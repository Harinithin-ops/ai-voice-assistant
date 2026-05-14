import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Manrope } from "next/font/google"
import "./globals.css"
import SWRegister from "@/components/pwa/sw-register"

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
}

export const metadata: Metadata = {
  title: "VoiceAI Pro - The Future of Voice Interaction",
  description:
    "Experience the next generation of AI-powered voice assistance with advanced speech recognition, intelligent web integration, and accessibility-first design.",
  generator: "v0.app",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VoiceAI Pro",
  },
  icons: {
    icon: "/placeholder-logo.png",
    apple: "/placeholder-logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${manrope.variable} antialiased dark`} suppressHydrationWarning>
      <body className="font-sans bg-gray-950 text-white">
        <SWRegister />
        {children}
      </body>
    </html>
  )
}
