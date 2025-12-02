"use client"

import * as React from "react"
import { Send, Paperclip, Bot, User, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAdvancedModelFeatures, runAdvancedModelSuite, uploadCsv } from "@/lib/api-client"
import { useWaveformPreview } from "@/provider/waveform-provider"
import type {
  AdvancedDiagnosticResultDto,
  UploadResponse,
} from "@/lib/api-client"

const formatDiagnosticsSummary = (response: UploadResponse): string | null => {
  const diagnostics = response.diagnostics ?? []
  if (!diagnostics.length) return null

  const processed = response.diagnosticsProcessedRows ?? diagnostics.length
  const total = response.diagnosticsTotalRows ?? processed
  const preview = diagnostics.slice(0, 3).map((item) => {
    const confidence = Number.isFinite(item.confidence) ? item.confidence.toFixed(1) : item.confidence
    return `Row ${item.rowIndex + 1}: ${item.diagnosis} (${confidence}% confidence)`
  })

  let summary = `Model processed ${processed}${total > processed ? ` of ${total}` : ""} row(s). `
  summary += preview.join(" | ")
  if (processed > preview.length) {
    summary += ` | …and ${processed - preview.length} more`
  } else if (total > processed) {
    summary += ` | …remaining rows skipped (increase UPLOAD_DIAGNOSTIC_ROW_LIMIT to process more)`
  }

  return summary
}

const formatProbabilitySnippet = (probabilities: Record<string, number>) => {
  return Object.entries(probabilities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, value]) => `${label}: ${value.toFixed(1)}%`)
    .join(" | ")
}

