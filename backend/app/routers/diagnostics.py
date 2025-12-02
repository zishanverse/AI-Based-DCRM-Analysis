from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict

from fastapi import APIRouter, Body, HTTPException, status

from ..services import diagnostics_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/diagnostics", tags=["diagnostics"])


@router.get("/features")
async def get_features() -> Dict[str, Any]:
    try:
        features = diagnostics_service.get_feature_names()
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    return {"features": features}


@router.post("/predict")
async def predict(features: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    try:
        prediction = diagnostics_service.predict_single(features)
        logger.info("Diagnostics prediction result: %s", json.dumps(prediction))
        print("Diagnostics prediction result:", prediction)
        return prediction
    except RuntimeError as exc:
        logger.exception("Prediction failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc