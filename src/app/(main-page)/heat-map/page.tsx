"use client"

import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const HeatmapMap = dynamic(() => import("@/components/heatmap-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-140px)] w-full flex items-center justify-center bg-muted rounded-lg border shadow-md">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground">Loading Heatmap...</p>
      </div>
    </div>
  )
})

export default function HeatMapPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">DCRM Heatmap Analysis</h1>
          <p className="text-muted-foreground">Geospatial distribution of DCRM health status across India</p>
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1">
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-0">
            <HeatmapMap />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Active Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Hotspots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">3</div>
            <p className="text-xs text-muted-foreground">Mumbai, Delhi, Chennai</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">87.5%</div>
            <p className="text-xs text-muted-foreground">Optimal performance</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}