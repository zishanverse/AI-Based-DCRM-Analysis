
import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load env FIRST
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

db_url = os.getenv("DATABASE_URL")
print(f"DEBUG: DATABASE_URL={db_url}")

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.db import database

async def debug_connection():
    print("Connecting...")
    await database.connect()
    
    print("Checking visible tables in public schema:")
    rows = await database.fetch_all("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    """)
    for r in rows:
        print(f" - {r['table_name']}")
    
    # Try raw select from "stations"
    try:
        print("Selecting from stations...")
        await database.fetch_all('SELECT * FROM "stations" LIMIT 1')
        print("Access successful.")
    except Exception as e:
        print(f"Access failed: {e}")

    await database.disconnect()

if __name__ == "__main__":
    asyncio.run(debug_connection())
