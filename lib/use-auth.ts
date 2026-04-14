"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Auth hook for Maestro.
 * Checks: localhost bypass → saved session → requires login.
 */

export function useAuth() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if localhost (always bypass)
    const isLocal = typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    if (isLocal) {
      setAuthenticated(true);
      return;
    }

    // Check saved session via cookie (set by server on login)
    // Also check localStorage fallback
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        setAuthenticated(d.authenticated === true);
      })
      .catch(() => setAuthenticated(false));
  }, []);

  const login = useCallback((token: string) => {
    localStorage.setItem("maestro-session", token);
    setAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("maestro-session");
    setAuthenticated(false);
  }, []);

  return { authenticated, login, logout };
}
