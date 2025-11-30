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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((item, index) => (
        <Card
          key={index}
          className={cn(
            "shadow-md border rounded-lg overflow-hidden",
            item.className
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium opacity-90">
              {item.title}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-4xl font-bold">{item.value}</div>
            <p className="text-sm opacity-80 mt-1">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
