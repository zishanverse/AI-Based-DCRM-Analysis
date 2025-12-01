from __future__ import annotations

import json
import logging
import math
import os
from pathlib import Path
from threading import Lock
from typing import Any, Dict, Mapping, Optional

import joblib
import pandas as pd

logger = logging.getLogger(__name__)

MODEL_DIR = Path(os.getenv("DCRM_MODEL_DIR", "dcrm_models"))
_xgb_model = None
_ada_model = None
_feature_names: list[str] = []
_label_map: Dict[int, str] = {}
_model_lock = Lock()


def _normalize_label_value(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    text = str(value).strip()
    if not text or text.lower() == "nan":
        return None
    return text


def _resolve_label(idx: int) -> str:
    label = _label_map.get(int(idx))
    if label:
        return label
    return f"class_{int(idx)}"


def _load_models() -> None:
    global _xgb_model, _ada_model, _feature_names, _label_map

    if not MODEL_DIR.exists():
        logger.warning("Model directory %s does not exist", MODEL_DIR)
        return

    try:
        _xgb_model = joblib.load(MODEL_DIR / "xgb_dcrm_model.pkl")
        _ada_model = joblib.load(MODEL_DIR / "adaboost_dcrm_model.pkl")
        _feature_names = joblib.load(MODEL_DIR / "feature_names.pkl")

        with open(MODEL_DIR / "label_map.json", "r", encoding="utf-8") as f:
            raw_map = json.load(f)
            cleaned: Dict[int, str] = {}
            for k, v in raw_map.items():
                normalized = _normalize_label_value(v)
                if normalized:
                    cleaned[int(k)] = normalized
            _label_map = cleaned

        logger.info("Diagnostics models loaded successfully from %s", MODEL_DIR)
    except Exception as exc:  # pragma: no cover - runtime artifacts
        logger.exception("Failed to load diagnostics models: %s", exc)
        _xgb_model = None
        _ada_model = None
        _feature_names = []
        _label_map = {}


_load_models()


def ensure_models_ready() -> None:
    if _xgb_model and _ada_model and _feature_names:
        return

    with _model_lock:
        if not (_xgb_model and _ada_model and _feature_names):
            _load_models()

    if not (_xgb_model and _ada_model and _feature_names):
        raise RuntimeError(
            "Diagnostic models are not loaded. Ensure artifacts exist in DCRM_MODEL_DIR."
        )


def get_feature_names() -> list[str]:
    ensure_models_ready()
    return list(_feature_names)


def _build_dataframe_row(features: Mapping[str, Any]) -> pd.DataFrame:
    row: list[float] = []
    for name in _feature_names:
        value = features.get(name, 50.0)
        try:
            row.append(float(value))
        except (TypeError, ValueError):
            row.append(50.0)
    return pd.DataFrame([row], columns=_feature_names)


def predict_single(features: Mapping[str, Any]) -> Dict[str, Any]:
    ensure_models_ready()
    input_df = _build_dataframe_row(features)

    try:
        xgb_pred_idx = _xgb_model.predict(input_df)[0]
        xgb_proba = _xgb_model.predict_proba(input_df)[0]
        xgb_label = _resolve_label(int(xgb_pred_idx))
        xgb_conf = float(xgb_proba[int(xgb_pred_idx)] * 100)

        ada_pred_idx = _ada_model.predict(input_df)[0]
        ada_label = _resolve_label(int(ada_pred_idx))

        probabilities: Dict[str, float] = {}
        for idx, prob in enumerate(xgb_proba):
            label = _resolve_label(idx)
            probabilities[label] = float(prob * 100)

        return {
            "diagnosis": xgb_label,
            "confidence": xgb_conf,
            "secondary_diagnosis": ada_label,
            "probabilities": probabilities,
            "status": "Healthy" if xgb_label == "Healthy" else "Faulty",
        }
    except Exception as exc:  # pragma: no cover - model dependent
        logger.exception("Prediction failed: %s", exc)
        raise RuntimeError(str(exc)) from exc
