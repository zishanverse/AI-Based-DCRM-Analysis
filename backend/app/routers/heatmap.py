from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Query

from ..models import HeatmapPoint, HeatmapResponse
from ..repositories.heatmap import fetch_heatmap_points, transform_heatmap_points

router = APIRouter(prefix="/api/v1/heatmap", tags=["heatmap"])


@router.get("/points", response_model=HeatmapResponse)
async def get_heatmap_points(limit: int = Query(256, ge=1, le=1000)) -> HeatmapResponse:
    rows = await fetch_heatmap_points(limit)
    transformed = transform_heatmap_points(rows)

    points = [
        HeatmapPoint(
            lat=row["lat"],
            lon=row["lon"],
            intensity=row["intensity"],
            severity=row["severity"],
            status=row["status"],
            deviceId=row["device_id"],
            timestamp=row["timestamp"],
            healthScore=row["health_score"],
        )
        for row in transformed
    ]

    return HeatmapResponse(points=points, total=len(points), generatedAt=datetime.utcnow())
