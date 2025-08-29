"use client"

import { useState } from "react"
import { AuthProvider } from "@/components/auth/auth-context"
import { LandingPage } from "@/components/landing-page"
import { LoginPage } from "@/components/auth/login-page"
import VoiceAssistant from "@/components/voice-assistant"

export default function Home() {
  const [currentView, setCurrentView] = useState<"landing" | "login" | "voice">("landing")

  const handleGetStarted = () => {
    setCurrentView("login")
  }

  const handleLoginSuccess = () => {
    setCurrentView("voice")
  }

  const handleBackToLanding = () => {
    setCurrentView("landing")
  }

  const handleShowLogin = () => {
    setCurrentView("login")
  }

  return (
    <AuthProvider>
      {currentView === "landing" && (
        <LandingPage 
          onGetStarted={handleGetStarted}
          onShowLogin={handleShowLogin}
        />
      )}
      {currentView === "login" && (
        <LoginPage 
          onBack={handleBackToLanding}
          onSuccess={handleLoginSuccess}
        />
      )}
      {currentView === "voice" && (
        <VoiceAssistant 
          onBackToLanding={handleBackToLanding}
        />
      )}
    </AuthProvider>
  )
}
