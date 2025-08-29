"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { userHistoryService } from "@/lib/user-history";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionId: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const auth = getFirebaseAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      if (user && !sessionId) {
        // Start a new session when user logs in
        try {
          const newSessionId = await userHistoryService.startSession(user.uid);
          setSessionId(newSessionId);
        } catch (error) {
          console.error("Failed to start session:", error);
        }
      } else if (!user && sessionId) {
        // End session when user logs out
        try {
          await userHistoryService.endSession(sessionId);
          setSessionId(null);
        } catch (error) {
          console.error("Failed to end session:", error);
        }
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  const signOut = async () => {
    try {
      if (sessionId) {
        await userHistoryService.endSession(sessionId);
        setSessionId(null);
      }
      await auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const value = {
    user,
    loading,
    sessionId,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
