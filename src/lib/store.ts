import { create } from "zustand";

interface DashboardState {
  selectedStateKey: string | null;
  hoveredStateKey: string | null;
  /** Which indicator drives the map's coloring. Null = default "dominant
   * issue per state" categorical mode; otherwise a specific indicator id
   * switches the map to a sequential choropleth for that one metric. */
  activeIndicatorId: string | null;
  selectState: (key: string | null) => void;
  hoverState: (key: string | null) => void;
  setActiveIndicator: (id: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedStateKey: null,
  hoveredStateKey: null,
  activeIndicatorId: null,
  selectState: (key) => set({ selectedStateKey: key }),
  hoverState: (key) => set({ hoveredStateKey: key }),
  setActiveIndicator: (id) => set({ activeIndicatorId: id }),
}));
