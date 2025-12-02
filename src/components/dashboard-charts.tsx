"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useWaveformPreview } from "@/provider/waveform-provider"

type LegacyDataPoint = {
  timestamp: string;
  primary: number;
  secondary: number | null;
  tertiary: number;
};

const legacyData: LegacyDataPoint[] = [
  { timestamp: "2024-04-01 08:00", primary: 125.5, secondary: 210.3, tertiary: 180.7 },
  { timestamp: "2024-04-01 09:00", primary: 127.2, secondary: 208.9, tertiary: 182.1 },
  { timestamp: "2024-04-01 10:00", primary: 124.8, secondary: 212.4, tertiary: 179.5 },
  { timestamp: "2024-04-01 11:00", primary: 126.3, secondary: 209.7, tertiary: 181.2 },
  { timestamp: "2024-04-01 12:00", primary: 128.1, secondary: 211.5, tertiary: 183.4 },
  { timestamp: "2024-04-01 13:00", primary: 125.9, secondary: 210.2, tertiary: 180.8 },
  { timestamp: "2024-04-01 14:00", primary: 127.7, secondary: 208.8, tertiary: 182.5 },
  { timestamp: "2024-04-01 15:00", primary: 126.4, secondary: 211.1, tertiary: 181.3 },
  { timestamp: "2024-04-01 16:00", primary: 128.9, secondary: 209.6, tertiary: 183.7 },
  { timestamp: "2024-04-01 17:00", primary: 127.2, secondary: 210.8, tertiary: 182.0 },
  { timestamp: "2024-04-02 08:00", primary: 126.5, secondary: 211.3, tertiary: 181.5 },
  { timestamp: "2024-04-02 09:00", primary: 128.3, secondary: 209.1, tertiary: 183.2 },
  { timestamp: "2024-04-02 10:00", primary: 125.7, secondary: 212.7, tertiary: 180.4 },
  { timestamp: "2024-04-02 11:00", primary: 127.1, secondary: 210.5, tertiary: 181.9 },
  { timestamp: "2024-04-02 12:00", primary: 129.2, secondary: 208.3, tertiary: 184.1 },
  { timestamp: "2024-04-02 13:00", primary: 126.8, secondary: 211.8, tertiary: 181.7 },
  { timestamp: "2024-04-02 14:00", primary: 128.5, secondary: 209.4, tertiary: 183.3 },
  { timestamp: "2024-04-02 15:00", primary: 127.3, secondary: 211.6, tertiary: 182.2 },
  { timestamp: "2024-04-02 16:00", primary: 129.7, secondary: 209.0, tertiary: 184.6 },
  { timestamp: "2024-04-02 17:00", primary: 128.0, secondary: 211.2, tertiary: 182.9 },
  { timestamp: "2024-04-03 08:00", primary: 127.4, secondary: 212.0, tertiary: 182.3 },
  { timestamp: "2024-04-03 09:00", primary: 129.1, secondary: 209.8, tertiary: 184.0 },
  { timestamp: "2024-04-03 10:00", primary: 126.6, secondary: 213.4, tertiary: 181.2 },
  { timestamp: "2024-04-03 11:00", primary: 128.2, secondary: 211.0, tertiary: 182.7 },
  { timestamp: "2024-04-03 12:00", primary: 130.3, secondary: 208.7, tertiary: 185.0 },
  { timestamp: "2024-04-03 13:00", primary: 127.9, secondary: 212.3, tertiary: 182.5 },
  { timestamp: "2024-04-03 14:00", primary: 129.6, secondary: 209.9, tertiary: 184.1 },
  { timestamp: "2024-04-03 15:00", primary: 128.4, secondary: 212.1, tertiary: 183.0 },
  { timestamp: "2024-04-03 16:00", primary: 130.8, secondary: 209.5, tertiary: 185.4 },
  { timestamp: "2024-04-03 17:00", primary: 129.1, secondary: 211.7, tertiary: 183.7 },
  { timestamp: "2024-04-04 08:00", primary: 128.5, secondary: 212.7, tertiary: 183.1 },
  { timestamp: "2024-04-04 09:00", primary: 130.2, secondary: 210.5, tertiary: 184.8 },
  { timestamp: "2024-04-04 10:00", primary: 127.7, secondary: 214.1, tertiary: 182.0 },
  { timestamp: "2024-04-04 11:00", primary: 129.3, secondary: null, tertiary: 183.5 },
  { timestamp: "2024-04-04 12:00", primary: 131.4, secondary: 209.4, tertiary: 185.8 },
  { timestamp: "2024-04-04 13:00", primary: 129.0, secondary: 213.0, tertiary: 183.3 },
  { timestamp: "2024-04-04 14:00", primary: 130.7, secondary: 210.6, tertiary: 184.9 },
  { timestamp: "2024-04-04 15:00", primary: 129.5, secondary: 212.8, tertiary: 183.8 },
  { timestamp: "2024-04-04 16:00", primary: 131.9, secondary: 210.2, tertiary: 186.2 },
  { timestamp: "2024-04-04 17:00", primary: 130.2, secondary: 212.4, tertiary: 184.5 },
  { timestamp: "2024-04-05 08:00", primary: 129.6, secondary: 213.4, tertiary: 183.9 },
  { timestamp: "2024-04-05 09:00", primary: 131.3, secondary: 211.2, tertiary: 185.6 },
  { timestamp: "2024-04-05 10:00", primary: 128.8, secondary: 214.8, tertiary: 182.8 },
  { timestamp: "2024-04-05 11:00", primary: 130.4, secondary: 212.4, tertiary: 184.3 },
  { timestamp: "2024-04-05 12:00", primary: 132.5, secondary: 210.1, tertiary: 186.6 },
  { timestamp: "2024-04-05 13:00", primary: 130.1, secondary: 213.7, tertiary: 184.1 },
  { timestamp: "2024-04-05 14:00", primary: 131.8, secondary: 211.3, tertiary: 185.7 },
  { timestamp: "2024-04-05 15:00", primary: 130.6, secondary: 213.5, tertiary: 184.6 },
  { timestamp: "2024-04-05 16:00", primary: 133.0, secondary: 210.9, tertiary: 187.0 },
  { timestamp: "2024-04-05 17:00", primary: 131.3, secondary: 213.1, tertiary: 185.3 },
]

