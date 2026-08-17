import { create } from "zustand";

interface UiState {
  /** Overlay del sidebar en mobile (SKILL.md §8). */
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  /** Sidebar expandido/colapsado a solo íconos en desktop (SKILL.md §7). */
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  sidebarCollapsed: false,
  toggleSidebarCollapsed: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
}));
