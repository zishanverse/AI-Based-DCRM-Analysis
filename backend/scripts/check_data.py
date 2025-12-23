
import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.db import database
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

async def check_data():
    print("Connecting...")
    await database.connect()
    
    print("\n--- STATIONS ---")
    stations = await database.fetch_all('SELECT id, name FROM "stations"')
    print(f"Count: {len(stations)}")
    for s in stations:
        print(dict(s))

    print("\n--- BREAKERS ---")
    breakers = await database.fetch_all('SELECT id, name, "stationId" FROM "breakers"')
    print(f"Count: {len(breakers)}")
    for b in breakers:
        print(dict(b))
        
    print("\n--- DATA SOURCES ---")
    data_sources = await database.fetch_all('SELECT * FROM "data_sources"')
    print(f"Count: {len(data_sources)}")
    for d in data_sources:
        print(dict(d))

    print("\n--- TEST RESULTS ---")
    tests = await database.fetch_all('SELECT id, "fileName", "componentHealth" FROM "test_results" LIMIT 5')

    print(f"Count: {len(tests)}") # Just checking if any
    for t in tests:
        print(f"ID: {t['id']}, File: {t['fileName']}, Health: {t['componentHealth'] is not None}")

    await database.disconnect()

if __name__ == "__main__":
    asyncio.run(check_data())
