from __future__ import annotations

import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from ..supabase_client import get_supabase_client

HEATMAP_TABLE_ENV_VAR = "SUPABASE_HEATMAP_TABLE"
DEFAULT_HEATMAP_TABLE = "heatmap_points"


def _table_name() -> str:
    return os.getenv(HEATMAP_TABLE_ENV_VAR, DEFAULT_HEATMAP_TABLE)


def _normalize_timestamp(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    candidate = value.replace("Z", "+00:00") if value.endswith("Z") else value
    try:
        return datetime.fromisoformat(candidate)
    except ValueError:
        return None


def _derive_severity(row: Dict[str, Any]) -> float:
    if row.get("severity") is not None:
        try:
            return float(row["severity"])
        except (TypeError, ValueError):
            pass
    if row.get("health_score") is not None:
        try:
            health = float(row["health_score"])
            return max(0.0, min(1.0, (100.0 - health) / 100.0))
        except (TypeError, ValueError):
            pass
    return 0.5


def _derive_intensity(row: Dict[str, Any]) -> float:
    severity = _derive_severity(row)
    return round(200.0 + severity * 800.0, 2)


def fetch_heatmap_points(limit: int = 512) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    response = (
        client.table(_table_name())
        .select("device_id, lat, lon, timestamp, health_score, status, severity")
        .order("timestamp", desc=True)
        .limit(limit)
        .execute()
    )
    return getattr(response, "data", []) or []


def transform_heatmap_points(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    transformed: List[Dict[str, Any]] = []
    for row in rows:
        try:
            lat = float(row.get("lat"))
            lon = float(row.get("lon"))
        except (TypeError, ValueError):
            continue

        intensity = _derive_intensity(row)
        severity = _derive_severity(row)
        health_score = row.get("health_score")
        try:
            health_score = float(health_score) if health_score is not None else None
        except (TypeError, ValueError):
            health_score = None

        transformed.append(
            {
                "lat": lat,
                "lon": lon,
                "intensity": intensity,
                "severity": severity,
                "health_score": health_score,
                "status": row.get("status") or "unknown",
                "device_id": row.get("device_id") or "unknown",
                "timestamp": _normalize_timestamp(row.get("timestamp")),
            }
        )
    return transformed
