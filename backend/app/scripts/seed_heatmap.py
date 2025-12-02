from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import List, Sequence, Tuple

from ..repositories.heatmap import DEFAULT_HEATMAP_TABLE, HEATMAP_TABLE_ENV_VAR
from ..supabase_client import get_supabase_client

HARDCODED_POINTS: Sequence[Tuple[float, float, float]] = (
    (19.0760, 72.8777, 1000),
    (28.6139, 77.2090, 800),
    (12.9716, 77.5946, 700),
    (13.0827, 80.2707, 600),
    (22.5726, 88.3639, 600),
    (17.3850, 78.4867, 500),
    (23.0225, 72.5714, 400),
    (18.5204, 73.8567, 450),
    (26.9124, 75.7873, 300),
    (15.2993, 74.1240, 200),
    (9.9312, 76.2673, 350),
    (21.1458, 79.0882, 400),
    (26.8467, 80.9462, 300),
    (25.3176, 82.9739, 250),
    (19.08, 72.88, 900),
    (19.07, 72.87, 850),
    (19.06, 72.89, 800),
    (28.62, 77.21, 750),
    (28.60, 77.22, 700),
    (12.98, 77.60, 650),
    (12.96, 77.58, 600),
)


def _severity_from_intensity(intensity: float) -> float:
    return max(0.0, min(1.0, intensity / 1000.0))


def _health_from_severity(severity: float) -> float:
    # Healthy is near 100, severe faults trend toward 5.
    return round(max(5.0, 100.0 - severity * 95.0), 2)


def _status_from_severity(severity: float) -> str:
    if severity >= 0.75:
        return "fault"
    if severity >= 0.45:
        return "moderate"
    return "healthy"


def build_rows() -> List[dict]:
    base_timestamp = datetime.now(timezone.utc)
    rows: List[dict] = []
    for idx, (lat, lon, intensity) in enumerate(HARDCODED_POINTS, start=1):
        severity = round(_severity_from_intensity(intensity), 3)
        health_score = _health_from_severity(severity)
        status = _status_from_severity(severity)
        rows.append(
            {
                "device_id": f"SEED-{idx:04d}",
                "lat": lat,
                "lon": lon,
                "timestamp": (base_timestamp - timedelta(minutes=idx * 7)).isoformat(),
                "health_score": health_score,
                "status": status,
                "severity": severity,
                "metadata": {
                    "source": "seed_heatmap.py",
                    "originalIntensity": intensity,
                },
            }
        )
    return rows


def seed_heatmap() -> None:
    client = get_supabase_client()
    table_name = os.getenv(HEATMAP_TABLE_ENV_VAR, DEFAULT_HEATMAP_TABLE)
    rows = build_rows()
    response = client.table(table_name).insert(rows, default_to_null=True).execute()
    print(f"Inserted {len(rows)} rows into '{table_name}'. Supabase response: {response}")


if __name__ == "__main__":
    seed_heatmap()
