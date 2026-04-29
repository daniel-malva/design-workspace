// ─────────────────────────────────────────────────────────────────────────────
// canvasHandles.ts — shared resize-handle layout tokens
// Used by CanvasFrame (SelectionOverlay) and MultiSelectionBoundingBox.
// ─────────────────────────────────────────────────────────────────────────────

import type React from 'react';

export type { ResizeHandle } from '../utils/computeResize';

export const HANDLE_CURSORS: Record<string, string> = {
  'top-left':      'nwse-resize',
  'top-center':    'ns-resize',
  'top-right':     'nesw-resize',
  'middle-left':   'ew-resize',
  'middle-right':  'ew-resize',
  'bottom-left':   'nesw-resize',
  'bottom-center': 'ns-resize',
  'bottom-right':  'nwse-resize',
};

export const HANDLE_POSITIONS: Record<string, React.CSSProperties> = {
  'top-left':      { top: -4,  left: -4  },
  'top-center':    { top: -4,  left: '50%', transform: 'translateX(-50%)' },
  'top-right':     { top: -4,  right: -4 },
  'middle-left':   { top: '50%', left: -4, transform: 'translateY(-50%)' },
  'middle-right':  { top: '50%', right: -4, transform: 'translateY(-50%)' },
  'bottom-left':   { bottom: -4, left: -4  },
  'bottom-center': { bottom: -4, left: '50%', transform: 'translateX(-50%)' },
  'bottom-right':  { bottom: -4, right: -4 },
};

export const ALL_HANDLES = Object.keys(HANDLE_POSITIONS);
