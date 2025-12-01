import { AppSidebar } from "@/components/app-sidebar"

import { ChatArea } from "@/components/chat-area"
import { SiteHeader } from "@/components/site-header"
import { DcrmStatsCards } from "@/components/DcrmStatsCards"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"


import { OverallScore } from "@/components/OverallScore"

import { AdaboostCharts } from "@/components/AdaboostCharts"

export default function Page() {


  return (

        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="grid gap-4 md:gap-8">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-3">
                <DcrmStatsCards/>
              </div>
              <div className="md:col-span-1">
                <OverallScore />
              </div>
            </div>
            <AdaboostCharts />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <div className="col-span-4 lg:col-span-7">
                <ChatArea />
              </div>
            </div>
          </div>
        </div>

  )
}
