import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Previous setup: use env vars if provided, otherwise fall back to known defaults
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC4ZTzcRHv4BRcjlJCexlNLrCa2J9SkzUM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "voice-assistant-f6fcc.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "voice-assistant-f6fcc",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "voice-assistant-f6fcc.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "409412736149",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:409412736149:web:b01716f1bfbbb1c4ee379c",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-V8GSVL1P6C",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getFirebaseFirestore(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

// Initialize Analytics only on the client, and only if supported
export async function getFirebaseAnalytics() {
  if (typeof window === "undefined") return null;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (await isSupported()) {
      return getAnalytics(getFirebaseApp());
    }
    return null;
  } catch {
    return null;
  }
}
