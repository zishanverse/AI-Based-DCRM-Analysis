
import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.db import database
from pathlib import Path
from dotenv import load_dotenv

# Ensure env is loaded
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

async def migrate_db_columns():
    print("Connecting to database...")
    await database.connect()
    
    # helper to check if col exists
    async def col_exists(table, col):
        query = "SELECT 1 FROM information_schema.columns WHERE table_name = :t AND column_name = :c"
        return await database.fetch_one(query, values={"t": table, "c": col})

    print("Checking stations table...")
    
    # 1. station_id -> id
    if await col_exists("stations", "station_id"):
        print("Renaming station_id -> id")
        await database.execute("ALTER TABLE stations RENAME COLUMN station_id TO id")
    
    # 2. password_hash -> password
    if await col_exists("stations", "password_hash"):
        print("Renaming password_hash -> password")
        await database.execute("ALTER TABLE stations RENAME COLUMN password_hash TO password")
        
    # 3. location_address -> location
    if await col_exists("stations", "location_address"):
        print("Renaming location_address -> location")
        await database.execute("ALTER TABLE stations RENAME COLUMN location_address TO location")
        
    # 4. created_at -> createdAt
    if await col_exists("stations", "created_at"):
        print("Renaming created_at -> \"createdAt\"")
        await database.execute("ALTER TABLE stations RENAME COLUMN created_at TO \"createdAt\"")

    # 5. updated_at -> updatedAt
    if await col_exists("stations", "updated_at"):
        print("Renaming updated_at -> \"updatedAt\"")
        await database.execute("ALTER TABLE stations RENAME COLUMN updated_at TO \"updatedAt\"")
        
    print("Column modification complete.")
    await database.disconnect()

if __name__ == "__main__":
    asyncio.run(migrate_db_columns())
