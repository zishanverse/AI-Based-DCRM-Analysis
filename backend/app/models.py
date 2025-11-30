from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


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
