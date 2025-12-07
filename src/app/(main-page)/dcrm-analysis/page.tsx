// app/dcrm-analysis/page.tsx
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define types for our data
interface DCRMDataPoint {
  time: number;
  resistanceCH1: number;
  resistanceCH2: number;
  resistanceCH3: number;
  resistanceCH4: number;
  resistanceCH5: number;
  resistanceCH6: number;
  travelT1: number;
  travelT2: number;
  travelT3: number;
  travelT4: number;
  travelT5: number;
  travelT6: number;
  currentCH1: number;
  currentCH2: number;
  currentCH3: number;
  currentCH4: number;
  currentCH5: number;
  currentCH6: number;
  coilCurrentC1: number;
  coilCurrentC2: number;
  coilCurrentC3: number;
  coilCurrentC4: number;
  coilCurrentC5: number;
  coilCurrentC6: number;
}

interface TestResult {
  resistanceCH1Avg: number;
  resistanceCH2Avg: number;
  resistanceCH3Avg: number;
  resistanceCH4Avg: number;
  resistanceCH5Avg: number;
  resistanceCH6Avg: number;
  travelT1Max: number;
  travelT2Max: number;
  travelT3Max: number;
  travelT4Max: number;
  travelT5Max: number;
  travelT6Max: number;
  currentCH1Max: number;
  currentCH2Max: number;
  currentCH3Max: number;
  currentCH4Max: number;
  currentCH5Max: number;
  currentCH6Max: number;
  coilCurrentC1Avg: number;
  coilCurrentC2Avg: number;
  coilCurrentC3Avg: number;
  coilCurrentC4Avg: number;
  coilCurrentC5Avg: number;
  coilCurrentC6Avg: number;
}

interface TestInfo {
  [key: string]: string;
}

