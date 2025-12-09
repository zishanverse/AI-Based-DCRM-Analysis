
import joblib
from pathlib import Path
import os

MODEL_DIR = Path(r"f:\sih 2025\frontend\new code\company-assigmnet\backend\dcrm_models\shap_models")

try:
    feature_names = joblib.load(MODEL_DIR / "feature_names.pkl")
    print("EXPECTED FEATURES (First 20):")
    print(feature_names[:20])
    
    print("\nALL FEATURES:")
    for f in feature_names:
        print(f)
        
except Exception as e:
    print(e)
