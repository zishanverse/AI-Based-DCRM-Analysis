import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const referenceUrl = formData.get("referenceUrl") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Try to get referenceUrl from DB if not provided but breakerId is
    let finalReferenceUrl = referenceUrl;
    const breakerId = formData.get("breakerId") as string;

    if (!finalReferenceUrl && breakerId) {
      try {
        const breaker = await db.breaker.findUnique({
          where: { id: breakerId },
          include: { dataSource: true },
        });
        if (breaker?.dataSource?.fileUrl) {
          finalReferenceUrl = breaker.dataSource.fileUrl;
          console.log(
            `Fetched Reference URL from DB for Breaker ${breaker.name}: ${finalReferenceUrl}`
          );
        }
      } catch (dbError) {
        console.error("Error fetching breaker details from DB:", dbError);
      }
    }

    const text = await file.text();

    // Parse the main CSV data
    const data = parseCSV(text);

    let referenceData = null;
    if (finalReferenceUrl) {
      try {
        const refResponse = await fetch(finalReferenceUrl);
        if (refResponse.ok) {
          const refText = await refResponse.text();
          referenceData = parseCSV(refText);
        } else {
          console.error(
            "Failed to fetch reference CSV:",
            refResponse.statusText
          );
        }
      } catch (refError) {
        console.error("Error processing reference CSV:", refError);
      }
    }

    let comparison = null;

    if (referenceData && data.testResults) {
      const refRes = referenceData.testResults;
      const newRes = data.testResults;

      // Calculate diffs for all available metrics
      const calculateDiff = (key: string) => {
        const newVal = newRes[key];
        const refVal = refRes[key];
        if (typeof newVal === 'number' && typeof refVal === 'number') {
          return newVal - refVal;
        }
        return 0;
      };

      const metricsDiff: Record<string, number> = {};
      Object.keys(newRes).forEach(key => {
        metricsDiff[`${key}Diff`] = calculateDiff(key);
      });

      // Detect Spikes / Abnormalities in Resistance
      // We'll scan the datapoints and look for significant deviations vs reference
      const abnormalities: string[] = [];
      let maxResistanceDev = 0;

      const RESISTANCE_THRESHOLD = 500; // uOhm deviation to consider "Abnormal Spike" - tunable

      // We need to iterate the data points to find specific spikes
      // Assuming data.dataPoints and referenceData.dataPoints are aligned by index
      const limit = Math.min(data.dataPoints.length, referenceData.dataPoints.length);

      for (let i = 0; i < limit; i++) {
        const pt = data.dataPoints[i];
        const ref = referenceData.dataPoints[i];

        // Check CH1-CH6 Resistance
        [1, 2, 3, 4, 5, 6].forEach(ch => {
          const key = `resistanceCH${ch}` as keyof DataPoint; // Cast to known key
          const val = pt[key] as number;
          const refVal = ref[key] as number;

          if (val !== undefined && refVal !== undefined && val < 8000 && refVal < 8000) {
            const diff = val - refVal;
            if (Math.abs(diff) > maxResistanceDev) maxResistanceDev = Math.abs(diff);

            if (Math.abs(diff) > RESISTANCE_THRESHOLD) {
              // Initial simple spike detection
              // We limit the log size to avoid context overflow
              if (abnormalities.length < 20) {
                abnormalities.push(`Time ${pt.time.toFixed(1)}ms: CH${ch} Deviation ${diff > 0 ? '+' : ''}${diff.toFixed(0)}μΩ (Test: ${val}, Ref: ${refVal})`);
              }
            }
          }
        });
      }

      comparison = {
        notes: "Difference calculated: New - Ideal. Includes Spike Analysis.",
        metrics: metricsDiff,
        abnormalityReport: abnormalities.length > 0 ? abnormalities.join("\n") : "No significant resistance spikes detected (>500μΩ).",
        maxResistanceDeviation: maxResistanceDev
      };

      // Workflow Log
      console.log("--- DCRM COMPARISON WORKFLOW EXECUTED ---");
      console.log("Breaker Reference Data Found. Comparing...");
      console.log(`Max Resistance Deviation: ${maxResistanceDev} μΩ`);
      console.log("Abnormalities Sample:", abnormalities.slice(0, 3));
      console.log("-----------------------------------------");

      // Merge reference data into dataPoints for easy charting
      // We assume the sampling rate is the same (10kHz)
      data.dataPoints = data.dataPoints.map((point, index) => {
        const refPoint = referenceData?.dataPoints[index];
        if (refPoint) {
          const enrichedPoint: DataPoint = {
            ...point,
            // Reference Data
            ref_travelT1: refPoint.travelT1,
            ref_travelT2: refPoint.travelT2,
            ref_travelT3: refPoint.travelT3,
            ref_travelT4: refPoint.travelT4,
            ref_travelT5: refPoint.travelT5,
            ref_travelT6: refPoint.travelT6,

            ref_velocityT1: refPoint.velocityT1,
            ref_velocityT2: refPoint.velocityT2,
            ref_velocityT3: refPoint.velocityT3,
            ref_velocityT4: refPoint.velocityT4,
            ref_velocityT5: refPoint.velocityT5,
            ref_velocityT6: refPoint.velocityT6,

            ref_resistanceCH1: refPoint.resistanceCH1,
            ref_resistanceCH2: refPoint.resistanceCH2,
            ref_resistanceCH3: refPoint.resistanceCH3,
            ref_resistanceCH4: refPoint.resistanceCH4,
            ref_resistanceCH5: refPoint.resistanceCH5,
            ref_resistanceCH6: refPoint.resistanceCH6,

            ref_currentCH1: refPoint.currentCH1,
            ref_currentCH2: refPoint.currentCH2,
            ref_currentCH3: refPoint.currentCH3,
            ref_currentCH4: refPoint.currentCH4,
            ref_currentCH5: refPoint.currentCH5,
            ref_currentCH6: refPoint.currentCH6,

            ref_coilCurrentC1: refPoint.coilCurrentC1,
            ref_coilCurrentC2: refPoint.coilCurrentC2,
            ref_coilCurrentC3: refPoint.coilCurrentC3,
            ref_coilCurrentC4: refPoint.coilCurrentC4,
            ref_coilCurrentC5: refPoint.coilCurrentC5,
            ref_coilCurrentC6: refPoint.coilCurrentC6,

            // Timeline-wise Differences (Test - Ideal)
            diff_travelT1: point.travelT1 - refPoint.travelT1,
            diff_travelT2: point.travelT2 - refPoint.travelT2,
            diff_travelT3: point.travelT3 - refPoint.travelT3,
            diff_travelT4: point.travelT4 - refPoint.travelT4,
            diff_travelT5: point.travelT5 - refPoint.travelT5,
            diff_travelT6: point.travelT6 - refPoint.travelT6,

            diff_velocityT1:
              (point.velocityT1 || 0) - (refPoint.velocityT1 || 0),
            diff_velocityT2:
              (point.velocityT2 || 0) - (refPoint.velocityT2 || 0),
            diff_velocityT3:
              (point.velocityT3 || 0) - (refPoint.velocityT3 || 0),
            diff_velocityT4:
              (point.velocityT4 || 0) - (refPoint.velocityT4 || 0),
            diff_velocityT5:
              (point.velocityT5 || 0) - (refPoint.velocityT5 || 0),
            diff_velocityT6:
              (point.velocityT6 || 0) - (refPoint.velocityT6 || 0),

            diff_resistanceCH1: point.resistanceCH1 - refPoint.resistanceCH1,
            diff_resistanceCH2: point.resistanceCH2 - refPoint.resistanceCH2,
            diff_resistanceCH3: point.resistanceCH3 - refPoint.resistanceCH3,
            diff_resistanceCH4: point.resistanceCH4 - refPoint.resistanceCH4,
            diff_resistanceCH5: point.resistanceCH5 - refPoint.resistanceCH5,
            diff_resistanceCH6: point.resistanceCH6 - refPoint.resistanceCH6,

            diff_currentCH1: point.currentCH1 - refPoint.currentCH1,
            diff_currentCH2: point.currentCH2 - refPoint.currentCH2,
            diff_currentCH3: point.currentCH3 - refPoint.currentCH3,
            diff_currentCH4: point.currentCH4 - refPoint.currentCH4,
            diff_currentCH5: point.currentCH5 - refPoint.currentCH5,
            diff_currentCH6: point.currentCH6 - refPoint.currentCH6,

            diff_coilCurrentC1: point.coilCurrentC1 - refPoint.coilCurrentC1,
            diff_coilCurrentC2: point.coilCurrentC2 - refPoint.coilCurrentC2,
            diff_coilCurrentC3: point.coilCurrentC3 - refPoint.coilCurrentC3,
            diff_coilCurrentC4: point.coilCurrentC4 - refPoint.coilCurrentC4,
            diff_coilCurrentC5: point.coilCurrentC5 - refPoint.coilCurrentC5,
            diff_coilCurrentC6: point.coilCurrentC6 - refPoint.coilCurrentC6,
          };
          return enrichedPoint;
        }
        return point;
      });
    }

    // SHAP Analysis & Persistence
    let shapResult = null;
    const includeShap = request.nextUrl.searchParams.get("include_shap") === "true";

    try {
      const backendFormData = new FormData();
      backendFormData.append("file", new Blob([text], { type: "text/csv" }), file.name);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      // Ensure trailing slash to avoid 307 redirects which can drop POST body
      const response = await fetch(`${backendUrl}/api/v1/uploads/?include_shap=${includeShap}`, {
        method: "POST",
        body: backendFormData,
      });

      if (response.ok) {
        const uploadJson = await response.json();
        const secureUrl = uploadJson.secureUrl;

        if (includeShap && uploadJson.shap) {
          shapResult = uploadJson.shap;
        }

        // Persistence Logic
        if (secureUrl) {
          try {
            // 1. Data Source
            await db.dataSource.upsert({
              where: { fileUrl: secureUrl },
              create: {
                fileName: file.name,
                fileUrl: secureUrl,
                description: "Uploaded via DCRM Analysis",
                status: "PROCESSED"
              },
              update: {}
            });

            // 2. Test Result
            if (breakerId) {
              await db.testResult.create({
                data: {
                  breakerId: breakerId,
                  testType: "DCRM",
                  fileName: file.name,
                  fileUrl: secureUrl,
                  referenceFileUrl: finalReferenceUrl,
                  testData: data as any,
                  componentHealth: shapResult ? (shapResult as any) : undefined,
                  status: "COMPLETED",
                  // Map calculated stats
                  travelT1Max: data.testResults.travelT1Max,
                  velocityT1Max: data.testResults.velocityT1Max,
                  resistanceCH1Avg: data.testResults.resistanceCH1Avg,
                  notes: comparison ? JSON.stringify(comparison) : null
                }
              });
            }
          } catch (dbErr) {
            console.error("DB Persistence Error:", dbErr);
          }
        }
      } else {
        console.error("Backend Upload Error:", response.statusText);
      }
    } catch (err) {
      console.error("Backend Proxy Error:", err);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        referenceData: referenceData
          ? {
            dataPoints: referenceData.dataPoints,
            testResults: referenceData.testResults,
          }
          : null,
        comparison: comparison,
        shap: shapResult, // Include SHAP in response
      },
    });
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to parse CSV file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

