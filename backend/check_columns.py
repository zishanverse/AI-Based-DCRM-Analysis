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

async def check_columns():
    await database.connect()
    try:
        # Check dataSourceId (camelCase)
        try:
            await database.fetch_one("SELECT \"dataSourceId\" FROM breakers LIMIT 1")
            print("Column 'dataSourceId' EXISTS")
        except Exception as e:
            print(f"Column 'dataSourceId' MISSING: {e}")

        # Check data_source_id (snake_case)
        try:
            await database.fetch_one("SELECT data_source_id FROM breakers LIMIT 1")
            print("Column 'data_source_id' EXISTS")
        except Exception as e:
            print(f"Column 'data_source_id' MISSING: {e}")

        # Check stationId vs station_id
        try:
            await database.fetch_one("SELECT \"stationId\" FROM breakers LIMIT 1")
            print("Column 'stationId' EXISTS")
        except Exception as e:
            print(f"Column 'stationId' MISSING: {e}")

        try:
            await database.fetch_one("SELECT station_id FROM breakers LIMIT 1")
            print("Column 'station_id' EXISTS")
        except Exception as e:
            print(f"Column 'station_id' MISSING: {e}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await database.disconnect()

if __name__ == "__main__":
    asyncio.run(check_columns())
