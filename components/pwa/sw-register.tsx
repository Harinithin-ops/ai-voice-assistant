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
        // Optional: listen for updates
        reg.addEventListener?.("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New content is available; you could prompt the user to refresh.
              console.info("Service worker updated. New content available.");
            }
          });
        });
      } catch (e) {
        console.warn("Service worker registration failed", e);
      }
    };

    // Register after page load for better TTI
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
