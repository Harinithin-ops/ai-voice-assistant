"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Mail, Lock, Chrome, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const auth = getFirebaseAuth();
  const googleProvider = new GoogleAuthProvider();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password: string, isSignUp: boolean = false) => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    if (isSignUp && password.length < 8) {
      setPasswordError("Password should be at least 8 characters for better security");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleEmailAuth = async (isSignUp: boolean) => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password, isSignUp);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName && userCredential.user) {
          await updateProfile(userCredential.user, { displayName });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess?.();
    } catch (err: any) {
      let errorMessage = "Authentication failed";
      if (err.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email";
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password";
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = "An account with this email already exists";
      } else if (err.code === 'auth/weak-password') {
        errorMessage = "Password is too weak";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");

    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Google authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl shadow-black/20 hover:shadow-black/30 transition-all duration-500">
          <CardHeader className="text-center pb-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4"
            >
              <div className="w-8 h-8 text-white font-bold text-xl">🎤</div>
            </motion.div>
            <CardTitle className="text-2xl font-bold text-white drop-shadow-lg relative z-10">
              Voice Assistant
            </CardTitle>
            <CardDescription className="text-white/80 relative z-10">
              Sign in to access your personalized AI experience
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
                <TabsTrigger value="login" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 data-[state=active]:shadow-lg transition-all duration-300 rounded-lg">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 data-[state=active]:shadow-lg transition-all duration-300 rounded-lg">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <TabsContent value="login" className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-white/90">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailError) setEmailError("");
                          }}
                          className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-cyan-400 focus:ring-cyan-400/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 ${
                            emailError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/50' : ''
                          }`}
                        />
                        <AnimatePresence>
                          {emailError && (
                            <motion.p 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="mt-1 text-sm text-red-300"
                            >
                              {emailError}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-white/90">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (passwordError) setPasswordError("");
                          }}
                          className={`pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-cyan-400 focus:ring-cyan-400/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 ${
                            passwordError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/50' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-white/50 hover:text-white/80 transition-colors duration-200"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <AnimatePresence>
                          {passwordError && (
                            <motion.p 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="mt-1 text-sm text-red-300"
                            >
                              {passwordError}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleEmailAuth(false)}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </div>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="text-sm font-medium text-gray-700">
                        Display Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="displayName"
                          type="text"
                          placeholder="Enter your name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="pl-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 pr-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleEmailAuth(true)}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-medium py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-white/60">Or continue with</span>
              </div>
            </div>

            <Button
              onClick={handleGoogleAuth}
              disabled={loading}
              variant="outline"
              className="w-full border-white/20 bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </div>
              ) : (
                <>
                  <Chrome className="mr-2 h-4 w-4" />
                  Continue with Google
                </>
              )}
            </Button>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="destructive" className="bg-red-500/10 border-red-400/50 backdrop-blur-sm">
                    <AlertDescription className="text-red-300">{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
