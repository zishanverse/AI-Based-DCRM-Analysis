import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from databases import Database

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

async def check_counts():
    await database.connect()
    try:
        stations_count = await database.fetch_val("SELECT COUNT(*) FROM stations")
        breakers_count = await database.fetch_val("SELECT COUNT(*) FROM breakers")
        print(f"Stations count: {stations_count}")
        print(f"Breakers count: {breakers_count}")
        
        if stations_count > 0:
            print("\nSample Stations:")
            rows = await database.fetch_all("SELECT id, name FROM stations LIMIT 5")
            for r in rows:
                print(dict(r))
                
    except Exception as e:
        print(f"Error querying database: {e}")
    finally:
        await database.disconnect()

if __name__ == "__main__":
    asyncio.run(check_counts())
