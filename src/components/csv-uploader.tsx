"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { presignUpload } from "@/lib/api-client"

export default function CsvUploader() {
  const [file, setFile] = React.useState<File | null>(null)
  const [status, setStatus] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0]
    setFile(f ?? null)
    setStatus(null)
  }

  const handleUpload = async () => {
    if (!file) return setStatus("No file selected")
    if (!file.name.toLowerCase().endsWith(".csv")) return setStatus("Please select a CSV file")

    setUploading(true)
    setStatus("Requesting upload URL...")

    try {
      const presign = await presignUpload(file.name, file.type || "text/csv")
      setStatus("Uploading to S3...")

      const res = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "text/csv",
        },
        body: file,
      })

      if (!res.ok) {
        throw new Error(`S3 upload failed: ${res.status} ${res.statusText}`)
      }

      setStatus(`Upload successful. Key: ${presign.key}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setStatus(`Upload error: ${msg}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-lg border p-4 bg-background">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Input type="file" accept=".csv" onChange={handleFileChange} />
        <Button onClick={handleUpload} disabled={uploading || !file}>
          {uploading ? "Uploading..." : "Upload CSV"}
        </Button>
      </div>
      {status && <p className="mt-2 text-sm">{status}</p>}
    </div>
  )
}
