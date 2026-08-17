"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { fetchMe, refreshSession } from "@/lib/api/auth";
import { PageSpinner } from "@/components/ui/spinner";
import { useAuthStore } from "./auth-store";

/**
 * Arranca la sesión al cargar la app: intenta renovar el access token con la
 * cookie httpOnly de refresh y, si funciona, hidrata el perfil (docs/15
 * §15.2: el access token vive solo en memoria, se pierde en cada recarga).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const setStatus = useAuthStore((s) => s.setStatus);
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    setStatus("loading");
    void (async () => {
      const refreshed = await refreshSession();
      if (!refreshed) {
        clear();
        return;
      }
      useAuthStore.getState().setAccessToken(refreshed.accessToken);
      try {
        const user = await fetchMe();
        setSession(refreshed.accessToken, user);
      } catch {
        clear();
      }
    })();
  }, [setStatus, setSession, clear]);

  if (status === "idle" || status === "loading") {
    return <PageSpinner />;
  }

  return children;
}
