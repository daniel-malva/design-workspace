// ── Gradient types ─────────────────────────────────────────────────

export interface GradientStop {
  id:       string;   // unique handle id
  position: number;   // 0–100 (%)
  color:    string;   // hex, e.g. "#FF6B6B"
  opacity:  number;   // 0–100
}

export interface LinearGradient {
  angle: number;         // 0–360°
  stops: GradientStop[]; // min 2 stops
}

/** Default gradient shown when the Linear tab is first opened. */
export const DEFAULT_GRADIENT: LinearGradient = {
  angle: 90,
  stops: [
    { id: 'default-1', position: 0,   color: '#5B4EFF', opacity: 100 },
    { id: 'default-2', position: 100, color: '#FF6B6B', opacity: 100 },
  ],
};
