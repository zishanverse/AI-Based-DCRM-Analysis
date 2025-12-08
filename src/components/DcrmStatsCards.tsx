"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DcrmStatsCardsProps {
  stats?: {
    critical: number;
    learning: number;
    healthy: number;
    total: number;
  };
}

export function DcrmStatsCards({ stats }: DcrmStatsCardsProps) {
  // Default values if no stats provided
  const data = stats || { critical: 0, learning: 0, healthy: 0, total: 0 };

  const cards = [
    {
      title: "Critical Pending",
      value: data.critical,
      description: "Immediate attention required",
      // Red/Deep Orange for Critical
      className: "!bg-red-600 !text-white !border-red-600",
    },
    {
      title: "Needs Maintenance",
      value: data.learning,
      description: "Scheduled maintenance",
      // Saffron (Orange) for Warning/Maintenance
      className: "!bg-orange-500 !text-white !border-orange-500",
    },
    {
      title: "Healthy",
      value: data.healthy,
      description: "Operating normally",
      // Green for Healthy
      className: "!bg-emerald-600 !text-white !border-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-full">
      {cards.map((item, index) => (
        <Card
          key={index}
          className={cn(
            "shadow-sm border rounded-lg overflow-hidden h-full flex flex-col justify-between",
            item.className
          )}
        >
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-sm font-medium opacity-90">
              {item.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="pb-3 px-4">
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs opacity-80 mt-0.5 leading-tight">
              {item.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
