
import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.db import database
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

async def manual_migrate():
    print("Connecting...")
    await database.connect()
    
    # 1. Update Stations
    print("Migrating stations...")
    await database.execute("ALTER TABLE stations ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Unknown Station'")
    await database.execute("ALTER TABLE stations ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'engineer'")
    await database.execute("ALTER TABLE stations ADD COLUMN IF NOT EXISTS description TEXT")
    # location_lat/lon should exist as per inspection
    
    # 2. Check/Create TestResults
    # Note: Prisma maps TestResult -> test_results
    # We use a simplified creation script based on schema
    # (Just basic columns to satisfy functionality if missing)
    print("Checking test_results...")
    exists = await database.fetch_one("SELECT to_regclass('public.test_results')")
    if not exists[0]:
        print("Creating test_results table...")
        # Create minimal table matching schema roughly
        query = """
        CREATE TABLE test_results (
            id TEXT PRIMARY KEY,
            "breakerId" TEXT NOT NULL,
            "testDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
            "testType" TEXT DEFAULT 'DCRM',
            operator TEXT,
            notes TEXT,
            "fileName" TEXT NOT NULL,
            "fileUrl" TEXT,
            "referenceFileName" TEXT,
            "referenceFileUrl" TEXT,
            "testData" JSONB NOT NULL,
            "travelT1Max" DOUBLE PRECISION,
            "velocityT1Max" DOUBLE PRECISION,
            "resistanceCH1Avg" DOUBLE PRECISION,
            status TEXT DEFAULT 'COMPLETED',
            "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            "componentHealth" JSONB
        )
        """
        await database.execute(query)
        
    print("Manual migration complete.")
    await database.disconnect()

if __name__ == "__main__":
    asyncio.run(manual_migrate())
