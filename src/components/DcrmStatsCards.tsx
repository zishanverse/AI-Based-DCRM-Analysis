"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DcrmStatsCards() {
  const cards = [
    {
      title: "Critical Pending",
      value: 337,
      description: "Awaiting resolution",
      className: "!bg-orange-700 !text-white !border-orange-600",
    },

    {
      title: "Resolved",
      value: 987,
      description: "Successfully resolved",
      className: "!bg-yellow-400 !text-black !border-yellow-400",
    },
    {
      title: "Total Complaints",
      value: 1324,
      description: "All complaints received this month",
      className: "!bg-lime-600 !text-white !border-lime-600",
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
