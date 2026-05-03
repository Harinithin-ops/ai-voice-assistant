"use client"

import { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface SpeechRecognitionManagerProps {
  onTranscript: (transcript: string, confidence: number, method: "web-api" | "gemini-api") => void
  onError: (error: string) => void
  isListening: boolean
  useGemini: boolean
  onConfirmationNeeded?: (transcript: string, confidence: number) => void
}

export function SpeechRecognitionManager({
  onTranscript,
  onError,
  isListening,
  useGemini,
  onConfirmationNeeded,
}: SpeechRecognitionManagerProps) {
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [lastRestartTime, setLastRestartTime] = useState(0)
  const [networkRetryCount, setNetworkRetryCount] = useState(0)
  const [browserCompatibility, setBrowserCompatibility] = useState<{
    hasWebSpeech: boolean
    hasMediaRecorder: boolean
    browserName: string
    isRecommended: boolean
  }>({ hasWebSpeech: false, hasMediaRecorder: false, browserName: "Unknown", isRecommended: false })
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const networkRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    let browserName = "Unknown"
    let isRecommended = false

    if (userAgent.includes("chrome") && !userAgent.includes("edg") && !userAgent.includes("brave")) {
      browserName = "Chrome"
      isRecommended = true
    } else if (userAgent.includes("edg")) {
      browserName = "Edge"
      isRecommended = false // Due to known network issues
    } else if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
      browserName = "Safari"
      isRecommended = true
    } else if (userAgent.includes("firefox")) {
      browserName = "Firefox"
      isRecommended = false // Speech recognition disabled by default
    } else if (userAgent.includes("brave")) {
      browserName = "Brave"
      isRecommended = false // No Web Speech API support
    }

    return { browserName, isRecommended }
  }

  useEffect(() => {
    const hasWebSpeech = "webkitSpeechRecognition" in window || "SpeechRecognition" in window
    const hasMediaRecorder = "MediaRecorder" in window && MediaRecorder.isTypeSupported("audio/webm")
    const { browserName, isRecommended } = detectBrowser()

    const compatibility = {
      hasWebSpeech,
      hasMediaRecorder,
      browserName,
      isRecommended,
    }

    setBrowserCompatibility(compatibility)
    setIsSupported(hasWebSpeech || hasMediaRecorder)

    if (!isRecommended && hasWebSpeech) {
      console.warn(`[v0] Browser ${browserName} may have speech recognition issues. Chrome or Safari recommended.`)
    }

    if (hasWebSpeech && !recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()

      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"
      recognitionRef.current.maxAlternatives = 5
      
      // Enhanced recognition settings for better accuracy
      if ('audioCapture' in recognitionRef.current) {
        recognitionRef.current.audioCapture = true
      }
      if ('noiseReduction' in recognitionRef.current) {
        recognitionRef.current.noiseReduction = true
      }
      if ('echoCancellation' in recognitionRef.current) {
        recognitionRef.current.echoCancellation = true
      }

      if ("serviceURI" in recognitionRef.current) {
        // Use Google's speech service explicitly for better reliability
        recognitionRef.current.serviceURI = "wss://www.google.com/speech-api/v2/recognize"
      }

      // Grammar hints removed to allow free-form commands like app names
      if ("grammars" in recognitionRef.current) {
        // We leave grammars empty to not constrain the recognizer
      }

      let speechTimeout: NodeJS.Timeout | null = null
      let lastInterimTranscript = ""
      let lastInterimTime = 0

      recognitionRef.current.onresult = (event: any) => {
        setNetworkRetryCount(0)

        let finalTranscript = ""
        let interimTranscript = ""
        let maxConfidence = 0
        const alternatives: string[] = []

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
            maxConfidence = Math.max(maxConfidence, result[0].confidence || 0.8)

            // Collect alternatives for low confidence results
            for (let j = 0; j < Math.min(result.length, 3); j++) {
              alternatives.push(result[j].transcript)
            }
          } else {
            interimTranscript += result[0].transcript
          }
        }

        if (finalTranscript) {
          const cleanTranscript = finalTranscript.trim()
          console.log("[v0] Speech recognized:", cleanTranscript, "Confidence:", maxConfidence)

          const CONFIDENCE_THRESHOLD = 0.5
          const MIN_CONFIDENCE_THRESHOLD = 0.3

          if (maxConfidence >= CONFIDENCE_THRESHOLD) {
            onTranscript(cleanTranscript, maxConfidence, "web-api")
          } else if (maxConfidence >= MIN_CONFIDENCE_THRESHOLD) {
            if (isLogicalCommand(cleanTranscript)) {
              onTranscript(cleanTranscript, maxConfidence, "web-api")
            } else if (onConfirmationNeeded) {
              console.log("[v0] Low confidence result, requesting confirmation:", cleanTranscript)
              onConfirmationNeeded(cleanTranscript, maxConfidence)
            } else {
              onTranscript(cleanTranscript, maxConfidence, "web-api")
            }
          } else {
            // Try processing very low confidence if it matches common patterns
            if (isCommonCommand(cleanTranscript)) {
              console.log("[v0] Processing common command despite low confidence:", cleanTranscript)
              onTranscript(cleanTranscript, maxConfidence, "web-api")
            } else {
              console.warn("[v0] Very low confidence, keeping mic active. Ignoring result:", cleanTranscript, maxConfidence)
              // soft-hint only; do not propagate as error to avoid stopping UI listening state
            }
          }

          if (speechTimeout) {
            clearTimeout(speechTimeout)
            speechTimeout = null
          }
        } else if (interimTranscript) {
          lastInterimTranscript = interimTranscript
          lastInterimTime = Date.now()

          if (speechTimeout) {
            clearTimeout(speechTimeout)
          }

          speechTimeout = setTimeout(() => {
            if (lastInterimTranscript && Date.now() - lastInterimTime >= 2000) {
              const cleanTranscript = lastInterimTranscript.trim()
              console.log("[v0] Processing interim result after timeout:", cleanTranscript)

              if (isLogicalCommand(cleanTranscript) || isCommonCommand(cleanTranscript)) {
                onTranscript(cleanTranscript, 0.65, "web-api")
              } else {
                console.warn("[v0] Interim low-confidence not logical/common; continuing to listen.")
                // soft-hint only; do not propagate as error
              }
              lastInterimTranscript = ""
            }
          }, 2000)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.log("[v0] Speech recognition error:", event.error)

        if (speechTimeout) {
          clearTimeout(speechTimeout)
          speechTimeout = null
        }

        if (event.error === "no-speech") {
          console.log("[v0] No speech detected, this is normal behavior")
          setIsActive(false)
          setIsStarting(false)
          return
        }

        if (event.error === "network") {
          console.error("[v0] Network error in speech recognition")
          setNetworkRetryCount((prev) => prev + 1)

          if (networkRetryCount < 3) {
            console.log(`[v0] Retrying speech recognition (attempt ${networkRetryCount + 1}/3)`)
            setIsActive(false)
            setIsStarting(false)

            const retryDelay = Math.min(1000 * Math.pow(2, networkRetryCount), 5000)

            networkRetryTimeoutRef.current = setTimeout(() => {
              if (isListening) {
                console.log("[v0] Retrying speech recognition after network error")
                try {
                  setIsStarting(true)
                  recognitionRef.current.start()
                } catch (retryError) {
                  console.error("[v0] Retry failed:", retryError)
                  handleFallbackToMediaRecorder()
                }
              }
            }, retryDelay)
            return
          } else {
            const errorMessage = compatibility.isRecommended
              ? "Network connection issue. Please check your internet connection and try again."
              : `Speech recognition network error in ${compatibility.browserName}. Try using Chrome or Safari for better reliability.`

            console.error("[v0] Max network retries reached, suggesting fallback")
            onError(errorMessage)
            handleFallbackToMediaRecorder()
            return
          }
        }

        console.error("[v0] Actual speech recognition error:", event.error)
        setIsActive(false)
        setIsStarting(false)

        let errorMessage = `Speech recognition error: ${event.error}`

        if (event.error === "not-allowed") {
          errorMessage = "Microphone access denied. Please allow microphone permissions and try again."
        } else if (event.error === "service-not-allowed") {
          errorMessage = "Speech recognition service not available. Please try again later."
        } else if (event.error === "bad-grammar") {
          errorMessage = "Speech recognition configuration error. Please refresh the page."
        }

        onError(errorMessage)
      }

      recognitionRef.current.onstart = () => {
        console.log("[v0] Speech recognition started")
        setIsActive(true)
        setIsStarting(false)
        setLastRestartTime(Date.now())
        if (networkRetryTimeoutRef.current) {
          clearTimeout(networkRetryTimeoutRef.current)
          networkRetryTimeoutRef.current = null
        }
      }

      recognitionRef.current.onend = () => {
        console.log("[v0] Speech recognition ended")
        setIsActive(false)
        setIsStarting(false)

        if (speechTimeout) {
          clearTimeout(speechTimeout)
          speechTimeout = null
        }

        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current)
          restartTimeoutRef.current = null
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (error) {
          console.log("[v0] Recognition already stopped")
        }
        setIsActive(false)
        setIsStarting(false)
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
        restartTimeoutRef.current = null
      }
      if (networkRetryTimeoutRef.current) {
        clearTimeout(networkRetryTimeoutRef.current)
        networkRetryTimeoutRef.current = null
      }
    }
  }, []) // Empty dependency array to prevent recreation

  const handleFallbackToMediaRecorder = async () => {
    if (!browserCompatibility.hasMediaRecorder) {
      onError("Speech recognition not supported in this browser. Please use Chrome or Safari.")
      return
    }

    try {
      console.log("[v0] Attempting fallback to MediaRecorder")
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 48000 },
          sampleSize: { ideal: 16 },
        } as MediaTrackConstraints,
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      })

      mediaRecorderRef.current = mediaRecorder

      const audioChunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
        // Here you would typically send the audio to a speech recognition service
        // For now, we'll show a message that this fallback is available
        onError("Fallback recording completed. External speech recognition service needed.")
        stream.getTracks().forEach((track) => track.stop())
      }

      if (isListening) {
        mediaRecorder.start()
        console.log("[v0] MediaRecorder fallback started")
      }
    } catch (error) {
      console.error("[v0] MediaRecorder fallback failed:", error)
      onError("Unable to access microphone. Please check permissions.")
    }
  }

  useEffect(() => {
    if (!isSupported || !recognitionRef.current) return

    const MIN_RESTART_DELAY = 2000
    const timeSinceLastRestart = Date.now() - lastRestartTime

    if (isListening && !isActive && !isStarting) {
      if (timeSinceLastRestart < MIN_RESTART_DELAY) {
        const remainingDelay = MIN_RESTART_DELAY - timeSinceLastRestart
        console.log(`[v0] Delaying restart by ${remainingDelay}ms to prevent loops`)

        restartTimeoutRef.current = setTimeout(() => {
          if (isListening && !isActive && !isStarting) {
            try {
              console.log("[v0] Starting speech recognition (delayed)")
              setIsStarting(true)
              recognitionRef.current.start()
            } catch (error: any) {
              console.error("[v0] Error starting recognition:", error)
              setIsStarting(false)
              if (error.message && error.message.includes("already started")) {
                console.log("[v0] Recognition already active, setting state accordingly")
                setIsActive(true)
              } else {
                handleFallbackToMediaRecorder()
              }
            }
          }
        }, remainingDelay)
        return
      }

      try {
        console.log("[v0] Starting speech recognition")
        setIsStarting(true)
        recognitionRef.current.start()
      } catch (error: any) {
        console.error("[v0] Error starting recognition:", error)
        setIsStarting(false)
        if (error.message && error.message.includes("already started")) {
          console.log("[v0] Recognition already active, setting state accordingly")
          setIsActive(true)
        } else {
          handleFallbackToMediaRecorder()
        }
      }
    } else if (!isListening && (isActive || isStarting)) {
      try {
        console.log("[v0] Stopping speech recognition")
        recognitionRef.current.stop()
        setIsStarting(false)
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current)
          restartTimeoutRef.current = null
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop()
        }
      } catch (error) {
        console.error("[v0] Error stopping recognition:", error)
        setIsActive(false)
        setIsStarting(false)
      }
    }
  }, [isListening, isSupported, isActive, isStarting, onError, lastRestartTime])

  const isCommonCommand = (transcript: string): boolean => {
    const lowerTranscript = transcript.toLowerCase().trim()
    
    const commonCommands = [
      'open notepad', 'notepad', 'open calculator', 'calculator',
      'open chrome', 'chrome', 'google chrome', 'browser',
      'open maps', 'maps', 'google maps', 'open youtube', 'youtube',
      'open facebook', 'facebook', 'open instagram', 'instagram',
      'open whatsapp', 'whatsapp', 'open spotify', 'spotify',
      'what time', 'time', 'current time',
      'weather', 'what weather', 'weather today',
      'hello', 'hi', 'help', 'thanks', 'thank you',
      'search', 'google', 'find'
    ]
    
    return commonCommands.some(cmd => 
      lowerTranscript === cmd || 
      lowerTranscript.startsWith(cmd + ' ') ||
      lowerTranscript.endsWith(' ' + cmd)
    )
  }

  const isLogicalCommand = (transcript: string): boolean => {
    const lowerTranscript = transcript.toLowerCase()

    const logicalPatterns = [
      /^(open|launch|start)\s+\w+/,
      /^(search|google|find)\s+.+/,
      /^(what|who|when|where|why|how)\s+.+/,
      /^(tell me|show me)\s+.+/,
      /^(play|stop|pause|resume)/,
      /^(weather|time|date|news)/,
      /^(help|hello|hi|thanks|thank you)/,
      /^(calculator|notepad|browser|maps|settings)/,
      /^\w+\s+(recipe|information|details)/,
      /^(close|exit|quit)\s+\w+/,
      /^(volume|brightness)\s+(up|down|mute)/,
      /^(take|capture)\s+(screenshot|photo)/
    ]

    const matchesPattern = logicalPatterns.some((pattern) => pattern.test(lowerTranscript))

    const nonsensicalPhrases = [
      /^\s*$/, // Empty or whitespace only
      /^[a-z]\s[a-z]\s[a-z]$/, // Single letters
      /random.*words.*together/i,
      /\b\w{1,2}\b.*\b\w{1,2}\b.*\b\w{1,2}\b/,
    ]

    const isNonsensical = nonsensicalPhrases.some((pattern) => pattern.test(transcript))

    return (matchesPattern || isCommonCommand(transcript)) && !isNonsensical && transcript.length > 1
  }

  return null
}
