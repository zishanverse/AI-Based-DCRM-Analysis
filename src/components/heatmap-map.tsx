"use client"

import { useEffect, useMemo, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import "leaflet.heat"

import { getHeatmapPoints, HeatmapPointDto } from "@/lib/api-client"

// Fix for default marker icon in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

type HeatmapLayerProps = {
  points: HeatmapPointDto[]
}

type StatusSummary = {
  healthy: number
  moderate: number
  fault: number
}

function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap()

  useEffect(() => {
    if (!points.length) {
      return
    }

    const formatted = points.map((point) => [point.lat, point.lon, point.intensity])

    if ((L as any).heatLayer) {
        const heat = (L as any).heatLayer(formatted, {
            radius: 25,
            blur: 15,
            maxZoom: 10,
            gradient: {
              0.4: 'blue',
              0.6: 'cyan',
              0.7: 'lime',
              0.8: 'yellow',
              1.0: 'red'
            }
        })
        heat.addTo(map)
        
        return () => {
            map.removeLayer(heat)
        }
    }
  }, [map, points])

  return null
}

export default function HeatmapMap() {
  const [points, setPoints] = useState<HeatmapPointDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    getHeatmapPoints()
      .then((res) => {
        if (!isMounted) return
        setPoints(res.points)
      })
      .catch((err) => {
        if (!isMounted) return
        const message = err instanceof Error ? err.message : "Failed to load heatmap data"
        setError(message)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const statusSummary = useMemo<StatusSummary>(() => {
    return points.reduce<StatusSummary>((acc, point) => {
      const key = (point.status ?? "healthy") as keyof StatusSummary
      if (acc[key] === undefined) {
        acc[key] = 0
      }
      acc[key] += 1
      return acc
    }, { healthy: 0, moderate: 0, fault: 0 })
  }, [points])

  return (
    <div className="relative z-0 h-[calc(100vh-140px)] w-full overflow-hidden rounded-lg border shadow-md">
      {(loading || error) && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <p className="text-sm font-medium text-foreground">
            {error ?? "Loading live heatmap data..."}
          </p>
        </div>
      )}
      <div className="pointer-events-none absolute left-4 top-4 z-20 space-y-1 rounded-md border bg-background/90 px-3 py-2 text-xs shadow-sm">
        <p className="font-semibold uppercase tracking-wide text-muted-foreground">Live stations</p>
        <div className="flex gap-3 text-muted-foreground">
          <span className="text-foreground">Total: {points.length}</span>
          <span className="text-green-600">Healthy: {statusSummary.healthy}</span>
          <span className="text-amber-600">Moderate: {statusSummary.moderate}</span>
          <span className="text-red-600">Fault: {statusSummary.fault}</span>
        </div>
      </div>
      <MapContainer 
        center={[20.5937, 78.9629]} 
        zoom={5} 
        scrollWheelZoom={true} 
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.length > 0 && <HeatmapLayer points={points} />}
      </MapContainer>
    </div>
  )
}
