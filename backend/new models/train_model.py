# train_improved.py
# Improved training script (hardcoded dataset path)
# Saves: scaler.pkl, label_encoder.pkl, feature_names.pkl,
#        xgboost_model.pkl, adaboost_model.pkl, autoencoder_model.keras, ae_threshold.pkl
# Metrics & feature importance saved as CSVs in working dir.

import os
import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
import joblib
import xgboost as xgb

from sklearn.ensemble import AdaBoostClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, RandomizedSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, f1_score, confusion_matrix
from sklearn.utils.class_weight import compute_sample_weight

# Keras Autoencoder
from tensorflow.keras.models import Model, load_model
from tensorflow.keras.layers import Input, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping

# Try to import SMOTE (recommended). If not available, script will still run.
try:
    from imblearn.over_sampling import SMOTE
    SMOTE_AVAILABLE = True
except Exception:
    SMOTE_AVAILABLE = False

# ---------------------------
# CONFIG (hardcoded)
# ---------------------------
# FIX 1: Updated to local file name and .csv extension
DATA_PATH = "sf6_dataset_with_improvements.csv"   
TARGET_COL = "overall_health"
ANOMALY_TARGET = "Good"
TEST_SIZE = 0.2
RANDOM_SEED = 42

# XGBoost base params
XGB_BASE_PARAMS = {
    "n_estimators": 300,
    "learning_rate": 0.05,
    "max_depth": 8,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "objective": "multi:softprob",
    "eval_metric": "mlogloss",
    "use_label_encoder": False,
    "n_jobs": -1,
    "random_state": RANDOM_SEED
}

ADABOOST_PARAMS = {
    "n_estimators": 200,
    "learning_rate": 0.1,
    "estimator": DecisionTreeClassifier(max_depth=3, random_state=RANDOM_SEED)
}

AE_PARAMS = {
    "encoding_dim": 16,
    "epochs": 80,
    "batch_size": 32,
    "validation_split": 0.12,
    "patience": 8
}

# ---------------------------
# UTIL: save artifacts
# ---------------------------
def save_artifact(obj, name):
    joblib.dump(obj, name)
    print(f"[saved] {name}")

# ---------------------------
# 1) Load & preprocess
# ---------------------------
def load_and_preprocess(path):
    print(f"Loading dataset from: {path}")
    
    # robust check for extension
    if path.endswith('.xlsx') or path.endswith('.xls'):
        df = pd.read_excel(path)
    else:
        df = pd.read_csv(path)

    print("Initial shape:", df.shape)
    
    # Drop known ID-like columns if present
    drop_cols = ['breaker_id', 'bay_id', 'raw_timeseries_id', 'operation_count_total']
    df = df.drop(columns=[c for c in drop_cols if c in df.columns], errors='ignore')
    
    # Ensure target exists
    if TARGET_COL not in df.columns:
        raise ValueError(f"Target column '{TARGET_COL}' not found in dataset. Columns present: {list(df.columns)}")
    
    # Identify categorical columns (exclude target)
    cat_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    if TARGET_COL in cat_cols:
        cat_cols.remove(TARGET_COL)
    
    # Fill NaNs for numeric before get_dummies to avoid all-NaN columns
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    for c in num_cols:
        if df[c].isna().any():
            df[c] = df[c].fillna(df[c].mean())
    
    # One-hot encode categorical columns (if any)
    if len(cat_cols) > 0:
        df = pd.get_dummies(df, columns=cat_cols, drop_first=True)
    
    # Encode target with LabelEncoder and save mapping
    le = LabelEncoder()
    df[TARGET_COL] = le.fit_transform(df[TARGET_COL].astype(str))
    
    # Separate
    X = df.drop(columns=[TARGET_COL])
    y = df[TARGET_COL]
    
    # Scale features (Standard)
    scaler = StandardScaler()
    X_scaled = pd.DataFrame(scaler.fit_transform(X), columns=X.columns)
    
    # Save artifacts
    save_artifact(scaler, 'scaler.pkl')
    save_artifact(le, 'label_encoder.pkl')
    save_artifact(list(X.columns), 'feature_names.pkl')
    
    print(f"Processed: features={X_scaled.shape[1]}, samples={X_scaled.shape[0]}, classes={len(le.classes_)}")
    return X_scaled, y, le, scaler

