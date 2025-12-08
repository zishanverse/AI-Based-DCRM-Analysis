import { Badge } from "@/components/ui/badge";

interface DcrmHeaderProps {
  assessment: "HEALTHY" | "NEEDS MAINTENANCE" | "CRITICAL";
  showAssessment: boolean;
}

export function DcrmHeader({ assessment, showAssessment }: DcrmHeaderProps) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">DCRM Test Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Upload your CSV file to analyze DCRM test results
        </p>
      </div>
      {showAssessment && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant={
                assessment === "HEALTHY"
                  ? "default"
                  : assessment === "NEEDS MAINTENANCE"
                  ? "secondary"
                  : "destructive"
              }
            >
              {assessment}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Assessment based on test results
            </span>
          </div>
        </div>
      )}
    </>
  );
}
