from __future__ import annotations

import logging
import os
import stat
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import Any, Dict, Iterable, List, Mapping

import joblib
import numpy as np
import pandas as pd
from tensorflow import keras

logger = logging.getLogger(__name__)

ADVANCED_MODEL_DIR = Path(os.getenv("ADVANCED_MODEL_DIR", "new models"))
_DROP_COLUMNS = {
    "breaker_id",
    "bay_id",
    "raw_timeseries_id",
    "operation_count_total",
    "overall_health",
}

_scaler = None
_label_encoder = None
_feature_names: List[str] = []
_xgb_model = None
_ada_model = None
_autoencoder = None
_ae_threshold: float | None = None
_model_lock = Lock()
_ARTIFACT_SUFFIXES = {".pkl", ".joblib", ".keras", ".json"}


def _ensure_read_access(path: Path) -> Path:
    try:
        with path.open("rb"):
            return path
    except PermissionError:
        try:
            path.chmod(
                stat.S_IRUSR
                | stat.S_IWUSR
                | stat.S_IRGRP
                | stat.S_IROTH
            )
        except Exception:  # pragma: no cover - best effort on Windows
            pass
        try:
            with path.open("rb"):
                return path
        except PermissionError as exc:  # pragma: no cover - surface helpful context
            raise RuntimeError(
                f"Advanced model artifact '{path}' is not readable. Update filesystem permissions or move it to an accessible directory."
            ) from exc


def _load_joblib_artifact(filename: str):
    artifact_path = _ensure_read_access(ADVANCED_MODEL_DIR / filename)
    return joblib.load(artifact_path)


def _load_keras_artifact(filename: str):
    artifact_path = _ensure_read_access(ADVANCED_MODEL_DIR / filename)
    return keras.models.load_model(artifact_path, compile=False)


def _infer_artifact_kind(name: str) -> str:
    lowered = name.lower()
    if "xgb" in lowered or "xgboost" in lowered:
        return "xgboost"
    if "ada" in lowered and "boost" in lowered:
        return "adaboost"
    if "autoencoder" in lowered or "ae" in lowered:
        return "autoencoder"
    if "encoder" in lowered:
        return "encoder"
    if "scaler" in lowered:
        return "scaler"
    if "threshold" in lowered:
        return "threshold"
    return "artifact"


def get_available_model_names() -> list[str]:
    names: list[str] = []
    if _xgb_model is not None:
        names.append("xgboost")
    if _ada_model is not None:
        names.append("adaboost")
    if _autoencoder is not None:
        names.append("autoencoder")
    return names


def get_class_labels() -> list[str]:
    if _label_encoder is None:
        return []
    try:
        return [str(label) for label in _label_encoder.classes_]
    except AttributeError:  # pragma: no cover - safeguard for custom encoders
        return []


def list_model_artifacts() -> list[dict[str, Any]]:
    artifacts: list[dict[str, Any]] = []
    if not ADVANCED_MODEL_DIR.exists():
        return artifacts

    for candidate in sorted(ADVANCED_MODEL_DIR.iterdir()):
        if not candidate.is_file():
            continue
        if candidate.suffix.lower() not in _ARTIFACT_SUFFIXES:
            continue
        stat = candidate.stat()
        artifacts.append(
            {
                "name": candidate.name,
                "kind": _infer_artifact_kind(candidate.name),
                "sizeBytes": stat.st_size,
                "modifiedAt": datetime.fromtimestamp(stat.st_mtime),
            }
        )
    return artifacts


def describe_models() -> dict[str, Any]:
    ensure_advanced_models_ready()
    artifacts = list_model_artifacts()
    return {
        "directory": str(ADVANCED_MODEL_DIR.resolve()),
        "artifactCount": len(artifacts),
        "featureCount": len(_feature_names),
        "classLabels": get_class_labels(),
        "availableModels": get_available_model_names(),
        "artifacts": artifacts,
    }


def describe_feature_space() -> dict[str, Any]:
    ensure_advanced_models_ready()
    return {
        "features": list(_feature_names),
        "classLabels": get_class_labels(),
        "artifactCount": len(list_model_artifacts()),
        "availableModels": get_available_model_names(),
    }


