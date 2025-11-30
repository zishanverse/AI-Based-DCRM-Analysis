from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from threading import Lock
from typing import Any, Dict

import joblib
import pandas as pd
from fastapi import APIRouter, Body, HTTPException, status

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/diagnostics", tags=["diagnostics"])

MODEL_DIR = Path(os.getenv("DCRM_MODEL_DIR", "dcrm_models"))
_xgb_model = None
_ada_model = None
_feature_names: list[str] = []
_label_map: Dict[int, str] = {}
_model_lock = Lock()


def _load_models() -> None:
    """Load model artifacts if they exist. Safe to call multiple times."""

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
            _label_map = {int(k): v for k, v in raw_map.items()}

        logger.info("Diagnostics models loaded successfully from %s", MODEL_DIR)
    except Exception as exc:  # pragma: no cover - depends on runtime assets
        logger.exception("Failed to load diagnostics models: %s", exc)
        _xgb_model = None
        _ada_model = None
        _feature_names = []
        _label_map = {}


_load_models()


def _ensure_models_ready() -> None:
    if _xgb_model and _ada_model and _feature_names:
        return

    # Attempt a lazy reload in case artifacts were added after startup
    with _model_lock:
        if not (_xgb_model and _ada_model and _feature_names):
            _load_models()

    if not (_xgb_model and _ada_model and _feature_names):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Diagnostic models are not loaded. Ensure artifacts exist in DCRM_MODEL_DIR.",
        )


@router.get("/features")
async def get_features() -> Dict[str, Any]:
    _ensure_models_ready()
    return {"features": _feature_names}


@router.post("/predict")
async def predict(features: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    _ensure_models_ready()

    input_vector: list[float] = []
    for name in _feature_names:
        value = features.get(name, 50.0)
        try:
            input_vector.append(float(value))
        except (TypeError, ValueError):
            input_vector.append(50.0)

    input_df = pd.DataFrame([input_vector], columns=_feature_names)

    try:
        xgb_pred_idx = _xgb_model.predict(input_df)[0]
        xgb_proba = _xgb_model.predict_proba(input_df)[0]
        xgb_label = _label_map.get(int(xgb_pred_idx), str(xgb_pred_idx))
        xgb_conf = float(xgb_proba[int(xgb_pred_idx)] * 100)

        ada_pred_idx = _ada_model.predict(input_df)[0]
        ada_label = _label_map.get(int(ada_pred_idx), str(ada_pred_idx))

        all_probs: Dict[str, float] = {}
        for idx, prob in enumerate(xgb_proba):
            label = _label_map.get(idx)
            if label:
                all_probs[label] = float(prob * 100)

        return {
            "diagnosis": xgb_label,
            "confidence": xgb_conf,
            "secondary_diagnosis": ada_label,
            "probabilities": all_probs,
            "status": "Healthy" if xgb_label == "Healthy" else "Faulty",
        }
    except Exception as exc:  # pragma: no cover - depends on model behavior
        logger.exception("Prediction failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc