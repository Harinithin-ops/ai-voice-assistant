"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, CheckCircle, XCircle, Loader2, Brain, Zap, ExternalLink, Search } from "lucide-react"

interface SearchResult {
  title: string
  snippet: string
  link: string
}

interface Command {
  id: string
  text: string
  response: string
  timestamp: Date
  status: "success" | "error" | "processing"
  recognitionMethod?: "web-api" | "gemini-api"
  confidence?: number
  searchResults?: SearchResult[]
  searchQuery?: string
}

interface CommandHistoryProps {
  commands: Command[]
}

export function CommandHistory({ commands }: CommandHistoryProps) {
  if (commands.length === 0) {
    return (
      <Card className="h-96">
        <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-serif">Your voice commands will appear here</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status: Command["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-destructive" />
      case "processing":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />
    }
  }

  const getStatusColor = (status: Command["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
      case "error":
        return "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
      case "processing":
        return "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
    }
  }

  const getRecognitionIcon = (method?: "web-api" | "gemini-api") => {
    switch (method) {
      case "gemini-api":
        return <Brain className="w-3 h-3 text-primary" />
      case "web-api":
        return <Zap className="w-3 h-3 text-secondary" />
      default:
        return null
    }
  }

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="font-sans text-lg">Command History</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full overflow-y-auto px-6 pb-6 space-y-3">
          {commands.map((command) => (
            <div key={command.id} className={`p-3 rounded-lg border transition-all ${getStatusColor(command.status)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  {getStatusIcon(command.status)}
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {command.timestamp.toLocaleTimeString()}
                  </Badge>
                  {command.recognitionMethod && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1 px-2 py-0.5">
                      {getRecognitionIcon(command.recognitionMethod)}
                      {command.recognitionMethod === "gemini-api" ? "Gemini" : "Web API"}
                    </Badge>
                  )}
                  {command.confidence && command.confidence > 0 && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      {Math.round(command.confidence * 100)}% confidence
                    </Badge>
                  )}
                  {command.searchResults && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1 px-2 py-0.5">
                      <Search className="w-3 h-3" />
                      Web Search
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">You said:</p>
                  <p className="font-serif text-sm text-foreground leading-relaxed">"{command.text}"</p>
                </div>

                {command.response && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Assistant:</p>
                    <p className="font-serif text-sm text-foreground leading-relaxed">{command.response}</p>
                  </div>
                )}

                {command.searchResults && command.searchResults.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Search className="w-3 h-3" />
                      Search Sources:
                    </p>
                    <div className="space-y-2">
                      {command.searchResults.slice(0, 3).map((result, index) => (
                        <div key={index} className="text-xs">
                          <a
                            href={result.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            {result.title}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <p className="text-muted-foreground mt-1 line-clamp-2">{result.snippet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
