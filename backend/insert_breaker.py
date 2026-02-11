import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from databases import Database
from datetime import datetime

# Load .env
env_path = Path.cwd() / ".env"
if not env_path.exists():
    env_path = Path.cwd().parent / ".env"
load_dotenv(env_path)

url = os.getenv("DATABASE_URL")
if not url:
    print("DATABASE_URL missing")
    exit(1)

# Fix URL for asyncpg
if url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql://", 1)
if "sslmode=" not in url:
    sep = "&" if "?" in url else "?"
    url = f"{url}{sep}sslmode=require"

database = Database(url)

async def insert_data():
    await database.connect()
    try:
        # 1. Insert Data Source if missing
        ds_query = """
        INSERT INTO data_sources (id, "fileName", "fileUrl", status, "createdAt")
        VALUES (:id, :fileName, :fileUrl, :status, NOW())
        ON CONFLICT (id) DO NOTHING
        """
        
        try:
            await database.execute(ds_query, values={
                "id": "ds-sample-01",
                "fileName": "sample_breaker_data.csv",
                "fileUrl": "https://example.com/sample.csv",
                "status": "READY"
            })
            print("Data Source inserted/verified.")
        except Exception as e_ds:
            print(f"Data Source Insert Error: {e_ds}")
            return # Stop if DS fails

        # 2. Insert Breaker
        breaker_query = """
        INSERT INTO breakers (
            id, name, type, manufacturer, model, voltage, current, status, 
            "installationDate", "createdAt", "updatedAt", 
            "stationId", "dataSourceId"
        ) VALUES (
            :id, :name, :type, :manufacturer, :model, :voltage, :current, :status, 
            :installationDate, :createdAt, :updatedAt, 
            :stationId, :dataSourceId
        )
        ON CONFLICT (id) DO NOTHING
        """
        
        ts = datetime.strptime('2025-12-25 11:23:37.383', '%Y-%m-%d %H:%M:%S.%f')
        
        values = {
            'id': 'brk-001',
            'name': 'BRK-Main-01',
            'type': 'SF6 Circuit Breaker',
            'manufacturer': 'Siemens',
            'model': None,
            'voltage': 400.0,
            'current': 2000.0,
            'status': 'Healthy',
            'installationDate': None,
            'createdAt': ts,
            'updatedAt': ts,
            'stationId': 'STN-1234', 
            'dataSourceId': 'ds-sample-01'
        }
        
        await database.execute(breaker_query, values)
        print("Breaker inserted successfully.")

    except Exception as e:
        print(f"Error inserting: {e}")
    finally:
        await database.disconnect()

if __name__ == "__main__":
    asyncio.run(insert_data())
