"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function OverallScore() {
  const score = 85; // Example score

  return (
    <Card className="shadow-md border rounded-lg overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Overall AI Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <span className="text-3xl font-bold text-primary">{score}/100</span>
          <span className="text-sm text-muted-foreground">Excellent</span>
        </div>
        <Progress value={score} className="h-3" />
        <p className="text-xs text-muted-foreground mt-2">
          AI-driven analysis of DCRM health and efficiency.
        </p>
      </CardContent>
    </Card>
  );
}
