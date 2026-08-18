import { create } from "zustand";

interface UiState {
  /** Overlay del sidebar en mobile (SKILL.md §8). */
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  /** Sidebar expandido/colapsado a solo íconos en desktop (SKILL.md §7). */
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  /**
   * Grupos de navegación colapsados manualmente por el usuario (acordeón,
   * SKILL.md §10.2). Ausente en el registro = expandido (default abierto:
   * agrupar es para ordenar, no para esconder — ver principio "reducir
   * pasos, no ocultarlos"). Independiente de los permisos del usuario.
   */
  collapsedNavGroups: Record<string, boolean>;
  toggleNavGroup: (label: string) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  sidebarCollapsed: false,
  toggleSidebarCollapsed: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  collapsedNavGroups: {},
  toggleNavGroup: (label) =>
    set({ collapsedNavGroups: { ...get().collapsedNavGroups, [label]: !get().collapsedNavGroups[label] } }),
}));
