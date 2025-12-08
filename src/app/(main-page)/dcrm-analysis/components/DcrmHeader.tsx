import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

interface DcrmHeaderProps {
  assessment?: "HEALTHY" | "NEEDS MAINTENANCE" | "CRITICAL";
  showAssessment?: boolean;
}

export function DcrmHeader({ assessment, showAssessment }: DcrmHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:mb-2 border-b print:border-none pb-4">
      <div className="flex items-center gap-3">
        {/* Optional Logo for Print */}
        <div className="hidden print:block w-12 h-12 bg-slate-200 rounded-full"></div>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-700 to-emerald-600 print:text-black">
            DCRM Analysis
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Dynamic Contact Resistance Measurement & Diagnostics
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 print:hidden">
        {showAssessment && assessment && (
          <>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="gap-2 border-primary/20 hover:bg-primary/5"
            >
              <Printer className="h-4 w-4" /> Export Report
            </Button>

            <Badge
              className={`text-sm px-4 py-1.5 ${
                assessment === "HEALTHY"
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : assessment === "NEEDS MAINTENANCE"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {assessment}
            </Badge>
          </>
        )}
      </div>

      {/* Print Only Header Badge */}
      <div className="hidden print:block text-right">
        <h2 className="text-lg font-bold">Assessment Result</h2>
        <div
          className={`text-xl font-bold uppercase ${
            assessment === "HEALTHY"
              ? "text-green-600"
              : assessment === "CRITICAL"
              ? "text-red-600"
              : "text-amber-600"
          }`}
        >
          {assessment}
        </div>
      </div>
    </div>
  );
}
