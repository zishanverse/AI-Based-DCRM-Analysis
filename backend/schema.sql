CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) ML Model Metadata
CREATE TABLE IF NOT EXISTS ml_model_metadata (
    id SERIAL PRIMARY KEY,
    model_name TEXT NOT NULL,
    model_type TEXT NOT NULL CHECK (model_type IN ('xgboost','adaboost','other')),
    model_version TEXT NOT NULL,
    training_date DATE NOT NULL,
    feature_names TEXT[] NOT NULL,
    label_map JSONB NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 2) ML Prediction Output
CREATE TABLE IF NOT EXISTS ml_prediction_output (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_metadata_id INT NOT NULL REFERENCES ml_model_metadata(id) ON DELETE CASCADE,
    input_shape INT[] NOT NULL,
    primary_class_index INT NOT NULL,
    primary_class_label TEXT NOT NULL,
    primary_confidence NUMERIC(5,2) NOT NULL,
    secondary_class_label TEXT NOT NULL,
    raw_scores JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ml_prediction_probabilities (
    id SERIAL PRIMARY KEY,
    prediction_id UUID NOT NULL REFERENCES ml_prediction_output(id) ON DELETE CASCADE,
    class_index INT NOT NULL,
    class_label TEXT NOT NULL,
    probability NUMERIC(6,3) NOT NULL
);

-- 3) Stations and CSV files
CREATE TABLE IF NOT EXISTS stations (
    station_id TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    location_lat NUMERIC(9,6),
    location_lon NUMERIC(9,6),
    location_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS station_csv_files (
    id SERIAL PRIMARY KEY,
    station_id TEXT NOT NULL REFERENCES stations(station_id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    filename TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Circuit categories
CREATE TABLE IF NOT EXISTS circuit_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('sf6','air_blast','hybrid')),
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 5) Uploaded CSV rows
CREATE TABLE IF NOT EXISTS uploaded_csv_rows (
    id BIGSERIAL PRIMARY KEY,
    csv_file_id INT NOT NULL REFERENCES station_csv_files(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    timestamp_iso TIMESTAMPTZ NOT NULL,
    sample_rate_hz NUMERIC(10,3) NOT NULL,
    channel TEXT NOT NULL,
    t_ms NUMERIC(12,5) NOT NULL,
    r_ohm NUMERIC(12,6) NOT NULL,
    raw_row_index INT NOT NULL,
    diagnostics JSONB
);

-- 6) CSV upload responses
CREATE TABLE IF NOT EXISTS csv_upload_responses (
    csv_file_id INT PRIMARY KEY REFERENCES station_csv_files(id) ON DELETE CASCADE,
    cloudinary_url TEXT NOT NULL,
    file_id TEXT NOT NULL,
    diagnostics JSONB NOT NULL,
    processed_rows INT NOT NULL,
    skipped_rows INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7) Heatmap data
CREATE TABLE IF NOT EXISTS heatmap_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    lat NUMERIC(9,6) NOT NULL,
    lon NUMERIC(9,6) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    health_score NUMERIC(5,2) NOT NULL CHECK (health_score BETWEEN 0 AND 100),
    status TEXT NOT NULL CHECK (status IN ('healthy','moderate','fault')),
    severity NUMERIC(3,2) NOT NULL CHECK (severity BETWEEN 0 AND 1),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 8) SHAP explanations
CREATE TABLE IF NOT EXISTS shap_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID NOT NULL REFERENCES ml_prediction_output(id) ON DELETE CASCADE,
    base_value DOUBLE PRECISION NOT NULL,
    shap_values DOUBLE PRECISION[][] NOT NULL,
    feature_names TEXT[] NOT NULL,
    data JSONB NOT NULL,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
