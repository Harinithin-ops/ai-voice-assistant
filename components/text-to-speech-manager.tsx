"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Volume2, Play, Pause, SkipForward } from "lucide-react"

interface TTSSettings {
  voice: string
  rate: number
  pitch: number
  volume: number
  enabled: boolean
  autoSpeak: boolean
}

interface TTSManagerProps {
  onSettingsChange?: (settings: TTSSettings) => void
  initialSettings?: Partial<TTSSettings>
  isVisible?: boolean
  onToggle?: () => void
}

export function TextToSpeechManager({ onSettingsChange, initialSettings, isVisible, onToggle }: TTSManagerProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null)
  const [settings, setSettings] = useState<TTSSettings>({
    voice: "",
    rate: 0.9,
    pitch: 1.0,
    volume: 0.8,
    enabled: true,
    autoSpeak: true,
    ...initialSettings,
  })

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    // Check for speech synthesis support
    if ("speechSynthesis" in window) {
      setIsSupported(true)

      // Load voices
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices()
        setVoices(availableVoices)

        // Set default voice if none selected
        if (!settings.voice && availableVoices.length > 0) {
          const defaultVoice = availableVoices.find((voice) => voice.default) || availableVoices[0]
          updateSettings({ voice: defaultVoice.name })
        }
      }

      // Load voices immediately and on voiceschanged event
      loadVoices()
      speechSynthesis.onvoiceschanged = loadVoices

      // Monitor speech synthesis state
      const checkSpeakingState = () => {
        setIsSpeaking(speechSynthesis.speaking)
        setIsPaused(speechSynthesis.paused)

        if (speechSynthesis.speaking || speechSynthesis.paused) {
          requestAnimationFrame(checkSpeakingState)
        }
      }

      const interval = setInterval(checkSpeakingState, 100)

      return () => {
        clearInterval(interval)
        speechSynthesis.cancel()
      }
    }
  }, [])

  const updateSettings = (newSettings: Partial<TTSSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    onSettingsChange?.(updatedSettings)
  }

  const speak = (text: string, options?: Partial<TTSSettings>) => {
    if (!isSupported || !settings.enabled) return

    // Cancel any ongoing speech
    speechSynthesis.cancel()

    const effectiveSettings = { ...settings, ...options }
    const utterance = new SpeechSynthesisUtterance(text)

    // Find the selected voice
    const selectedVoice = voices.find((voice) => voice.name === effectiveSettings.voice)
    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    // Apply settings
    utterance.rate = effectiveSettings.rate
    utterance.pitch = effectiveSettings.pitch
    utterance.volume = effectiveSettings.volume

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true)
      setIsPaused(false)
      setCurrentUtterance(utterance)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setIsPaused(false)
      setCurrentUtterance(null)
    }

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error)
      setIsSpeaking(false)
      setIsPaused(false)
      setCurrentUtterance(null)
    }

    utterance.onpause = () => {
      setIsPaused(true)
    }

    utterance.onresume = () => {
      setIsPaused(false)
    }

    utteranceRef.current = utterance
    speechSynthesis.speak(utterance)
  }

  const pause = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause()
    }
  }

  const resume = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume()
    }
  }

  const stop = () => {
    speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
    setCurrentUtterance(null)
  }

  const testVoice = () => {
    const testText = "Hello! This is how I sound with the current voice settings."
    speak(testText)
  }

  const content = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Text-to-Speech Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable TTS */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="tts-enabled">Enable Text-to-Speech</Label>
            <p className="text-xs text-muted-foreground">Automatically speak assistant responses</p>
          </div>
          <Switch
            id="tts-enabled"
            checked={settings.enabled}
            onCheckedChange={(enabled) => updateSettings({ enabled })}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Auto-speak toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-speak">Auto-speak Responses</Label>
                <p className="text-xs text-muted-foreground">Automatically speak all assistant responses</p>
              </div>
              <Switch
                id="auto-speak"
                checked={settings.autoSpeak}
                onCheckedChange={(autoSpeak) => updateSettings({ autoSpeak })}
              />
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <Label>Voice</Label>
              <Select value={settings.voice} onValueChange={(voice) => updateSettings({ voice })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      <div className="flex items-center justify-between w-full">
                        <span>{voice.name}</span>
                        <div className="flex gap-1 ml-2">
                          <Badge variant="outline" className="text-xs">
                            {voice.lang}
                          </Badge>
                          {voice.default && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Speech Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Speech Rate</Label>
                <span className="text-sm text-muted-foreground">{settings.rate.toFixed(1)}x</span>
              </div>
              <Slider
                value={[settings.rate]}
                onValueChange={([rate]) => updateSettings({ rate })}
                min={0.1}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Pitch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pitch</Label>
                <span className="text-sm text-muted-foreground">{settings.pitch.toFixed(1)}</span>
              </div>
              <Slider
                value={[settings.pitch]}
                onValueChange={([pitch]) => updateSettings({ pitch })}
                min={0.1}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Volume</Label>
                <span className="text-sm text-muted-foreground">{Math.round(settings.volume * 100)}%</span>
              </div>
              <Slider
                value={[settings.volume]}
                onValueChange={([volume]) => updateSettings({ volume })}
                min={0.0}
                max={1.0}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button onClick={testVoice} variant="outline" size="sm" disabled={isSpeaking && !isPaused}>
                <Play className="w-4 h-4 mr-2" />
                Test Voice
              </Button>

              {isSpeaking && (
                <>
                  {isPaused ? (
                    <Button onClick={resume} variant="outline" size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                  ) : (
                    <Button onClick={pause} variant="outline" size="sm">
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}

                  <Button onClick={stop} variant="outline" size="sm">
                    <SkipForward className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}

              {isSpeaking && (
                <Badge variant="secondary" className="ml-auto">
                  {isPaused ? "Paused" : "Speaking"}
                </Badge>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )

  if (isVisible !== undefined) {
    return (
      <div className={`fixed inset-0 z-50 ${isVisible ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-black/50" onClick={onToggle} />
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
          {content}
        </div>
      </div>
    )
  }

  return content
}

// Hook for using TTS functionality
export function useTextToSpeech(initialSettings?: Partial<TTSSettings>) {
  const [settings, setSettings] = useState<TTSSettings>({
    voice: "",
    rate: 0.9,
    pitch: 1.0,
    volume: 0.8,
    enabled: true,
    autoSpeak: true,
    ...initialSettings,
  })

  const [isSupported] = useState(() => "speechSynthesis" in window)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const speak = (text: string, options?: Partial<TTSSettings>) => {
    if (!isSupported || !settings.enabled) return

    speechSynthesis.cancel()

    const effectiveSettings = { ...settings, ...options }
    const utterance = new SpeechSynthesisUtterance(text)

    const voices = speechSynthesis.getVoices()
    const selectedVoice = voices.find((voice) => voice.name === effectiveSettings.voice)
    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    utterance.rate = effectiveSettings.rate
    utterance.pitch = effectiveSettings.pitch
    utterance.volume = effectiveSettings.volume

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      setIsPaused(false)
    }
    utterance.onpause = () => setIsPaused(true)
    utterance.onresume = () => setIsPaused(false)

    speechSynthesis.speak(utterance)
  }

  const pause = () => speechSynthesis.pause()
  const resume = () => speechSynthesis.resume()
  const stop = () => {
    speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
  }

  return {
    speak,
    pause,
    resume,
    stop,
    settings,
    setSettings,
    isSupported,
    isSpeaking,
    isPaused,
  }
}
