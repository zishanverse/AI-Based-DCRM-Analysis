
import { ChatArea } from "@/components/chat-area";
import { DcrmStatsCards } from "@/components/DcrmStatsCards";

import { OverallScore } from "@/components/OverallScore";

import { AdaboostCharts } from "@/components/AdaboostCharts";
import { DashboardCharts } from "@/components/dashboard-charts";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-2 p-2 md:gap-4 md:p-4">
      <div className="grid gap-2 md:gap-4">
        <div className="grid gap-2 md:grid-cols-4 h-full">
          <div className="md:col-span-3 h-full">
            <DcrmStatsCards />
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
