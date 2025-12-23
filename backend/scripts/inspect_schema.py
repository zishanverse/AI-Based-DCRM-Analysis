
import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.db import database
from pathlib import Path
from dotenv import load_dotenv

# Ensure env is loaded (redundant if db.py does it, but safe)
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

async def inspect():
    print("Connecting...")
    await database.connect()
    
    db_name = await database.fetch_one("SELECT current_database()")
    print(f"CONNECTED TO DATABASE: {db_name[0]}")
    
    print("Fetching columns for 'stations' in 'public' schema...")
    rows = await database.fetch_all("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'stations' AND table_schema = 'public'")
    print(f"Found {len(rows)} columns.")
    for r in rows:
        print(f" - {r['column_name']} (Nullable: {r['is_nullable']})")
    
    await database.disconnect()

if __name__ == "__main__":
    asyncio.run(inspect())