# ---------------------------
# 2) Train XGBoost with early stopping and optional randomized search
# ---------------------------
def train_xgboost(X_train, y_train, X_val, y_val, do_search=False):
    print("\n--- Training XGBoost ---")
    # sample weights handling for imbalanced multiclass
    sample_weights = compute_sample_weight(class_weight='balanced', y=y_train)
    
    params = XGB_BASE_PARAMS.copy()
    
    # FIX 2: early_stopping_rounds moved to params for newer XGBoost versions
    params['early_stopping_rounds'] = 25
    
    model = xgb.XGBClassifier(**params)
    
    # Convert validation to DMatrix-like eval_set for early stopping
    eval_set = [(X_train, y_train), (X_val, y_val)]
    
    model.fit(
        X_train, y_train,
        sample_weight=sample_weights,
        eval_set=eval_set,
        verbose=False
    )
    
    # Optionally run a lightweight randomized search (uncomment to enable)
    if do_search:
        print("Running RandomizedSearchCV (this may take time)...")
        param_dist = {
            "n_estimators": [100, 200, 300, 500],
            "max_depth": [3, 5, 8, 10],
            "learning_rate": [0.01, 0.03, 0.05, 0.1],
            "subsample": [0.6, 0.8, 1.0],
            "colsample_bytree": [0.6, 0.8, 1.0]
        }
        # Note: RandomizedSearch handles its own params, so we init a fresh classifier
        rs = RandomizedSearchCV(
            xgb.XGBClassifier(use_label_encoder=False, n_jobs=-1, random_state=RANDOM_SEED),
            param_distributions=param_dist,
            n_iter=20,
            scoring='f1_macro',
            cv=StratifiedKFold(n_splits=3, shuffle=True, random_state=RANDOM_SEED),
            verbose=1,
            n_jobs=-1,
            random_state=RANDOM_SEED
        )
        rs.fit(X_train, y_train, sample_weight=sample_weights)
        print("RandomizedSearch best:", rs.best_params_)
        model = rs.best_estimator_
    
    preds = model.predict(X_val)
    acc = accuracy_score(y_val, preds)
    f1 = f1_score(y_val, preds, average='macro')
    print(f"XGBoost val acc: {acc:.4f}  macro-F1: {f1:.4f}")
    
    # Save model and feature importance
    save_artifact(model, 'xgboost_model.pkl')
    try:
        fi = model.get_booster().get_score(importance_type='gain')
        fi_df = pd.DataFrame(list(fi.items()), columns=['feature','gain']).sort_values('gain', ascending=False)
        fi_df.to_csv('xgb_feature_importance.csv', index=False)
        print("[saved] xgb_feature_importance.csv")
    except Exception:
        pass
    
    return model

# ---------------------------
# 3) Train AdaBoost
# ---------------------------
def train_adaboost(X_train, y_train, X_test, y_test):
    print("\n--- Training AdaBoost ---")
    sample_weights = compute_sample_weight(class_weight='balanced', y=y_train)
    base = ADABOOST_PARAMS['estimator']
    model = AdaBoostClassifier(estimator=base, n_estimators=ADABOOST_PARAMS['n_estimators'],
                               learning_rate=ADABOOST_PARAMS['learning_rate'], random_state=RANDOM_SEED)
    model.fit(X_train, y_train, sample_weight=sample_weights)
    
    preds = model.predict(X_test)
    print(f"AdaBoost Accuracy: {accuracy_score(y_test, preds):.4f}  macro-F1: {f1_score(y_test, preds, average='macro'):.4f}")
    save_artifact(model, 'adaboost_model.pkl')
    return model

# ---------------------------
# 4) Train Autoencoder for anomaly detection
# ---------------------------
def train_autoencoder(X, y, label_encoder):
    print("\n--- Training Autoencoder (unsupervised on 'normal') ---")
    # Find label index for ANOMALY_TARGET
    if ANOMALY_TARGET not in label_encoder.classes_:
        raise ValueError(f"ANOMALY_TARGET '{ANOMALY_TARGET}' not found in label encoder classes: {label_encoder.classes_}")
    normal_idx = label_encoder.transform([ANOMALY_TARGET])[0]
    X_normal = X[y == normal_idx]
    print(f"Autoencoder training samples (normal): {X_normal.shape[0]}")
    
    input_dim = X.shape[1]
    inp = Input(shape=(input_dim,))
    enc = Dense(128, activation='relu')(inp)
    enc = Dropout(0.2)(enc)
    enc = Dense(64, activation='relu')(enc)
    bottleneck = Dense(AE_PARAMS['encoding_dim'], activation='relu')(enc)
    dec = Dense(64, activation='relu')(bottleneck)
    dec = Dense(128, activation='relu')(dec)
    out = Dense(input_dim, activation='linear')(dec)
    autoencoder = Model(inp, out)
    autoencoder.compile(optimizer='adam', loss='mean_squared_error')
    
    early = EarlyStopping(monitor='val_loss', patience=AE_PARAMS['patience'], restore_best_weights=True)
    autoencoder.fit(
        X_normal, X_normal,
        epochs=AE_PARAMS['epochs'],
        batch_size=AE_PARAMS['batch_size'],
        validation_split=AE_PARAMS['validation_split'],
        callbacks=[early],
        verbose=1
    )
    
    # Compute reconstruction mse and threshold
    recon = autoencoder.predict(X_normal, verbose=0)
    mse = np.mean(np.power(X_normal - recon, 2), axis=1)
    threshold = np.percentile(mse, 95)
    print(f"Computed AE threshold (95th percentile): {threshold:.6f}")
    
    autoencoder.save('autoencoder_model.keras')
    joblib.dump(threshold, 'ae_threshold.pkl')
    print("[saved] autoencoder_model.keras, ae_threshold.pkl")
    return autoencoder, threshold

