import { create } from "zustand";
import type { AuthUser } from "../api/auth";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  user: AuthUser | null;
  /** Sede activa seleccionada por el usuario (docs/15 §15.2). Persistida en sessionStorage. */
  activeSedeId: string | null;
  setStatus: (status: AuthStatus) => void;
  setAccessToken: (token: string) => void;
  setSession: (accessToken: string, user: AuthUser) => void;
  setActiveSedeId: (sedeId: string) => void;
  clear: () => void;
}

const ACTIVE_SEDE_KEY = "funeraria-minaya:active-sede";

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "idle",
  accessToken: null,
  user: null,
  activeSedeId:
    typeof window !== "undefined" ? window.sessionStorage.getItem(ACTIVE_SEDE_KEY) : null,

  setStatus: (status) => set({ status }),
  setAccessToken: (accessToken) => set({ accessToken }),

  setSession: (accessToken, user) => {
    const sedeIds = user.sedeIds;
    let activeSedeId = get().activeSedeId;
    if (!activeSedeId || !sedeIds.includes(activeSedeId)) {
      activeSedeId = sedeIds[0] ?? null;
    }
    if (typeof window !== "undefined" && activeSedeId) {
      window.sessionStorage.setItem(ACTIVE_SEDE_KEY, activeSedeId);
    }
    set({ accessToken, user, status: "authenticated", activeSedeId });
  },

  setActiveSedeId: (sedeId) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(ACTIVE_SEDE_KEY, sedeId);
    }
    set({ activeSedeId: sedeId });
  },

  clear: () => set({ accessToken: null, user: null, status: "unauthenticated" }),
}));

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  return user?.permisos.includes(permission) ?? false;
}
