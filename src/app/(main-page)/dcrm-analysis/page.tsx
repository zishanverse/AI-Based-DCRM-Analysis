"use client";

import { useDcrmAnalysis } from "./useDcrmAnalysis";
import { DcrmHeader } from "./components/DcrmHeader";
import { DcrmFileUpload } from "./components/DcrmFileUpload";
import { DcrmCharts } from "./components/DcrmCharts";
import { DcrmAssessmentReport } from "./components/DcrmAssessmentReport";

export default function DCRMAnalysis() {
  const {
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
  } = useDcrmAnalysis();

  return (
    <div className="container mx-auto p-6">
      <DcrmHeader assessment={assessment} showAssessment={!!testInfo} />

      {/* Show Upload Card if no data loaded */}
      <DcrmFileUpload
        visible={!testInfo}
        file={file}
        loading={loading}
        error={error}
        stations={stations}
        breakers={breakers}
        selectedStation={selectedStation}
        selectedBreaker={selectedBreaker}
        selectedBreakerDetails={selectedBreakerDetails}
        onFileChange={handleFileChange}
        onStationChange={(val) => {
          setSelectedStation(val);
          setSelectedBreaker("");
        }}
        onBreakerChange={setSelectedBreaker}
        onSubmit={handleSubmit}
      />

      {testInfo && (
        <>
          <DcrmAssessmentReport
            testInfo={testInfo}
            testResults={testResults}
            comparison={comparison}
            assessment={assessment}
          />

          <DcrmCharts
            data={data}
            visibleLines={visibleLines}
            setVisibleLines={setVisibleLines}
            left={left}
            right={right}
            refAreaLeft={refAreaLeft}
            refAreaRight={refAreaRight}
            setRefAreaLeft={setRefAreaLeft}
            setRefAreaRight={setRefAreaRight}
            zoom={zoom}
            zoomOut={zoomOut}
          />
        </>
      )}
    </div>
  );
}
