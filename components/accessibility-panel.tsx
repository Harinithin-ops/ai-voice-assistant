"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Mic,
  MicOff,
  Download,
  Save,
  FileText,
  Volume2,
  Loader2,
  Upload,
  Play,
  SkipForward,
  RotateCcw,
} from "lucide-react"

interface AccessibilityPanelProps {
  isVisible: boolean
  onToggle: () => void
}

interface Question {
  id: number
  text: string
  answered: boolean
  userAnswer?: string
}

export default function AccessibilityPanel({ isVisible, onToggle }: AccessibilityPanelProps) {
  const [activeTab, setActiveTab] = useState<"document" | "pdf-reader">("document")
  const [isListening, setIsListening] = useState(false)
  const [documentContent, setDocumentContent] = useState("")
  const [documentTitle, setDocumentTitle] = useState("My Document")
  const [isProcessing, setIsProcessing] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [currentTranscript, setCurrentTranscript] = useState("")

  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isReadingQuestion, setIsReadingQuestion] = useState(false)
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [isListeningForAnswer, setIsListeningForAnswer] = useState(false)
  const [isProcessingPdf, setIsProcessingPdf] = useState(false)
  const [allVoiceInput, setAllVoiceInput] = useState("")
  const [realtimeInput, setRealtimeInput] = useState("")
  const [voiceInputHistory, setVoiceInputHistory] = useState<string[]>([])

  const recognitionRef = useRef<any | null>(null)
  const answerRecognitionRef = useRef<any | null>(null)
  const restartTimeoutRef = useRef<any>(null)

  useEffect(() => {
    const words = documentContent
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)
    setWordCount(words.length)
  }, [documentContent])

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"
      recognitionRef.current.maxAlternatives = 1

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0].transcript

          if (result.isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        setCurrentTranscript(interimTranscript)

        if (finalTranscript) {
          setDocumentContent((prev) => prev + (prev ? " " : "") + finalTranscript)
          setCurrentTranscript("")
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
        setIsProcessing(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        setIsProcessing(false)
      }

      answerRecognitionRef.current = new SpeechRecognition()
      answerRecognitionRef.current.continuous = true
      answerRecognitionRef.current.interimResults = true
      answerRecognitionRef.current.lang = "en-US"
      answerRecognitionRef.current.maxAlternatives = 1

      answerRecognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0].transcript.trim()

          if (result.isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (interimTranscript) {
          setCurrentAnswer(interimTranscript)
          setRealtimeInput((prev) => {
            const lines = prev.split("\n")
            const lastLine = lines[lines.length - 1]
            if (lastLine.startsWith("🎤 ")) {
              lines[lines.length - 1] = `🎤 ${interimTranscript}`
            } else {
              lines.push(`🎤 ${interimTranscript}`)
            }
            return lines.join("\n")
          })
        }

        if (finalTranscript) {
          const cleanTranscript = finalTranscript.trim()
          if (cleanTranscript) {
            setRealtimeInput((prev) => {
              const lines = prev.split("\n").filter((line) => !line.startsWith("🎤 "))
              lines.push(`✓ ${cleanTranscript}`)
              return lines.join("\n")
            })

            if (cleanTranscript.toLowerCase().includes("next question")) {
              handleNextQuestion()
              return
            }

            if (questions[currentQuestionIndex]) {
              const updatedQuestions = [...questions]
              const existingAnswer = updatedQuestions[currentQuestionIndex].userAnswer || ""
              updatedQuestions[currentQuestionIndex].userAnswer = existingAnswer
                ? `${existingAnswer} ${cleanTranscript}`
                : cleanTranscript
              updatedQuestions[currentQuestionIndex].answered = true
              setQuestions(updatedQuestions)
            }
            setCurrentAnswer("")
          }
        }
      }

      answerRecognitionRef.current.onerror = (event: any) => {
        if (event.error === "no-speech") {
          return
        }
        if (event.error === "aborted") {
          return
        }
        if (event.error === "network") {
          console.log("Network error in speech recognition, will retry")
          return
        }
        console.error("Answer recognition error:", event.error)
        setIsListeningForAnswer(false)
      }

      answerRecognitionRef.current.onend = () => {
        if (isWaitingForAnswer && !isReadingQuestion && isListeningForAnswer) {
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current)
          }

          restartTimeoutRef.current = setTimeout(() => {
            if (answerRecognitionRef.current && isWaitingForAnswer && !isReadingQuestion && isListeningForAnswer) {
              try {
                answerRecognitionRef.current.start()
              } catch (error) {
                if ((error as any).message && !(error as any).message.includes("already started")) {
                  console.log("Recognition restart failed, will retry:", error)
                  restartTimeoutRef.current = setTimeout(() => {
                    if (
                      answerRecognitionRef.current &&
                      isWaitingForAnswer &&
                      !isReadingQuestion &&
                      isListeningForAnswer
                    ) {
                      try {
                        answerRecognitionRef.current.start()
                      } catch (retryError) {
                        console.error("Recognition restart failed after retry:", retryError)
                        setIsListeningForAnswer(false)
                      }
                    }
                  }, 3000)
                }
              }
            }
          }, 2000)
        }
      }
    }

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (answerRecognitionRef.current) {
        answerRecognitionRef.current.stop()
      }
    }
  }, [questions, currentQuestionIndex, isWaitingForAnswer, isListeningForAnswer])

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start()
      setIsListening(true)
      setIsProcessing(true)
      setCurrentTranscript("")
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
    setIsProcessing(false)
    setCurrentTranscript("")
  }

  const clearDocument = () => {
    setDocumentContent("")
    setCurrentTranscript("")
    setWordCount(0)
  }

  const downloadDocument = () => {
    const element = document.createElement("a")
    const file = new Blob([documentContent], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `${documentTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const saveAsWord = () => {
    const header = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${documentTitle}</title>
</head>
<body>
<h1>${documentTitle}</h1>
<p>${documentContent.replace(/\n/g, "</p><p>")}</p>
</body>
</html>`

    const element = document.createElement("a")
    const file = new Blob([header], { type: "application/msword" })
    element.href = URL.createObjectURL(file)
    element.download = `${documentTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.doc`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const speakContent = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(documentContent)
      utterance.rate = 0.8
      utterance.pitch = 1.0
      utterance.volume = 0.9
      speechSynthesis.speak(utterance)
    }
  }

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || file.type !== "application/pdf") {
      alert("Please select a valid PDF file")
      return
    }

    setPdfFile(file)
    setIsProcessingPdf(true)

    try {
      const formData = new FormData()
      formData.append("pdf", file)

      const response = await fetch("/api/extract-pdf-questions", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to process PDF")
      }

      const data = await response.json()
      const extractedQuestions: Question[] = data.questions.map((q: string, index: number) => ({
        id: index + 1,
        text: q,
        answered: false,
      }))

      setQuestions(extractedQuestions)
      setCurrentQuestionIndex(0)
      setIsProcessingPdf(false)

      if (extractedQuestions.length > 0) {
        readQuestion(extractedQuestions[0].text)
      }
    } catch (error) {
      console.error("Error processing PDF:", error)
      setIsProcessingPdf(false)
      alert("Error processing PDF. Please try again.")
    }
  }

  const readQuestion = (questionText: string) => {
    if ("speechSynthesis" in window) {
      setIsReadingQuestion(true)
      const utterance = new SpeechSynthesisUtterance(questionText)
      utterance.rate = 0.7
      utterance.pitch = 1.0
      utterance.volume = 0.9

      utterance.onend = () => {
        setIsReadingQuestion(false)
        startWaitingForAnswer()
      }

      speechSynthesis.speak(utterance)
    }
  }

  const startWaitingForAnswer = () => {
    setIsWaitingForAnswer(true)
    setIsListeningForAnswer(true)
    setTimeout(() => {
      if (answerRecognitionRef.current && isWaitingForAnswer) {
        try {
          answerRecognitionRef.current.start()
        } catch (error) {
          console.error("Failed to start answer recognition:", error)
          setIsListeningForAnswer(false)
        }
      }
    }, 500)
  }

  const handleNextQuestion = () => {
    setIsWaitingForAnswer(false)
    setIsListeningForAnswer(false)
    setCurrentAnswer("")
    setRealtimeInput("")

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
    }

    if (answerRecognitionRef.current) {
      try {
        answerRecognitionRef.current.stop()
      } catch (error) {
        console.log("Recognition stop failed (expected):", error)
      }
    }

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      setTimeout(() => {
        readQuestion(questions[nextIndex].text)
      }, 500)
    } else {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance("All questions completed. Thank you!")
        speechSynthesis.speak(utterance)
      }
    }
  }

  const restartQuestions = () => {
    setCurrentQuestionIndex(0)
    setIsWaitingForAnswer(false)
    setIsListeningForAnswer(false)
    setCurrentAnswer("")
    setRealtimeInput("")
    setAllVoiceInput("")
    setVoiceInputHistory([])

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
    }

    const resetQuestions = questions.map((q) => ({ ...q, answered: false, userAnswer: undefined }))
    setQuestions(resetQuestions)

    if (questions.length > 0) {
      setTimeout(() => {
        readQuestion(questions[0].text)
      }, 500)
    }
  }

  const downloadAnswers = () => {
    const content = questions
      .map((q, index) => `Question ${index + 1}: ${q.text}\nAnswer: ${q.userAnswer || "Not answered"}\n\n`)
      .join("")

    const element = document.createElement("a")
    const file = new Blob([content], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `pdf_questions_answers.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const downloadAnswersAsWord = () => {
    const content = questions
      .map(
        (q, index) =>
          `<h3>Question ${index + 1}:</h3><p>${q.text}</p><h4>Answer:</h4><p>${q.userAnswer || "Not answered"}</p><br>`,
      )
      .join("")

    const header = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>PDF Questions and Answers</title>
</head>
<body>
<h1>PDF Questions and Answers</h1>
${content}
</body>
</html>`

    const element = document.createElement("a")
    const file = new Blob([header], { type: "application/msword" })
    element.href = URL.createObjectURL(file)
    element.download = `pdf_questions_answers.doc`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const downloadQuestionsOnly = () => {
    const content = questions.map((q, index) => `Question ${index + 1}: ${q.text}\n\n`).join("")

    const element = document.createElement("a")
    const file = new Blob([content], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `pdf_questions_only.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const downloadAllVoiceInput = () => {
    const content = `All Voice Input Content\n\n${allVoiceInput}\n\nDetailed History:\n${voiceInputHistory.map((input, index) => `${index + 1}. ${input}`).join("\n")}`

    const element = document.createElement("a")
    const file = new Blob([content], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `voice_input_content.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const downloadVoiceInputAsWord = () => {
    const content = `<h1>Voice Input Content</h1><h2>Complete Content:</h2><p>${allVoiceInput}</p><h2>Detailed History:</h2>${voiceInputHistory.map((input, index) => `<p><strong>${index + 1}.</strong> ${input}</p>`).join("")}`

    const header = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Voice Input Content</title>
</head>
<body>
${content}
</body>
</html>`

    const element = document.createElement("a")
    const file = new Blob([header], { type: "application/msword" })
    element.href = URL.createObjectURL(file)
    element.download = `voice_input_content.doc`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                Accessibility Tools
              </CardTitle>
              <p className="text-lg text-muted-foreground mt-2 font-serif">
                Specialized services for visually impaired users
              </p>
            </div>
            <Button variant="outline" onClick={onToggle}>
              Close
            </Button>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant={activeTab === "document" ? "default" : "outline"}
              onClick={() => setActiveTab("document")}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Document Creator
            </Button>
            <Button
              variant={activeTab === "pdf-reader" ? "default" : "outline"}
              onClick={() => setActiveTab("pdf-reader")}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              PDF Question Reader
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {activeTab === "document" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="doc-title" className="text-lg font-semibold">
                  Document Title
                </Label>
                <Input
                  id="doc-title"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="Enter document title..."
                  className="text-lg"
                  aria-label="Document title input"
                />
              </div>

              <Card className="border-2 border-primary/20">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-semibold">Voice Recording</h3>

                    <Button
                      onClick={isListening ? stopListening : startListening}
                      size="lg"
                      className={`w-24 h-24 rounded-full text-lg font-semibold transition-all duration-300 ${
                        isListening
                          ? "bg-destructive hover:bg-destructive/90 animate-pulse"
                          : "bg-primary hover:bg-primary/90"
                      }`}
                      aria-label={isListening ? "Stop recording" : "Start recording"}
                    >
                      {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
                    </Button>

                    <div className="space-y-2">
                      <Badge variant={isListening ? "destructive" : "secondary"} className="text-lg px-4 py-2">
                        {isListening ? "Recording..." : "Ready to Record"}
                      </Badge>

                      {isProcessing && (
                        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-lg">Processing speech...</span>
                        </div>
                      )}
                    </div>

                    {currentTranscript && (
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <p className="text-lg italic text-muted-foreground">
                            Currently speaking: "{currentTranscript}"
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="doc-content" className="text-lg font-semibold">
                    Document Content
                  </Label>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-sm">
                      {wordCount} words
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={speakContent}
                      disabled={!documentContent}
                      className="flex items-center gap-2 bg-transparent"
                      aria-label="Read document aloud"
                    >
                      <Volume2 className="w-4 h-4" />
                      Read Aloud
                    </Button>
                  </div>
                </div>

                <Textarea
                  id="doc-content"
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  placeholder="Your dictated content will appear here... You can also type or edit manually."
                  className="min-h-[300px] text-lg leading-relaxed"
                  aria-label="Document content"
                />
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  onClick={downloadDocument}
                  disabled={!documentContent}
                  className="flex items-center gap-2 text-lg px-6 py-3"
                  aria-label="Download as text file"
                >
                  <Download className="w-5 h-5" />
                  Download as Text
                </Button>

                <Button
                  onClick={saveAsWord}
                  disabled={!documentContent}
                  variant="outline"
                  className="flex items-center gap-2 text-lg px-6 py-3 bg-transparent"
                  aria-label="Save as Word document"
                >
                  <Save className="w-5 h-5" />
                  Save as Word
                </Button>

                <Button
                  onClick={clearDocument}
                  disabled={!documentContent}
                  variant="destructive"
                  className="flex items-center gap-2 text-lg px-6 py-3"
                  aria-label="Clear document content"
                >
                  Clear Document
                </Button>
              </div>

              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-lg mb-2">Instructions:</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Click the "Start" button (microphone icon) to begin voice recording</li>
                    <li>• Speak clearly and naturally - your words will appear in the document</li>
                    <li>• Click "Stop" when you're finished dictating</li>
                    <li>• Use "Read Aloud" to hear your document content</li>
                    <li>• Download your document as text or Word format when complete</li>
                    <li>• All features are optimized for screen readers and keyboard navigation</li>
                  </ul>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "pdf-reader" && (
            <>
              {!pdfFile && (
                <Card className="border-2 border-primary/20">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <h3 className="text-xl font-semibold">Upload PDF with Questions</h3>
                      <div className="space-y-4">
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={handlePdfUpload}
                          className="text-lg"
                          aria-label="Upload PDF file"
                        />
                        <p className="text-muted-foreground">
                          Upload a PDF containing questions. The system will read each question aloud and wait for your
                          spoken answer.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isProcessingPdf && (
                <Card className="border-2 border-primary/20">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                      <h3 className="text-xl font-semibold">Processing PDF...</h3>
                      <p className="text-muted-foreground">Extracting questions from your PDF file.</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {pdfFile && questions.length > 0 && !isProcessingPdf && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Question Column */}
                    <div className="space-y-4">
                      <Card className="border-2 border-primary/20">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold">
                              Question {currentQuestionIndex + 1} of {questions.length}
                            </h3>
                            <Badge variant="outline" className="text-sm">
                              {questions.filter((q) => q.answered).length} answered
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Card className="bg-muted/50">
                            <CardContent className="p-4">
                              <p className="text-lg leading-relaxed">{questions[currentQuestionIndex]?.text}</p>
                            </CardContent>
                          </Card>

                          <div className="flex items-center justify-center gap-4">
                            {isReadingQuestion && (
                              <Badge variant="default" className="text-lg px-4 py-2 animate-pulse">
                                <Volume2 className="w-4 h-4 mr-2" />
                                Reading Question...
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-3 justify-center">
                            <Button
                              onClick={() => readQuestion(questions[currentQuestionIndex]?.text)}
                              disabled={isReadingQuestion}
                              className="flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Repeat Question
                            </Button>

                            <Button
                              onClick={handleNextQuestion}
                              disabled={currentQuestionIndex >= questions.length - 1}
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <SkipForward className="w-4 h-4" />
                              Next Question
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {questions[currentQuestionIndex]?.userAnswer && (
                        <Card className="bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800">
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                              <h4 className="font-semibold text-green-800 dark:text-green-200">
                                Your Recorded Answer:
                              </h4>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="bg-white dark:bg-green-950/40 p-3 rounded-lg border border-green-200 dark:border-green-700">
                              <p className="text-lg text-green-900 dark:text-green-100 leading-relaxed">
                                {questions[currentQuestionIndex].userAnswer}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Voice Input Column */}
                    <div className="space-y-4">
                      <Card className="border-2 border-blue-200 dark:border-blue-800">
                        <CardHeader>
                          <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200">Voice Input</h3>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="text-center space-y-4">
                            <Button
                              onClick={
                                isListeningForAnswer
                                  ? () => {
                                      setIsListeningForAnswer(false)
                                      setIsWaitingForAnswer(false)
                                      if (restartTimeoutRef.current) {
                                        clearTimeout(restartTimeoutRef.current)
                                      }
                                      if (answerRecognitionRef.current) {
                                        try {
                                          answerRecognitionRef.current.stop()
                                        } catch (error) {
                                          console.log("Recognition stop failed:", error)
                                        }
                                      }
                                    }
                                  : () => {
                                      setIsWaitingForAnswer(true)
                                      setIsListeningForAnswer(true)
                                      setCurrentAnswer("")
                                      setRealtimeInput("")
                                      setTimeout(() => {
                                        if (answerRecognitionRef.current) {
                                          try {
                                            answerRecognitionRef.current.start()
                                          } catch (error) {
                                            console.error("Failed to start answer recognition:", error)
                                            setIsListeningForAnswer(false)
                                          }
                                        }
                                      }, 500)
                                    }
                              }
                              size="lg"
                              className={`w-20 h-20 rounded-full text-lg font-semibold transition-all duration-300 ${
                                isListeningForAnswer
                                  ? "bg-destructive hover:bg-destructive/90 animate-pulse"
                                  : "bg-blue-600 hover:bg-blue-700"
                              }`}
                              aria-label={isListeningForAnswer ? "Stop listening" : "Start listening for answer"}
                            >
                              {isListeningForAnswer ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                            </Button>

                            <Badge
                              variant={isListeningForAnswer ? "destructive" : "secondary"}
                              className="text-lg px-4 py-2"
                            >
                              {isListeningForAnswer ? "Listening..." : "Click to Record Answer"}
                            </Badge>
                          </div>

                          <div className="min-h-[200px] space-y-3">
                            {(realtimeInput || currentAnswer) && (
                              <Card className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Mic className="w-5 h-5 text-blue-600 animate-pulse" />
                                    <h4 className="font-semibold text-blue-800 dark:text-blue-200">Speaking Now:</h4>
                                  </div>
                                  <div className="bg-white dark:bg-blue-950/40 p-3 rounded-lg border border-blue-200 dark:border-blue-700 min-h-[60px]">
                                    <p className="text-lg italic text-blue-700 dark:text-blue-300 font-medium">
                                      "{realtimeInput || currentAnswer}"
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {allVoiceInput && (
                              <Card className="bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800">
                                <CardHeader>
                                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                                    All Voice Input Content:
                                  </h4>
                                </CardHeader>
                                <CardContent>
                                  <div className="bg-white dark:bg-green-950/40 p-3 rounded-lg border border-green-200 dark:border-green-700 max-h-[200px] overflow-y-auto">
                                    <p className="text-sm text-green-900 dark:text-green-100 leading-relaxed whitespace-pre-wrap">
                                      {allVoiceInput}
                                    </p>
                                  </div>
                                  <div className="mt-3 text-xs text-green-700 dark:text-green-300">
                                    Total words: {allVoiceInput.split(/\s+/).filter((word) => word.length > 0).length}
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {isListeningForAnswer && (
                              <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-800">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                                      Listening for Your Answer
                                    </h4>
                                  </div>
                                  <p className="text-yellow-700 dark:text-yellow-300">
                                    Speak clearly. Say "next question" when ready to continue.
                                  </p>
                                </CardContent>
                              </Card>
                            )}

                            {!isListeningForAnswer && !currentAnswer && !allVoiceInput && (
                              <Card className="bg-muted/30">
                                <CardContent className="p-4">
                                  <div className="text-center text-muted-foreground">
                                    <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-lg">
                                      Click the microphone button above to start recording your answer
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </div>

                          {/* Voice Input Instructions */}
                          <Card className="bg-muted/20">
                            <CardContent className="p-3">
                              <h5 className="font-semibold text-sm mb-2">Voice Commands:</h5>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• Click microphone to start/stop recording</li>
                                <li>• Say "next question" to advance</li>
                                <li>• Speak clearly for best recognition</li>
                                <li>• Your answer will be saved automatically</li>
                              </ul>
                            </CardContent>
                          </Card>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <h3 className="text-xl font-semibold">Download Options</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Button
                          onClick={downloadAnswers}
                          disabled={questions.length === 0}
                          className="flex items-center gap-2 text-lg px-6 py-3"
                        >
                          <Download className="w-5 h-5" />
                          Download Answers
                        </Button>

                        <Button
                          onClick={downloadAnswersAsWord}
                          disabled={questions.length === 0}
                          variant="outline"
                          className="flex items-center gap-2 text-lg px-6 py-3 bg-transparent"
                        >
                          <Save className="w-5 h-5" />
                          Save as Word
                        </Button>

                        <Button
                          onClick={downloadQuestionsOnly}
                          disabled={questions.length === 0}
                          variant="outline"
                          className="flex items-center gap-2 text-lg px-6 py-3 bg-transparent"
                        >
                          <FileText className="w-5 h-5" />
                          Questions Only
                        </Button>

                        <Button
                          onClick={downloadAllVoiceInput}
                          disabled={!allVoiceInput}
                          className="flex items-center gap-2 text-lg px-6 py-3 bg-blue-600 hover:bg-blue-700"
                        >
                          <Download className="w-5 h-5" />
                          Voice Input Text
                        </Button>

                        <Button
                          onClick={downloadVoiceInputAsWord}
                          disabled={!allVoiceInput}
                          variant="outline"
                          className="flex items-center gap-2 text-lg px-6 py-3 bg-transparent"
                        >
                          <Save className="w-5 h-5" />
                          Voice Input Word
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex flex-wrap gap-4 justify-center">
                    <Button
                      onClick={restartQuestions}
                      variant="outline"
                      className="flex items-center gap-2 text-lg px-6 py-3 bg-transparent"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Restart
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