def _load_artifacts() -> None:
    global _scaler, _label_encoder, _feature_names, _xgb_model, _ada_model, _autoencoder, _ae_threshold

    if not ADVANCED_MODEL_DIR.exists():
        logger.warning("Advanced model directory %s not found", ADVANCED_MODEL_DIR)
        return

    try:
        logger.info("Loading advanced model artifacts from %s", ADVANCED_MODEL_DIR)
        _scaler = _load_joblib_artifact("scaler.pkl")
        _label_encoder = _load_joblib_artifact("label_encoder.pkl")
        _feature_names = _load_joblib_artifact("feature_names.pkl")
        _xgb_model = _load_joblib_artifact("xgboost_model.pkl")
        _ada_model = _load_joblib_artifact("adaboost_model.pkl")
        _autoencoder = _load_keras_artifact("autoencoder_model.keras")
        _ae_threshold = float(_load_joblib_artifact("ae_threshold.pkl"))
    except Exception as exc:  # pragma: no cover - runtime artifacts
        logger.exception("Failed to load advanced model artifacts: %s", exc)
        _scaler = None
        _label_encoder = None
        _feature_names = []
        _xgb_model = None
        _ada_model = None
        _autoencoder = None
        _ae_threshold = None


def ensure_advanced_models_ready() -> None:
    if _scaler and _label_encoder and _feature_names and _xgb_model and _ada_model and _autoencoder and _ae_threshold:
        return

    with _model_lock:
        if not (
            _scaler
            and _label_encoder
            and _feature_names
            and _xgb_model
            and _ada_model
            and _autoencoder
            and _ae_threshold is not None
        ):
            _load_artifacts()

    if not (
        _scaler
        and _label_encoder
        and _feature_names
        and _xgb_model
        and _ada_model
        and _autoencoder
        and _ae_threshold is not None
    ):
        raise RuntimeError("Advanced model artifacts are missing. Ensure ADVANCED_MODEL_DIR is populated.")


def get_advanced_feature_names() -> list[str]:
    ensure_advanced_models_ready()
    return list(_feature_names)


def _prepare_dataframe(df_raw: pd.DataFrame) -> pd.DataFrame:
    ensure_advanced_models_ready()

    df = df_raw.copy()
    drop_cols = [col for col in _DROP_COLUMNS if col in df.columns]
    if drop_cols:
        df = df.drop(columns=drop_cols)

    df = pd.get_dummies(df)

    for col in _feature_names:
        if col not in df.columns:
            df[col] = 0.0

    df = df[_feature_names]
    df = df.fillna(0.0)

    scaled = _scaler.transform(df)
    return pd.DataFrame(scaled, columns=_feature_names)


def _format_probabilities(probabilities: Iterable[float]) -> Dict[str, float]:
    ensure_advanced_models_ready()

    result: Dict[str, float] = {}
    for idx, prob in enumerate(probabilities):
        label = _label_encoder.inverse_transform([idx])[0]
        result[label] = float(prob * 100)
    return result


def predict_row(row: Mapping[str, Any]) -> Dict[str, Any]:
    ensure_advanced_models_ready()

    df_raw = pd.DataFrame([row])
    processed = _prepare_dataframe(df_raw)

    try:
        xgb_pred_idx = int(_xgb_model.predict(processed)[0])
        xgb_proba = _xgb_model.predict_proba(processed)[0]
        xgb_label = _label_encoder.inverse_transform([xgb_pred_idx])[0]
        xgb_conf = float(xgb_proba[xgb_pred_idx] * 100)

        ada_pred_idx = int(_ada_model.predict(processed)[0])
        ada_proba = _ada_model.predict_proba(processed)[0]
        ada_label = _label_encoder.inverse_transform([ada_pred_idx])[0]
        ada_conf = float(ada_proba[ada_pred_idx] * 100)

        reconstruction = _autoencoder.predict(processed, verbose=0)
        mse = float(np.mean(np.power(processed - reconstruction, 2), axis=1)[0])
        threshold = float(_ae_threshold or 0.0)

        return {
            "xgboost": {
                "label": xgb_label,
                "confidence": xgb_conf,
                "probabilities": _format_probabilities(xgb_proba),
            },
            "adaboost": {
                "label": ada_label,
                "confidence": ada_conf,
                "probabilities": _format_probabilities(ada_proba),
            },
            "autoencoder": {
                "isAnomaly": bool(mse > threshold),
                "reconstructionError": mse,
                "threshold": threshold,
            },
        }
    except Exception as exc:  # pragma: no cover - inference
        logger.exception("Advanced model prediction failed: %s", exc)
        raise RuntimeError(str(exc)) from exc


def batch_predict(rows: Iterable[Mapping[str, Any]]) -> List[Dict[str, Any]]:
    ensure_advanced_models_ready()
    results: List[Dict[str, Any]] = []
    for row in rows:
        results.append(predict_row(row))
    return results
