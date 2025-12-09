import os
import glob
import pandas as pd
import numpy as np
import joblib
import warnings
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, AdaBoostClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
import xgboost as xgb
from pathlib import Path
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models

# Suppress warnings
warnings.filterwarnings('ignore')

# Configuration
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "DCRM CSV files" / "402" / "402-B 26-11-2021.csv"
MODEL_DIR = BASE_DIR / "dcrm_models" / "shap_models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

def parse_dcrm_csv(file_path):
    """Parses DCRM CSV file to extract data points."""
    try:
        with open(file_path, 'r') as f:
            lines = f.readlines()
        
        data_start_index = -1
        for i, line in enumerate(lines):
            if "Coil Current C1 (A)" in line:
                data_start_index = i + 1
                break
        
        if data_start_index == -1:
            print(f"Skipping {file_path}: Data header not found")
            return None

        # Extract data
        data_lines = [line.strip().split(',') for line in lines[data_start_index:] if line.strip()]
        
        parsed_data = []
        for row in data_lines:
            if len(row) < 26: continue
            try:
                def get_val(idx):
                    val = float(row[idx])
                    return 0 if (val > 7900 or val < -100) else val # Filter outliers

                point = {
                    'resistance': [get_val(14), get_val(16), get_val(18), get_val(20), get_val(22), get_val(24)],
                    'travel': [get_val(7), get_val(8), get_val(9), get_val(10), get_val(11), get_val(12)],
                    'current': [get_val(15), get_val(17), get_val(19), get_val(21), get_val(23), get_val(25)],
                }
                parsed_data.append(point)
            except ValueError:
                continue
                
        return parsed_data
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return None

def extract_window_features(data, window_size=100):
    """Extracts features from windows of data points."""
    features = []
    n_points = len(data)
    
    for i in range(0, n_points - window_size, window_size):
        window = data[i:i+window_size]
        
        for ch in range(6):
            r_vals = np.array([pt['resistance'][ch] for pt in window])
            t_vals = np.array([pt['travel'][ch] for pt in window])
            c_vals = np.array([pt['current'][ch] for pt in window])
            
            f_row = {
                'window_mean_resistance': np.mean(r_vals),
                'window_std_resistance': np.std(r_vals),
                'window_max_resistance': np.max(r_vals),
                
                'window_mean_travel': np.mean(t_vals),
                'window_std_travel': np.std(t_vals),
                
                'window_mean_current': np.mean(c_vals),
                'window_std_current': np.std(c_vals),
                
                'Rp_avg': np.mean(r_vals),
                'Ra_ta': np.mean(r_vals) * np.mean(t_vals) if np.mean(t_vals) != 0 else 0,
                'T_overlap': 0
            }
            features.append(f_row)
            
    return pd.DataFrame(features)

def generate_dataset():
    print(f"Loading data from {DATA_FILE}...")
    raw_data = parse_dcrm_csv(DATA_FILE)
    if not raw_data:
        raise ValueError("Could not load training data")
        
    df_healthy = extract_window_features(raw_data)
    df_healthy['label'] = 0 # Healthy
    
    print(f"Extracted {len(df_healthy)} healthy samples")
    
    df_faulty = df_healthy.copy()
    
    # Fault generation: Resistance drift, Travel stiction
    df_faulty['window_mean_resistance'] *= np.random.uniform(1.5, 5.0, size=len(df_faulty))
    df_faulty['window_max_resistance'] *= np.random.uniform(1.5, 5.0, size=len(df_faulty))
    df_faulty['Rp_avg'] *= np.random.uniform(1.5, 5.0, size=len(df_faulty))
    df_faulty['window_mean_travel'] *= np.random.uniform(0.5, 0.9, size=len(df_faulty))
    
    df_faulty['label'] = 1 # Faulty
    print(f"Generated {len(df_faulty)} faulty samples")
    
    return pd.concat([df_healthy, df_faulty], ignore_index=True)

def train_and_save_all_models():
    df = generate_dataset()
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    X = df.drop(columns=['label'])
    y = df['label']
    feature_names = X.columns.tolist()
    
    # 1. Advanced Artifacts: Scaler & Encoder
    print("Fitting Scaler and LabelEncoder...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_scaled = pd.DataFrame(X_scaled, columns=feature_names)
    
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    # 2. Train Classifiers (XGB & Adaboost)
    print("Training classifiers...")
    xgb_model = xgb.XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.1, eval_metric='logloss')
    xgb_model.fit(X_scaled, y_encoded)
    
    ada_model = AdaBoostClassifier(n_estimators=100, learning_rate=0.1)
    ada_model.fit(X_scaled, y_encoded)
    
    # 3. Train Autoencoder (Anomaly Detection)
    # Train only on healthy data (label=0)
    print("Training Autoencoder...")
    X_healthy = X_scaled[y_encoded == 0]
    
    input_dim = X_healthy.shape[1]
    
    autoencoder = models.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(8, activation='relu'),
        layers.Dense(4, activation='relu'),
        layers.Dense(8, activation='relu'),
        layers.Dense(input_dim, activation='linear')
    ])
    
    autoencoder.compile(optimizer='adam', loss='mse')
    autoencoder.fit(X_healthy, X_healthy, epochs=50, batch_size=32, shuffle=True, verbose=0)
    
    # Calculate Threshold
    reconstructions = autoencoder.predict(X_healthy)
    mse = np.mean(np.power(X_healthy - reconstructions, 2), axis=1)
    threshold = float(np.max(mse) * 1.5) # Margin
    print(f"Autoencoder threshold: {threshold}")
    
    # 4. Save Artifacts
    print(f"Saving all artifacts to {MODEL_DIR}...")
    
    # SHAP requirements
    joblib.dump(xgb_model, MODEL_DIR / "xgb_shap_model.pkl")
    joblib.dump(ada_model, MODEL_DIR / "ada_shap_model.pkl")
    joblib.dump(feature_names, MODEL_DIR / "shap_feature_names.pkl")
    
    # Advanced Service requirements
    joblib.dump(scaler, MODEL_DIR / "scaler.pkl")
    joblib.dump(label_encoder, MODEL_DIR / "label_encoder.pkl")
    joblib.dump(feature_names, MODEL_DIR / "feature_names.pkl")
    joblib.dump(xgb_model, MODEL_DIR / "xgboost_model.pkl")
    joblib.dump(ada_model, MODEL_DIR / "adaboost_model.pkl")
    joblib.dump(threshold, MODEL_DIR / "ae_threshold.pkl")
    autoencoder.save(MODEL_DIR / "autoencoder_model.keras")
    
    print("Consolidated model generation complete.")

if __name__ == "__main__":
    train_and_save_all_models()
