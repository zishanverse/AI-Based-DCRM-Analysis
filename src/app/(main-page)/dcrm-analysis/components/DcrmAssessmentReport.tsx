import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TestInfo, TestResult } from "../types";
import { DcrmAIAnalysis } from "./DcrmAIAnalysis";

interface DcrmAssessmentReportProps {
  testInfo: TestInfo;
  testResults: TestResult | null;
  comparison: any | null;
  assessment: "HEALTHY" | "NEEDS MAINTENANCE" | "CRITICAL";
  aiAnalysis?: any;
  analyzing?: boolean;
  onRunAi?: () => void;
}

export function DcrmAssessmentReport({
  testInfo,
  testResults,
  comparison,
  assessment,
  aiAnalysis,
  analyzing,
  onRunAi,
}: DcrmAssessmentReportProps) {
  if (!testInfo) return null;

  return (
    <>
      <div className="print:block hidden mb-8 text-center border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Circuit Breaker Diagnostic Report
        </h1>
        <p className="text-gray-500">
          Generated on {new Date().toLocaleDateString()}
        </p>
      </div>

      {onRunAi && (
        <DcrmAIAnalysis
          analysis={aiAnalysis}
          loading={!!analyzing}
          onAnalyze={onRunAi}
        />
      )}

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
                    <span className="font-medium capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}:
                    </span>
                    <span>{value}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* ... (Existing Cards remain essentially the same, just copied full content for safety or assumed context if replacing whole file.
         The user previously wrote this file entirely. I will just replace the `return` logic or the whole file to be safe.) 
         Actually, I should use `replace_file_content` or just `write_to_file` if I have the whole content. 
         I already have the previous content in context step 152. I will reuse it and just prepend the AI part.
         */}
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
              <div className="flex justify-between items-center">
                <span className="font-medium">Travel T1 Max (mm):</span>
                <div className="text-right">
                  <span className="font-mono block">
                    {testResults?.travelT1Max?.toFixed(2)}
                  </span>
                  {comparison && (
                    <span
                      className={`text-[10px] ${
                        Math.abs(comparison.metrics.travelT1MaxDiff) > 5
                          ? "text-red-600 font-bold"
                          : "text-green-600"
                      }`}
                    >
                      {comparison.metrics.travelT1MaxDiff > 0 ? "+" : ""}
                      {comparison.metrics.travelT1MaxDiff.toFixed(2)}
                    </span>
                  )}
                </div>
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
              <div className="mt-4 p-3 bg-gray-100 rounded-md print:hidden">
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
                <span className="font-medium">Coil Current C1 Avg (A):</span>
                <span>{testResults?.coilCurrentC1Avg?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Coil Current C2 Avg (A):</span>
                <span>{testResults?.coilCurrentC2Avg?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Resistance CH1 Avg (µOhm):</span>
                <div className="text-right">
                  <span className="font-mono block">
                    {testResults?.resistanceCH1Avg?.toFixed(2)}
                  </span>
                  {comparison && (
                    <span
                      className={`text-[10px] ${
                        Math.abs(comparison.metrics.resistanceCH1AvgDiff) > 10
                          ? "text-red-600 font-bold"
                          : "text-green-600"
                      }`}
                    >
                      {comparison.metrics.resistanceCH1AvgDiff > 0 ? "+" : ""}
                      {comparison.metrics.resistanceCH1AvgDiff.toFixed(2)}
                    </span>
                  )}
                </div>
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

      {comparison && (
        <Card className="mb-6 border-2 border-purple-200 shadow-lg bg-linear-to-br from-white to-purple-50 break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🧬</span>
              <span className="bg-clip-text text-transparent bg-linear-to-r from-purple-600 to-blue-600 font-extrabold">
                Difference Matrix
              </span>
            </CardTitle>
            <CardDescription>
              Detailed phase-wise deviation analysis (New - Ideal)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Travel Diff Card */}
              <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-4xl">📏</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Travel Delta
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-medium text-gray-400">
                      T1 Max Diff
                    </span>
                    <span
                      className={`text-xl font-mono font-bold ${
                        Math.abs(comparison.metrics.travelT1MaxDiff) > 5
                          ? "text-red-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {comparison.metrics.travelT1MaxDiff > 0 ? "+" : ""}
                      {comparison.metrics.travelT1MaxDiff.toFixed(2)}{" "}
                      <span className="text-xs font-normal text-gray-400">
                        mm
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        Math.abs(comparison.metrics.travelT1MaxDiff) > 5
                          ? "bg-red-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.abs(comparison.metrics.travelT1MaxDiff) * 5,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Velocity Diff Card */}
              <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-4xl">⚡</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Velocity Delta
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-medium text-gray-400">
                      T1 Max Diff
                    </span>
                    <span
                      className={`text-xl font-mono font-bold ${
                        Math.abs(comparison.metrics.velocityT1MaxDiff) > 0.5
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {comparison.metrics.velocityT1MaxDiff > 0 ? "+" : ""}
                      {comparison.metrics.velocityT1MaxDiff.toFixed(2)}{" "}
                      <span className="text-xs font-normal text-gray-400">
                        m/s
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        Math.abs(comparison.metrics.velocityT1MaxDiff) > 0.5
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.abs(comparison.metrics.velocityT1MaxDiff) * 20,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Resistance Diff Card */}
              <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-4xl">Ω</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Resistance Delta
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-medium text-gray-400">
                      CH1 Avg Diff
                    </span>
                    <span
                      className={`text-xl font-mono font-bold ${
                        Math.abs(comparison.metrics.resistanceCH1AvgDiff) > 10
                          ? "text-red-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {comparison.metrics.resistanceCH1AvgDiff > 0 ? "+" : ""}
                      {comparison.metrics.resistanceCH1AvgDiff.toFixed(2)}{" "}
                      <span className="text-xs font-normal text-gray-400">
                        µΩ
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        Math.abs(comparison.metrics.resistanceCH1AvgDiff) > 10
                          ? "bg-red-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.abs(comparison.metrics.resistanceCH1AvgDiff) * 2,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
