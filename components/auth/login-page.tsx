"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./auth-context";
import { LoginForm } from "./login-form";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface LoginPageProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

export function LoginPage({ onBack, onSuccess }: LoginPageProps) {
  const { user, loading } = useAuth();

  // Use useEffect to handle authentication state changes
  useEffect(() => {
    if (user && onSuccess) {
      onSuccess();
    }
  }, [user, onSuccess]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, delay: 0.2 }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
      {/* Header with back button */}
      <motion.header
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="sticky top-0 z-50 backdrop-blur-md bg-white/10 border-b border-white/20"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="p-2 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-all duration-300"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <motion.div 
                  className="w-8 h-8 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="text-xl">🎤</div>
                </motion.div>
                <h1 className="text-xl font-bold text-white drop-shadow-lg">
                  Voice Assistant
                </h1>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <span className="text-sm text-white/70">
                New to Voice Assistant? Sign up below
              </span>
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="w-full max-w-md">
          {/* Welcome text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mb-8"
          >
            <motion.h2 
              className="text-4xl font-bold text-white mb-4 drop-shadow-lg"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              Welcome Back
            </motion.h2>
            <motion.p 
              className="text-white/80 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              Sign in to access your personalized AI voice assistant experience
            </motion.p>
          </motion.div>

          {/* Login form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <LoginForm onSuccess={onSuccess} />
          </motion.div>

          {/* Additional info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-8 text-center"
          >
            <motion.div 
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl"
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h3 className="font-semibold text-white mb-3 text-lg">Why Sign In?</h3>
              <ul className="text-sm text-white/80 space-y-2">
                {[
                  'Save your voice command history',
                  'Personalized AI responses', 
                  'Sync across devices',
                  'Advanced voice features'
                ].map((item, index) => (
                  <motion.li 
                    key={index}
                    className="flex items-center space-x-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                  >
                    <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="py-6 px-4 border-t border-white/20 bg-white/5 backdrop-blur-md"
      >
        <div className="container mx-auto text-center">
          <p className="text-sm text-gray-500">
            © 2024 Voice Assistant. Secure authentication powered by Firebase.
          </p>
        </div>
      </motion.footer>
    </motion.div>
  );
}
