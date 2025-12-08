# DCRM Analysis Route Context

**Route**: `/dcrm-analysis`

## 1. Overview

The DCRM (Dynamic Contact Resistance Measurement) Analysis route is a critical feature for analyzing Circuit Breaker health. It visualizes high-resolution time-series data from uploaded CSV tests, compares them against "Ideal" reference curves, and calculates granular time-wise differences to identify anomalies.

## 2. Key Files

- **Frontend**: `src/app/(main-page)/dcrm-analysis/page.tsx`
- **Backend API**: `src/app/api/dcrm-data/route.ts`
- **Database Schema**: `prisma/schema.prisma`

---

## 3. Frontend Architecture (`page.tsx`)

### **A. Waveform Visualization Components**

The page uses **Recharts** to render four synchronized time-series graphs.

#### **1. Chart Configuration**

- **Library**: `recharts` (`LineChart`, `ResponsiveContainer`).
- **Synchronization**: All charts share a `syncId="dcrmSync"`, allowing simultaneous cursor movement and zooming across Resistance, Current, Travel, and Coil charts.
- **X-Axis**: Represents **Time (ms)**. Data points are sampled at 0.1ms intervals (0-600ms domain).
- **Y-Axis**: Auto-scaled based on value ranges (µOhm, Amps, mm).

#### **2. Line Types & Styling Logic**

The visualization uses a sophisticated multi-layer approach for every channel (e.g., Resistance CH1):

1.  **Test Data Line** (Standard):
    - `dataKey`: `resistanceCH1`
    - **Style**: Solid, specific color (e.g., Red for Res, Green for Travel).
    - **Purpose**: Shows the actual measured data from the uploaded CSV.
2.  **Ideal (Reference) Line**:
    - `dataKey`: `ref_resistanceCH1` (Prefix: `ref_`)
    - **Style**: **Solid** Line, distinct color (e.g., Light Blue/Cyan).
    - **Purpose**: Represents the manufacturer's baseline or "Golden Curve" stored in the database.
3.  **Difference Line**:
    - `dataKey`: `diff_resistanceCH1` (Prefix: `diff_`)
    - **Style**: **Step** Line (`type="step"`), **Dashed** Stroke (`strokeDasharray="3 3"`), Purple accent.
    - **Purpose**: visualizes the exact deviation (`Test Value - Ideal Value`) at every timestamp.

### **B. Granular Channel Selection UI**

A dedicated Grid/Matrix UI allows users to independently toggle visibility for 18 specific data series per graph type.

- **Structure**:
  - **Rows**: Channels (CH1-CH6) or Phases (T1-T6).
  - **Columns**:
    1.  **Test Data** (Checkbox)
    2.  **Ideal (Ref)** (Checkbox)
    3.  **Difference** (Checkbox)
- **State Management**:
  - Controlled by `visibleLines` state: `Record<string, boolean>`.
  - Example Keys: `resistanceCH1`, `ref_resistanceCH1`, `diff_resistanceCH1`.
- **Defaults**: Upon file load, **Channel 1** (Test, ideal, and Diff) is enabled by default for all metrics.

### **C. Assessment Logic (`determineAssessment`)**

Client-side logic analyzes the parsed data arrays to determine health status:

- **Metrics**: Robust Max (95th percentile), Trimmed Standard Deviation (fluctuation).
- **Rules**:
  - **CRITICAL**: High Resistance (>1000µΩ) OR High Fluctuation (StdDev > 50µΩ).
  - **NEEDS MAINTENANCE**: Moderate Fluctuation (>30µΩ) or abnormal Travel/Velocity.
  - **HEALTHY**: Within all thresholds.

---

## 4. Backend Logic (`route.ts`)

### **A. Data Processing Workflow**

1.  **Input**: Receives `FormData` containing the CSV file and optional `breakerId`.
2.  **Reference Fetching**:
    - specific `breakerId` -> Queries Database (`db.breaker.findUnique`) -> Gets `dataSource.fileUrl`.
    - Fetches the Reference CSV from the URL.
3.  **CSV Parsing (`parseCSV`)**:
    - Splits text by lines, identifies headers.
    - Extracts data columns (Coil Current, Travel, Resistance, DCRM Current) by index.
    - **Sampling**: Assumes 10kHz sampling (0.1ms per row).
4.  **Data Enrichment (Merging & Diff Calculation)**:
    - Iterates through Test Data points.
    - Merges corresponding Reference Data point (`ref_` keys).
    - **Calculates Differences**: `diff_key = TestValue - RefValue`.
    - Returns a unified `DCRMDataPoint` object containing Test, Ref, and Diff values for the frontend to render easily.

---

## 5. Database Schema (`schema.prisma`)

### **Relationship**

- **Breaker**: Represents a physical physical circuit breaker asset.
- **DataSource**: Represents a "Golden Curve" CSV file.
- **Relation**: `Breaker` has an optional `dataSourceId` pointing to `DataSource`.
  - This allows multiple breakers to share the same reference curve (e.g., same model/type).
  - When a Breaker is selected in the UI, the backend automatically looks up this relation to fetch the comparison data.

```prisma
model Breaker {
  id           String      @id @default(cuid())
  // ... metadata ...
  dataSourceId String?
  dataSource   DataSource? @relation(fields: [dataSourceId], references: [id])
}

model DataSource {
  id       String    @id @default(cuid())
  fileName String
  fileUrl  String    @unique // URL to the Reference CSV
  breakers Breaker[]
}
```
