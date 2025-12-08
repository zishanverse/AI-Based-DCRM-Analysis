"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function OverallScore() {
  const score = 85; // Example score

  return (
    <Card className="shadow-sm border rounded-lg overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-sm font-medium">Overall AI Score</CardTitle>
      </CardHeader>
      <CardContent className="pb-3 px-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-2xl font-bold text-primary">{score}/100</span>
          <span className="text-xs text-muted-foreground">Excellent</span>
        </div>
        <Progress value={score} className="h-2" />
        <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">
          AI-driven analysis of DCRM health and efficiency.
        </p>
      </CardContent>
    </Card>
  );
}
