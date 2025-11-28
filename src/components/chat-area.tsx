"use client"

import * as React from "react"
import { Send, Paperclip, Bot, User } from "lucide-react"

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

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function ChatArea() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! You can upload a new DCRM waveform here or paste the data to get an analysis.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I've received your data. Analyzing the waveform... The primary resistance shows a slight deviation, but it's within the healthy range.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle>DCRM Assistant</CardTitle>
        <CardDescription>
          Add new DCRM waveforms and get instant results.
        </CardDescription>
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
        {isLoading && (
          <div className="flex gap-3">
             <Avatar className="h-8 w-8">
                <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
             </Avatar>
             <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                Analyzing...
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
          <Button type="button" variant="outline" size="icon" className="shrink-0">
            <Paperclip className="h-4 w-4" />
            <span className="sr-only">Attach file</span>
          </Button>
          <Input
            placeholder="Type your message or paste data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
