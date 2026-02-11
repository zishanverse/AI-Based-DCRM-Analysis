import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from databases import Database
import json

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

async def check_schema():
    await database.connect()
    try:
        tables = ["stations", "breakers", "data_sources"]
        schema_info = {}
        
        for table in tables:
            query = f"""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '{table}'
            """
            rows = await database.fetch_all(query)
            schema_info[table] = {r['column_name']: r['data_type'] for r in rows}
            
        print(json.dumps(schema_info, indent=2))
                
    except Exception as e:
        print(f"Error querying database: {e}")
    finally:
        await database.disconnect()

if __name__ == "__main__":
    asyncio.run(check_schema())
