"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, Brain, Globe, Zap, Shield, Users, ArrowRight, Play, Star } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"
import { UserProfileDropdown } from "@/components/user-profile-dropdown"

interface LandingPageProps {
  onGetStarted: () => void
  onShowLogin?: () => void
}

export function LandingPage({ onGetStarted, onShowLogin }: LandingPageProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const features = [
    {
      icon: <Mic className="h-8 w-8" />,
      title: "Advanced Voice Recognition",
      description: "State-of-the-art speech processing with 99% accuracy across multiple languages and accents.",
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Intelligence",
      description: "Contextual understanding and learning capabilities that adapt to your communication style.",
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Web Integration",
      description: "Seamlessly browse, search, and interact with websites through natural voice commands.",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Lightning Fast",
      description: "Real-time processing with sub-second response times for instant voice interactions.",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Privacy First",
      description: "Your conversations stay private with end-to-end encryption and local processing.",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Accessibility Focused",
      description: "Designed for everyone, including specialized features for visually impaired users.",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager",
      content:
        "This AI assistant has revolutionized how I manage my daily tasks. The voice recognition is incredibly accurate.",
      rating: 5,
    },
    {
      name: "Michael Rodriguez",
      role: "Developer",
      content:
        "The web integration features are game-changing. I can browse and research without touching my keyboard.",
      rating: 5,
    },
    {
      name: "Emily Johnson",
      role: "Content Creator",
      content:
        "As someone with visual impairments, the accessibility features have made technology truly inclusive for me.",
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass-effect border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center animate-glow">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">VoiceAI Pro</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">
              Testimonials
            </a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </a>
            {user ? (
              <UserProfileDropdown />
            ) : onShowLogin && (
              <Button
                variant="outline"
                onClick={onShowLogin}
                className="text-gray-300 hover:text-white border-gray-600 hover:bg-gray-800"
              >
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto text-center">
          <div className={`transition-all duration-1000 ${isVisible ? "animate-fade-in" : "opacity-0"}`}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-green-200 to-emerald-300 bg-clip-text text-transparent">
              The Future of
              <span className="block bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                Voice Interaction
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Experience the next generation of AI-powered voice assistance with advanced speech recognition,
              intelligent web integration, and accessibility-first design.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-green-500/25 animate-glow"
                onClick={onGetStarted}
              >
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 transition-all duration-300 hover:scale-105 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
              >
                <Play className="mr-2 h-5 w-5" /> Watch Demo
              </Button>
            </div>
          </div>

          {/* Floating Animation Element */}
          <div className="relative mx-auto w-64 h-64 mb-16">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full animate-float blur-xl"></div>
            <div className="relative glass-effect rounded-full w-full h-full flex items-center justify-center shadow-2xl border border-green-500/20">
              <Mic className="h-24 w-24 text-green-400 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-gradient-to-r from-gray-900/50 to-slate-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Powerful Features</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover the advanced capabilities that make VoiceAI Pro the ultimate voice assistant
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-2 glass-effect border-gray-700/50 hover:border-green-500/50"
              >
                <CardContent className="p-6">
                  <div className="text-green-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">What Users Say</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of satisfied users who have transformed their productivity
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="glass-effect border-gray-700/50">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Get Started?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join the voice revolution and experience the future of human-computer interaction
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-green-500/25 animate-glow"
            onClick={onGetStarted}
          >
            Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-950 border-t border-gray-800">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Mic className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">VoiceAI Pro</span>
              </div>
              <p className="text-gray-400">The next generation of voice-powered AI assistance.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; 2024 VoiceAI Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
