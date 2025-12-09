import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Sparkles, Activity, Settings, Zap, AlertTriangle, Calendar, ClipboardCheck } from "lucide-react";

interface ComponentHealth {
  score: number;
  status: "Healthy" | "Observation Required" | "Critical";
  reasoning: string;
}

interface TechnicalParam {
  value: number;
  unit: string;
  status: "Healthy" | "Warning" | "Critical";
}

interface AIAnalysisData {
  arcContacts: ComponentHealth;
  mainContacts: ComponentHealth;
  operatingMechanism: ComponentHealth;
  technicalParameters?: {
    mainContactResistance: TechnicalParam;
    arcingContactResistance: TechnicalParam;
    travelOverlap: TechnicalParam;
    integratedWear: TechnicalParam;
  };
  overallScore: number;
  maintenanceRecommendation: string;
  maintenanceSchedule?: string;
  maintenancePriority?: "Critical" | "High" | "Medium" | "Low";
  criticalAlert?: string;
  differenceAnalysis?: string;
  abnormal_ranges?: any[];
}

interface DcrmAIAnalysisProps {
  analysis: AIAnalysisData | null;
  loading: boolean;
  onAnalyze: () => void;
}

function HealthGauge({
  score,
  label,
  icon: Icon,
}: {
  score: number;
  label: string;
  icon: any;
}) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = "text-emerald-500";
  if (score < 50) colorClass = "text-red-500";
  else if (score < 80) colorClass = "text-amber-500";

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative w-20 h-20 mb-2">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200"
          />
          {/* Progress Circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-out ${colorClass}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <Icon className={`w-5 h-5 mb-1 ${colorClass}`} />
          <span className="text-sm font-bold text-gray-700">{score}%</span>
        </div>
      </div>
      <span className="text-xs font-medium text-center text-gray-600">
        {label}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    Healthy: "bg-green-100 text-green-700",
    Warning: "bg-amber-100 text-amber-700",
    Critical: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[status as keyof typeof colors] || "bg-gray-100"}`}>
      {status}
    </span>
  );
}

export function DcrmAIAnalysis({
  analysis,
  loading,
  onAnalyze,
}: DcrmAIAnalysisProps) {
  if (!analysis && !loading) {
    return (
      <Card className="mb-6 bg-linear-to-r from-violet-50 to-indigo-50 border-indigo-100 print:hidden">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-full shadow-sm">
              <Brain className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-900">
                AI Diagnostics Available
              </h3>
              <p className="text-sm text-indigo-700">
                Use GLM-4 AI to analyze component health (Contacts, Mechanism).
              </p>
            </div>
          </div>
          <button
            onClick={onAnalyze}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Run AI Analysis
          </button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="mb-6 border-indigo-100">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <Brain className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">
            Analyzing Circuit Breaker Health...
          </h3>
          <p className="text-sm text-gray-500 max-w-md">
            The AI is examining the waveform data for Arc Contact wear, Main
            Contact resistance, and Mechanism travel irregularities.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const isCritical = analysis.maintenancePriority === "Critical" || analysis.overallScore < 50;

  return (
    <Card className={`mb-6 border-2 shadow-md overflow-hidden print:shadow-none print:border ${isCritical ? 'border-red-200' : 'border-indigo-100'}`}>
      <CardHeader className={`${isCritical ? 'bg-red-50 border-red-100' : 'bg-linear-to-r from-indigo-50 to-white border-indigo-50'} border-b flex flex-row items-center justify-between`}>
        <div>
          <CardTitle className={`flex items-center gap-2 ${isCritical ? 'text-red-900' : 'text-indigo-900'}`}>
            <Brain className={`w-5 h-5 ${isCritical ? 'text-red-600' : 'text-indigo-600'}`} />
            AI Health Assessment
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Generated by GLM-4 • Component-wise Analysis
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
          <span className="text-sm text-gray-600 font-medium">
            Overall Health Score:
          </span>
          <span
            className={`text-lg font-bold ${analysis.overallScore >= 80
              ? "text-emerald-600"
              : analysis.overallScore >= 50
                ? "text-amber-600"
                : "text-red-600"
              }`}
          >
            {analysis.overallScore}/100
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">

        {/* Critical Alert Banner */}
        {(isCritical || analysis.criticalAlert) && (
          <div className="bg-red-100 p-3 flex items-start gap-3 border-b border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-800">Use Caution: Abnormality Detected</h4>
              <p className="text-xs text-red-700 mt-1">
                {analysis.criticalAlert || "Critical deviations detected. maintenance required immediately."}
              </p>
            </div>
          </div>
        )}

        {/* Comparison / Difference Analysis Summary */}
        {analysis.differenceAnalysis && (
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Deviation Analysis
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {analysis.differenceAnalysis}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* Arc Contacts */}
          <div className="p-4 flex flex-col items-center text-center hover:bg-gray-50 transition-colors group">
            <HealthGauge
              score={analysis.arcContacts.score}
              label="Arc Contacts"
              icon={Zap}
            />
            <div className="mt-3">
              <span
                className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mb-2 ${analysis.arcContacts.status === "Healthy"
                  ? "bg-green-100 text-green-700"
                  : analysis.arcContacts.status === "Critical"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                  }`}
              >
                {analysis.arcContacts.status}
              </span>
              <p className="text-xs text-gray-500 leading-snug px-2">
                {analysis.arcContacts.reasoning}
              </p>
            </div>
          </div>

          {/* Main Contacts */}
          <div className="p-4 flex flex-col items-center text-center hover:bg-gray-50 transition-colors group">
            <HealthGauge
              score={analysis.mainContacts.score}
              label="Main Contacts"
              icon={Activity}
            />
            <div className="mt-3">
              <span
                className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mb-2 ${analysis.mainContacts.status === "Healthy"
                  ? "bg-green-100 text-green-700"
                  : analysis.mainContacts.status === "Critical"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                  }`}
              >
                {analysis.mainContacts.status}
              </span>
              <p className="text-xs text-gray-500 leading-snug px-2">
                {analysis.mainContacts.reasoning}
              </p>
            </div>
          </div>

          {/* Mechanism */}
          <div className="p-4 flex flex-col items-center text-center hover:bg-gray-50 transition-colors group">
            <HealthGauge
              score={analysis.operatingMechanism.score}
              label="Mechanism"
              icon={Settings}
            />
            <div className="mt-3">
              <span
                className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mb-2 ${analysis.operatingMechanism.status === "Healthy"
                  ? "bg-green-100 text-green-700"
                  : analysis.operatingMechanism.status === "Critical"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                  }`}
              >
                {analysis.operatingMechanism.status}
              </span>
              <p className="text-xs text-gray-500 leading-snug px-2">
                {analysis.operatingMechanism.reasoning}
              </p>
            </div>
          </div>
        </div>

        {/* Technical Parameters Grid */}
        {analysis.technicalParameters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Main Contact (Rp)</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-lg font-bold text-gray-800">{analysis.technicalParameters.mainContactResistance?.value ?? "--"}</span>
                <span className="text-xs text-gray-500 mb-1">{analysis.technicalParameters.mainContactResistance?.unit}</span>
              </div>
              <StatusBadge status={analysis.technicalParameters.mainContactResistance?.status ?? "Healthy"} />
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Arcing Contact (Ra)</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-lg font-bold text-gray-800">{analysis.technicalParameters.arcingContactResistance?.value ?? "--"}</span>
                <span className="text-xs text-gray-500 mb-1">{analysis.technicalParameters.arcingContactResistance?.unit}</span>
              </div>
              <StatusBadge status={analysis.technicalParameters.arcingContactResistance?.status ?? "Healthy"} />
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Travel Overlap</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-lg font-bold text-gray-800">{analysis.technicalParameters.travelOverlap?.value ?? "--"}</span>
                <span className="text-xs text-gray-500 mb-1">{analysis.technicalParameters.travelOverlap?.unit}</span>
              </div>
              <StatusBadge status={analysis.technicalParameters.travelOverlap?.status ?? "Healthy"} />
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Integrated Wear</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-lg font-bold text-gray-800">{analysis.technicalParameters.integratedWear?.value ?? "--"}</span>
                <span className="text-xs text-gray-500 mb-1">{analysis.technicalParameters.integratedWear?.unit}</span>
              </div>
              <StatusBadge status={analysis.technicalParameters.integratedWear?.status ?? "Healthy"} />
            </div>
          </div>
        )}

        {/* Recommendation Footer */}
        <div className="bg-indigo-50/50 p-4 border-t border-indigo-100">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <ClipboardCheck className="w-3 h-3" /> AI Recommendation
              </h4>
              <p className="text-sm text-indigo-800 italic bg-white/50 p-3 rounded-md border border-indigo-100">
                "{analysis.maintenanceRecommendation}"
              </p>
            </div>

            {/* Maintenance Schedule Block */}
            <div className="shrink-0 flex flex-col gap-2 min-w-[200px]">
              <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                <h5 className="text-xs text-indigo-500 font-bold uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Schedule
                </h5>
                <p className="text-sm font-bold text-indigo-900">
                  {analysis.maintenanceSchedule || "Condition Based"}
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                <h5 className="text-xs text-indigo-500 font-bold uppercase mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Priority
                </h5>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${analysis.maintenancePriority === 'Critical' ? 'bg-red-500' :
                      analysis.maintenancePriority === 'High' ? 'bg-orange-500' :
                        analysis.maintenancePriority === 'Medium' ? 'bg-yellow-500' :
                          'bg-blue-500'
                    }`}></span>
                  <p className="text-sm font-bold text-indigo-900">
                    {analysis.maintenancePriority || "Standard"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
