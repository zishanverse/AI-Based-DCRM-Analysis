<div align="center">

# SIH 2025 - Powergrid DCRM Analysis & Monitoring Platform

A comprehensive Digital Contact Resistance Monitoring (DCRM) platform built for the Smart India Hackathon 2025. This application empowers utilities to monitor breaker health, visualize waveforms, and perform advanced comparative analysis.

</div>

## Table of Contents

1. [Architecture](#architecture)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [DCRM Analysis Workflow](#dcrm-analysis-workflow)
6. [Project Structure](#project-structure)

## Architecture

- **Frontend**: Next.js 14 (App Router) with TypeScript, Tailwind CSS, and Shadcn UI.
- **Backend**: FastAPI (Python) for heavy computational tasks, file processing, and ML inference.
- **Database**: PostgreSQL (via Supabase) managed with Prisma ORM.
- **Visualizations**: Recharts for interactive waveform graphing.

## Key Features

### 🔍 Advanced DCRM Analysis

- **3-Column Comparison Layout**: Simultaneously view "Ideal/Reference" data, "New/Test" data, and a "Superimposed" overlay.
- **Velocity Calculation**: Automatically computes contact velocity (m/s) from travel data.
- **Waveform Visualization**: Interactive graphs for Resistance, Travel, Velocity, and Current.
- **Direct Breaker Selection**: Select breakers directly to load their linking "Ideal" dataset automatically.

### 📊 Modern Dashboard

- **Bento Grid Layout**: Apple-style grid for high-density information display.
- **Ministry of Power Theming**: Professional color scheme (Deep Blue, Saffron, Green).
- **Interactive Widgets**: Real-time comparison metrics (Max Travel, Max Velocity, Avg Resistance).

### 🤖 Generative AI Diagnostics

- **Automated Health Assessment**: Uses LangChain & **GLM-4-Flash** (Optimized) for high-speed diagnostics.
- **Component-Level Insights**:
  - **Arc Contacts**: Evaluates wear based on dynamic resistance.
  - **Main Contacts**: Checks for looseness/oxidation via static resistance.
  - **Operating Mechanism**: Diagnoses mechanical friction/damping from travel curves.
- **Advanced Difference Analysis**:
  - AI analyzes the **Abnormality Report** generated from row-by-row CSV comparison.
  - Identifies specific resistance spikes (>500μΩ) and signal deviations.
- **Actionable Outputs**:
  - **Maintenance Schedule**: Suggests immediate or routine maintenance.
  - **Critical Alerts**: Highlights urgent issues with a visual banner.
  - **Recommendations**: Specific actionable advice (e.g., "Inspect nozzle contacts").

### 🛠️ Admin & Management

- **Breaker Management**: Link CSV files to specific breakers as "Ideal Data" for future comparisons.
- **User Management**: Admin panel for managing user access and profiles.

## Tech Stack

| Component    | Technology                                     |
| ------------ | ---------------------------------------------- |
| **Frontend** | Next.js 14, React, TypeScript                  |
| **Styling**  | Tailwind CSS, Shadcn UI, Framer Motion         |
| **Backend**  | Python, FastAPI, Uvicorn                       |
| **Database** | PostgreSQL, Prisma ORM                         |
| **Storage**  | ImageKit (File Storage)                        |
| **ML/Data**  | NumPy, Pandas, Scikit-learn (XGBoost/AdaBoost) |
| **GenAI**    | LangChain, Z.ai (GLM-4-Flash / GLM-4)          |

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL Database URL
- **(New) AI Configuration**: ZAI_API_KEY, ZAI_BASE_URL (for Generative AI Analysis)

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
# Opens http://localhost:3000
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
.\.venv\Scripts\activate  # Windows
# source .venv/bin/activate # Mac/Linux

# Install requirements
pip install -r requirements.txt

# Run FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Database Setup (Prisma)

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio to manage data
npx prisma studio
```

## DCRM Analysis Workflow

1.  **Navigate to DCRM Analysis**: Go to the Analysis page from the dashboard.
2.  **Select Configuration**: Choose a Station and Breaker from the dropdowns.
    - _Note: If the breaker has "Ideal Data" linked, it will load automatically in the BLUE column._
3.  **Upload New Data**: Use the "New Data (Test)" input to upload a CSV file from a recent field test.
4.  **Analyze & Compare**:
    - The system parses both files.
    - **Blue Column**: Shows Reference/Ideal waveforms.
    - **Red Column**: Shows the newly uploaded test waveforms.
    - **Purple Column**: Superimposes both with a dedicated **Difference Line** (Step Chart) to visualize exact deviations.
    - **Metrics**: Compare Max Travel, Velocity, and Resistance side-by-side.
5.  **AI Health Assessment**:
    - Click "Analyze Health" to trigger the GenAI diagnostic engine.
    - The system generates a text-based **Abnormality Report** in the background.
    - Review the **Difference Analysis**, **Maintenance Schedule**, and Critical Alerts.
6.  **Set Ideal Data**: If a breaker has no data, you can upload a file via "Update Ideal Data (DB)" to save it as the new baseline.

## Project Structure

```
.
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (main-page)/        # Dashboard & Analysis routes
│   │   ├── api/                # Next.js API Routes (upload, dcrm-data)
│   ├── components/             # React components (Charts, UI elements)
│   ├── lib/                    # Utilities (Prisma, DB connection)
│   └── scripts/                # Seeding and maintenance scripts
├── backend/
│   ├── app/                    # FastAPI application
│   │   ├── services/           # Business logic & ML services
│   │   └── main.py             # Entry point
│   ├── dcrm_models/            # Trained ML models
├── prisma/                     # Database schema & migrations
└── public/                     # Static assets
```
