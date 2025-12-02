from __future__ import annotations

import os
from functools import lru_cache
from typing import Final

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

SUPABASE_URL_ENV: Final[str] = "SUPABASE_URL"
SUPABASE_SERVICE_ROLE_KEY_ENV: Final[str] = "SUPABASE_SERVICE_ROLE_KEY"
SUPABASE_ANON_KEY_ENV: Final[str] = "SUPABASE_ANON_KEY"


class SupabaseSettingsError(RuntimeError):
    """Raised when the required Supabase environment variables are missing."""


def _get_supabase_credentials() -> tuple[str, str]:
    url = os.getenv(SUPABASE_URL_ENV)
    key = os.getenv(SUPABASE_SERVICE_ROLE_KEY_ENV) or os.getenv(SUPABASE_ANON_KEY_ENV)
    if not url or not key:
        raise SupabaseSettingsError(
            "Supabase credentials are missing. Make sure SUPABASE_URL and either "
            "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY are defined."
        )
    return url, key


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Return a cached Supabase client instance."""

    url, key = _get_supabase_credentials()
    return create_client(url, key)
