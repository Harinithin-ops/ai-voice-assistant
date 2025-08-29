"use client";

import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/service-worker.js", {
          scope: "/",
        });
        console.log("Service worker registered successfully");
        
        // Optional: listen for updates
        reg.addEventListener?.("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.info("Service worker updated. New content available.");
            }
          });
        });
      } catch (e) {
        console.warn("Service worker registration failed", e);
        // Don't throw error, just log it
      }
    };

    // Add a small delay to prevent blocking initial render
    const timeoutId = setTimeout(() => {
      if (document.readyState === "complete") {
        register();
      } else {
        window.addEventListener("load", register, { once: true });
      }
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
