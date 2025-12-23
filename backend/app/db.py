
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

database = Database(DATABASE_URL)