const formatAdvancedMessages = (results?: AdvancedDiagnosticResultDto[]): string[] => {
  if (!results || !results.length) return []
  const [primary, ...rest] = results
  const rowLabel = `Row ${primary.rowIndex + 1}`
  const suffix = rest.length ? ` (${results.length} rows evaluated)` : ""

  const xgbMsg = [
    `${rowLabel} · Advanced XGBoost → ${primary.xgboost.label} (${primary.xgboost.confidence.toFixed(1)}% confidence)`,
    `Top classes: ${formatProbabilitySnippet(primary.xgboost.probabilities)}`,
    suffix,
  ]
    .filter(Boolean)
    .join("\n")

  const adaMsg = `${rowLabel} · Advanced AdaBoost → ${primary.adaboost.label} (${primary.adaboost.confidence.toFixed(1)}% confidence)`

  const autoMsg = `${rowLabel} · Autoencoder → ${
    primary.autoencoder.isAnomaly ? "Anomaly detected" : "No anomaly"
  } (error ${primary.autoencoder.reconstructionError.toExponential(2)} vs threshold ${primary.autoencoder.threshold.toExponential(2)})`

  return [xgbMsg, adaMsg, autoMsg]
}

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function ChatArea() {
  const { setPreview } = useWaveformPreview()
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! You can upload a waveform CSV or ask me to run the advanced model suite for a quick check.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [predictionLoading, setPredictionLoading] = React.useState(false)
  const [advancedFeatureNames, setAdvancedFeatureNames] = React.useState<string[]>([])
  const [attachedFile, setAttachedFile] = React.useState<File | null>(null)
  const [fileUploading, setFileUploading] = React.useState(false)
  const [attachmentError, setAttachmentError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    let mounted = true
    getAdvancedModelFeatures()
      .then((res) => {
        if (mounted) setAdvancedFeatureNames(res.features ?? [])
      })
      .catch(() => {
        // Ignore for now; button will re-fetch when needed
      })
    return () => {
      mounted = false
    }
  }, [])

  const handleSend = async () => {
    const trimmed = input.trim()
    const hasFile = Boolean(attachedFile)

    if (!trimmed && !hasFile) return

    const outgoing: Message[] = []

    if (trimmed) {
      outgoing.push({
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      })
    }

    if (attachedFile) {
      outgoing.push({
        id: (Date.now() + 1).toString(),
        role: "user",
        content: `Uploading CSV: ${attachedFile.name}`,
        timestamp: new Date(),
      })
    }

    setMessages((prev) => [...prev, ...outgoing])
    setInput("")
    setAttachmentError(null)

    if (attachedFile) {
      setFileUploading(true)
      try {
        const result = await uploadCsv(attachedFile)
        setPreview(result.waveformPreview ?? null)
        const summary = formatDiagnosticsSummary(result)
        const uploadMessages: Message[] = [
          {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: `CSV uploaded successfully. Access it at ${result.secureUrl}.`,
            timestamp: new Date(),
          },
        ]

        if (summary) {
          uploadMessages.push({
            id: (Date.now() + 3).toString(),
            role: "assistant",
            content: summary,
            timestamp: new Date(),
          })
        }

        const advancedMessages = formatAdvancedMessages(result.advancedDiagnostics)
        if (advancedMessages.length) {
          advancedMessages.forEach((content, idx) => {
            uploadMessages.push({
              id: (Date.now() + 10 + idx).toString(),
              role: "assistant",
              content,
              timestamp: new Date(),
            })
          })
        }

        if (result.waveformPreview?.points?.length) {
          uploadMessages.push({
            id: (Date.now() + 20).toString(),
            role: "assistant",
            content: `Waveform preview ready. ${result.waveformPreview.points.length} samples synced to the dashboard charts.`,
            timestamp: new Date(),
          })
        }

        setMessages((prev) => [...prev, ...uploadMessages])
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to upload CSV"
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 4).toString(),
            role: "assistant",
            content: `Upload error: ${message}`,
            timestamp: new Date(),
          },
        ])
      } finally {
        setFileUploading(false)
        setAttachedFile(null)
      }
    }

    if (trimmed) {
      setIsLoading(true)
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 4).toString(),
          role: "assistant",
          content:
            "I've received your data. Analyzing the waveform... The primary resistance shows a slight deviation, but it's within the healthy range.",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        setIsLoading(false)
      }, 1500)
    }
  }

  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files && event.target.files[0]
    if (!selected) {
      setAttachedFile(null)
      return
    }

    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setAttachmentError("Please select a CSV file")
      setAttachedFile(null)
      event.target.value = ""
      return
    }

    setAttachmentError(null)
    setAttachedFile(selected)
    event.target.value = ""
  }

  const removeAttachment = () => {
    setAttachedFile(null)
    setAttachmentError(null)
  }

  const handleRunPrediction = async () => {
    setIsLoading(true)
    setPredictionLoading(true)
    try {
      let names = advancedFeatureNames
      if (!names.length) {
        const response = await getAdvancedModelFeatures()
        names = response.features ?? []
        setAdvancedFeatureNames(names)
      }

      if (!names.length) {
        throw new Error("Advanced model features unavailable")
      }

      const payload = Object.fromEntries(names.map((name) => [name, 50]))
      const response = await runAdvancedModelSuite(payload)
      const advancedMessages = formatAdvancedMessages([response.result])

      const summaryMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: [
          "Advanced model suite completed.",
          `Models: ${response.availableModels.join(", ") || "unavailable"}.`,
          `Requested at: ${new Date(response.requestedAt).toLocaleString()}.`,
        ].join("\n"),
        timestamp: new Date(),
      }

      const detailMessages: Message[] = advancedMessages.map((content, idx) => ({
        id: (Date.now() + 3 + idx).toString(),
        role: "assistant",
        content,
        timestamp: new Date(),
      }))

      setMessages((prev) => [...prev, summaryMessage, ...detailMessages])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to run diagnostics"
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 3).toString(),
          role: "assistant",
          content: `Error: ${message}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setPredictionLoading(false)
      setIsLoading(false)
    }
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Advanced Diagnostics Assistant</CardTitle>
          <CardDescription>
            Upload breaker waveforms or ping the new model suite for instant insights.
          </CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleRunPrediction}
          disabled={predictionLoading}
        >
          {predictionLoading ? "Running..." : "Run Model"}
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <Avatar className="h-8 w-8">
              {message.role === "assistant" ? (
                <>
                  <AvatarImage src="/avatars/bot.png" />
                  <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                </>
              ) : (
                <>
                  <AvatarImage src="/avatars/user.png" />
                  <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                </>
              )}
            </Avatar>
            <div
              className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
          {(isLoading || fileUploading) && (
          <div className="flex gap-3">
             <Avatar className="h-8 w-8">
                <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
             </Avatar>
             <div className="bg-muted rounded-lg px-3 py-2 text-sm">
               {fileUploading ? "Uploading CSV..." : "Analyzing..."}
             </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex w-full items-center gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={handleFileButtonClick}
            disabled={fileUploading}
          >
            <Paperclip className="h-4 w-4" />
            <span className="sr-only">Attach file</span>
          </Button>
          <Input
            placeholder="Type your message or paste data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || fileUploading || (!input.trim() && !attachedFile)}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
        {(attachedFile || attachmentError) && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
            {attachedFile && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                {attachedFile.name}
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Remove attachment"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {attachmentError && <span className="text-destructive">{attachmentError}</span>}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
