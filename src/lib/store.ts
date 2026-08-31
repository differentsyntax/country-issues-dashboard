import { create } from "zustand";
import { periods } from "./data";

interface DashboardState {
  periodIndex: number;
  selectedStateKey: string | null;
  hoveredStateKey: string | null;
  isPlaying: boolean;
  setPeriodIndex: (i: number) => void;
  step: (dir: 1 | -1) => void;
  selectState: (key: string | null) => void;
  hoverState: (key: string | null) => void;
  togglePlay: () => void;
  setPlaying: (v: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  periodIndex: periods.length - 1,
  selectedStateKey: null,
  hoveredStateKey: null,
  isPlaying: false,
  setPeriodIndex: (i) =>
    set({ periodIndex: Math.max(0, Math.min(periods.length - 1, i)) }),
  step: (dir) => {
    const next = get().periodIndex + dir;
    if (next < 0 || next > periods.length - 1) {
      set({ isPlaying: false });
      return;
    }
    set({ periodIndex: next });
  },
  selectState: (key) => set({ selectedStateKey: key }),
  hoverState: (key) => set({ hoveredStateKey: key }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaying: (v) => set({ isPlaying: v }),
}));
