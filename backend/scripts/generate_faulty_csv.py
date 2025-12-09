
import pandas as pd
import numpy as np
import os

# output path
output_file = os.path.join("backend", "faulty_sample.csv")

# Create 500ms of data at 10kHz (5000 points)
n_points = 5000
time = np.linspace(0, 500, n_points)

# Base healthy signals
resistance = np.ones(n_points) * 50.0  # 50 microOhm
travel = np.linspace(0, 100, n_points) # 0 to 100mm
current = np.ones(n_points) * 10.0     # 10A

# Inject Faults
# 1. Resistance Spike at 100-150ms (Simulating contact issue)
resistance[1000:1500] = 500.0 

# 2. Current Drop at 300-350ms (Simulating coil issue)
current[3000:3500] = 2.0

# Create DataFrame with exact headers expected by backend
df = pd.DataFrame({
    "Time (ms)": time,
    "Resistance CH1 (microOhm)": resistance,
    # Add other channels as flat lines to avoid missing column errors if strict
    "Resistance CH2 (microOhm)": [50.0] * n_points,
    "Resistance CH3 (microOhm)": [50.0] * n_points,
    "Resistance CH4 (microOhm)": [50.0] * n_points,
    "Resistance CH5 (microOhm)": [50.0] * n_points,
    "Resistance CH6 (microOhm)": [50.0] * n_points,
    
    "Contact Travel T1 (mm)": travel,
    "Contact Travel T2 (mm)": travel,
    "Contact Travel T3 (mm)": travel,
    
    "Current CH1 (A)": current,
    "Current CH2 (A)": [10.0] * n_points,
    
    "Coil Current C1 (A)": [5.0] * n_points,
})

df.to_csv(output_file, index=False)
print(f"Generated {output_file} with synthesized faults.")
