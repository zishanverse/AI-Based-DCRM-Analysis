import sys
from pathlib import Path
import pandas as pd
import logging

# Add backend directory to path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from app.services import shap_service

# Setup logging
logging.basicConfig(level=logging.INFO)

def verify():
    print("Verifying SHAP Service...")
    
    # 1. Create a dummy waveform dataframe
    # Needed columns: timeMs, resistanceCH1..6, travelT1..6, currentCH1..6 usually
    # But our parser uses column names from CSV. 
    # Let's mock the internal dataframe structure expected by the service
    
    # shap_service expects raw csv column names or mapped ones?
    # It checks for "resistance" in column names.
    
    # Create 200 data points (20ms at 10kHz) so we get at least 2 windows
    n_points = 200
    data = {
        "Resistance CH1 (microOhm)": [50] * n_points,
        "Contact Travel T1 (mm)": [1] * n_points,
        "Current CH1 (A)": [10] * n_points
    }
    # Add a "fault" spike
    for i in range(50, 70):
        data["Resistance CH1 (microOhm)"][i] = 6000 # High resistance
    
    df = pd.DataFrame(data)
    
    print("Input Data:")
    print(df)
    
    # 2. Call Service
    result = shap_service.calculate_shap_for_waveform(df)
    
    if result:
        print("\nSHAP Result keys:", result.keys())
        print("Time windows:", len(result['time_windows']))
        print("XGBoost features:", result['shap']['xgboost'].keys())
        
        res_scores = result['shap']['xgboost']['resistance']
        print(f"Resistance Scores (XGB): {res_scores}")
        
        # Validation
        if len(res_scores) > 0 and max(res_scores) > 0:
             print("SUCCESS: SHAP values computed and normalized.")
        else:
             print("WARNING: SHAP values are all zero (might be expected if model sees no fault or limited data).")
             
    else:
        print("FAILURE: Service returned None.")

if __name__ == "__main__":
    verify()
