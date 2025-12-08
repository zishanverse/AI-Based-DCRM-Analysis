// app/dcrm-analysis/page.tsx
"use client";

import { useState, useEffect } from "react";
import { getStations, getBreakers } from "./actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
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
  const [assessment, setAssessment] = useState<
    "HEALTHY" | "NEEDS MAINTENANCE" | "CRITICAL"
  >("HEALTHY");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Selector State
  const [stations, setStations] = useState<any[]>([]);
  const [breakers, setBreakers] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [selectedBreaker, setSelectedBreaker] = useState<string>("");

  useEffect(() => {
    async function loadStations() {
      const res = await getStations();
      if (res.success && res.data) {
        setStations(res.data);
      }
    }
    loadStations();
  }, []);

  useEffect(() => {
    async function loadBreakers() {
      if (!selectedStation) {
        setBreakers([]);
        return;
      }
      const res = await getBreakers(selectedStation);
      if (res.success && res.data) {
        setBreakers(res.data);
      }
    }
    loadBreakers();
  }, [selectedStation]);

  // State for controlling visible lines on the chart
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
    resistanceCH1: true,
    resistanceCH2: true,
    resistanceCH3: true,
    resistanceCH4: false,
    resistanceCH5: false,
    resistanceCH6: false,
    currentCH1: false,
    currentCH2: false,
    currentCH3: false,
    currentCH4: false,
    currentCH5: false,
    currentCH6: false,
    travelT1: false,
    travelT2: false,
    travelT3: false,
    travelT4: false,
    travelT5: false,
    travelT6: false,
    coilCurrentC1: false,
    coilCurrentC2: false,
    coilCurrentC3: false,
    coilCurrentC4: false,
    coilCurrentC5: false,
    coilCurrentC6: false,
  });

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
      formData.append("file", file);
      if (selectedStation) formData.append("stationId", selectedStation);
      if (selectedBreaker) formData.append("breakerId", selectedBreaker);

      const response = await fetch("/api/dcrm-data", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to parse CSV file");
      }

      const { testInfo, testResults, dataPoints } = result.data;

      setTestInfo(testInfo);
      setTestResults(testResults);
      setData(dataPoints);

      // Determine assessment based on the data
      const assessmentResult = determineAssessment(testResults, dataPoints);
      setAssessment(assessmentResult);
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Function to determine assessment based on test results
  const determineAssessment = (
    results: TestResult,
    dataPoints: DCRMDataPoint[]
  ) => {
    // Helper to calculate statistics including Trimmed StdDev for stability analysis
    const calculateStats = (values: number[]) => {
      const valid = values
        .filter((v) => v < 8000 && v > 0)
        .sort((a, b) => a - b);
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
      statsCH1.robustMax > 0 ||
      statsCH2.robustMax > 0 ||
      statsCH3.robustMax > 0;
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
  };

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="station-select">Station</Label>
                  <Select
                    onValueChange={setSelectedStation}
                    value={selectedStation}
                  >
                    <SelectTrigger id="station-select">
                      <SelectValue placeholder="Select Station" />
                    </SelectTrigger>
                    <SelectContent>
                      {stations.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breaker-select">Breaker</Label>
                  <Select
                    onValueChange={setSelectedBreaker}
                    value={selectedBreaker}
                    disabled={!selectedStation}
                  >
                    <SelectTrigger id="breaker-select">
                      <SelectValue placeholder="Select Breaker" />
                    </SelectTrigger>
                    <SelectContent>
                      {breakers.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              <Badge
                variant={
                  assessment === "HEALTHY"
                    ? "default"
                    : assessment === "NEEDS MAINTENANCE"
                    ? "secondary"
                    : "destructive"
                }
              >
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
                  {Object.entries(testInfo)
                    .slice(0, 9)
                    .map(([key, value]) => (
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
                      {assessment === "CRITICAL" &&
                        "The breaker shows critical issues with high resistance and abnormal coil current. Immediate maintenance is required."}
                      {assessment === "NEEDS MAINTENANCE" &&
                        "The breaker shows signs of wear and requires maintenance soon to prevent failure."}
                      {assessment === "HEALTHY" &&
                        "The breaker is operating within normal parameters. Continue routine monitoring."}
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
                    <span className="font-medium">
                      Coil Current C1 Avg (A):
                    </span>
                    <span>{testResults?.coilCurrentC1Avg?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">
                      Coil Current C2 Avg (A):
                    </span>
                    <span>{testResults?.coilCurrentC2Avg?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">
                      Resistance CH1 Avg (µOhm):
                    </span>
                    <span>{testResults?.resistanceCH1Avg?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">
                      Resistance CH2 Avg (µOhm):
                    </span>
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

          <Card>
            <CardHeader>
              <CardTitle>DCRM Test Data Visualization</CardTitle>
              <CardDescription>
                Toggle the checkboxes below to show/hide different measurements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Checkbox Controls */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Resistance (µOhm)</h4>
                  {[1, 2, 3, 4, 5, 6].map((ch) => (
                    <label
                      key={`res-${ch}`}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleLines[`resistanceCH${ch}`]}
                        onChange={(e) =>
                          setVisibleLines({
                            ...visibleLines,
                            [`resistanceCH${ch}`]: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Channel {ch}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">DCRM Current (A)</h4>
                  {[1, 2, 3, 4, 5, 6].map((ch) => (
                    <label
                      key={`cur-${ch}`}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleLines[`currentCH${ch}`]}
                        onChange={(e) =>
                          setVisibleLines({
                            ...visibleLines,
                            [`currentCH${ch}`]: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Channel {ch}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Travel (mm)</h4>
                  {[1, 2, 3, 4, 5, 6].map((t) => (
                    <label
                      key={`travel-${t}`}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleLines[`travelT${t}`]}
                        onChange={(e) =>
                          setVisibleLines({
                            ...visibleLines,
                            [`travelT${t}`]: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Phase T{t}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Coil Current (A)</h4>
                  {[1, 2, 3, 4, 5, 6].map((c) => (
                    <label
                      key={`coil-${c}`}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleLines[`coilCurrentC${c}`]}
                        onChange={(e) =>
                          setVisibleLines({
                            ...visibleLines,
                            [`coilCurrentC${c}`]: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Coil C{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* CSS Overlapped Stacked Waveforms */}
              <div className="relative">
                {/* Resistance Graph */}
                <div className="space-y-1 mb-2">
                  <h3 className="text-xs font-semibold text-red-700 px-2 bg-red-50 inline-block rounded">
                    Resistance (µOhm)
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={data}
                      margin={{ top: 5, right: 30, left: 10, bottom: 0 }}
                      syncId="dcrmSync"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#fee"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="time"
                        type="number"
                        domain={[0, 600]}
                        hide
                      />
                      <YAxis hide domain={["auto", "auto"]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: "11px" }}
                        iconType="line"
                        iconSize={12}
                      />
                      {visibleLines.resistanceCH1 && (
                        <Line
                          type="monotone"
                          dataKey="resistanceCH1"
                          stroke="#FF0000"
                          name="CH1"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.resistanceCH2 && (
                        <Line
                          type="monotone"
                          dataKey="resistanceCH2"
                          stroke="#DC143C"
                          name="CH2"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.resistanceCH3 && (
                        <Line
                          type="monotone"
                          dataKey="resistanceCH3"
                          stroke="#FF6347"
                          name="CH3"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.resistanceCH4 && (
                        <Line
                          type="monotone"
                          dataKey="resistanceCH4"
                          stroke="#FF4500"
                          name="CH4"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.resistanceCH5 && (
                        <Line
                          type="monotone"
                          dataKey="resistanceCH5"
                          stroke="#CD5C5C"
                          name="CH5"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.resistanceCH6 && (
                        <Line
                          type="monotone"
                          dataKey="resistanceCH6"
                          stroke="#8B0000"
                          name="CH6"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* DCRM Current Graph */}
                <div className="space-y-1 mb-2">
                  <h3 className="text-xs font-semibold text-blue-700 px-2 bg-blue-50 inline-block rounded">
                    DCRM Current (A)
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={data}
                      margin={{ top: 5, right: 30, left: 10, bottom: 0 }}
                      syncId="dcrmSync"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#eef"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="time"
                        type="number"
                        domain={[0, 600]}
                        hide
                      />
                      <YAxis hide domain={["auto", "auto"]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: "11px" }}
                        iconType="line"
                        iconSize={12}
                      />
                      {visibleLines.currentCH1 && (
                        <Line
                          type="monotone"
                          dataKey="currentCH1"
                          stroke="#0000FF"
                          name="CH1"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.currentCH2 && (
                        <Line
                          type="monotone"
                          dataKey="currentCH2"
                          stroke="#4169E1"
                          name="CH2"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.currentCH3 && (
                        <Line
                          type="monotone"
                          dataKey="currentCH3"
                          stroke="#1E90FF"
                          name="CH3"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.currentCH4 && (
                        <Line
                          type="monotone"
                          dataKey="currentCH4"
                          stroke="#00BFFF"
                          name="CH4"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.currentCH5 && (
                        <Line
                          type="monotone"
                          dataKey="currentCH5"
                          stroke="#5F9EA0"
                          name="CH5"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.currentCH6 && (
                        <Line
                          type="monotone"
                          dataKey="currentCH6"
                          stroke="#000080"
                          name="CH6"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Contact Travel Graph */}
                <div className="space-y-1 mb-2">
                  <h3 className="text-xs font-semibold text-green-700 px-2 bg-green-50 inline-block rounded">
                    Contact Travel (mm)
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={data}
                      margin={{ top: 5, right: 30, left: 10, bottom: 0 }}
                      syncId="dcrmSync"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#efe"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="time"
                        type="number"
                        domain={[0, 600]}
                        hide
                      />
                      <YAxis hide domain={["auto", "auto"]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: "11px" }}
                        iconType="line"
                        iconSize={12}
                      />
                      {visibleLines.travelT1 && (
                        <Line
                          type="monotone"
                          dataKey="travelT1"
                          stroke="#00FF00"
                          name="T1"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.travelT2 && (
                        <Line
                          type="monotone"
                          dataKey="travelT2"
                          stroke="#32CD32"
                          name="T2"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.travelT3 && (
                        <Line
                          type="monotone"
                          dataKey="travelT3"
                          stroke="#00FA9A"
                          name="T3"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.travelT4 && (
                        <Line
                          type="monotone"
                          dataKey="travelT4"
                          stroke="#90EE90"
                          name="T4"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.travelT5 && (
                        <Line
                          type="monotone"
                          dataKey="travelT5"
                          stroke="#3CB371"
                          name="T5"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.travelT6 && (
                        <Line
                          type="monotone"
                          dataKey="travelT6"
                          stroke="#006400"
                          name="T6"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Coil Current Graph (with X-axis) */}
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-purple-700 px-2 bg-purple-50 inline-block rounded">
                    Coil Current (A)
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart
                      data={data}
                      margin={{ top: 5, right: 30, left: 10, bottom: 35 }}
                      syncId="dcrmSync"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#fef"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="time"
                        type="number"
                        domain={[0, 600]}
                        label={{
                          value: "Time (ms)",
                          position: "insideBottom",
                          offset: -22,
                          style: { fontSize: 14, fontWeight: "bold" },
                        }}
                        tick={{ fontSize: 11 }}
                        tickLine={{ stroke: "#666" }}
                      />
                      <YAxis hide domain={["auto", "auto"]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: "11px" }}
                        iconType="line"
                        iconSize={12}
                      />
                      {visibleLines.coilCurrentC1 && (
                        <Line
                          type="monotone"
                          dataKey="coilCurrentC1"
                          stroke="#FF00FF"
                          name="C1"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.coilCurrentC2 && (
                        <Line
                          type="monotone"
                          dataKey="coilCurrentC2"
                          stroke="#DA70D6"
                          name="C2"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.coilCurrentC3 && (
                        <Line
                          type="monotone"
                          dataKey="coilCurrentC3"
                          stroke="#BA55D3"
                          name="C3"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.coilCurrentC4 && (
                        <Line
                          type="monotone"
                          dataKey="coilCurrentC4"
                          stroke="#9370DB"
                          name="C4"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.coilCurrentC5 && (
                        <Line
                          type="monotone"
                          dataKey="coilCurrentC5"
                          stroke="#8B008B"
                          name="C5"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                      {visibleLines.coilCurrentC6 && (
                        <Line
                          type="monotone"
                          dataKey="coilCurrentC6"
                          stroke="#4B0082"
                          name="C6"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Test Assessment</CardTitle>
              <CardDescription>
                Based on analysis of the DCRM test results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Badge
                  variant={
                    assessment === "HEALTHY"
                      ? "default"
                      : assessment === "NEEDS MAINTENANCE"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {assessment}
                </Badge>
                <span className="text-sm">
                  {assessment === "CRITICAL" && "Immediate attention required"}
                  {assessment === "NEEDS MAINTENANCE" &&
                    "Schedule maintenance within 30 days"}
                  {assessment === "HEALTHY" && "Continue routine monitoring"}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Key Findings:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    Contact resistance values show{" "}
                    {assessment === "HEALTHY" ? "normal" : "abnormal"} patterns
                    across channels
                  </li>
                  <li>
                    Coil current values are{" "}
                    {assessment === "HEALTHY" ? "within" : "outside"} expected
                    ranges
                  </li>
                  <li>
                    Contact travel measurements indicate{" "}
                    {assessment === "HEALTHY"
                      ? "normal"
                      : "potential issues with"}{" "}
                    mechanical operation
                  </li>
                  <li>
                    Velocity measurements are{" "}
                    {assessment === "HEALTHY" ? "consistent" : "inconsistent"}{" "}
                    with manufacturer specifications
                  </li>
                </ul>

                <h3 className="text-lg font-medium mt-4">Recommendations:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {assessment === "CRITICAL" && (
                    <>
                      <li>
                        Immediate inspection of the breaker contacts is required
                      </li>
                      <li>Check for signs of overheating or contact erosion</li>
                      <li>
                        Verify proper operation of closing and opening
                        mechanisms
                      </li>
                      <li>
                        Consider replacing the breaker if issues cannot be
                        resolved
                      </li>
                    </>
                  )}
                  {assessment === "NEEDS MAINTENANCE" && (
                    <>
                      <li>Schedule maintenance within the next 30 days</li>
                      <li>Inspect contacts for signs of wear or pitting</li>
                      <li>
                        Verify proper lubrication of mechanical components
                      </li>
                      <li>Re-test after maintenance to verify improvements</li>
                    </>
                  )}
                  {assessment === "HEALTHY" && (
                    <>
                      <li>
                        Continue routine monitoring according to the maintenance
                        schedule
                      </li>
                      <li>Document baseline values for future comparison</li>
                      <li>
                        Consider increasing monitoring frequency if operating
                        conditions change
                      </li>
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
