// app/api/dcrm-data/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const referenceUrl = formData.get("referenceUrl") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();

    // Parse the main CSV data
    const data = parseCSV(text);

    let referenceData = null;
    if (referenceUrl) {
      try {
        const refResponse = await fetch(referenceUrl);
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
      };

      // Add all data points to show the full waveform
      dataPoints.push(dataPoint);
    } catch (error) {
      console.error(`Error parsing line ${i}:`, error);
    }
  }

  // If we have data points, calculate some basic statistics for test results
  if (dataPoints.length > 0) {
    // Calculate averages for each channel (excluding 8000 values which are out of range)
    const calculateAverage = (key: keyof DataPoint) => {
      const validValues = dataPoints
        .map((point) => point[key])
        .filter((val) => val < 8000 && val > 0);
      if (validValues.length === 0) return 0;
      const sum = validValues.reduce((acc, val) => acc + val, 0);
      return sum / validValues.length;
    };

    // Calculate max values for each channel (excluding 8000 values)
    const calculateMax = (key: keyof DataPoint) => {
      const validValues = dataPoints
        .map((point) => point[key])
        .filter((val) => val < 8000);
      return validValues.length > 0 ? Math.max(...validValues) : 0;
    };

    // Calculate min values for each channel (excluding 8000 and 0 values)
    const calculateMin = (key: keyof DataPoint) => {
      const validValues = dataPoints
        .map((point) => point[key])
        .filter((val) => val < 8000 && val > 0);
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
    });
  }

  return { testInfo, testResults, dataPoints };
}
