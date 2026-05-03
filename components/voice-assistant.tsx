"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, FileText, Home, Mic, MicOff, Settings, Sparkles, Square, Play, Check, X, Phone, Video, Camera, Image as ImageIcon } from "lucide-react"
import { VoiceVisualizer } from "@/components/voice-visualizer"
import { CommandHistory } from "@/components/command-history"
import { SpeechRecognitionManager } from "@/components/speech-recognition-manager"
import { TextToSpeechManager, useTextToSpeech } from "@/components/text-to-speech-manager"
import AIFeaturesPanel from "@/components/ai-features-panel"
import AccessibilityPanel from "@/components/accessibility-panel"
import { UserProfileDropdown } from "@/components/user-profile-dropdown"

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

interface VoiceAssistantProps {
  onBackToLanding: () => void
}

export default function VoiceAssistant({ onBackToLanding }: VoiceAssistantProps) {
  const [showAIFeatures, setShowAIFeatures] = useState(false)
  const [showAccessibility, setShowAccessibility] = useState(false)
  const [showTTSSettings, setShowTTSSettings] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [commands, setCommands] = useState<Command[]>([])
  const [audioLevel, setAudioLevel] = useState(0)
  const [useGeminiAPI, setUseGeminiAPI] = useState(false)
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true)
  const [isScreenOff, setIsScreenOff] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    transcript: string
    confidence: number
  } | null>(null)
  const resumeAfterTTSRef = useRef(false)

  const {
    speak,
    stop,
    isSpeaking,
    settings: ttsSettings,
    setSettings: setTTSSettings,
  } = useTextToSpeech({
    enabled: true,
    autoSpeak: true,
  })

  const processCommand = async (transcript: string, confidence: number, method: "web-api" | "gemini-api") => {
    const commandId = Date.now().toString()
    const newCommand: Command = {
      id: commandId,
      text: transcript,
      response: "",
      timestamp: new Date(),
      status: "processing",
      recognitionMethod: method,
      confidence: confidence,
    }

    setCommands((prev) => [newCommand, ...prev])

    try {
      const response = await fetch("/api/process-command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command: transcript }),
      })

      const data = await response.json()

      // Handle website opening actions
      if (data.action && data.action.type === "open_url") {
        console.log("[v0] Opening URL:", data.action.url)
        window.open(data.action.url, "_blank", "noopener,noreferrer")
      }
      
      // Handle screen power actions (especially for mobile simulation)
      if (data.action && data.action.type === "screen_power") {
        if (data.action.direction === "off") {
          setIsScreenOff(true)
        } else {
          setIsScreenOff(false)
        }
      }

      const updatedCommand: Command = {
        ...newCommand,
        response: data.response,
        status: "success",
        searchResults: data.action?.searchResults,
        searchQuery: data.searchQuery,
      }

      setCommands((prev) => prev.map((cmd) => (cmd.id === commandId ? updatedCommand : cmd)))

      if (data.response && ttsSettings.enabled && ttsSettings.autoSpeak) {
        console.log("[v0] Speaking response:", data.response)
        speak(data.response)
      }
    } catch (error) {
      console.error("[v0] Command processing error:", error)
      const errorMessage = "Sorry, I encountered an error processing your command."
      setCommands((prev) =>
        prev.map((cmd) => (cmd.id === commandId ? { ...cmd, response: errorMessage, status: "error" } : cmd)),
      )

      if (ttsSettings.enabled && ttsSettings.autoSpeak) {
        speak(errorMessage)
      }
    }
  }

  const handleTranscript = (transcript: string, confidence: number, method: "web-api" | "gemini-api") => {
    setCurrentTranscript("")
    processCommand(transcript, confidence, method)
  }

  const handleConfirmationNeeded = (transcript: string, confidence: number) => {
    // Skip confirmation dialog and process command directly
    processCommand(transcript, confidence, "web-api")
  }

  const confirmCommand = () => {
    if (pendingConfirmation) {
      processCommand(pendingConfirmation.transcript, pendingConfirmation.confidence, "web-api")
      setPendingConfirmation(null)
    }
  }

  const rejectCommand = () => {
    setPendingConfirmation(null)
    if (ttsSettings.enabled) {
      speak("Please try speaking your command again.")
    }
  }

  const handleError = (error: string) => {
    console.error("[v0] Speech recognition error:", error)
    const errLower = error.toLowerCase()
    const isSoftHint =
      errLower.includes("i didn't catch that clearly") ||
      errLower.includes("fallback recording completed") ||
      errLower.includes("no speech") ||
      errLower.includes("retrying speech recognition")

    // Do NOT stop listening for soft, non-fatal hints
    if (!isSoftHint) {
      setIsListening(false)
    }
    setPendingConfirmation(null)
  }

  const toggleListening = () => {
    setIsListening(!isListening)
    if (pendingConfirmation) {
      setPendingConfirmation(null)
    }
  }

  // Wake Word Detector
  useEffect(() => {
    if (!wakeWordEnabled || isListening || isSpeaking) return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const wakeWordRecognition = new SpeechRecognition()
    wakeWordRecognition.continuous = true
    wakeWordRecognition.interimResults = true
    wakeWordRecognition.lang = "en-US"

    let isStopped = false

    wakeWordRecognition.onresult = (event: any) => {
      if (isStopped) return
      let transcript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      
      const lowerTranscript = transcript.toLowerCase()
      if (
        lowerTranscript.includes("hey assistant") || 
        lowerTranscript.includes("hi assistant") || 
        lowerTranscript.includes("hello assistant") ||
        lowerTranscript.includes("ok assistant") ||
        lowerTranscript.includes("okay assistant")
      ) {
        console.log("[v0] Wake word detected!")
        isStopped = true
        wakeWordRecognition.stop()
        
        setIsScreenOff(false) // Wake up screen if it was off
        setIsListening(true)
        if (ttsSettings.enabled && ttsSettings.autoSpeak) {
           speak("Yes?")
        }
      }
    }

    wakeWordRecognition.onerror = (event: any) => {
      // Ignore background errors, but restart if it's a typical timeout
      if (event.error === "no-speech" || event.error === "network") {
         // It will auto-restart via onend
      }
    }

    wakeWordRecognition.onend = () => {
      if (!isStopped && !isListening && !isSpeaking && wakeWordEnabled) {
        try {
          wakeWordRecognition.start()
        } catch (e) {}
      }
    }

    try {
      wakeWordRecognition.start()
    } catch (e) {
      console.error("[v0] Wake word recognition start error", e)
    }

    return () => {
      isStopped = true
      try {
        wakeWordRecognition.stop()
      } catch (e) {}
    }
  }, [isListening, isSpeaking, wakeWordEnabled, ttsSettings.enabled, ttsSettings.autoSpeak, speak])

  // Pause mic while TTS is speaking to avoid feedback; resume if it was previously on
  useEffect(() => {
    if (isSpeaking) {
      if (isListening) {
        resumeAfterTTSRef.current = true
        setIsListening(false)
      }
    } else {
      if (resumeAfterTTSRef.current) {
        // small delay to avoid capturing the tail end of audio playback
        const t = setTimeout(() => {
          resumeAfterTTSRef.current = false
          setIsListening(true)
        }, 250)
        return () => clearTimeout(t)
      }
    }
  }, [isSpeaking])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isListening) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.8 + 0.2)
      }, 100)
    } else {
      setAudioLevel(0)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isListening])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      {isScreenOff && (
        <div 
          className="fixed inset-0 bg-black z-[99999] flex items-center justify-center cursor-pointer"
          onClick={() => setIsScreenOff(false)}
        >
          <div className="text-gray-900 text-xs opacity-50">Tap anywhere or say "turn on screen" to wake</div>
        </div>
      )}

      <SpeechRecognitionManager
        onTranscript={handleTranscript}
        onError={handleError}
        isListening={isListening}
        useGemini={useGeminiAPI}
        onConfirmationNeeded={handleConfirmationNeeded}
      />

      <div className="sticky top-0 z-50 glass-effect border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToLanding}
                className="p-2 hover:bg-white/10 rounded-full text-gray-300 hover:text-white"
                aria-label="Back to home"
              >
                <Home className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-green-400" />
                <h1 className="text-xl font-bold text-white">VoiceAI</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UserProfileDropdown />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl pb-24 md:pb-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            AI Voice Assistant
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Experience the future of voice interaction. Speak naturally and let our advanced AI understand and respond
            to your commands.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8 sm:mb-12">
          <Button
            variant="outline"
            onClick={() => setShowAIFeatures(!showAIFeatures)}
            className="flex items-center gap-2 glass-effect border-blue-500/30 text-blue-300 hover:bg-blue-500/10 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
          >
            <Brain className="w-4 h-4" />
            AI Features
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAccessibility(!showAccessibility)}
            className="flex items-center gap-2 glass-effect border-green-500/30 text-green-300 hover:bg-green-500/10 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300"
            aria-label="Open accessibility features for visually impaired users"
          >
            <FileText className="w-4 h-4" />
            Accessibility
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowTTSSettings(!showTTSSettings)}
            className="flex items-center gap-2 glass-effect border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
          >
            <Settings className="w-4 h-4" />
            Voice Settings
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="glass-effect border-gray-700/50 shadow-xl hover:shadow-green-500/10 transition-all duration-300">
              <CardContent className="p-8">
                <div className="text-center space-y-8">
                  <VoiceVisualizer isActive={isListening} audioLevel={audioLevel} />


                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center relative py-2">
                      {/* Unified Control Dock */}
                      <div className="flex items-center justify-center gap-4 sm:gap-8 glass-effect px-6 py-4 rounded-[3rem] border border-gray-700/50 shadow-2xl bg-gray-900/60 backdrop-blur-xl">
                        
                        {/* Play/Stop Toggle */}
                        <div className="w-14 h-14 flex items-center justify-center">
                          {!isSpeaking && commands.length > 0 && commands[0].response ? (
                            <Button
                              onClick={() => speak(commands[0].response)}
                              size="icon"
                              variant="ghost"
                              className="w-12 h-12 rounded-full text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 transition-all duration-300 ring-1 ring-emerald-500/30"
                              title="Play last response"
                            >
                              <Play className="w-6 h-6 ml-1 fill-current" />
                            </Button>
                          ) : isSpeaking ? (
                            <Button
                              onClick={stop}
                              size="icon"
                              variant="ghost"
                              className="w-12 h-12 rounded-full text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 transition-all duration-300 animate-pulse ring-1 ring-orange-500/30"
                              title="Stop speaking"
                            >
                              <Square className="w-5 h-5 fill-current" />
                            </Button>
                          ) : (
                            <div className="w-12 h-12 rounded-full opacity-30 flex items-center justify-center text-gray-500 ring-1 ring-gray-700">
                              <Play className="w-6 h-6 ml-1" />
                            </div>
                          )}
                        </div>

                        {/* Main Microphone Button */}
                        <div className="relative">
                          {/* Outer glow rings when listening */}
                          {isListening && (
                            <>
                              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: '3s' }}></div>
                              <div className="absolute inset-[-10px] rounded-full border border-red-500/30 animate-pulse" style={{ animationDuration: '2s' }}></div>
                            </>
                          )}
                          <Button
                            onClick={toggleListening}
                            size="lg"
                            className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full text-lg font-semibold transition-all duration-500 shadow-xl border-4 z-10 ${
                              isListening
                                ? "bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 border-red-400/40 shadow-red-500/50 scale-105"
                                : "bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-green-400/30 shadow-green-500/40 hover:scale-105 hover:shadow-green-500/60"
                            }`}
                          >
                            {isListening ? (
                              <MicOff className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" />
                            ) : (
                              <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" />
                            )}
                          </Button>
                        </div>

                        {/* Clear History Placeholder (Symmetry) */}
                        <div className="w-14 h-14 flex items-center justify-center">
                           <Button
                             onClick={() => setCommands([])}
                             size="icon"
                             variant="ghost"
                             className={`w-12 h-12 rounded-full transition-all duration-300 ring-1 ${commands.length > 0 ? "text-gray-400 hover:text-red-400 hover:bg-red-500/20 ring-gray-600 hover:ring-red-500/40" : "text-gray-700 ring-gray-800 cursor-not-allowed"}`}
                             title="Clear conversation"
                             disabled={commands.length === 0}
                           >
                             <X className="w-6 h-6" />
                           </Button>
                        </div>

                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xl font-semibold text-white">
                        {isListening
                          ? "I'm listening..."
                          : "Ready to assist you"}
                      </p>
                      <p className="text-gray-300">
                        {isSpeaking
                          ? "Speaking response - click stop to interrupt"
                          : isListening
                            ? "Speak your command now"
                            : commands.length > 0 && commands[0].response
                              ? "Click play to hear the last response or microphone for new command"
                              : "Click the microphone to start"}
                      </p>
                      
                      {!isListening && wakeWordEnabled && !isSpeaking && (
                        <div className="inline-block px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium animate-pulse">
                          Say "Hey Assistant" to wake me up
                        </div>
                      )}

                      {currentTranscript && (
                        <div className="glass-effect rounded-lg p-4 max-w-md mx-auto border border-green-500/20">
                          <p className="text-sm text-gray-400 mb-1">You're saying:</p>
                          <p className="text-white italic">"{currentTranscript}"</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <label className="flex items-center gap-3 cursor-pointer glass-effect rounded-full px-4 py-2 hover:bg-white/5 transition-colors border border-gray-700/50">
                        <input
                          type="checkbox"
                          checked={useGeminiAPI}
                          onChange={(e) => setUseGeminiAPI(e.target.checked)}
                          className="rounded accent-green-500"
                        />
                        <span className="text-sm font-medium text-gray-300">Enhanced AI Recognition</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer glass-effect rounded-full px-4 py-2 hover:bg-white/5 transition-colors border border-gray-700/50">
                        <input
                          type="checkbox"
                          checked={wakeWordEnabled}
                          onChange={(e) => setWakeWordEnabled(e.target.checked)}
                          className="rounded accent-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-300">Wake Word</span>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="glass-effect border-gray-700/50 shadow-xl h-fit">
              <CardContent className="p-6">
                <CommandHistory commands={commands} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950/90 backdrop-blur-lg border-t border-gray-800/50 md:hidden z-50 px-2 py-3 flex justify-between items-center shadow-2xl shadow-green-500/10">
        <Button
          variant="ghost"
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-green-400 hover:bg-green-500/10 h-auto py-2 flex-1"
          onClick={() => {
            if (ttsSettings.enabled) speak("Opening phone dialer.")
            window.location.href = "tel:"
          }}
        >
          <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[10px] sm:text-xs font-medium">Call</span>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 h-auto py-2 flex-1"
          onClick={async () => {
            if (ttsSettings.enabled) speak("Requesting video permission.")
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
              stream.getTracks().forEach(track => track.stop()) // Stop immediately, just wanted permission
              alert("Video and audio permissions granted!")
            } catch (err) {
              alert("Permission denied or device unavailable.")
            }
          }}
        >
          <Video className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[10px] sm:text-xs font-medium">Video</span>
        </Button>
        
        {/* Central Mic Button for Mobile */}
        <div className="relative -top-6 flex-1 flex justify-center">
          <Button
            onClick={toggleListening}
            size="lg"
            className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-300 shadow-xl border-4 border-gray-950 ${
              isListening
                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse shadow-red-500/40"
                : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/40 animate-glow"
            }`}
          >
            {isListening ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </Button>
        </div>

        <Button
          variant="ghost"
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 h-auto py-2 flex-1"
          onClick={() => {
            if (ttsSettings.enabled) speak("Opening camera.")
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*,video/*'
            input.capture = 'environment'
            input.click()
          }}
        >
          <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[10px] sm:text-xs font-medium">Camera</span>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 h-auto py-2 flex-1"
          onClick={() => {
            if (ttsSettings.enabled) speak("Opening image gallery.")
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.click()
          }}
        >
          <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[10px] sm:text-xs font-medium">Image</span>
        </Button>
      </div>

      <AIFeaturesPanel isVisible={showAIFeatures} onToggle={() => setShowAIFeatures(!showAIFeatures)} />
      <AccessibilityPanel isVisible={showAccessibility} onToggle={() => setShowAccessibility(!showAccessibility)} />
      <TextToSpeechManager
        isVisible={showTTSSettings}
        onToggle={() => setShowTTSSettings(!showTTSSettings)}
        initialSettings={ttsSettings}
        onSettingsChange={setTTSSettings}
      />
    </div>
  )
}