# ---------------------------
# 5) Evaluation utilities
# ---------------------------
def print_classification(y_true, y_pred, label_encoder=None):
    print("Accuracy:", accuracy_score(y_true, y_pred))
    print("Macro F1:", f1_score(y_true, y_pred, average='macro'))
    print("Classification Report:")
    print(classification_report(y_true, y_pred, target_names=(label_encoder.classes_ if label_encoder else None)))
    print("Confusion Matrix:")
    print(confusion_matrix(y_true, y_pred))

# ---------------------------
# 6) Main
# ---------------------------
if __name__ == "__main__":
    X, y, le, scaler = load_and_preprocess(DATA_PATH)
    
    # Train/test split (stratified)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y)
    
    # Use SMOTE if available (oversample only training set)
    if SMOTE_AVAILABLE:
        print("SMOTE available - applying to training set")
        sm = SMOTE(random_state=RANDOM_SEED)
        X_train_res, y_train_res = sm.fit_resample(X_train, y_train)
        print("After SMOTE: ", pd.Series(y_train_res).value_counts().to_dict())
    else:
        print("SMOTE not available - using original training set (sample weights will be used in fit).")
        X_train_res, y_train_res = X_train, y_train
    
    # Optionally further split training to create validation for early stopping
    X_tr_sub, X_val, y_tr_sub, y_val = train_test_split(X_train_res, y_train_res, test_size=0.15, random_state=RANDOM_SEED, stratify=y_train_res)
    
    # Train models
    xgb_model = train_xgboost(X_tr_sub, y_tr_sub, X_val, y_val, do_search=False)
    adaboost_model = train_adaboost(X_tr_sub, y_tr_sub, X_test, y_test)
    ae_model, ae_threshold = train_autoencoder(X, y, le)
    
    # Final evaluation: XGBoost on test set
    preds_test = xgb_model.predict(X_test)
    print("\n--- Final Evaluation: XGBoost on Test Set ---")
    print_classification(y_test, preds_test, label_encoder=le)
    
    # Save final artifacts (already saved but ensure presence)
    save_artifact(xgb_model, 'xgboost_model.pkl')
    save_artifact(adaboost_model, 'adaboost_model.pkl')
    save_artifact(ae_threshold, 'ae_threshold.pkl')
    
    # ---------------------------
    # Real-time inference example (simulate raw row)
    # ---------------------------
    print("\n--- Real-time inference demo (single sample) ---")
    # Simulate reading a raw row from original df (we'll use an X_test row but show scaling step)
    raw_row = X_test.iloc[0].copy()  # note: X_test here is already scaled; but in real-world you'd receive raw features
    # To demonstrate the correct pipeline for raw input: apply scaler transform on a raw row (if you had raw)
    # Here we assume `raw_row` is scaled; we'll still show how to apply scaler on raw input:
    sample = pd.DataFrame([raw_row.values], columns=X_test.columns)
    
    # XGBoost predict
    xgb_loaded = joblib.load('xgboost_model.pkl')
    ae_loaded = load_model('autoencoder_model.keras', compile=False)
    le_loaded = joblib.load('label_encoder.pkl')
    scaler_loaded = joblib.load('scaler.pkl')
    thresh_loaded = joblib.load('ae_threshold.pkl')
    
    # If incoming data is raw (unscaled), do: sample_scaled = pd.DataFrame(scaler_loaded.transform(sample_raw), columns=feature_names)
    # Here our `sample` is already scaled, so use directly:
    pred_idx = xgb_loaded.predict(sample)[0]
    pred_label = le_loaded.inverse_transform([pred_idx])[0]
    
    # Autoencoder anomaly score (reconstruction MSE)
    rec = ae_loaded.predict(sample, verbose=0)
    mse_val = np.mean(np.power(sample - rec, 2), axis=1)[0]
    
    print(f"Predicted Status: {pred_label}")
    print(f"Anomaly score (MSE): {mse_val:.6f}  Threshold: {thresh_loaded:.6f}  IsAnomaly: {mse_val > thresh_loaded}")
    
    print("\nDone. Artifacts written to current working directory.")