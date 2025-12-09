import pandas as pd
import numpy as np
import shap
import logging
import joblib
import os
from pathlib import Path

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parent.parent.parent / "dcrm_models" / "shap_models"
_xgb_shap_model = None
_ada_shap_model = None
_shap_feature_names = []

def _load_shap_models():
    """Lazy loads the dedicated SHAP models."""
    global _xgb_shap_model, _ada_shap_model, _shap_feature_names
    try:
        if not _xgb_shap_model:
            _xgb_shap_model = joblib.load(MODEL_DIR / "xgb_shap_model.pkl")
        if not _ada_shap_model:
            _ada_shap_model = joblib.load(MODEL_DIR / "ada_shap_model.pkl")
        if not _shap_feature_names:
            _shap_feature_names = joblib.load(MODEL_DIR / "shap_feature_names.pkl")
    except Exception as e:
        logger.error(f"Error loading SHAP models: {e}")

def get_shap_models():
    """Returns the loaded SHAP models and feature names."""
    if not (_xgb_shap_model and _ada_shap_model and _shap_feature_names):
        _load_shap_models()
    return _xgb_shap_model, _ada_shap_model, _shap_feature_names

def calculate_shap_for_waveform(waveform_df: pd.DataFrame, segment_ms: int = 10) -> dict | None:
    try:
        # 1. Get Models (Dedicated SHAP Models)
        xgb_model, ada_model, feature_names = get_shap_models()
        if not xgb_model or not ada_model:
            logger.warning("SHAP skipped: Models not ready")
            return None

        # 1. Segment Data
        # 1. Segment Data
        # Normalize columns if needed
        # Common variations: "Time (ms)", "Time(ms)", "time", "Time"
        for col in waveform_df.columns:
            if "time" in col.lower() and "ms" in col.lower():
                waveform_df = waveform_df.rename(columns={col: "timeMs"})
                break
        
        if "timeMs" not in waveform_df.columns:
             # Fallback: check for just "Time"
             for col in waveform_df.columns:
                if col.lower() == "time":
                    waveform_df = waveform_df.rename(columns={col: "timeMs"})
                    break

        if "timeMs" not in waveform_df.columns:
             # Fallback: synthesize time assuming 10kHz (0.1ms per sample)
             # This handles cases where CSV has no explicit time column
             logger.warning("SHAP: 'timeMs' not found, synthesizing 10kHz time axis")
             waveform_df["timeMs"] =  pd.RangeIndex(len(waveform_df)) * 0.1
             
        max_time = waveform_df["timeMs"].max()
        if pd.isna(max_time):
            return None

        windows = []
        features_list = []
        
        # Determine sampling rate if possible, else assume 10kHz (0.1ms)
        
        for start in range(0, int(max_time), segment_ms):
            end = start + segment_ms
            windows.append({"start_ms": start, "end_ms": end})
            
            # Slice dataframe
            segment = waveform_df[(waveform_df["timeMs"] >= start) & (waveform_df["timeMs"] < end)]
            
            features = {}
            if not segment.empty:
                # Basic Feature Engineering - mapping to likely model feature names
                # Ideally this matches training exactly. 
                # If feature_names are complex (e.g. "resistance_mean"), we generate them.
                # If we don't know the feature names, we create a generic set and fill zeros for missing.
                
                # Check for resistance
                res_col = next((c for c in segment.columns if "resistance" in c.lower()), None)
                travel_col = next((c for c in segment.columns if "travel" in c.lower()), None)
                curr_col = next((c for c in segment.columns if "current" in c.lower() and "coil" not in c.lower()), None)

                if res_col:
                    vals = segment[res_col].values
                    features["window_mean_resistance"] = np.mean(vals)
                    features["window_std_resistance"] = np.std(vals)
                    features["window_max_resistance"] = np.max(vals)
                    features["Rp_avg"] = np.mean(vals) # Consistent with training script
                
                if travel_col:
                     vals = segment[travel_col].values
                     features["window_mean_travel"] = np.mean(vals)
                     features["window_std_travel"] = np.std(vals)
                     features["window_max_travel"] = np.max(vals) # Note: Only if in training features
                
                if curr_col:
                     vals = segment[curr_col].values
                     features["window_mean_current"] = np.mean(vals)
                     features["window_std_current"] = np.std(vals)
                
                # Cross-features
                r_mean = features.get("window_mean_resistance", 0)
                t_mean = features.get("window_mean_travel", 0)
                features["Ra_ta"] = r_mean * t_mean
                features["T_overlap"] = 0 # Placeholder matches training script
            
            # Fill the row for the model
            # Fill the row for the model
            row_values = []
            for fname in feature_names:
                val = features.get(fname, 0.0)
                row_values.append(val)
            
            features_list.append(row_values)

        if not features_list:
            return None

        X_windows = pd.DataFrame(features_list, columns=feature_names)

        # 2. Compute SHAP
        # Use TreeExplainer for speed
        # Ensure we are using the booster if possible
        
        # XGBoost
        explainer_xgb = shap.TreeExplainer(xgb_model)
        shap_xgb = explainer_xgb.shap_values(X_windows)
        
        # AdaBoost (might need KernelExplainer if not tree-based, but usually is)
        # Check if adaboost has estimators_
        if hasattr(ada_model, "estimators_"):
             # For adaboost, using the first estimator or a kernel explainer is common
             # or treating it as an ensemble. 
             # Simpler fallback: just use XGBoost SHAP for main explanation if ada is complex
             # But let's try TreeExplainer if it's a decision tree base
             try:
                 explainer_ada = shap.TreeExplainer(ada_model)
                 shap_ada = explainer_ada.shap_values(X_windows)
             except Exception:
                 # Fallback to zeros or skipped
                 shap_ada = np.zeros_like(shap_xgb)
        else:
             shap_ada = np.zeros_like(shap_xgb)


        # 3. Aggregation & Normalization
        def aggregate_shap(shap_values, feature_names):
            # Sum absolute SHAP values for features belonging to a channel
            resistance_idxs = [i for i, f in enumerate(feature_names) if "resistance" in f.lower()]
            travel_idxs = [i for i, f in enumerate(feature_names) if "travel" in f.lower()]
            current_idxs = [i for i, f in enumerate(feature_names) if "current" in f.lower()]
            
            res_scores = np.sum(np.abs(shap_values[:, resistance_idxs]), axis=1) if resistance_idxs else np.zeros(len(shap_values))
            trav_scores = np.sum(np.abs(shap_values[:, travel_idxs]), axis=1) if travel_idxs else np.zeros(len(shap_values))
            curr_scores = np.sum(np.abs(shap_values[:, current_idxs]), axis=1) if current_idxs else np.zeros(len(shap_values))
            
            return res_scores, trav_scores, curr_scores

        def normalize(arr):
            # Normalize to 0-1
            v_min, v_max = np.min(arr), np.max(arr)
            if v_max - v_min == 0:
                return np.zeros_like(arr).tolist()
            return ((arr - v_min) / (v_max - v_min)).tolist()

        xgb_res, xgb_trav, xgb_curr = aggregate_shap(shap_xgb, feature_names)
        ada_res, ada_trav, ada_curr = aggregate_shap(shap_ada, feature_names)

        # DEBUG: Log max scores to verify signal
        logger.info(f"SHAP Max Scores - Res: {np.max(xgb_res):.4f}, Trav: {np.max(xgb_trav):.4f}, Curr: {np.max(xgb_curr):.4f}")


        return {
            "time_windows": windows,
            "shap": {
                "xgboost": {
                    "resistance": normalize(xgb_res),
                    "travel": normalize(xgb_trav),
                    "current": normalize(xgb_curr)
                },
                "adaboost": {
                    "resistance": normalize(ada_res),
                    "travel": normalize(ada_trav),
                    "current": normalize(ada_curr)
                }
            }
        }

    except Exception as e:
        logger.error(f"SHAP calculation failed: {e}")
        return None
