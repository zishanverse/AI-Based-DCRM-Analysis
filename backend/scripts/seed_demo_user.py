
import asyncio
import os
import sys

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import database
from passlib.context import CryptContext

# Same check as in app/repositories/stations.py
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

async def seed():
    print("Connecting to database...")
    await database.connect()

    # debug schema
    rows = await database.fetch_all("SELECT column_name FROM information_schema.columns WHERE table_name = 'stations'")
    print("Columns in stations:", [r['column_name'] for r in rows])
    
    station_id = "demo-station"
    # Plain password "password" - hash it
    hashed = pwd_context.hash("password")
    
    print(f"Checking if {station_id} exists...")
    query = "SELECT * FROM stations WHERE station_id = :id"
    row = await database.fetch_one(query=query, values={"id": station_id})
    
    if row:
        print(f"User {station_id} already exists. Updating password...")
        update_query = """
        UPDATE stations 
        SET password = :password, role = 'engineer' 
        WHERE id = :id
        """
        await database.execute(query=update_query, values={"password": hashed, "id": station_id})
    else:
        print(f"Creating user {station_id}...")
        insert_query = """
        INSERT INTO stations (id, name, role, password, "updatedAt")
        VALUES (:id, 'Demo Substation 400kV', 'engineer', :password, NOW())
        """
        await database.execute(query=insert_query, values={"id": station_id, "password": hashed})
        
    print("Seeding complete.")
    await database.disconnect()

if __name__ == "__main__":
    asyncio.run(seed())
