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

async def pre_check():
    await database.connect()
    try:
        # Check DS
        ds_id = 'ds-sample-01'
        # Try both camel and snake for table verification if needed, but table is likely 'data_sources' (mapped in schema)
        # Schema says @@map("data_sources")
        
        # Check if column is id?
        count = await database.fetch_val(f"SELECT COUNT(*) FROM data_sources WHERE id = '{ds_id}'")
        print(f"Data Source '{ds_id}' exists: {count > 0}")

        # Check Breaker Columns
        print("\nBreaker Columns:")
        rows = await database.fetch_all("SELECT column_name FROM information_schema.columns WHERE table_name = 'breakers'")
        cols = [r['column_name'] for r in rows]
        print(cols)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await database.disconnect()

if __name__ == "__main__":
    asyncio.run(pre_check())
