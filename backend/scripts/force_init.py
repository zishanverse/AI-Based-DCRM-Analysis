
import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load env FIRST
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("FATAL: No DATABASE_URL")
    sys.exit(1)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.db import database

async def force_init():
    print(f"Connecting to {db_url.split('@')[1] if '@' in db_url else 'DB'}...")
    await database.connect()
    
    try:
        # Check if table exists
        print("Checking stations...")
        rows = await database.fetch_all("SELECT to_regclass('public.stations')")
        print(f"to_regclass: {rows[0][0]}")
        
        # Create directly
        print("Creating stations table...")
        await database.execute("""
            CREATE TABLE IF NOT EXISTS public."stations" (
                "id" TEXT PRIMARY KEY,
                "name" TEXT NOT NULL,
                "role" TEXT DEFAULT 'engineer'
            );
        """)
        print("Table created (or exists).")
        
        # Insert
        print("Inserting...")
        await database.execute("""
            INSERT INTO public."stations" ("id", "name") 
            VALUES ('force-test', 'Force Station')
            ON CONFLICT ("id") DO NOTHING
        """)
        print("Insert done.")
        
        # Select
        print("Selecting...")
        rows = await database.fetch_all('SELECT * FROM public."stations"')
        print(f"Rows found: {len(rows)}")
        for r in rows:
            print(dict(r))
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

    await database.disconnect()

if __name__ == "__main__":
    asyncio.run(force_init())
