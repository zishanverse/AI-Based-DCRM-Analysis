"use client"

import * as React from "react"
import type { WaveformPreviewDto } from "@/lib/api-client"

type WaveformContextValue = {
  preview: WaveformPreviewDto | null
  setPreview: (preview: WaveformPreviewDto | null) => void
}

const WaveformContext = React.createContext<WaveformContextValue | undefined>(
  undefined,
)

export function WaveformProvider({ children }: { children: React.ReactNode }) {
  const [preview, setPreview] = React.useState<WaveformPreviewDto | null>(null)
  const value = React.useMemo(() => ({ preview, setPreview }), [preview])

  return <WaveformContext.Provider value={value}>{children}</WaveformContext.Provider>
}

export function useWaveformPreview() {
  const ctx = React.useContext(WaveformContext)
  if (!ctx) {
    throw new Error("useWaveformPreview must be used within a WaveformProvider")
  }
  return ctx
}
