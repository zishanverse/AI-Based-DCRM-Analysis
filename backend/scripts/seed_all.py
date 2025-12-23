
import asyncio
import os
import sys
import json
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load env FIRST
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.db import database
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

async def seed_all():
    print("Connecting...")
    await database.connect()
    


    # 1. Stations
    print("Seeding Stations...")
    station_id = "demo-station"
    hashed = pwd_context.hash("password")
    
    # Check if exists
    s_row = await database.fetch_one('SELECT * FROM public."stations" WHERE id = :id', values={"id": station_id})
    if not s_row:
        await database.execute("""
            INSERT INTO public."stations" ("id", "name", "location", "role", "password", "createdAt", "updatedAt")
            VALUES (:id, 'Demo Substation 400kV', 'New Delhi', 'engineer', :password, NOW(), NOW())
        """, values={"id": station_id, "password": hashed})
    else:
        print("Demo station exists.")

    # 2. Data Sources
    print("Seeding Data Sources...")
    ds_id = "ds-sample-01"
    d_row = await database.fetch_one('SELECT * FROM public."data_sources" WHERE id = :id', values={"id": ds_id})
    if not d_row:
        await database.execute("""
            INSERT INTO public."data_sources" ("id", "fileName", "fileUrl", "description", "status", "createdAt", "updatedAt")
            VALUES (:id, 'sample_dcrm.csv', 'https://res.cloudinary.com/demo/image/upload/sample.csv', 'Sample DCRM Data', 'PROCESSED', NOW(), NOW())
        """, values={"id": ds_id})

    # 3. Breakers
    print("Seeding Breakers...")
    breaker_id = "brk-001"
    b_row = await database.fetch_one('SELECT * FROM public."breakers" WHERE id = :id', values={"id": breaker_id})
    if not b_row:
         await database.execute("""
            INSERT INTO public."breakers" ("id", "name", "type", "manufacturer", "voltage", "current", "status", "stationId", "dataSourceId", "createdAt", "updatedAt")
            VALUES (:id, 'BRK-Main-01', 'SF6 Circuit Breaker', 'Siemens', 400, 2000, 'Healthy', :sid, :did, NOW(), NOW())
        """, values={"id": breaker_id, "sid": station_id, "did": ds_id})
    
    # 4. Test Results
    print("Seeding Test Results...")
    tr_id = "tr-001"
    t_row = await database.fetch_one('SELECT * FROM public."test_results" WHERE id = :id', values={"id": tr_id})
    if not t_row:
        sample_data = json.dumps({"travel": [1, 2, 3], "current": [10, 20, 30]})
        health_data = json.dumps({"status": "Healthy", "score": 98})
        await database.execute("""
            INSERT INTO public."test_results" ("id", "breakerId", "testDate", "testType", "fileName", "testData", "componentHealth", "createdAt", "updatedAt")
            VALUES (:id, :bid, NOW(), 'DCRM', 'test_run_1.csv', :data, :health, NOW(), NOW())
        """, values={"id": tr_id, "bid": breaker_id, "data": sample_data, "health": health_data})

    print("Seeding Complete.")
    await database.disconnect()

if __name__ == "__main__":
    asyncio.run(seed_all())
