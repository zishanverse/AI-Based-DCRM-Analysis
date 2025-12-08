import { DCRMDataPoint, TestResult } from "./types";

export function determineAssessment(
  results: TestResult,
  dataPoints: DCRMDataPoint[]
): "HEALTHY" | "NEEDS MAINTENANCE" | "CRITICAL" {
  // Helper to calculate statistics including Trimmed StdDev for stability analysis
  const calculateStats = (values: number[]) => {
    const valid = values.filter((v) => v < 8000 && v > 0).sort((a, b) => a - b);
    if (valid.length === 0) return { robustMax: 0, trimmedStdDev: 0 };

    // Robust Max (95th percentile)
    const maxIndex = Math.floor(valid.length * 0.95);
    const robustMax = valid[maxIndex];

    // Trimmed StdDev (remove top/bottom 10% to ignore transitions)
    const q10 = Math.floor(valid.length * 0.1);
    const q90 = Math.floor(valid.length * 0.9);
    const trimmed = valid.slice(q10, q90);

    if (trimmed.length === 0) return { robustMax, trimmedStdDev: 0 };

    const trimmedMean = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    const trimmedSquareDiffs = trimmed.map((value) =>
      Math.pow(value - trimmedMean, 2)
    );
    const trimmedStdDev = Math.sqrt(
      trimmedSquareDiffs.reduce((a, b) => a + b, 0) / trimmed.length
    );

    return { robustMax, trimmedStdDev };
  };

  // Calculate stats for each channel
  const statsCH1 = calculateStats(dataPoints.map((p) => p.resistanceCH1));
  const statsCH2 = calculateStats(dataPoints.map((p) => p.resistanceCH2));
  const statsCH3 = calculateStats(dataPoints.map((p) => p.resistanceCH3));

  // Check if valid data exists
  const hasData =
    statsCH1.robustMax > 0 || statsCH2.robustMax > 0 || statsCH3.robustMax > 0;
  if (!hasData) {
    return "HEALTHY"; // No valid resistance data available
  }

  // 1. CRITICAL CHECK: High Fluctuation / Instability
  // If resistance is fluctuating wildly after closing, it's a contact issue.
  // Threshold: Trimmed StdDev > 50 µOhm (Healthy is typically ~15-20)
  const hasHighFluctuation =
    statsCH1.trimmedStdDev > 50 ||
    statsCH2.trimmedStdDev > 50 ||
    statsCH3.trimmedStdDev > 50;

  // 2. CRITICAL CHECK: Absolute High Resistance
  // Safety fallback: if resistance is consistently high even if stable.
  const hasCriticalResistance =
    statsCH1.robustMax > 1000 ||
    statsCH2.robustMax > 1000 ||
    statsCH3.robustMax > 1000;

  // 3. MAINTENANCE CHECK: Moderate Fluctuation or Resistance
  const hasModerateFluctuation =
    statsCH1.trimmedStdDev > 30 ||
    statsCH2.trimmedStdDev > 30 ||
    statsCH3.trimmedStdDev > 30;
  const hasHighResistance =
    statsCH1.robustMax > 500 ||
    statsCH2.robustMax > 500 ||
    statsCH3.robustMax > 500;

  // Check for abnormal coil current or travel (existing logic)
  const hasAbnormalCoilCurrent =
    (results.coilCurrentC1Avg > 0 &&
      (results.coilCurrentC1Avg < 0.3 || results.coilCurrentC1Avg > 5)) ||
    (results.coilCurrentC2Avg > 0 &&
      (results.coilCurrentC2Avg < 0.3 || results.coilCurrentC2Avg > 5));

  const hasAbnormalTravel =
    (results.travelT1Max > 0 &&
      (results.travelT1Max < 80 || results.travelT1Max > 250)) ||
    (results.travelT2Max > 0 &&
      (results.travelT2Max < 80 || results.travelT2Max > 250)) ||
    (results.travelT3Max > 0 &&
      (results.travelT3Max < 80 || results.travelT3Max > 250));

  // Determine assessment
  if (hasHighFluctuation || hasCriticalResistance) {
    return "CRITICAL";
  } else if (
    hasModerateFluctuation ||
    hasHighResistance ||
    hasAbnormalCoilCurrent ||
    hasAbnormalTravel
  ) {
    return "NEEDS MAINTENANCE";
  }
  return "HEALTHY";
}
