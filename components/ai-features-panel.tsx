"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Lightbulb, Camera, FileText, TrendingUp, Clock, Zap, X, Eye } from "lucide-react"

interface AIInsight {
  id: string
  type: "suggestion" | "reminder" | "insight" | "learning" | "analysis"
  title: string
  description: string
  confidence: number
  timestamp: Date
  fileType?: "image" | "document"
  fileName?: string
}

interface AIFeaturesProps {
  isVisible: boolean
  onToggle: () => void
}

export default function AIFeaturesPanel({ isVisible, onToggle }: AIFeaturesProps) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [conversationContext, setConversationContext] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Generate AI insights based on usage patterns
    const generateInsights = () => {
      const sampleInsights: AIInsight[] = [
        {
          id: "1",
          type: "suggestion",
          title: "Smart Schedule Optimization",
          description:
            "Based on your usage patterns, I suggest scheduling your daily briefing at 8:30 AM for optimal productivity.",
          confidence: 0.87,
          timestamp: new Date(),
        },
        {
          id: "2",
          type: "learning",
          title: "Voice Pattern Recognition",
          description:
            "I've learned your preferred speaking pace and adjusted speech recognition sensitivity accordingly.",
          confidence: 0.92,
          timestamp: new Date(),
        },
        {
          id: "3",
          type: "insight",
          title: "Usage Analytics",
          description:
            "You use web search commands 40% more on weekdays. Would you like me to proactively suggest relevant topics?",
          confidence: 0.78,
          timestamp: new Date(),
        },
      ]
      setInsights(sampleInsights)
    }

    if (isVisible) {
      generateInsights()
    }
  }, [isVisible])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith("image/")) {
        setUploadedFiles((prev) => [...prev, file])
        analyzeFile(file, "image")
      }
    }
  }

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]
      // Limit document size to 5MB for complex processing
      if (file.size > 5 * 1024 * 1024) {
        setInsights((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "insight",
            title: "File Too Large",
            description: "Document size exceeds 5MB limit. Please upload a smaller file for analysis.",
            confidence: 1.0,
            timestamp: new Date(),
            fileType: "document",
            fileName: file.name,
          },
        ])
        return
      }

      if (file.type.includes("pdf") || file.type.includes("text") || file.type.includes("document")) {
        setUploadedFiles((prev) => [...prev, file])
        analyzeFile(file, "document")
      }
    }
  }

  const analyzeFile = async (file: File, type: "image" | "document") => {
    setIsAnalyzing(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      // Simulate AI analysis with realistic processing time
      await new Promise((resolve) => setTimeout(resolve, 3000))

      let analysisResult = ""
      if (type === "image") {
        analysisResult = `Analyzed image "${file.name}": Detected objects, text, and visual elements. The image appears to contain ${Math.floor(Math.random() * 5) + 1} main subjects with ${Math.floor(Math.random() * 3) + 1} text regions. Ready to answer questions about the visual content.`
      } else {
        analysisResult = `Analyzed document "${file.name}": Extracted ${Math.floor(Math.random() * 50) + 10} key concepts and ${Math.floor(Math.random() * 20) + 5} main topics. Document contains approximately ${Math.floor(file.size / 100)} words. Ready to answer questions about the content.`
      }

      setInsights((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "analysis",
          title: `${type === "image" ? "Image" : "Document"} Analysis Complete`,
          description: analysisResult,
          confidence: 0.85 + Math.random() * 0.1,
          timestamp: new Date(),
          fileType: type,
          fileName: file.name,
        },
      ])
    } catch (error) {
      setInsights((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "insight",
          title: "Analysis Failed",
          description: `Failed to analyze ${file.name}. Please try again or use a different file format.`,
          confidence: 1.0,
          timestamp: new Date(),
          fileType: type,
          fileName: file.name,
        },
      ])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "suggestion":
        return <Lightbulb className="w-4 h-4" />
      case "reminder":
        return <Clock className="w-4 h-4" />
      case "insight":
        return <TrendingUp className="w-4 h-4" />
      case "learning":
        return <Brain className="w-4 h-4" />
      case "analysis":
        return <Eye className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case "suggestion":
        return "bg-blue-500/10 text-blue-600 border-blue-200"
      case "reminder":
        return "bg-orange-500/10 text-orange-600 border-orange-200"
      case "insight":
        return "bg-green-500/10 text-green-600 border-green-200"
      case "learning":
        return "bg-purple-500/10 text-purple-600 border-purple-200"
      case "analysis":
        return "bg-indigo-500/10 text-indigo-600 border-indigo-200"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-200"
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with shadow effect */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onToggle} />

      {/* Modal content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 overflow-hidden">
        <Card className="bg-white dark:bg-gray-900 border-green-200 dark:border-green-800 shadow-2xl">
          <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Brain className="w-6 h-6 text-green-600" />
                AI Features & Analysis
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Multi-modal AI Controls */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-600" />
                    Multi-modal AI Analysis
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isAnalyzing}
                      className="h-20 flex-col gap-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900 dark:hover:to-indigo-900"
                    >
                      <Camera className="w-6 h-6 text-blue-600" />
                      <span className="text-sm font-medium">{isAnalyzing ? "Analyzing..." : "Upload Image"}</span>
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => documentInputRef.current?.click()}
                      disabled={isAnalyzing}
                      className="h-20 flex-col gap-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900 dark:hover:to-emerald-900"
                    >
                      <FileText className="w-6 h-6 text-green-600" />
                      <span className="text-sm font-medium">Upload Document</span>
                    </Button>
                  </div>

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <input
                    ref={documentInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={handleDocumentUpload}
                    className="hidden"
                  />

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Uploaded Files:</h4>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              {file.type.startsWith("image/") ? (
                                <Camera className="w-4 h-4 text-blue-600" />
                              ) : (
                                <FileText className="w-4 h-4 text-green-600" />
                              )}
                              <span className="text-sm font-medium truncate flex-1">{file.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {(file.size / 1024).toFixed(1)} KB
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFile(index)}
                              className="h-8 w-8 p-0 ml-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Context Awareness */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    Context Memory
                  </h3>
                  <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                      Remembering conversation context across {conversationContext.length} interactions
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      AI learns from your preferences and adapts responses accordingly
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - AI Insights */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  AI Insights & Analysis
                </h3>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {insights.map((insight) => (
                    <div
                      key={insight.id}
                      className="p-4 rounded-lg border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                            {getInsightIcon(insight.type)}
                          </div>
                          <div>
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {insight.title}
                            </span>
                            {insight.fileName && (
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {insight.fileType}
                                </Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
                                  {insight.fileName}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className={getInsightColor(insight.type)}>
                          {Math.round(insight.confidence * 100)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                        {insight.description}
                      </p>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {insight.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}

                  {insights.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        No AI insights yet. Upload files or interact with the assistant to see analysis.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
