"use client";

import { useState, useEffect } from "react";
import { DcrmStatsCards } from "@/components/DcrmStatsCards";
import { OverallScore } from "@/components/OverallScore";
import { AdaboostCharts } from "@/components/AdaboostCharts";
import { DashboardCharts } from "@/components/dashboard-charts";
import { ChatArea } from "@/components/chat-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStationStats, type StationStats } from "./actions";

interface DashboardClientProps {
  initialStations: { id: string; name: string }[];
}

export function DashboardClient({ initialStations }: DashboardClientProps) {
  const [selectedStation, setSelectedStation] = useState<string>(
    initialStations[0]?.id || ""
  );
  const [stats, setStats] = useState<StationStats>({
    critical: 0,
    learning: 0,
    healthy: 0,
    total: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      if (selectedStation) {
        const data = await getStationStats(selectedStation);
        setStats(data);
      }
    }
    fetchStats();
  }, [selectedStation]);

  return (
    <div className="flex flex-1 flex-col gap-2 p-2 md:gap-4 md:p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-slate-800">
          Station Overview
        </h2>
        <Select value={selectedStation} onValueChange={setSelectedStation}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue placeholder="Select Station" />
          </SelectTrigger>
          <SelectContent>
            {initialStations.map((station) => (
              <SelectItem key={station.id} value={station.id}>
                {station.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2 md:gap-4">
        <div className="grid gap-2 md:grid-cols-4 h-full">
          <div className="md:col-span-3 h-full">
            <DcrmStatsCards stats={stats} />
          </div>
          <div className="md:col-span-1 h-full">
            <OverallScore />
          </div>
        </div>
        <AdaboostCharts />
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 lg:col-span-7">
            <DashboardCharts />
          </div>
          <div className="col-span-4 lg:col-span-7">
            <ChatArea />
          </div>
        </div>
      </div>
    </div>
  );
}
