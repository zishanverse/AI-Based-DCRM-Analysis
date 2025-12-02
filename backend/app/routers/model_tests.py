from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, HTTPException, status

from ..models import (
    AdvancedBatchPredictionEnvelope,
    AdvancedBatchPredictionRequest,
    AdvancedFeaturesResponse,
    AdvancedDiagnosticResult,
    AdvancedModelsStatus,
    AdvancedPredictionRequest,
    AdvancedPredictionEnvelope,
)
from ..services import advanced_models_service

router = APIRouter(prefix="/api/v1/new-models", tags=["new-models"])


@router.get("/status", response_model=AdvancedModelsStatus)
def get_models_status() -> AdvancedModelsStatus:
    try:
        payload = advanced_models_service.describe_models()
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    return AdvancedModelsStatus(**payload)


@router.get("/features", response_model=AdvancedFeaturesResponse)
def get_advanced_features() -> AdvancedFeaturesResponse:
    try:
        payload = advanced_models_service.describe_feature_space()
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    return AdvancedFeaturesResponse(**payload)


@router.post("/predict", response_model=AdvancedPredictionEnvelope)
def predict_single(payload: AdvancedPredictionRequest) -> AdvancedPredictionEnvelope:
    try:
        prediction = advanced_models_service.predict_row(payload.features)
        result = AdvancedDiagnosticResult(rowIndex=0, **prediction)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return AdvancedPredictionEnvelope(
        requestedAt=datetime.utcnow(),
        featuresUsed=list(payload.features.keys()),
        availableModels=advanced_models_service.get_available_model_names(),
        result=result,
    )


@router.post("/batch", response_model=AdvancedBatchPredictionEnvelope)
def predict_batch(payload: AdvancedBatchPredictionRequest) -> AdvancedBatchPredictionEnvelope:
    try:
        results = advanced_models_service.batch_predict(payload.rows)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    wrapped: list[AdvancedDiagnosticResult] = []
    for idx, result in enumerate(results):
        wrapped.append(AdvancedDiagnosticResult(rowIndex=idx, **result))
    return AdvancedBatchPredictionEnvelope(
        requestedAt=datetime.utcnow(),
        rowCount=len(wrapped),
        availableModels=advanced_models_service.get_available_model_names(),
        results=wrapped,
    )
