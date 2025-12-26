
import os
from databases import Database
from dotenv import load_dotenv

from pathlib import Path

# Load .env from project root (backend/app/db.py -> backend/app -> backend -> root)
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Use DATABASE_URL from .env
# Ensure it starts with postgresql://
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in environment variables.")

# asyncpg requires postgresql:// scheme
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)



# Force SSL mode if not present
if "sslmode=" not in DATABASE_URL:
    separator = "&" if "?" in DATABASE_URL else "?"
    DATABASE_URL = f"{DATABASE_URL}{separator}sslmode=require"


import ssl

# Create a proper SSL context
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Fix for Supabase Transaction Pooler (which doesn't support prepared statements)
# and general stability on Render.
database = Database(
    DATABASE_URL, 
    min_size=1, 
    max_size=20,
    statement_cache_size=0,  # Required for PgBouncer Transaction Mode
    ssl=ssl_context 
)
