import os
import time
import random
import warnings
import json

# Web Framework
from flask import Flask, render_template, jsonify, request

# Data & ML
import pandas as pd
import numpy as np
import joblib
import xgboost as xgb
import shap
from sklearn.preprocessing import StandardScaler, LabelEncoder
from tensorflow.keras.models import load_model

# Suppress warnings for cleaner logs
warnings.filterwarnings("ignore")

app = Flask(__name__)

# --- CONFIGURATION ---
UPLOAD_FOLDER = 'uploads'
ARTIFACTS_FOLDER = '.'  # Assumes models are in the same directory as app.py
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Global variables to hold loaded models
artifacts = {}

# --- LOADER FUNCTION ---
def load_models():
    """Loads all ML artifacts into memory on startup."""
    global artifacts
    try:
        print("Loading models and artifacts...")
        artifacts['scaler'] = joblib.load(os.path.join(ARTIFACTS_FOLDER, 'scaler.pkl'))
        artifacts['le'] = joblib.load(os.path.join(ARTIFACTS_FOLDER, 'label_encoder.pkl'))
        artifacts['feature_names'] = joblib.load(os.path.join(ARTIFACTS_FOLDER, 'feature_names.pkl'))
        artifacts['xgboost'] = joblib.load(os.path.join(ARTIFACTS_FOLDER, 'xgboost_model.pkl'))
        artifacts['ae_threshold'] = joblib.load(os.path.join(ARTIFACTS_FOLDER, 'ae_threshold.pkl'))
        
        # Load Keras model safely
        artifacts['autoencoder'] = load_model(os.path.join(ARTIFACTS_FOLDER, 'autoencoder_model.keras'), compile=False)
        
        # Initialize SHAP explainer (TreeExplainer is fast for XGBoost)
        # We pass the model to the explainer
        artifacts['explainer'] = shap.TreeExplainer(artifacts['xgboost'])
        
        print("✅ All models loaded successfully.")
        return True
    except FileNotFoundError as e:
        print(f"❌ Error loading models: {e}")
        print("Please ensure train_model.py has been run and .pkl/.keras files are in the directory.")
        return False

# Load models immediately
models_loaded = load_models()

# --- PREPROCESSING HELPER ---
def preprocess_input(df_raw):
    """
    Applies the same preprocessing steps as train_model.py
    Returns: X_scaled (ready for inference), df_processed (for reference)
    """
    # 1. Drop ID columns
    drop_cols = ['breaker_id', 'bay_id', 'raw_timeseries_id', 'operation_count_total', 'overall_health']
    df = df_raw.drop(columns=[c for c in drop_cols if c in df_raw.columns], errors='ignore')
    
    # 2. Handle categorical (One-Hot) - Align with training features
    # In production, we usually reindex to ensure columns match exactly
    df = pd.get_dummies(df)
    
    # 3. Align columns with training data (add missing cols as 0, drop extra cols)
    expected_cols = artifacts['feature_names']
    
    # Add missing columns
    for col in expected_cols:
        if col not in df.columns:
            df[col] = 0
            
    # Reorder/Drop extra columns to match training structure exactly
    df = df[expected_cols]
    
    # 4. Handle NaNs (Simple fill with 0 or mean if we had it saved, using 0/ffill for now)
    df = df.fillna(0)
    
    # 5. Scale
    X_scaled = artifacts['scaler'].transform(df)
    
    return pd.DataFrame(X_scaled, columns=expected_cols)

# --- ROUTES ---

@app.route('/')
def dashboard():
    """Serves the main dashboard HTML."""
    return render_template('dashboard.html')

# --- API ENDPOINTS ---

