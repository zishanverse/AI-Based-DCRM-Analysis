from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import AnyUrl, BaseModel, Field


class User(BaseModel):
    id: str = Field(..., description="Station identifier")
    name: str
    role: str


class LoginRequest(BaseModel):
    station_id: str = Field(..., alias="station_id")
    password: str

    class Config:
        populate_by_name = True


class TokenResponse(BaseModel):
    accessToken: str
    user: User


class RefreshResponse(BaseModel):
    accessToken: str


class Device(BaseModel):
    id: str
    name: str
    location: str
    model: str
    installedAt: datetime
    lastTestedAt: datetime
    healthScore: float
    metadata: dict[str, str] | None = None


class WaveformSample(BaseModel):
    timestamp: float
    value: float


class Waveform(BaseModel):
    id: str
    device_id: str
    captured_at: datetime
    samples: list[WaveformSample]


class Analysis(BaseModel):
    id: str
    waveform_id: str
    summary: str
    score: float
    created_at: datetime


class XaiPayload(BaseModel):
    explanation: str
    importance: list[float]


class SummaryResponse(BaseModel):
    globalHealth: float
    activeAlerts: int
    last24hDetections: int
    modelVersion: str


class DevicesResponse(BaseModel):
    devices: list[Device]
    total: int


class DiagnosticResult(BaseModel):
    rowIndex: int = Field(..., ge=0)
    diagnosis: str
    confidence: float
    secondary_diagnosis: str
    probabilities: dict[str, float]
    status: str


class UploadResponse(BaseModel):
    assetId: str
    publicId: str
    secureUrl: AnyUrl
    bytes: int
    format: str
    diagnostics: list[DiagnosticResult] | None = None
    diagnosticsProcessedRows: int | None = Field(default=None, ge=0)
    diagnosticsTotalRows: int | None = Field(default=None, ge=0)
    advancedDiagnostics: list[AdvancedDiagnosticResult] | None = None
    waveformPreview: WaveformPreview | None = None
    shap: ShapResponse | None = None


class ShapValues(BaseModel):
    resistance: list[float]
    travel: list[float]
    current: list[float]


class ShapModelResult(BaseModel):
    xgboost: ShapValues
    adaboost: ShapValues


class ShapTimeWindow(BaseModel):
    start_ms: float
    end_ms: float


class ShapResponse(BaseModel):
    time_windows: list[ShapTimeWindow]
    shap: ShapModelResult


class HeatmapPoint(BaseModel):
    lat: float
    lon: float
    intensity: float = Field(..., description="Scaled value used by the Leaflet heat layer")
    severity: float = Field(..., ge=0.0, le=1.0)
    status: str
    deviceId: str
    timestamp: datetime | None = None
    healthScore: float | None = None


class HeatmapResponse(BaseModel):
    points: list[HeatmapPoint]
    total: int
    generatedAt: datetime


class ClassifierOutput(BaseModel):
    label: str
    confidence: float = Field(..., ge=0.0, le=100.0)
    probabilities: dict[str, float]


class AutoencoderOutput(BaseModel):
    isAnomaly: bool
    reconstructionError: float
    threshold: float


class AdvancedDiagnosticResult(BaseModel):
    rowIndex: int = Field(..., ge=0)
    xgboost: ClassifierOutput
    adaboost: ClassifierOutput
    autoencoder: AutoencoderOutput


class AdvancedModelArtifact(BaseModel):
    name: str
    kind: str
    sizeBytes: int = Field(..., ge=0)
    modifiedAt: datetime


class AdvancedModelsStatus(BaseModel):
    directory: str
    artifactCount: int = Field(..., ge=0)
    featureCount: int = Field(..., ge=0)
    classLabels: list[str]
    availableModels: list[str]
    artifacts: list[AdvancedModelArtifact]


class AdvancedFeaturesResponse(BaseModel):
    features: list[str]
    classLabels: list[str]
    artifactCount: int = Field(..., ge=0)
    availableModels: list[str]


class AdvancedPredictionEnvelope(BaseModel):
    requestedAt: datetime
    featuresUsed: list[str]
    availableModels: list[str]
    result: AdvancedDiagnosticResult


class AdvancedBatchPredictionEnvelope(BaseModel):
    requestedAt: datetime
    rowCount: int = Field(..., ge=0)
    availableModels: list[str]
    results: list[AdvancedDiagnosticResult]


class AdvancedPredictionRequest(BaseModel):
    features: dict[str, Any]


class AdvancedBatchPredictionRequest(BaseModel):
    rows: list[dict[str, Any]]


class WaveformPoint(BaseModel):
    timeMs: float
    values: dict[str, float | None]


class WaveformPreview(BaseModel):
    rowCount: int = Field(..., ge=1)
    sourceName: str | None = None
    valueColumns: list[str]
    columnMap: dict[str, str] | None = None
    points: list[WaveformPoint]
