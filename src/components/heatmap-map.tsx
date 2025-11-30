"use client"

import { useEffect } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import "leaflet.heat"

// Fix for default marker icon in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Mock data for India heatmap
// Format: [lat, lng, intensity]
const addressPoints = [
  [19.0760, 72.8777, 1000], // Mumbai (High intensity)
  [28.6139, 77.2090, 800],  // Delhi
  [12.9716, 77.5946, 700],  // Bangalore
  [13.0827, 80.2707, 600],  // Chennai
  [22.5726, 88.3639, 600],  // Kolkata
  [17.3850, 78.4867, 500],  // Hyderabad
  [23.0225, 72.5714, 400],  // Ahmedabad
  [18.5204, 73.8567, 450],  // Pune
  [26.9124, 75.7873, 300],  // Jaipur
  [15.2993, 74.1240, 200],  // Goa
  [9.9312, 76.2673, 350],   // Kochi
  [21.1458, 79.0882, 400],  // Nagpur
  [26.8467, 80.9462, 300],  // Lucknow
  [25.3176, 82.9739, 250],  // Varanasi
  
  // Clusters around Mumbai
  [19.08, 72.88, 900],
  [19.07, 72.87, 850],
  [19.06, 72.89, 800],
  
  // Clusters around Delhi
  [28.62, 77.21, 750],
  [28.60, 77.22, 700],
  
  // Clusters around Bangalore
  [12.98, 77.60, 650],
  [12.96, 77.58, 600],
]

function HeatmapLayer() {
  const map = useMap()

  useEffect(() => {
    const points = addressPoints
      ? addressPoints.map((p) => {
          return [p[0], p[1], p[2]] // lat, lng, intensity
        })
      : []

    if ((L as any).heatLayer) {
        const heat = (L as any).heatLayer(points, {
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
  }, [map])

  return null
}

export default function HeatmapMap() {
  return (
    <div className="h-[calc(100vh-140px)] w-full rounded-lg overflow-hidden border shadow-md relative z-0">
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
        <HeatmapLayer />
      </MapContainer>
    </div>
  )
}
