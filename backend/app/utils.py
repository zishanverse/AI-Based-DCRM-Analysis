from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional
import secrets

from fastapi import HTTPException, status

from .storage import ACCESS_TOKENS, REFRESH_TOKENS, USERS

ACCESS_TOKEN_TTL_SECONDS = 60 * 60  # 1 hour


def create_access_token(station_id: str, ttl_seconds: int = ACCESS_TOKEN_TTL_SECONDS) -> str:
    token = secrets.token_urlsafe(32)
    ACCESS_TOKENS[token] = {
        "station_id": station_id,
        "expires_at": datetime.utcnow() + timedelta(seconds=ttl_seconds),
    }
    return token


def create_refresh_token(station_id: str) -> str:
    token = secrets.token_urlsafe(48)
    REFRESH_TOKENS[token] = station_id
    return token


def validate_access_token(token: Optional[str]) -> dict:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")
    record = ACCESS_TOKENS.get(token)
    if not record:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    if record["expires_at"] <= datetime.utcnow():
        del ACCESS_TOKENS[token]
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    return record


def require_user_from_token(token: Optional[str]) -> dict:
    record = validate_access_token(token)
    station_id = record["station_id"]
    user = USERS.get(station_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists")
    return {
        "id": station_id,
        "name": user["name"],
        "role": user["role"],
    }


def parse_authorization_header(header_value: Optional[str]) -> Optional[str]:
    if not header_value:
        return None
    if not header_value.lower().startswith("bearer "):
        return None
    return header_value.split(" ", 1)[1].strip() or None
