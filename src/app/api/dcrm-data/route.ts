// app/api/dcrm-data/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    const text = await file.text();
    
    // Parse the CSV data
    const data = parseCSV(text);
    
    return NextResponse.json({ 
      success: true,
      data 
    });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to parse CSV file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function parseCSV(csvText: string) {
  // Split the text into lines and filter out empty lines
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  
  // Initialize empty objects for test info and results
  const testInfo = {};
  const testResults = {};
  
  // Extract data points (time series data)
  const dataPoints = [];
  
  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle different possible delimiters
    let parts = [];
    if (line.includes('|')) {
      parts = line.split('|').map(part => part.trim());
    } else if (line.includes(',')) {
      parts = line.split(',').map(part => part.trim());
    } else {
      // If no clear delimiter, try to split by whitespace
      parts = line.split(/\s+/).map(part => part.trim());
    }
    
    // Skip empty parts
    parts = parts.filter(part => part !== '');
    
    // Skip if we don't have enough data
    if (parts.length < 3) continue;
    
    // Try to parse numeric values
    const numericParts = parts.map(part => {
      const num = parseFloat(part);
      return isNaN(num) ? 0 : num;
    });
    
    // Based on the sample data and images, let's structure the data point
    try {
      // Looking at the sample data, it appears to be comma-separated with some empty fields
      // The first values seem to be time, then some measurements, then more measurements
      
      // Let's try to identify the structure more precisely
      // Based on the images, we need time, resistance, travel, and current data
      
      // Create a data point with the values we can identify
      const dataPoint = {
        // Time in milliseconds (first value in the sample)
        time: numericParts[0] || i,
        
        // DCRM Resistance values (µOhm)
        resistanceCH1: numericParts[12] || 0,
        resistanceCH2: numericParts[13] || 0,
        resistanceCH3: numericParts[14] || 0,
        resistanceCH4: numericParts[15] || 0,
        resistanceCH5: numericParts[16] || 0,
        resistanceCH6: numericParts[17] || 0,
        
        // Contact Travel values (mm)
        travelT1: numericParts[6] || 0,
        travelT2: numericParts[7] || 0,
        travelT3: numericParts[8] || 0,
        travelT4: numericParts[9] || 0,
        travelT5: numericParts[10] || 0,
        travelT6: numericParts[11] || 0,
        
        // Current values (A)
        currentCH1: numericParts[18] || 0,
        currentCH2: numericParts[19] || 0,
        currentCH3: numericParts[20] || 0,
        currentCH4: numericParts[21] || 0,
        currentCH5: numericParts[22] || 0,
        currentCH6: numericParts[23] || 0,
        
        // Coil Current values (A)
        coilCurrentC1: numericParts[0] || 0,
        coilCurrentC2: numericParts[1] || 0,
        coilCurrentC3: numericParts[2] || 0,
        coilCurrentC4: numericParts[3] || 0,
        coilCurrentC5: numericParts[4] || 0,
        coilCurrentC6: numericParts[5] || 0
      };
      
      dataPoints.push(dataPoint);
    } catch (error) {
      console.error(`Error parsing line ${i}:`, error);
    }
  }
  
  // If we have data points, calculate some basic statistics for test results
  if (dataPoints.length > 0) {
    // Calculate averages for each channel
    const calculateAverage = (key: string) => {
      const sum = dataPoints.reduce((acc, point) => acc + (point[key] || 0), 0);
      return sum / dataPoints.length;
    };
    
    // Calculate max values for each channel
    const calculateMax = (key: string) => {
      return Math.max(...dataPoints.map(point => point[key] || 0));
    };
    
    // Calculate min values for each channel
    const calculateMin = (key: string) => {
      return Math.min(...dataPoints.map(point => point[key] || 0));
    };
    
    // Populate test results with calculated values
    Object.assign(testResults, {
      // Resistance values
      resistanceCH1Avg: calculateAverage('resistanceCH1'),
      resistanceCH2Avg: calculateAverage('resistanceCH2'),
      resistanceCH3Avg: calculateAverage('resistanceCH3'),
      resistanceCH4Avg: calculateAverage('resistanceCH4'),
      resistanceCH5Avg: calculateAverage('resistanceCH5'),
      resistanceCH6Avg: calculateAverage('resistanceCH6'),
      
      // Travel values
      travelT1Max: calculateMax('travelT1'),
      travelT2Max: calculateMax('travelT2'),
      travelT3Max: calculateMax('travelT3'),
      travelT4Max: calculateMax('travelT4'),
      travelT5Max: calculateMax('travelT5'),
      travelT6Max: calculateMax('travelT6'),
      
      // Current values
      currentCH1Max: calculateMax('currentCH1'),
      currentCH2Max: calculateMax('currentCH2'),
      currentCH3Max: calculateMax('currentCH3'),
      currentCH4Max: calculateMax('currentCH4'),
      currentCH5Max: calculateMax('currentCH5'),
      currentCH6Max: calculateMax('currentCH6'),
      
      // Coil Current values
      coilCurrentC1Avg: calculateAverage('coilCurrentC1'),
      coilCurrentC2Avg: calculateAverage('coilCurrentC2'),
      coilCurrentC3Avg: calculateAverage('coilCurrentC3'),
      coilCurrentC4Avg: calculateAverage('coilCurrentC4'),
      coilCurrentC5Avg: calculateAverage('coilCurrentC5'),
      coilCurrentC6Avg: calculateAverage('coilCurrentC6')
    });
  }
  
  return { testInfo, testResults, dataPoints };
}