@app.route('/api/shap/<category>', methods=['GET'])
def get_shap_data(category):
    """
    Returns generic SHAP feature importance based on the loaded model.
    Since we don't have a specific instance 'row' here, we return global feature importance
    derived from the XGBoost model, styled for the frontend.
    """
    if not models_loaded:
        return jsonify({"error": "Models not loaded"}), 500

    # Get global feature importance from XGBoost
    # Using 'gain' or 'weight' to determine top features
    booster = artifacts['xgboost'].get_booster()
    importance = booster.get_score(importance_type='gain')
    
    # Sort and get top 5
    sorted_importance = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:5]
    top_features = [x[0] for x in sorted_importance]
    top_values = [round(x[1], 2) for x in sorted_importance]

    # Map categories to dummy 'scores' just for the UI visualization 
    # (Real scores come from /api/predict)
    ui_map = {
        'critical': {'score': 0.92, 'color': '#ef4444', 'desc': 'Critical anomalies detected in signal patterns.'},
        'warning':  {'score': 0.64, 'color': '#eab308', 'desc': 'Operational parameters deviating from baseline.'},
        'healthy':  {'score': 0.12, 'color': '#22c55e', 'desc': 'System operating within optimal parameters.'}
    }
    
    info = ui_map.get(category, ui_map['warning'])

    response_data = {
        'label': category.capitalize(),
        'score': info['score'],
        'color': info['color'],
        'text': f"Model Analysis: {info['desc']}",
        'features': top_features,  # REAL top features from model
        'values': top_values       # REAL importance scores
    }
    
    return jsonify(response_data)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """
    Handles CSV/Excel file uploads, runs XGBoost + Autoencoder, 
    and returns predictions with SHAP explanations.
    """
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400

    if file and models_loaded:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        
        try:
            # 1. Read File
            if filepath.endswith('.xlsx') or filepath.endswith('.xls'):
                df_input = pd.read_excel(filepath)
            else:
                df_input = pd.read_csv(filepath)
            
            # Take just the first row for single-instance demo (or handle multiple)
            # For this API, we will process the first row to return a detailed analysis
            X_processed = preprocess_input(df_input.head(1))
            
            # 2. XGBoost Prediction (Classification)
            # Predict Class
            pred_idx = artifacts['xgboost'].predict(X_processed)[0]
            pred_label = artifacts['le'].inverse_transform([pred_idx])[0]
            # Predict Proba
            probs = artifacts['xgboost'].predict_proba(X_processed)[0]
            confidence = float(np.max(probs))
            
            # 3. Autoencoder Prediction (Anomaly Detection)
            # Reconstruct
            reconstruction = artifacts['autoencoder'].predict(X_processed, verbose=0)
            # Calculate MSE
            mse = np.mean(np.power(X_processed - reconstruction, 2), axis=1)[0]
            threshold = artifacts['ae_threshold']
            is_anomaly = bool(mse > threshold)
            
            # 4. SHAP Values for this specific instance
            shap_values = artifacts['explainer'].shap_values(X_processed)
            
            # Handle binary vs multiclass SHAP shapes
            if isinstance(shap_values, list):
                # Multiclass: shap_values is a list of arrays, one per class. 
                # We take the array corresponding to the predicted class.
                sv = shap_values[pred_idx][0]
            else:
                sv = shap_values[0]
                
            # Get indices of top 3 contributing features
            top_indices = np.argsort(np.abs(sv))[-3:][::-1]
            feature_names = artifacts['feature_names']
            
            top_factors = []
            for i in top_indices:
                top_factors.append({
                    "feature": feature_names[i],
                    "impact": round(float(sv[i]), 4),
                    "value": round(float(X_processed.iloc[0, i]), 4)
                })

            # 5. Construct Response
            result = {
                "status": "success",
                "filename": file.filename,
                "prediction": {
                    "health_status": pred_label,
                    "confidence": f"{confidence*100:.1f}%",
                    "anomaly_detection": {
                        "is_anomaly": is_anomaly,
                        "reconstruction_error": round(float(mse), 6),
                        "threshold": round(float(threshold), 6)
                    }
                },
                "explanation": {
                    "top_factors": top_factors,
                    "summary": f"Classified as {pred_label} with {confidence*100:.1f}% confidence. "
                               f"{'Anomalous pattern detected.' if is_anomaly else 'Signal pattern within normal reconstruction limits.'}"
                }
            }
            return jsonify(result)

        except Exception as e:
            return jsonify({"status": "error", "message": f"Processing error: {str(e)}"}), 500
    
    return jsonify({"status": "error", "message": "Models not loaded correctly."}), 500

@app.route('/api/chat', methods=['POST'])
def chat_response():
    """Simple Logic for the Dashboard Assistant."""
    data = request.json
    user_msg = data.get('message', '').lower()
    response_text = ""

    if not models_loaded:
        return jsonify({"reply": "System Error: ML Models are not loaded. Please check server logs."})

    if "run model" in user_msg or "analyze" in user_msg:
        response_text = "I can analyze your data. Please upload a CSV or Excel file using the panel on the right, and I will run the XGBoost classifier and Autoencoder anomaly detector."
    
    elif "status" in user_msg:
        # Check active model info
        features_count = len(artifacts.get('feature_names', []))
        response_text = f"System Online. <br><strong>Loaded Models:</strong> XGBoost (Classifier), Autoencoder (Anomaly Detection).<br><strong>Input Features:</strong> {features_count} sensors monitored."
    
    elif "threshold" in user_msg or "sensitivity" in user_msg:
        thresh = artifacts.get('ae_threshold', 0)
        response_text = f"The current Deep Learning Anomaly Threshold is set to <strong>{thresh:.4f}</strong> MSE. Signals deviating beyond this are flagged as anomalies."
        
    elif "hello" in user_msg:
        response_text = "Hello! I am the DCRM Assistant. I can help you analyze circuit breaker health using Hybrid AI."
        
    else:
        response_text = "I've logged that request. You can ask me about 'System Status', 'Thresholds', or ask me to 'Analyze' a file."

    return jsonify({"reply": response_text})

if __name__ == '__main__':
    print("Starting Flask Server...")
    # Ensure artifacts exist before starting
    if not os.path.exists(os.path.join(ARTIFACTS_FOLDER, 'xgboost_model.pkl')):
        print("⚠️ WARNING: Model files not found. Run train_model.py first!")
    
    app.run(debug=True, port=8000)