interface DataPoint {
  time: number;
  coilCurrentC1: number;
  coilCurrentC2: number;
  coilCurrentC3: number;
  coilCurrentC4: number;
  coilCurrentC5: number;
  coilCurrentC6: number;
  travelT1: number;
  travelT2: number;
  travelT3: number;
  travelT4: number;
  travelT5: number;
  travelT6: number;
  resistanceCH1: number;
  resistanceCH2: number;
  resistanceCH3: number;
  resistanceCH4: number;
  resistanceCH5: number;
  resistanceCH6: number;
  currentCH1: number;
  currentCH2: number;
  currentCH3: number;
  currentCH4: number;
  currentCH5: number;
  currentCH6: number;
  velocityT1: number;
  velocityT2: number;
  velocityT3: number;
  velocityT4: number;
  velocityT5: number;
  velocityT6: number;

  // Reference & Diff fields (optional)
  [key: string]: number | undefined;
}

function parseCSV(csvText: string) {
  // Split the text into lines and filter out empty lines
  const lines = csvText.split("\n").filter((line) => line.trim() !== "");

  // Initialize empty objects for test info and results
  const testInfo: Record<string, string> = {};
  const testResults: Record<string, number> = {};

  // Extract data points (time series data)
  const dataPoints: DataPoint[] = [];

  // Find the header line to determine where data starts
  let dataStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Coil Current C1 (A)")) {
      dataStartIndex = i + 1; // Data starts on next line
      break;
    }
  }

  if (dataStartIndex === -1) {
    throw new Error("Could not find data header in CSV file");
  }

  // Extract test info from header section
  for (let i = 0; i < dataStartIndex - 1; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p);
    if (parts.length >= 2) {
      // Store key-value pairs from header
      for (let j = 0; j < parts.length - 1; j += 2) {
        if (parts[j] && parts[j + 1] && !parts[j].includes(":")) {
          testInfo[parts[j]] = parts[j + 1];
        }
      }
    }
  }

  // Process data lines
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma and parse values
    const parts = line.split(",");

    // Skip if we don't have enough columns
    if (parts.length < 26) continue;

    // Parse numeric values from the correct columns
    // Column structure based on actual CSV:
    // 0-5: Coil Current C1-C6 (A)
    // 6: Empty
    // 7-12: Contact Travel T1-T6 (mm)
    // 13: Empty
    // 14-25: Alternating DCRM Resistance (µOhm) and Current (A) for CH1-CH6
    const parseNum = (str: string) => {
      const num = parseFloat(str.trim());
      return isNaN(num) ? 0 : num;
    };

    try {
      const dataPoint = {
        // Time in milliseconds (use row index * 0.1ms as sampling is 10kC = 10000 samples/sec)
        time: (i - dataStartIndex) * 0.1,

        // Coil Current values (A) - columns 0-5
        coilCurrentC1: parseNum(parts[0]),
        coilCurrentC2: parseNum(parts[1]),
        coilCurrentC3: parseNum(parts[2]),
        coilCurrentC4: parseNum(parts[3]),
        coilCurrentC5: parseNum(parts[4]),
        coilCurrentC6: parseNum(parts[5]),

        // Contact Travel values (mm) - columns 7-12
        travelT1: parseNum(parts[7]),
        travelT2: parseNum(parts[8]),
        travelT3: parseNum(parts[9]),
        travelT4: parseNum(parts[10]),
        travelT5: parseNum(parts[11]),
        travelT6: parseNum(parts[12]),

        // DCRM Resistance values (µOhm) - columns 14, 16, 18, 20, 22, 24
        resistanceCH1: parseNum(parts[14]),
        resistanceCH2: parseNum(parts[16]),
        resistanceCH3: parseNum(parts[18]),
        resistanceCH4: parseNum(parts[20]),
        resistanceCH5: parseNum(parts[22]),
        resistanceCH6: parseNum(parts[24]),

        // DCRM Current values (A) - columns 15, 17, 19, 21, 23, 25
        currentCH1: parseNum(parts[15]),
        currentCH2: parseNum(parts[17]),
        currentCH3: parseNum(parts[19]),
        currentCH4: parseNum(parts[21]),
        currentCH5: parseNum(parts[23]),
        currentCH6: parseNum(parts[25]),

        // Velocity (Calculated: Δd/Δt) - Init to 0, calc in next pass or on-the-fly?
        // Simple 2-point difference: v = (d2 - d1) / (t2 - t1)
        // Since we are parsing line by line, we can't look ahead, but we can look back if we stored specific state?
        // Better: Calculate velocity after the loop or use a simple diff with previous line if strictly parsing.
        // For simplicity, we'll initialize to 0 and calculate in a post-processing loop.
        velocityT1: 0,
        velocityT2: 0,
        velocityT3: 0,
        velocityT4: 0,
        velocityT5: 0,
        velocityT6: 0,
      };

      // Add all data points to show the full waveform
      dataPoints.push(dataPoint);
    } catch (error) {
      console.error(`Error parsing line ${i}:`, error);
    }
  }

  // Calculate Velocity
  for (let i = 1; i < dataPoints.length; i++) {
    const p1 = dataPoints[i - 1];
    const p2 = dataPoints[i];
    const dt = (p2.time - p1.time) / 1000; // time in seconds (ms to s)

    if (dt > 0) {
      dataPoints[i].velocityT1 = (p2.travelT1 - p1.travelT1) / dt;
      dataPoints[i].velocityT2 = (p2.travelT2 - p1.travelT2) / dt;
      dataPoints[i].velocityT3 = (p2.travelT3 - p1.travelT3) / dt;
      dataPoints[i].velocityT4 = (p2.travelT4 - p1.travelT4) / dt;
      dataPoints[i].velocityT5 = (p2.travelT5 - p1.travelT5) / dt;
      dataPoints[i].velocityT6 = (p2.travelT6 - p1.travelT6) / dt;
    }
  }

  // If we have data points, calculate some basic statistics for test results
  if (dataPoints.length > 0) {
    // Calculate averages for each channel (excluding 8000 values which are out of range)
    const calculateAverage = (key: keyof DataPoint) => {
      const validValues = dataPoints
        .map((point) => point[key] as number) // Cast to number to avoid undefined error
        .filter((val) => val !== undefined && val < 8000 && val > 0);
      if (validValues.length === 0) return 0;
      const sum = validValues.reduce((acc, val) => acc + val, 0);
      return sum / validValues.length;
    };

    // Calculate max values for each channel (excluding 8000 values)
    const calculateMax = (key: keyof DataPoint) => {
      const validValues = dataPoints
        .map((point) => point[key] as number)
        .filter((val) => val !== undefined && val < 8000);
      return validValues.length > 0 ? Math.max(...validValues) : 0;
    };

    // Calculate min values for each channel (excluding 8000 and 0 values)
    const calculateMin = (key: keyof DataPoint) => {
      const validValues = dataPoints
        .map((point) => point[key] as number)
        .filter((val) => val !== undefined && val < 8000 && val > 0);
      return validValues.length > 0 ? Math.min(...validValues) : 0;
    };

    // Populate test results with calculated values
    Object.assign(testResults, {
      // Resistance values - use min instead of avg as per DCRM standards
      resistanceCH1Avg: calculateMin("resistanceCH1"),
      resistanceCH2Avg: calculateMin("resistanceCH2"),
      resistanceCH3Avg: calculateMin("resistanceCH3"),
      resistanceCH4Avg: calculateMin("resistanceCH4"),
      resistanceCH5Avg: calculateMin("resistanceCH5"),
      resistanceCH6Avg: calculateMin("resistanceCH6"),

      // Travel values
      travelT1Max: calculateMax("travelT1"),
      travelT2Max: calculateMax("travelT2"),
      travelT3Max: calculateMax("travelT3"),
      travelT4Max: calculateMax("travelT4"),
      travelT5Max: calculateMax("travelT5"),
      travelT6Max: calculateMax("travelT6"),

      // Current values
      currentCH1Max: calculateMax("currentCH1"),
      currentCH2Max: calculateMax("currentCH2"),
      currentCH3Max: calculateMax("currentCH3"),
      currentCH4Max: calculateMax("currentCH4"),
      currentCH5Max: calculateMax("currentCH5"),
      currentCH6Max: calculateMax("currentCH6"),

      // Coil Current values
      coilCurrentC1Avg: calculateAverage("coilCurrentC1"),
      coilCurrentC2Avg: calculateAverage("coilCurrentC2"),
      coilCurrentC3Avg: calculateAverage("coilCurrentC3"),
      coilCurrentC4Avg: calculateAverage("coilCurrentC4"),
      coilCurrentC5Avg: calculateAverage("coilCurrentC5"),
      coilCurrentC6Avg: calculateAverage("coilCurrentC6"),

      // Velocity Max
      velocityT1Max: calculateMax("velocityT1"),
      velocityT2Max: calculateMax("velocityT2"),
      velocityT3Max: calculateMax("velocityT3"),
      velocityT4Max: calculateMax("velocityT4"),
      velocityT5Max: calculateMax("velocityT5"),
      velocityT6Max: calculateMax("velocityT6"),
    });
  }

  return { testInfo, testResults, dataPoints };
}
