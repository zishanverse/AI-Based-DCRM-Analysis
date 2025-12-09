import { useState, useEffect } from "react";
import { getStations, getBreakers } from "./actions";
import { determineAssessment } from "./utils";
import { DCRMDataPoint, TestInfo, TestResult } from "./types";

export function useDcrmAnalysis() {
  const [data, setData] = useState<DCRMDataPoint[]>([]);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null);
  const [comparison, setComparison] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<
    "HEALTHY" | "NEEDS MAINTENANCE" | "CRITICAL"
  >("HEALTHY");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Zoom State
  const [left, setLeft] = useState<string | number>("dataMin");
  const [right, setRight] = useState<string | number>("dataMax");
  const [refAreaLeft, setRefAreaLeft] = useState<string | number>("");
  const [refAreaRight, setRefAreaRight] = useState<string | number>("");

  // Selector State
  const [stations, setStations] = useState<any[]>([]);
  const [breakers, setBreakers] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [selectedBreaker, setSelectedBreaker] = useState<string>("");
  const [selectedBreakerDetails, setSelectedBreakerDetails] =
    useState<any>(null);

  // SHAP Analysis State
  const [showShap, setShowShap] = useState(false);
  const [shapData, setShapData] = useState<any>(null);

  // AI Analysis Logic State
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Chart Visibility State
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
    resistanceCH1: true,
    resistanceCH2: false,
    resistanceCH3: false,
    resistanceCH4: false,
    resistanceCH5: false,
    resistanceCH6: false,
    currentCH1: true,
    currentCH2: false,
    currentCH3: false,
    currentCH4: false,
    currentCH5: false,
    currentCH6: false,
    travelT1: true,
    travelT2: false,
    travelT3: false,
    travelT4: false,
    travelT5: false,
    travelT6: false,
    coilCurrentC1: true,
    coilCurrentC2: false,
    coilCurrentC3: false,
    coilCurrentC4: false,
    coilCurrentC5: false,
    coilCurrentC6: false,

    // Reference Lines
    ref_resistanceCH1: true,
    ref_resistanceCH2: false,
    ref_resistanceCH3: false,
    ref_resistanceCH4: false,
    ref_resistanceCH5: false,
    ref_resistanceCH6: false,
    ref_travelT1: true,
    ref_travelT2: false,
    ref_travelT3: false,
    ref_travelT4: false,
    ref_travelT5: false,
    ref_travelT6: false,
    ref_currentCH1: true,
    ref_currentCH2: false,
    ref_currentCH3: false,
    ref_currentCH4: false,
    ref_currentCH5: false,
    ref_currentCH6: false,
    ref_coilCurrentC1: true,
    ref_coilCurrentC2: false,
    ref_coilCurrentC3: false,
    ref_coilCurrentC4: false,
    ref_coilCurrentC5: false,
    ref_coilCurrentC6: false,

    // Difference Lines
    diff_resistanceCH1: true,
    diff_resistanceCH2: false,
    diff_resistanceCH3: false,
    diff_resistanceCH4: false,
    diff_resistanceCH5: false,
    diff_resistanceCH6: false,
    diff_travelT1: true,
    diff_travelT2: false,
    diff_travelT3: false,
    diff_travelT4: false,
    diff_travelT5: false,
    diff_travelT6: false,
    diff_currentCH1: true,
    diff_currentCH2: false,
    diff_currentCH3: false,
    diff_currentCH4: false,
    diff_currentCH5: false,
    diff_currentCH6: false,
    diff_coilCurrentC1: true,
    diff_coilCurrentC2: false,
    diff_coilCurrentC3: false,
    diff_coilCurrentC4: false,
    diff_coilCurrentC5: false,
    diff_coilCurrentC6: false,
  });

  // Load Stations
  useEffect(() => {
    async function loadStations() {
      const res = await getStations();
      if (res.success && res.data) {
        setStations(res.data);
      }
    }
    loadStations();
  }, []);

  // Load Breakers
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

  // Load Breaker Details
  useEffect(() => {
    if (selectedBreaker) {
      const breaker = breakers.find((b) => b.id === selectedBreaker);
      setSelectedBreakerDetails(breaker || null);
    } else {
      setSelectedBreakerDetails(null);
    }
  }, [selectedBreaker, breakers]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const zoom = () => {
    let l = refAreaLeft;
    let r = refAreaRight;

    if (l === r || r === "") {
      setRefAreaLeft("");
      setRefAreaRight("");
      return;
    }
    if (l > r) [l, r] = [r, l];

    setRefAreaLeft("");
    setRefAreaRight("");
    setLeft(l);
    setRight(r);
  };

  const zoomOut = () => {
    setLeft("dataMin");
    setRight("dataMax");
    setRefAreaLeft("");
    setRefAreaRight("");
  };

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

      if (selectedBreakerDetails?.dataSource?.fileUrl) {
        formData.append(
          "referenceUrl",
          selectedBreakerDetails.dataSource.fileUrl
        );
      }

      // Pass SHAP toggle state
      const response = await fetch(`/api/dcrm-data?include_shap=${showShap}`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to parse CSV file");
      }

      const { testInfo, testResults, dataPoints, comparison, shap } = result.data;

      setTestInfo(testInfo);
      setTestResults(testResults);
      setData(dataPoints);
      setComparison(comparison);

      if (shap) {
        console.log("SHAP Data Received:", shap); // DEBUG
        setShapData(shap);
      } else {
        console.log("No SHAP Data in response"); // DEBUG
      }

      // Determine assessment based on the data
      if (testResults) {
        const assessmentResult = determineAssessment(testResults, dataPoints);
        setAssessment(assessmentResult);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleAiAnalysis = async () => {
    if (!testResults || !testInfo) return;

    setAnalyzing(true);
    try {
      const payload = {
        testResultId: testResults.id || null,
        metrics: testResults,
        comparison: comparison, // Data from both CSVs (diffs & text report)
      };

      const res = await fetch("/api/analyze-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setAiAnalysis(json.data);

        // Map AI abnormal ranges to SHAP format for visualization
        if (json.data.abnormal_ranges && json.data.abnormal_ranges.length > 0) {
          console.log("AI Detected Abnormal Ranges:", json.data.abnormal_ranges);

          // Create empty scores arrays matching current data length or default 500ms
          const maxTime = Math.max(...json.data.abnormal_ranges.map((r: any) => r.end_ms), 500);
          const windows = [];

          // Create temporal windows every 10ms
          for (let t = 0; t <= maxTime; t += 10) {
            windows.push({ start_ms: t, end_ms: t + 10 });
          }

          const shapStructure = {
            xgboost: {
              resistance: new Array(windows.length).fill(0),
              current: new Array(windows.length).fill(0),
              travel: new Array(windows.length).fill(0)
            }
          };

          // Fill scores based on ranges
          json.data.abnormal_ranges.forEach((range: any) => {
            const startIndex = Math.floor(range.start_ms / 10);
            const endIndex = Math.floor(range.end_ms / 10);
            const type = range.type.toLowerCase();

            for (let i = startIndex; i <= endIndex && i < windows.length; i++) {
              if (type.includes("resistance")) shapStructure.xgboost.resistance[i] = range.severity;
              if (type.includes("current")) shapStructure.xgboost.current[i] = range.severity;
              if (type.includes("travel")) shapStructure.xgboost.travel[i] = range.severity;
            }
          });

          const syntheticShap = {
            time_windows: windows,
            shap: shapStructure
          };

          console.log("Synthesized SHAP from AI:", syntheticShap);
          setShapData(syntheticShap);
          setShowShap(true); // Auto-enable overlay
        }

      } else {
        console.error("AI Analysis Failed:", json.error, json.details);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  return {
    data,
    testResults,
    testInfo,
    comparison,
    loading,
    assessment,
    file,
    error,
    left,
    right,
    refAreaLeft,
    refAreaRight,
    setRefAreaLeft,
    setRefAreaRight,
    zoom,
    zoomOut,
    stations,
    breakers,
    selectedStation,
    selectedBreaker,
    selectedBreakerDetails,
    setSelectedStation,
    setSelectedBreaker,
    handleFileChange,
    handleSubmit,
    visibleLines,
    setVisibleLines,
    aiAnalysis,
    analyzing,
    handleAiAnalysis,
    showShap,
    setShowShap,
    shapData,
  };
}
