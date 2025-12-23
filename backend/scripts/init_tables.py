
import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.db import database
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

async def init_tables():
    print("Connecting...")
    await database.connect()
    
    # Copy from full_init_migration.sql
    queries = [
        """
        CREATE TABLE IF NOT EXISTS "stations" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL DEFAULT 'Unknown Station',
            "location" TEXT,
            "location_lat" DOUBLE PRECISION,
            "location_lon" DOUBLE PRECISION,
            "description" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "password" TEXT DEFAULT '$2b$12$cq1...',
            "role" TEXT NOT NULL DEFAULT 'engineer',

            CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS "data_sources" (
            "id" TEXT NOT NULL,
            "fileName" TEXT NOT NULL,
            "fileUrl" TEXT NOT NULL,
            "description" TEXT,
            "status" TEXT NOT NULL DEFAULT 'PENDING',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS "breakers" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "manufacturer" TEXT NOT NULL,
            "model" TEXT,
            "voltage" DOUBLE PRECISION,
            "current" DOUBLE PRECISION,
            "status" TEXT,
            "installationDate" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "stationId" TEXT NOT NULL,
            "dataSourceId" TEXT,

            CONSTRAINT "breakers_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "breakers_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "breakers_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "data_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS "test_results" (
            "id" TEXT NOT NULL,
            "breakerId" TEXT NOT NULL,
            "testDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "testType" TEXT NOT NULL DEFAULT 'DCRM',
            "operator" TEXT,
            "notes" TEXT,
            "fileName" TEXT NOT NULL,
            "fileUrl" TEXT,
            "referenceFileName" TEXT,
            "referenceFileUrl" TEXT,
            "testData" JSONB NOT NULL,
            "travelT1Max" DOUBLE PRECISION,
            "velocityT1Max" DOUBLE PRECISION,
            "resistanceCH1Avg" DOUBLE PRECISION,
            "status" TEXT NOT NULL DEFAULT 'COMPLETED',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "componentHealth" JSONB,

            CONSTRAINT "test_results_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "test_results_breakerId_fkey" FOREIGN KEY ("breakerId") REFERENCES "breakers"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
        """
    ]
    
    for q in queries:
        try:
            await database.execute(q)
            print("Executed table creation.")
        except Exception as e:
            print(f"Error creating table: {e}")

    await database.disconnect()

if __name__ == "__main__":
    asyncio.run(init_tables())
