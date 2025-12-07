
const fs = require('fs');

interface DataPoint {
  time: number;
  resistanceCH1: number;
  resistanceCH2: number;
  resistanceCH3: number;
  resistanceCH4: number;
  resistanceCH5: number;
  resistanceCH6: number;
  // ... other fields irrelevant for critical check
}

interface TestResult {
    resistanceCH1Avg: number;
    resistanceCH2Avg: number;
    resistanceCH3Avg: number;
    // ...
}

function parseCSV(csvText: string) {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  const dataPoints: DataPoint[] = [];
  let dataStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Coil Current C1 (A)')) {
      dataStartIndex = i + 1;
      break;
    }
  }

  if (dataStartIndex === -1) {
      console.log("Header not found");
      return { dataPoints: [] };
  }

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 26) continue;

    const parseNum = (str: string) => {
      const num = parseFloat(str.trim());
      return isNaN(num) ? 0 : num;
    };

    // Columns for Resistance: 14, 16, 18
    const p = {
        resistanceCH1: parseNum(parts[14]),
        resistanceCH2: parseNum(parts[16]),
        resistanceCH3: parseNum(parts[18]),
        resistanceCH4: parseNum(parts[20]),
        resistanceCH5: parseNum(parts[22]),
        resistanceCH6: parseNum(parts[24]),
        time: (i - dataStartIndex) * 0.1
    };
    dataPoints.push(p);
  }
  return { dataPoints };
}

function determineAssessment(dataPoints: DataPoint[]) {
    // Logic from page.tsx
    const validResistanceReadings = dataPoints.filter(point =>
      point.resistanceCH1 < 8000 ||
      point.resistanceCH2 < 8000 ||
      point.resistanceCH3 < 8000
    );

    console.log(`Total Points: ${dataPoints.length}`);
    console.log(`Valid Resistance Points (< 8000): ${validResistanceReadings.length}`);

    if (validResistanceReadings.length > 0) {
        // Show first few valid points
        console.log("First 5 valid points:", JSON.stringify(validResistanceReadings.slice(0, 5), null, 2));
    }

    const hasCriticalResistance = validResistanceReadings.some(point =>
      (point.resistanceCH1 > 1000 && point.resistanceCH1 < 8000) ||
      (point.resistanceCH2 > 1000 && point.resistanceCH2 < 8000) ||
      (point.resistanceCH3 > 1000 && point.resistanceCH3 < 8000)
    );

    if (hasCriticalResistance) {
        console.log("Assessment: CRITICAL");
        // Find the critical point
        const criticalPoint = validResistanceReadings.find(point => 
            (point.resistanceCH1 > 1000 && point.resistanceCH1 < 8000) ||
            (point.resistanceCH2 > 1000 && point.resistanceCH2 < 8000) ||
            (point.resistanceCH3 > 1000 && point.resistanceCH3 < 8000)
        );
        console.log("Triggered by:", JSON.stringify(criticalPoint, null, 2));
    } else {
        console.log("Assessment: NOT CRITICAL (Check Maintenance/Healthy)");
    }
}

try {
    const csvContent = fs.readFileSync('d:\\myprojects\\sih-2025\\sih-frontned\\src\\data\\109000055719_20241016172337.csv', 'utf-8');
    const result = parseCSV(csvContent);
    determineAssessment(result.dataPoints);
} catch (err) {
    console.error(err);
}
