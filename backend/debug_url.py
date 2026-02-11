import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path.cwd() / ".env"
# If not in backend root, try parent
if not env_path.exists():
    env_path = Path.cwd().parent / ".env"

load_dotenv(env_path)

url = os.getenv("DATABASE_URL")

with open("debug_url_info.txt", "w", encoding="utf-8") as f:
    if not url:
        f.write("DATABASE_URL is None or Empty\n")
    else:
        f.write(f"Raw repr: {repr(url)}\n")
        f.write(f"Length: {len(url)}\n")
        try:
            from urllib.parse import urlparse
            p = urlparse(url)
            f.write(f"Scheme: {p.scheme}\n")
            f.write(f"Netloc: {p.netloc}\n")
            # Mask password
            if p.password:
                safe_netloc = p.netloc.replace(p.password, "******")
                f.write(f"Safe Netloc: {safe_netloc}\n")
            f.write(f"Hostname: {p.hostname}\n")
            f.write(f"Port: {p.port}\n")
            f.write(f"Path: {p.path}\n")
        except Exception as e:
            f.write(f"Parse Error: {e}\n")
