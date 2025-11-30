"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DashboardSingleChart } from "@/components/dashboard-charts";

const data = [
  {
    sample: "Sample 0",
    probabilities: [
      { name: "Healthy", value: 0.02, color: "#22c55e" }, // Green
      { name: "Warning", value: 0.08, color: "#eab308" }, // Yellow
      { name: "Critical", value: 0.90, color: "#ef4444" }, // Red
    ],
    result: "Critical",
    chartProps: {
      title: "Primary Resistance",
      description: "Waveform Analysis - Circuit A",
      dataKey: "primary" as const,
      color: "#003366",
    }
  },
  {
    sample: "Sample 1",
    probabilities: [
      { name: "Healthy", value: 0.85, color: "#22c55e" },
      { name: "Warning", value: 0.10, color: "#eab308" },
      { name: "Critical", value: 0.05, color: "#ef4444" },
    ],
    result: "Healthy",
    chartProps: {
      title: "Secondary Resistance",
      description: "Waveform Analysis - Circuit B",
      dataKey: "secondary" as const,
      color: "#FF9933",
    }
  },
  {
    sample: "Sample 2",
    probabilities: [
      { name: "Healthy", value: 0.10, color: "#22c55e" },
      { name: "Warning", value: 0.75, color: "#eab308" },
      { name: "Critical", value: 0.15, color: "#ef4444" },
    ],
    result: "Warning",
    chartProps: {
      title: "Tertiary Resistance",
      description: "Waveform Analysis - Circuit C",
      dataKey: "tertiary" as const,
      color: "#138808",
    }
  },
];

export function AdaboostCharts() {
  return (
    <div className="flex flex-col gap-8">
      {data.map((item, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <Card className="shadow-md border rounded-lg overflow-hidden h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">
                  {item.sample} Result: <span className={
                    item.result === "Critical" ? "text-red-500" :
                    item.result === "Warning" ? "text-yellow-500" : "text-green-500"
                  }>{item.result}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={item.probabilities} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {item.probabilities.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            <DashboardSingleChart {...item.chartProps} />
          </div>
        </div>
      ))}
    </div>
  );
}
