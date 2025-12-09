
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from app.services.diagnostics_service import ensure_models_ready, get_feature_names
    print("Attempting to load models...")
    ensure_models_ready()
    feats = get_feature_names()
    print(f"SUCCESS: Models loaded. Found {len(feats)} features.")
except Exception as e:
    print(f"FAILURE: {e}")
    import traceback
    traceback.print_exc()
