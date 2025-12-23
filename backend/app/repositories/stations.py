from __future__ import annotations

import os
from typing import Any, Dict, Optional

from fastapi import HTTPException, status
from passlib.context import CryptContext

# from ..supabase_client import get_supabase_client

STATIONS_TABLE_ENV_VAR = "SUPABASE_STATIONS_TABLE"
DEFAULT_STATIONS_TABLE = "stations"
DEFAULT_ROLE_ENV_VAR = "SUPABASE_DEFAULT_STATION_ROLE"

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def _get_table_name() -> str:
    return os.getenv(STATIONS_TABLE_ENV_VAR, DEFAULT_STATIONS_TABLE)


def _derive_station_name(row: Dict[str, Any]) -> str:
    for key in ("station_name", "display_name", "name", "location_address"):
        value = row.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return row.get("station_id", "Unknown Station")


def _derive_station_role(row: Dict[str, Any]) -> str:
    for key in ("role", "station_role"):
        value = row.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return os.getenv(DEFAULT_ROLE_ENV_VAR, "engineer")


def _password_matches(provided_password: str, stored_hash: str) -> bool:
    if not stored_hash:
        return False
    # Support legacy plain-text passwords during migration.
    if stored_hash.startswith("$"):
        try:
            return pwd_context.verify(provided_password, stored_hash)
        except ValueError:
            return False
    return provided_password == stored_hash


from ..db import database

async def fetch_station_by_id(station_id: str) -> Optional[Dict[str, Any]]:
    # Mock fallback if DB is not connected (optional, but good for resilience)
    # For now, let's try direct DB query
    query = f"SELECT * FROM stations WHERE id = :station_id"
    # Query using standard 'id' column
    query = "SELECT * FROM stations WHERE id = :station_id"
    try:
        row = await database.fetch_one(query=query, values={"station_id": station_id})
        # Map row to dictionary, ensure password_hash (if still used in logic) is mapped from password
        if row:
            d = dict(row)
            # Code uses 'password_hash' key, map 'password' column to it if needed
            if "password" in d and "password_hash" not in d:
                d["password_hash"] = d["password"]
            return d
        return None
    except Exception as e:
        print(f"Database Error: {e}")
        # Build resilience: falling back to mock if needed or just re-raising
        if station_id == "demo-station":
             return {
                "id": "demo-station",
                "name": "Demo Substation 400kV",
                "role": "engineer",
                "password": "$2b$12$cq1..." # mocked hash
            }
        return None


async def authenticate_station(station_id: str, password: str) -> Dict[str, str]:
    station_row = await fetch_station_by_id(station_id)
    if not station_row or not _password_matches(password, station_row.get("password_hash", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return {
        "id": station_id,
        "name": _derive_station_name(station_row),
        "role": _derive_station_role(station_row),
    }


def get_station_profile(station_id: str) -> Dict[str, str]:
    station_row = fetch_station_by_id(station_id)
    if not station_row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists")
    return {
        "id": station_id,
        "name": _derive_station_name(station_row),
        "role": _derive_station_role(station_row),
    }
