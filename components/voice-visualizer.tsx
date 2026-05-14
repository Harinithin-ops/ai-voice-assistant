"use client"

import { useEffect, useRef } from "react"

interface VoiceVisualizerProps {
  isActive: boolean
}

export function VoiceVisualizer({ isActive }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const baseRadius = 40

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (isActive) {
        // Generate random audio level for visual effect without triggering React re-renders
        // Smooth out the random changes by interpolating
        const targetAudioLevel = Math.random() * 0.8 + 0.2;
        // The time-based math adds some natural variation
        const audioLevel = targetAudioLevel * 0.5 + 0.5 * Math.abs(Math.sin(Date.now() * 0.005));
        
        // Animated rings based on audio level
        const rings = 3
        const time = Date.now() * 0.005

        for (let i = 0; i < rings; i++) {
          const ringRadius = baseRadius + i * 20 + audioLevel * 30 * Math.sin(time + i)
          const opacity = (1 - i / rings) * 0.6 * (0.5 + audioLevel)

          // Gradient for each ring
          const gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            ringRadius - 10,
            centerX,
            centerY,
            ringRadius + 10,
          )
          gradient.addColorStop(0, `rgba(132, 204, 22, ${opacity})`)
          gradient.addColorStop(1, `rgba(21, 128, 61, ${opacity * 0.3})`)

          ctx.beginPath()
          ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
          ctx.strokeStyle = gradient
          ctx.lineWidth = 3
          ctx.stroke()
        }

        // Central pulsing circle
        const pulseRadius = baseRadius * (1 + audioLevel * 0.5)
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius)
        gradient.addColorStop(0, "rgba(132, 204, 22, 0.8)")
        gradient.addColorStop(1, "rgba(21, 128, 61, 0.2)")

        ctx.beginPath()
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      } else {
        // Static circle when inactive
        ctx.beginPath()
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(132, 204, 22, 0.3)"
        ctx.lineWidth = 2
        ctx.stroke()
      }

      if (isActive) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive])

  return (
    <div className="relative">
      <canvas ref={canvasRef} width={200} height={200} className="rounded-full" />
    </div>
  )
}
