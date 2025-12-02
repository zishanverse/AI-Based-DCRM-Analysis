from __future__ import annotations

from datetime import datetime
from typing import Any, Dict

# Token stores; values track ownership and expiry
ACCESS_TOKENS: Dict[str, Dict[str, Any]] = {}
REFRESH_TOKENS: Dict[str, str] = {}

# Future ready in-memory registries (devices, waveforms, etc.)
DEVICES: Dict[str, Dict[str, Any]] = {}
WAVEFORMS: Dict[str, Dict[str, Any]] = {}
ANALYSES: Dict[str, Dict[str, Any]] = {}
UPLOADS: Dict[str, Dict[str, Any]] = {}

TokenRecord = Dict[str, Any]

def is_token_expired(record: TokenRecord) -> bool:
    """Utility shared by tests and routers to check expiry."""
    expires_at: datetime | None = record.get("expires_at")
    return expires_at is not None and expires_at <= datetime.utcnow()
