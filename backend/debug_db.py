import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from databases import Database
import asyncio

# Load .env
env_path = Path.cwd() / ".env"
# If not in backend root, try parent
if not env_path.exists():
    env_path = Path.cwd().parent / ".env"

print(f"Loading .env from: {env_path}")
load_dotenv(env_path)

url = os.getenv("DATABASE_URL")
if not url:
    print("ERROR: DATABASE_URL is missing!")
    sys.exit(1)

print(f"DATABASE_URL length: {len(url)}")
try:
    from urllib.parse import urlparse
    parsed = urlparse(url)
    print(f"Scheme: {parsed.scheme}")
    print(f"User: {'***' if parsed.username else 'None'}")
    print(f"Password: {'***' if parsed.password else 'None'}")
    print(f"Hostname: {parsed.hostname}")
    print(f"Port: {parsed.port}")
    print(f"Path: {parsed.path}")
except Exception as e:
    print(f"URL Parsing failed: {e}")

print("\nAttempting to initialize Database...")
try:
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    
    if "sslmode=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode=require"

    database = Database(url)
    print("Database initialized object successfully.")
    
    print("Attempting to connect...")
    async def test_connect():
        await database.connect()
        print("Connection successful!")
        await database.disconnect()

    asyncio.run(test_connect())

except Exception as e:
    print("\nEXCEPTION CAUGHT:")
    import traceback
    traceback.print_exc()
