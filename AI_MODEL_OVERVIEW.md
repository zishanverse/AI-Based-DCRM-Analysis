# AI, SHAP, & LLM Model Overview

## 1. Generative AI (LLM)
*   **Component**: `src/app/api/analyze-health`
*   **Tech Stack**: LangChain (`ChatOpenAI`), interfacing with an LLM (e.g., **Llama 3.1** via Ollama or compatible API).
*   **Role**: Acts as a senior DCRM diagnostics assistant. It receives extracted metrics and abnormality reports to generate a structured JSON health assessment, providing component specific scores (Arc/Main Contacts, Operating Mechanism) and actionable maintenance schedules.

## 2. SHAP (Explainable AI)
*   **Component**: `backend/app/services/shap_service.py`
*   **Tech Stack**: `shap` library (TreeExplainer).
*   **Role**: Provides model interpretability for the XGBoost and AdaBoost classifiers. It calculates SHAP values to quantify the contribution of specific waveform features (Resistance, Travel, Current) to the final prediction, helping users understand *why* a breaker was flagged as faulty.

## 3. Predictive ML Models
*   **Component**: `backend/app/services/advanced_models_service.py` & `diagnostics_service.py`
*   **Models**:
    *   **XGBoost & AdaBoost**: supervised classification models used to predict the binary health status (Healthy vs. Faulty) with confidence scores.
    *   **Autoencoder**: A neural network that detects anomalies by calculating the reconstruction error (MSE) of the waveform data; values exceeding a learned threshold indicate potential defects.