const COLOR_PALETTE = [
  "#2563eb",
  "#f97316",
  "#10b981",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#facc15",
  "#f973ab",
]

const singleChartConfig = {
  primary: {
    label: "Primary",
    color: "#003366",
  },
  secondary: {
    label: "Secondary",
    color: "#FF9933",
  },
  tertiary: {
    label: "Tertiary",
    color: "#138808",
  },
} satisfies ChartConfig

export function DashboardCharts() {
  const { preview } = useWaveformPreview()
  const waveformData = React.useMemo(() => {
    if (preview?.points?.length && preview.valueColumns?.length) {
      const columns = preview.valueColumns
      const data = preview.points.map((point, idx) => {
        const row: Record<string, number | null | undefined> = {
          timeMs: point.timeMs ?? idx,
        }
        columns.forEach((column) => {
          row[column] = point.values?.[column] ?? null
        })
        return row
      })

      return {
        data,
        columns,
        label: preview.sourceName
          ? `Synced from ${preview.sourceName}`
          : "Latest upload",
      }
    }

    return { data: [], columns: [] as string[], label: "" }
  }, [preview])

  const dynamicConfig = React.useMemo<ChartConfig>(() => {
    const config: ChartConfig = {}
    waveformData.columns.forEach((column, index) => {
      config[column] = {
        label: preview?.columnMap?.[column] ?? column,
        color: COLOR_PALETTE[index % COLOR_PALETTE.length],
      }
    })
    return config
  }, [waveformData.columns, preview?.columnMap])

  const tooltipFormatter = React.useCallback(
    (
      value: number | string | Array<number | string> | undefined,
      name: string | number | undefined,
    ) => {
      if (typeof name !== "string") {
        return [value, name]
      }
      if (typeof value !== "number") {
        return [value ?? "-", preview?.columnMap?.[name] ?? name]
      }
      return [`${value.toFixed(2)}`, preview?.columnMap?.[name] ?? name]
    },
    [preview?.columnMap],
  )

  if (!waveformData.data.length || !waveformData.columns.length) {
    return (
      <Card className="border-t-4 border-t-primary shadow-md">
        <CardHeader>
          <CardTitle>Waveform Overlay</CardTitle>
          <CardDescription>Upload a CSV via the assistant to visualize real breaker telemetry.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Waiting for waveform data. Once you upload a CSV, every numeric parameter will be plotted against milliseconds here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-t-4 border-t-primary shadow-md">
      <CardHeader>
        <CardTitle>Waveform Overlay</CardTitle>
        <CardDescription>
          Displaying {waveformData.data.length} samples from the latest CSV upload.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">{waveformData.label}</p>
        <ChartContainer config={dynamicConfig} className="w-full max-h-[420px]">
          <LineChart data={waveformData.data} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#47556933" />
            <XAxis
              dataKey="timeMs"
              tickFormatter={(value) => `${Number(value).toFixed(0)} ms`}
              label={{ value: "Milliseconds", position: "insideBottom", offset: -5 }}
            />
            <YAxis
              stroke="#94a3b8"
              domain={["auto", "auto"]}
              label={{ value: "Parameter Value", angle: -90, position: "insideLeft" }}
            />
            <Legend verticalAlign="top" height={36} />
            <ChartTooltip content={<ChartTooltipContent formatter={tooltipFormatter} />} />
            {waveformData.columns.map((column, index) => (
              <Line
                key={column}
                dataKey={column}
                type="monotone"
                stroke={COLOR_PALETTE[index % COLOR_PALETTE.length]}
                strokeWidth={2.25}
                dot={false}
                name={preview?.columnMap?.[column] ?? column}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

interface DashboardSingleChartProps {
  title: string
  description: string
  dataKey: "primary" | "secondary" | "tertiary"
  color: string
}

export function DashboardSingleChart({ title, description, dataKey, color }: DashboardSingleChartProps) {
  return (
    <Card className="border-t-4 shadow-md" style={{ borderTopColor: color }}>
      <CardHeader>
        <CardTitle style={{ color }}>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={singleChartConfig} className="aspect-21/9 w-full max-h-80">
          <LineChart data={legacyData} margin={{ top: 16, right: 24, left: 12, bottom: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#47556933" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            />
            <YAxis
              domain={["dataMin - 5", "dataMax + 5"]}
              label={{ value: "Resistance (Ω)", angle: -90, position: "insideLeft" }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              dataKey={dataKey}
              type="monotone"
              stroke={color}
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
