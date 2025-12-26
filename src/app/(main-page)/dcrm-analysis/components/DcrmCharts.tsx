import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Activity } from "lucide-react";

interface DcrmChartsProps {
  data: any[];
  visibleLines: Record<string, boolean>;
  setVisibleLines: (lines: Record<string, boolean>) => void;
  left: string | number;
  right: string | number;
  refAreaLeft: string | number;
  refAreaRight: string | number;
  setRefAreaLeft: (val: string | number) => void;
  setRefAreaRight: (val: string | number) => void;
  zoom: () => void;
  zoomOut: () => void;
  shapData?: any; // { time_windows, shap: { xgboost: { resistance: [], ... } } }
  showShap?: boolean;
  onToggleShap?: (val: boolean) => void;
}

import { ShapOverlay } from "@/components/ShapOverlay";
import { useTheme } from "next-themes";

// Custom tooltip for the charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Determine unit based on the dataKey
    const getUnit = (dataKey: string) => {
      if (dataKey.includes('resistance')) return 'µΩ';
      if (dataKey.includes('current') || dataKey.includes('coilCurrent')) return 'A';
      if (dataKey.includes('travel')) return 'mm';
      return '';
    };

    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        <p className="font-semibold">{`Time: ${label} ms`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value} ${getUnit(entry.dataKey)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function DcrmCharts({
  data,
  visibleLines,
  setVisibleLines,
  left,
  right,
  refAreaLeft,
  refAreaRight,
  setRefAreaLeft,
  setRefAreaRight,
  zoom,
  zoomOut,
  shapData,
  showShap,
  onToggleShap,
}: DcrmChartsProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const axisColor = isDark ? "#888888" : "#333333";
  const gridColor = isDark ? "#333333" : "#eeeeee";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipBorder = isDark ? "#374151" : "#e5e7eb";
  const tooltipText = isDark ? "#f3f4f6" : "#000000";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>DCRM Test Data Visualization</CardTitle>
          <CardDescription>
            Toggle checkboxes below to filter. drag cursor on graph to Zoom.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {onToggleShap && (
            <Button
              variant={showShap ? "destructive" : "outline"}
              size="sm"
              onClick={() => onToggleShap(!showShap)}
              className={`gap-2 ${showShap ? "bg-red-100 text-red-700 hover:bg-red-200 border-red-200" : ""}`}
            >
              <Activity className="h-4 w-4" />
              {showShap ? "Hide AI Overlays" : "Show AI Overlays"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={zoomOut} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Reset Zoom
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Checkbox Controls - Granular Selection */}
        <div className="space-y-6 bg-gray-50 p-4 rounded-lg">
          {/* Resistance Controls */}
          <div>
            <h4 className="font-semibold text-sm mb-2 text-red-700">
              Resistance Channels (µOhm)
            </h4>
            <div className="grid grid-cols-7 gap-2 text-sm font-medium text-center bg-gray-200 p-2 rounded-t-md">
              <div className="text-left pl-2">Channel</div>
              <div className="col-span-2">Test Data</div>
              <div className="col-span-2">Ideal (Ref)</div>
              <div className="col-span-2">Difference</div>
            </div>
            <div className="bg-white border rounded-b-md divide-y">
              {[1, 2, 3, 4, 5, 6].map((ch) => (
                <div
                  key={`res-row-${ch}`}
                  className="grid grid-cols-7 gap-2 p-2 items-center hover:bg-gray-50"
                >
                  <div className="font-medium pl-2">CH{ch}</div>
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="checkbox"
                      checked={visibleLines[`resistanceCH${ch}`]}
                      onChange={(e) =>
                        setVisibleLines({
                          ...visibleLines,
                          [`resistanceCH${ch}`]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-red-600"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="checkbox"
                      checked={visibleLines[`ref_resistanceCH${ch}`]}
                      onChange={(e) =>
                        setVisibleLines({
                          ...visibleLines,
                          [`ref_resistanceCH${ch}`]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-blue-400"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="checkbox"
                      checked={visibleLines[`diff_resistanceCH${ch}`]}
                      onChange={(e) =>
                        setVisibleLines({
                          ...visibleLines,
                          [`diff_resistanceCH${ch}`]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-purple-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Controls */}
          <div>
            <h4 className="font-semibold text-sm mb-2 text-blue-700">
              DCRM Current Channels (A)
            </h4>
            <div className="grid grid-cols-7 gap-2 text-sm font-medium text-center bg-gray-200 p-2 rounded-t-md">
              <div className="text-left pl-2">Channel</div>
              <div className="col-span-2">Test Data</div>
              <div className="col-span-2">Ideal (Ref)</div>
              <div className="col-span-2">Difference</div>
            </div>
            <div className="bg-white border rounded-b-md divide-y">
              {[1, 2, 3, 4, 5, 6].map((ch) => (
                <div
                  key={`cur-row-${ch}`}
                  className="grid grid-cols-7 gap-2 p-2 items-center hover:bg-gray-50"
                >
                  <div className="font-medium pl-2">CH{ch}</div>
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="checkbox"
                      checked={visibleLines[`currentCH${ch}`]}
                      onChange={(e) =>
                        setVisibleLines({
                          ...visibleLines,
                          [`currentCH${ch}`]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-blue-600"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="checkbox"
                      checked={visibleLines[`ref_currentCH${ch}`]}
                      onChange={(e) =>
                        setVisibleLines({
                          ...visibleLines,
                          [`ref_currentCH${ch}`]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-cyan-400"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="checkbox"
                      checked={visibleLines[`diff_currentCH${ch}`]}
                      onChange={(e) =>
                        setVisibleLines({
                          ...visibleLines,
                          [`diff_currentCH${ch}`]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-purple-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Travel Controls */}
          <div>
            <h4 className="font-semibold text-sm mb-2 text-green-700">
              Travel Phases (mm)
            </h4>
            <div className="grid grid-cols-7 gap-2 text-sm font-medium text-center bg-gray-200 p-2 rounded-t-md">
              <div className="text-left pl-2">Phase</div>
              <div className="col-span-2">Test Data</div>
              <div className="col-span-2">Ideal (Ref)</div>
              <div className="col-span-2">Difference</div>
            </div>
            <div className="bg-white border rounded-b-md divide-y">
              {[1, 2, 3, 4, 5, 6].map((t) => (
                <div
                  key={`travel-row-${t}`}
                  className="grid grid-cols-7 gap-2 p-2 items-center hover:bg-gray-50"
                >
                  <div className="font-medium pl-2">T{t}</div>
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="checkbox"
                      checked={visibleLines[`travelT${t}`]}
                      onChange={(e) =>
                        setVisibleLines({
                          ...visibleLines,
                          [`travelT${t}`]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-green-600"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="checkbox"
                      checked={visibleLines[`ref_travelT${t}`]}
                      onChange={(e) =>
                        setVisibleLines({
                          ...visibleLines,
                          [`ref_travelT${t}`]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-green-400"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="checkbox"
                      checked={visibleLines[`diff_travelT${t}`]}
                      onChange={(e) =>
                        setVisibleLines({
                          ...visibleLines,
                          [`diff_travelT${t}`]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-purple-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coil Current Controls */}
          <div>
            <h4 className="font-semibold text-sm mb-2 text-purple-700">
              Coil Current (A)
            </h4>
            <div className="grid grid-cols-7 gap-2 text-sm font-medium text-center bg-gray-200 p-2 rounded-t-md">
              <div className="text-left pl-2">Coil</div>
              <div className="col-span-2">Test Data</div>
              <div className="col-span-2">Ideal (Ref)</div>
              <div className="col-span-2">Difference</div>
            </div>
            <div className="bg-white border rounded-b-md divide-y">
              {[1, 2, 3, 4, 5, 6].map((c) => (
                <div
                  key={`coil-row-${c}`}
                  className="grid grid-cols-7 gap-2 p-2 items-center hover:bg-gray-50"
                >
                  <div className="font-medium pl-2">C{c}</div>
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="checkbox"
                      checked={visibleLines[`coilCurrentC${c}`]}
                      onChange={(e) =>
                        setVisibleLines({
                          ...visibleLines,
                          [`coilCurrentC${c}`]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-purple-600"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="checkbox"
                      checked={visibleLines[`ref_coilCurrentC${c}`]}
                      onChange={(e) =>
                        setVisibleLines({
                          ...visibleLines,
                          [`ref_coilCurrentC${c}`]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-fuchsia-400"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="checkbox"
                      checked={visibleLines[`diff_coilCurrentC${c}`]}
                      onChange={(e) =>
                        setVisibleLines({
                          ...visibleLines,
                          [`diff_coilCurrentC${c}`]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-purple-600"
                    />
                  </div>
                </div>
              ))}
            </div>
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
                key={showShap ? "shap-visible" : "shap-hidden"}
                data={data}
                margin={{ top: 5, right: 30, left: 10, bottom: 0 }}
                syncId="dcrmSync"
                onMouseDown={(e) =>
                  e?.activeLabel && setRefAreaLeft(e.activeLabel)
                }
                onMouseMove={(e) =>
                  refAreaLeft &&
                  e?.activeLabel &&
                  setRefAreaRight(e.activeLabel)
                }
                onMouseUp={zoom}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={[left, right]}
                  allowDataOverflow
                  hide
                  stroke={axisColor}
                />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px" }}
                  iconType="line"
                  iconSize={12}
                />
                {refAreaLeft && refAreaRight ? (
                  <ReferenceArea
                    x1={refAreaLeft}
                    x2={refAreaRight}
                    strokeOpacity={0.3}
                  />
                ) : null}

                {/* SHAP Overlay - Resistance */}
                {showShap && shapData?.shap?.xgboost?.resistance && (
                  <ShapOverlay
                    windows={shapData.time_windows}
                    scores={shapData.shap.xgboost.resistance}
                    color="#ff0000" // Red for resistance issues
                    visible={true}
                  />
                )}

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

                {/* Reference Lines (Solid, Distinct Color) */}
                {visibleLines.ref_resistanceCH1 && (
                  <Line
                    type="monotone"
                    dataKey="ref_resistanceCH1"
                    stroke="#87CEEB"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal CH1"
                  />
                )}
                {visibleLines.ref_resistanceCH2 && (
                  <Line
                    type="monotone"
                    dataKey="ref_resistanceCH2"
                    stroke="#ADD8E6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal CH2"
                  />
                )}
                {visibleLines.ref_resistanceCH3 && (
                  <Line
                    type="monotone"
                    dataKey="ref_resistanceCH3"
                    stroke="#B0C4DE"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal CH3"
                  />
                )}
                {visibleLines.ref_resistanceCH4 && (
                  <Line
                    type="monotone"
                    dataKey="ref_resistanceCH4"
                    stroke="#4682B4"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal CH4"
                  />
                )}
                {visibleLines.ref_resistanceCH5 && (
                  <Line
                    type="monotone"
                    dataKey="ref_resistanceCH5"
                    stroke="#5F9EA0"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal CH5"
                  />
                )}
                {visibleLines.ref_resistanceCH6 && (
                  <Line
                    type="monotone"
                    dataKey="ref_resistanceCH6"
                    stroke="#6495ED"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal CH6"
                  />
                )}

                {/* Difference Lines (Step, Dashed) */}
                {visibleLines.diff_resistanceCH1 && (
                  <Line
                    type="step"
                    dataKey="diff_resistanceCH1"
                    stroke="#800080"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff CH1"
                  />
                )}
                {visibleLines.diff_resistanceCH2 && (
                  <Line
                    type="step"
                    dataKey="diff_resistanceCH2"
                    stroke="#8B008B"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff CH2"
                  />
                )}
                {visibleLines.diff_resistanceCH3 && (
                  <Line
                    type="step"
                    dataKey="diff_resistanceCH3"
                    stroke="#9932CC"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff CH3"
                  />
                )}
                {visibleLines.diff_resistanceCH4 && (
                  <Line
                    type="step"
                    dataKey="diff_resistanceCH4"
                    stroke="#9400D3"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff CH4"
                  />
                )}
                {visibleLines.diff_resistanceCH5 && (
                  <Line
                    type="step"
                    dataKey="diff_resistanceCH5"
                    stroke="#BA55D3"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff CH5"
                  />
                )}
                {visibleLines.diff_resistanceCH6 && (
                  <Line
                    type="step"
                    dataKey="diff_resistanceCH6"
                    stroke="#9370DB"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff CH6"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Current Graph */}
          <div className="space-y-1 mb-2">
            <h3 className="text-xs font-semibold text-blue-700 px-2 bg-blue-50 inline-block rounded">
              Current (A)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 10, bottom: 0 }}
                syncId="dcrmSync"
                onMouseDown={(e) =>
                  e?.activeLabel && setRefAreaLeft(e.activeLabel)
                }
                onMouseMove={(e) =>
                  refAreaLeft &&
                  e?.activeLabel &&
                  setRefAreaRight(e.activeLabel)
                }
                onMouseUp={zoom}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={[left, right]}
                  allowDataOverflow
                  hide
                />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px" }}
                  iconType="line"
                  iconSize={12}
                />
                {refAreaLeft && refAreaRight ? (
                  <ReferenceArea
                    x1={refAreaLeft}
                    x2={refAreaRight}
                    strokeOpacity={0.3}
                  />
                ) : null}

                {/* SHAP Overlay - Current */}
                {showShap && shapData?.shap?.xgboost?.current && (
                  <ShapOverlay
                    windows={shapData.time_windows}
                    scores={shapData.shap.xgboost.current}
                    color="#0000ff" // Blue for current issues
                    visible={true}
                  />
                )}

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
                    stroke="#1E90FF"
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
                    stroke="#00BFFF"
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
                    stroke="#87CEFA"
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
                    stroke="#4682B4"
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
                    stroke="#5F9EA0"
                    name="CH6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}

                {/* Reference Fields */}
                {visibleLines.ref_currentCH1 && (
                  <Line
                    type="monotone"
                    dataKey="ref_currentCH1"
                    stroke="#E0FFFF"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal CH1"
                  />
                )}
                {visibleLines.ref_currentCH2 && (
                  <Line
                    type="monotone"
                    dataKey="ref_currentCH2"
                    stroke="#AFEEEE"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal CH2"
                  />
                )}
                {visibleLines.ref_currentCH3 && (
                  <Line
                    type="monotone"
                    dataKey="ref_currentCH3"
                    stroke="#7FFFD4"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal CH3"
                  />
                )}
                {visibleLines.ref_currentCH4 && (
                  <Line
                    type="monotone"
                    dataKey="ref_currentCH4"
                    stroke="#40E0D0"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal CH4"
                  />
                )}
                {visibleLines.ref_currentCH5 && (
                  <Line
                    type="monotone"
                    dataKey="ref_currentCH5"
                    stroke="#48D1CC"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal CH5"
                  />
                )}
                {visibleLines.ref_currentCH6 && (
                  <Line
                    type="monotone"
                    dataKey="ref_currentCH6"
                    stroke="#00CED1"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal CH6"
                  />
                )}

                {/* Difference Fields */}
                {visibleLines.diff_currentCH1 && (
                  <Line
                    type="step"
                    dataKey="diff_currentCH1"
                    stroke="#800080"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff CH1"
                  />
                )}
                {visibleLines.diff_currentCH2 && (
                  <Line
                    type="step"
                    dataKey="diff_currentCH2"
                    stroke="#8B008B"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff CH2"
                  />
                )}
                {visibleLines.diff_currentCH3 && (
                  <Line
                    type="step"
                    dataKey="diff_currentCH3"
                    stroke="#9932CC"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff CH3"
                  />
                )}
                {visibleLines.diff_currentCH4 && (
                  <Line
                    type="step"
                    dataKey="diff_currentCH4"
                    stroke="#9400D3"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff CH4"
                  />
                )}
                {visibleLines.diff_currentCH5 && (
                  <Line
                    type="step"
                    dataKey="diff_currentCH5"
                    stroke="#BA55D3"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff CH5"
                  />
                )}
                {visibleLines.diff_currentCH6 && (
                  <Line
                    type="step"
                    dataKey="diff_currentCH6"
                    stroke="#9370DB"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff CH6"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Travel Graph */}
          <div className="space-y-1 mb-2">
            <h3 className="text-xs font-semibold text-green-700 px-2 bg-green-50 inline-block rounded">
              Travel (mm)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                key={showShap ? "shap-visible-travel" : "shap-hidden-travel"}
                data={data}
                margin={{ top: 5, right: 30, left: 10, bottom: 0 }}
                syncId="dcrmSync"
                onMouseDown={(e) =>
                  e?.activeLabel && setRefAreaLeft(e.activeLabel)
                }
                onMouseMove={(e) =>
                  refAreaLeft &&
                  e?.activeLabel &&
                  setRefAreaRight(e.activeLabel)
                }
                onMouseUp={zoom}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={[left, right]}
                  allowDataOverflow
                  hide
                  stroke={axisColor}
                />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px" }}
                  iconType="line"
                  iconSize={12}
                />
                {refAreaLeft && refAreaRight ? (
                  <ReferenceArea
                    x1={refAreaLeft}
                    x2={refAreaRight}
                    strokeOpacity={0.3}
                  />
                ) : null}

                {/* SHAP Overlay - Travel */}
                {showShap && shapData?.shap?.xgboost?.travel && (
                  <ShapOverlay
                    windows={shapData.time_windows}
                    scores={shapData.shap.xgboost.travel}
                    color="#008000" // Green for travel issues
                    visible={true}
                  />
                )}
                {visibleLines.travelT1 && (
                  <Line
                    type="monotone"
                    dataKey="travelT1"
                    stroke="#008000"
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
                    stroke="#228B22"
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
                    stroke="#32CD32"
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
                    stroke="#3CB371"
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
                    stroke="#2E8B57"
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

                {/* Reference Travel */}
                {visibleLines.ref_travelT1 && (
                  <Line
                    type="monotone"
                    dataKey="ref_travelT1"
                    stroke="#98FB98"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal T1"
                  />
                )}
                {visibleLines.ref_travelT2 && (
                  <Line
                    type="monotone"
                    dataKey="ref_travelT2"
                    stroke="#90EE90"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal T2"
                  />
                )}
                {visibleLines.ref_travelT3 && (
                  <Line
                    type="monotone"
                    dataKey="ref_travelT3"
                    stroke="#00FF7F"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal T3"
                  />
                )}
                {visibleLines.ref_travelT4 && (
                  <Line
                    type="monotone"
                    dataKey="ref_travelT4"
                    stroke="#00FA9A"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal T4"
                  />
                )}
                {visibleLines.ref_travelT5 && (
                  <Line
                    type="monotone"
                    dataKey="ref_travelT5"
                    stroke="#20B2AA"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal T5"
                  />
                )}
                {visibleLines.ref_travelT6 && (
                  <Line
                    type="monotone"
                    dataKey="ref_travelT6"
                    stroke="#66CDAA"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal T6"
                  />
                )}

                {/* Diff Travel */}
                {visibleLines.diff_travelT1 && (
                  <Line
                    type="step"
                    dataKey="diff_travelT1"
                    stroke="#800080"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff T1"
                  />
                )}
                {visibleLines.diff_travelT2 && (
                  <Line
                    type="step"
                    dataKey="diff_travelT2"
                    stroke="#8B008B"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff T2"
                  />
                )}
                {visibleLines.diff_travelT3 && (
                  <Line
                    type="step"
                    dataKey="diff_travelT3"
                    stroke="#9932CC"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff T3"
                  />
                )}
                {visibleLines.diff_travelT4 && (
                  <Line
                    type="step"
                    dataKey="diff_travelT4"
                    stroke="#9400D3"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff T4"
                  />
                )}
                {visibleLines.diff_travelT5 && (
                  <Line
                    type="step"
                    dataKey="diff_travelT5"
                    stroke="#BA55D3"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff T5"
                  />
                )}
                {visibleLines.diff_travelT6 && (
                  <Line
                    type="step"
                    dataKey="diff_travelT6"
                    stroke="#9370DB"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff T6"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Coil Current Graph */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-purple-700 px-2 bg-purple-50 inline-block rounded">
              Coil Current (A)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 10, bottom: 20 }}
                syncId="dcrmSync"
                onMouseDown={(e) =>
                  e?.activeLabel && setRefAreaLeft(e.activeLabel)
                }
                onMouseMove={(e) =>
                  refAreaLeft &&
                  e?.activeLabel &&
                  setRefAreaRight(e.activeLabel)
                }
                onMouseUp={zoom}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={[left, right]}
                  allowDataOverflow
                  label={{
                    value: "Time (ms)",
                    position: "bottom",
                    offset: 0,
                    fill: axisColor, // Ensure label is visible
                  }}
                  stroke={axisColor}
                />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px" }}
                  iconType="line"
                  iconSize={12}
                />
                {refAreaLeft && refAreaRight ? (
                  <ReferenceArea
                    x1={refAreaLeft}
                    x2={refAreaRight}
                    strokeOpacity={0.3}
                  />
                ) : null}
                {visibleLines.coilCurrentC1 && (
                  <Line
                    type="monotone"
                    dataKey="coilCurrentC1"
                    stroke="#800080"
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
                    stroke="#8B008B"
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
                    stroke="#9932CC"
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
                    stroke="#9400D3"
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
                    stroke="#BA55D3"
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
                    stroke="#9370DB"
                    name="C6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}

                {/* Reference Coil */}
                {visibleLines.ref_coilCurrentC1 && (
                  <Line
                    type="monotone"
                    dataKey="ref_coilCurrentC1"
                    stroke="#DDA0DD"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal C1"
                  />
                )}
                {visibleLines.ref_coilCurrentC2 && (
                  <Line
                    type="monotone"
                    dataKey="ref_coilCurrentC2"
                    stroke="#EE82EE"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal C2"
                  />
                )}
                {visibleLines.ref_coilCurrentC3 && (
                  <Line
                    type="monotone"
                    dataKey="ref_coilCurrentC3"
                    stroke="#DA70D6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal C3"
                  />
                )}
                {visibleLines.ref_coilCurrentC4 && (
                  <Line
                    type="monotone"
                    dataKey="ref_coilCurrentC4"
                    stroke="#FF00FF"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal C4"
                  />
                )}
                {visibleLines.ref_coilCurrentC5 && (
                  <Line
                    type="monotone"
                    dataKey="ref_coilCurrentC5"
                    stroke="#FF00FF"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal C5"
                  />
                )}
                {visibleLines.ref_coilCurrentC6 && (
                  <Line
                    type="monotone"
                    dataKey="ref_coilCurrentC6"
                    stroke="#8A2BE2"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="Ideal C6"
                  />
                )}

                {/* Diff Coil */}
                {visibleLines.diff_coilCurrentC1 && (
                  <Line
                    type="step"
                    dataKey="diff_coilCurrentC1"
                    stroke="#800080"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff C1"
                  />
                )}
                {visibleLines.diff_coilCurrentC2 && (
                  <Line
                    type="step"
                    dataKey="diff_coilCurrentC2"
                    stroke="#8B008B"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff C2"
                  />
                )}
                {visibleLines.diff_coilCurrentC3 && (
                  <Line
                    type="step"
                    dataKey="diff_coilCurrentC3"
                    stroke="#9932CC"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff C3"
                  />
                )}
                {visibleLines.diff_coilCurrentC4 && (
                  <Line
                    type="step"
                    dataKey="diff_coilCurrentC4"
                    stroke="#9400D3"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff C4"
                  />
                )}
                {visibleLines.diff_coilCurrentC5 && (
                  <Line
                    type="step"
                    dataKey="diff_coilCurrentC5"
                    stroke="#BA55D3"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff C5"
                  />
                )}
                {visibleLines.diff_coilCurrentC6 && (
                  <Line
                    type="step"
                    dataKey="diff_coilCurrentC6"
                    stroke="#9370DB"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                    name="Diff C6"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
