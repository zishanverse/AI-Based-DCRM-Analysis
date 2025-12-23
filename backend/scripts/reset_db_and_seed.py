
import asyncio
import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Load env FIRST
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.db import database
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

async def reset_and_seed():
    print("Connecting...")
    await database.connect()
    
    print("Dropping legacy tables...")
    await database.execute('DROP TABLE IF EXISTS "test_results", "breaker_components", "breakers", "data_sources", "stations" CASCADE')
    
    print("Creating tables...")
    queries = [
        """
        CREATE TABLE "stations" (
            "id" TEXT PRIMARY KEY,
            "name" TEXT NOT NULL DEFAULT 'Unknown Station',
            "location" TEXT,
            "location_lat" DOUBLE PRECISION,
            "location_lon" DOUBLE PRECISION,
            "description" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "password" TEXT DEFAULT '$2b$12$cq1...',
            "role" TEXT NOT NULL DEFAULT 'engineer'
        );
        """,
        """
        CREATE TABLE "data_sources" (
            "id" TEXT PRIMARY KEY,
            "fileName" TEXT NOT NULL,
            "fileUrl" TEXT NOT NULL UNIQUE,
            "description" TEXT,
            "status" TEXT NOT NULL DEFAULT 'PENDING',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE "breakers" (
            "id" TEXT PRIMARY KEY,
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
            "stationId" TEXT NOT NULL REFERENCES "stations"("id") ON DELETE CASCADE,
            "dataSourceId" TEXT REFERENCES "data_sources"("id")
        );
        """,
        """
        CREATE TABLE "test_results" (
            "id" TEXT PRIMARY KEY,
            "breakerId" TEXT NOT NULL REFERENCES "breakers"("id") ON DELETE CASCADE,
            "testDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "testType" TEXT NOT NULL DEFAULT 'DCRM',
            "fileName" TEXT NOT NULL,
            "fileUrl" TEXT,
            "referenceFileName" TEXT,
            "referenceFileUrl" TEXT,
            "testData" JSONB NOT NULL,
            "status" TEXT NOT NULL DEFAULT 'COMPLETED',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "componentHealth" JSONB,
            "travelT1Max" DOUBLE PRECISION,
            "velocityT1Max" DOUBLE PRECISION,
            "resistanceCH1Avg" DOUBLE PRECISION,
            "operator" TEXT,
            "notes" TEXT
        );
        """
    ]
    for q in queries:
        await database.execute(q)

    print("Tables created.")
    
    # SEEDING
    # 1. Stations
    print("Seeding Stations...")
    station_id = "demo-station"
    hashed = pwd_context.hash("password")
    
    await database.execute("""
        INSERT INTO "stations" ("id", "name", "location", "role", "password", "createdAt", "updatedAt")
        VALUES (:id, 'Demo Substation 400kV', 'New Delhi', 'engineer', :password, NOW(), NOW())
    """, values={"id": station_id, "password": hashed})

    # 2. Data Sources
    print("Seeding Data Sources...")
    ds_id = "ds-sample-01"
    await database.execute("""
        INSERT INTO "data_sources" ("id", "fileName", "fileUrl", "description", "status", "createdAt", "updatedAt")
        VALUES (:id, 'sample_dcrm.csv', 'https://res.cloudinary.com/demo/image/upload/sample.csv', 'Sample DCRM Data', 'PROCESSED', NOW(), NOW())
    """, values={"id": ds_id})

    # 3. Breakers
    print("Seeding Breakers...")
    breaker_id = "brk-001"
    await database.execute("""
        INSERT INTO "breakers" ("id", "name", "type", "manufacturer", "voltage", "current", "status", "stationId", "dataSourceId", "createdAt", "updatedAt")
        VALUES (:id, 'BRK-Main-01', 'SF6 Circuit Breaker', 'Siemens', 400.0, 2000.0, 'Healthy', :sid, :did, NOW(), NOW())
    """, values={"id": breaker_id, "sid": station_id, "did": ds_id})
    
    # 4. Test Results
    print("Seeding Test Results...")
    tr_id = "tr-001"
    sample_data = json.dumps({"travel": [1, 2, 3], "current": [10, 20, 30]})
    health_data = json.dumps({"status": "Healthy", "score": 98})
    await database.execute("""
        INSERT INTO "test_results" ("id", "breakerId", "testDate", "testType", "fileName", "testData", "componentHealth", "createdAt", "updatedAt")
        VALUES (:id, :bid, NOW(), 'DCRM', 'test_run_1.csv', :data, :health, NOW(), NOW())
    """, values={"id": tr_id, "bid": breaker_id, "data": sample_data, "health": health_data})

    print("Seeding Complete!")
    await database.disconnect()

if __name__ == "__main__":
    asyncio.run(reset_and_seed())