export default function DCRMAnalysis() {
  const [data, setData] = useState<DCRMDataPoint[]>([]);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<"HEALTHY" | "NEEDS MAINTENANCE" | "CRITICAL">("HEALTHY");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/dcrm-data', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to parse CSV file');
      }
      
      const { testInfo, testResults, dataPoints } = result.data;
      
      setTestInfo(testInfo);
      setTestResults(testResults);
      setData(dataPoints);
      
      // Determine assessment based on the data
      const assessmentResult = determineAssessment(testResults, dataPoints);
      setAssessment(assessmentResult);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Function to determine assessment based on test results
  const determineAssessment = (results: TestResult, dataPoints: DCRMDataPoint[]) => {
    // Check for abnormal resistance values
    const hasHighResistance = dataPoints.some(point => 
      point.resistanceCH1 > 100 || 
      point.resistanceCH2 > 100 || 
      point.resistanceCH3 > 100 || 
      point.resistanceCH4 > 100
    );
    
    // Check for abnormal coil current
    const hasAbnormalCoilCurrent = 
      results.coilCurrentC1Avg < 1 || results.coilCurrentC1Avg > 10 ||
      results.coilCurrentC2Avg < 1 || results.coilCurrentC2Avg > 25;
    
    // Check for abnormal travel
    const hasAbnormalTravel = 
      results.travelT3Max < 150 || results.travelT3Max > 190 ||
      results.travelT4Max < 150 || results.travelT4Max > 190;
    
    // Determine assessment
    if (hasHighResistance && hasAbnormalCoilCurrent && hasAbnormalTravel) {
      return "CRITICAL";
    } else if (hasHighResistance || hasAbnormalCoilCurrent || hasAbnormalTravel) {
      return "NEEDS MAINTENANCE";
    } else {
      return "HEALTHY";
    }
  };

  // Prepare data for charts
  const resistanceChartData = useMemo(() => {
    return data.map((point) => ({
      time: point.time,
      CH1: point.resistanceCH1,
      CH2: point.resistanceCH2,
      CH3: point.resistanceCH3,
      CH4: point.resistanceCH4,
      CH5: point.resistanceCH5,
      CH6: point.resistanceCH6
    }));
  }, [data]);

  const currentChartData = useMemo(() => {
    return data.map((point) => ({
      time: point.time,
      CH1: point.currentCH1,
      CH2: point.currentCH2,
      CH3: point.currentCH3,
      CH4: point.currentCH4,
      CH5: point.currentCH5,
      CH6: point.currentCH6
    }));
  }, [data]);

  const travelChartData = useMemo(() => {
    return data.map((point) => ({
      time: point.time,
      T1: point.travelT1,
      T2: point.travelT2,
      T3: point.travelT3,
      T4: point.travelT4,
      T5: point.travelT5,
      T6: point.travelT6
    }));
  }, [data]);

  const coilCurrentChartData = useMemo(() => {
    return data.map((point) => ({
      time: point.time,
      C1: point.coilCurrentC1,
      C2: point.coilCurrentC2,
      C3: point.coilCurrentC3,
      C4: point.coilCurrentC4,
      C5: point.coilCurrentC5,
      C6: point.coilCurrentC6
    }));
  }, [data]);

  // Custom tooltip for the charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="font-semibold">{`Time: ${label} ms`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">DCRM Test Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Upload your CSV file to analyze DCRM test results
        </p>
      </div>

      {!testInfo && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Select a DCRM test CSV file to analyze
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={loading || !file}>
                {loading ? "Processing..." : "Analyze"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {testInfo && (
        <>
          <div className="mb-6">
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={assessment === "HEALTHY" ? "default" : assessment === "NEEDS MAINTENANCE" ? "secondary" : "destructive"}>
                {assessment}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Assessment based on test results
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(testInfo).slice(0, 9).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium">{key}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Travel Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Travel T3 Max (mm):</span>
                    <span>{testResults?.travelT3Max?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Travel T4 Max (mm):</span>
                    <span>{testResults?.travelT4Max?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Travel T1 Max (mm):</span>
                    <span>{testResults?.travelT1Max?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Travel T2 Max (mm):</span>
                    <span>{testResults?.travelT2Max?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Travel T5 Max (mm):</span>
                    <span>{testResults?.travelT5Max?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Travel T6 Max (mm):</span>
                    <span>{testResults?.travelT6Max?.toFixed(2)}</span>
                  </div>
                  <div className="mt-4 p-3 bg-gray-100 rounded-md">
                    <p className="text-sm font-medium">Assessment Notes:</p>
                    <p className="text-sm mt-1">
                      {assessment === "CRITICAL" && "The breaker shows critical issues with high resistance and abnormal coil current. Immediate maintenance is required."}
                      {assessment === "NEEDS MAINTENANCE" && "The breaker shows signs of wear and requires maintenance soon to prevent failure."}
                      {assessment === "HEALTHY" && "The breaker is operating within normal parameters. Continue routine monitoring."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current & Resistance Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Coil Current C1 Avg (A):</span>
                    <span>{testResults?.coilCurrentC1Avg?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Coil Current C2 Avg (A):</span>
                    <span>{testResults?.coilCurrentC2Avg?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Resistance CH1 Avg (µOhm):</span>
                    <span>{testResults?.resistanceCH1Avg?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Resistance CH2 Avg (µOhm):</span>
                    <span>{testResults?.resistanceCH2Avg?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Current CH1 Max (A):</span>
                    <span>{testResults?.currentCH1Max?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Current CH2 Max (A):</span>
                    <span>{testResults?.currentCH2Max?.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="resistance" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="resistance">Resistance</TabsTrigger>
              <TabsTrigger value="current">Current</TabsTrigger>
              <TabsTrigger value="travel">Travel</TabsTrigger>
              <TabsTrigger value="coilCurrent">Coil Current</TabsTrigger>
            </TabsList>
            
            <TabsContent value="resistance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Resistance Over Time</CardTitle>
                  <CardDescription>
                    Resistance values for each channel during the test (in µOhm)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={resistanceChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        label={{ value: 'Time (ms)', position: 'insideBottom', offset: -5 }} 
                        domain={[0, 400]}
                      />
                      <YAxis 
                        label={{ value: 'Resistance (µOhm)', angle: -90, position: 'insideLeft' }}
                        domain={[0, 100]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="CH1" stroke="#8884d8" name="Channel 1" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="CH2" stroke="#82ca9d" name="Channel 2" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="CH3" stroke="#ffc658" name="Channel 3" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="CH4" stroke="#ff7300" name="Channel 4" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="CH5" stroke="#00ff00" name="Channel 5" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="CH6" stroke="#ff00ff" name="Channel 6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="current" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Current Over Time</CardTitle>
                  <CardDescription>
                    Current values for each channel during the test (in Amp)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={currentChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        label={{ value: 'Time (ms)', position: 'insideBottom', offset: -5 }} 
                        domain={[0, 400]}
                      />
                      <YAxis 
                        label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }}
                        domain={[0, 5000]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="CH1" stroke="#8884d8" name="Channel 1" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="CH2" stroke="#82ca9d" name="Channel 2" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="CH3" stroke="#ffc658" name="Channel 3" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="CH4" stroke="#ff7300" name="Channel 4" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="CH5" stroke="#00ff00" name="Channel 5" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="CH6" stroke="#ff00ff" name="Channel 6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="travel" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Travel Over Time</CardTitle>
                  <CardDescription>
                    Contact travel values for each phase during the test (in mm)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={travelChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        label={{ value: 'Time (ms)', position: 'insideBottom', offset: -5 }} 
                        domain={[0, 400]}
                      />
                      <YAxis 
                        label={{ value: 'Travel (mm)', angle: -90, position: 'insideLeft' }}
                        domain={[-1, 1]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="T1" stroke="#8884d8" name="Phase T1" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="T2" stroke="#82ca9d" name="Phase T2" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="T3" stroke="#ffc658" name="Phase T3" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="T4" stroke="#ff7300" name="Phase T4" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="T5" stroke="#00ff00" name="Phase T5" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="T6" stroke="#ff00ff" name="Phase T6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="coilCurrent" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Coil Current Over Time</CardTitle>
                  <CardDescription>
                    Coil current values for each coil during the test (in A)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={coilCurrentChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        label={{ value: 'Time (ms)', position: 'insideBottom', offset: -5 }} 
                        domain={[0, 400]}
                      />
                      <YAxis 
                        label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }}
                        domain={[-1, 1]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="C1" stroke="#8884d8" name="Coil C1" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="C2" stroke="#82ca9d" name="Coil C2" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="C3" stroke="#ffc658" name="Coil C3" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="C4" stroke="#ff7300" name="Coil C4" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="C5" stroke="#00ff00" name="Coil C5" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="C6" stroke="#ff00ff" name="Coil C6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Test Assessment</CardTitle>
              <CardDescription>
                Based on analysis of the DCRM test results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={assessment === "HEALTHY" ? "default" : assessment === "NEEDS MAINTENANCE" ? "secondary" : "destructive"}>
                  {assessment}
                </Badge>
                <span className="text-sm">
                  {assessment === "CRITICAL" && "Immediate attention required"}
                  {assessment === "NEEDS MAINTENANCE" && "Schedule maintenance within 30 days"}
                  {assessment === "HEALTHY" && "Continue routine monitoring"}
                </span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Key Findings:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Contact resistance values show {assessment === "HEALTHY" ? "normal" : "abnormal"} patterns across channels</li>
                  <li>Coil current values are {assessment === "HEALTHY" ? "within" : "outside"} expected ranges</li>
                  <li>Contact travel measurements indicate {assessment === "HEALTHY" ? "normal" : "potential issues with"} mechanical operation</li>
                  <li>Velocity measurements are {assessment === "HEALTHY" ? "consistent" : "inconsistent"} with manufacturer specifications</li>
                </ul>
                
                <h3 className="text-lg font-medium mt-4">Recommendations:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {assessment === "CRITICAL" && (
                    <>
                      <li>Immediate inspection of the breaker contacts is required</li>
                      <li>Check for signs of overheating or contact erosion</li>
                      <li>Verify proper operation of closing and opening mechanisms</li>
                      <li>Consider replacing the breaker if issues cannot be resolved</li>
                    </>
                  )}
                  {assessment === "NEEDS MAINTENANCE" && (
                    <>
                      <li>Schedule maintenance within the next 30 days</li>
                      <li>Inspect contacts for signs of wear or pitting</li>
                      <li>Verify proper lubrication of mechanical components</li>
                      <li>Re-test after maintenance to verify improvements</li>
                    </>
                  )}
                  {assessment === "HEALTHY" && (
                    <>
                      <li>Continue routine monitoring according to the maintenance schedule</li>
                      <li>Document baseline values for future comparison</li>
                      <li>Consider increasing monitoring frequency if operating conditions change</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}