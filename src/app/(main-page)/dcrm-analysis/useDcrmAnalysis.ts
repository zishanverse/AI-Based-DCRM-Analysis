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

      const response = await fetch("/api/dcrm-data", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to parse CSV file");
      }

      const { testInfo, testResults, dataPoints, comparison } = result.data;

      setTestInfo(testInfo);
      setTestResults(testResults);
      setData(dataPoints);
      setComparison(comparison);

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
  };
}
