// ─────────────────────────────────────────────────────────────────────────────
// computeResize — pure function, no React deps.
// Called once per mousemove during a resize drag.
// ─────────────────────────────────────────────────────────────────────────────

export type ResizeHandle =
  | 'top-left'    | 'top-center'    | 'top-right'
  | 'middle-left' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ResizeState {
  startMouseX: number;
  startMouseY: number;
  startX:      number;
  startY:      number;
  startW:      number;
  startH:      number;
  handle:      ResizeHandle;
  aspectRatio: number;   // startW / startH captured at drag-start
  /** V54: font-size at drag-start, null for non-text elements */
  startFontSize: number | null;
}

interface ComputeResizeParams {
  dx:         number;
  dy:         number;
  handle:     ResizeHandle;
  keepRatio:  boolean;   // Shift held
  fromCenter: boolean;   // Alt/Option held
  state:      ResizeState;
}

export function computeResize({
  dx, dy, handle, keepRatio, fromCenter, state,
}: ComputeResizeParams): { x: number; y: number; width: number; height: number } {
  let { startX: x, startY: y, startW: width, startH: height, aspectRatio } = state;

  // ── Step 1: apply raw delta per handle ───────────────────────────
  switch (handle) {
    case 'top-left':
      width  = state.startW - dx;
      height = state.startH - dy;
      if (!fromCenter) { x = state.startX + dx; y = state.startY + dy; }
      break;
    case 'top-center':
      height = state.startH - dy;
      if (!fromCenter) { y = state.startY + dy; }
      break;
    case 'top-right':
      width  = state.startW + dx;
      height = state.startH - dy;
      if (!fromCenter) { y = state.startY + dy; }
      break;
    case 'middle-left':
      width = state.startW - dx;
      if (!fromCenter) { x = state.startX + dx; }
      break;
    case 'middle-right':
      width = state.startW + dx;
      break;
    case 'bottom-left':
      width  = state.startW - dx;
      height = state.startH + dy;
      if (!fromCenter) { x = state.startX + dx; }
      break;
    case 'bottom-center':
      height = state.startH + dy;
      break;
    case 'bottom-right':
      width  = state.startW + dx;
      height = state.startH + dy;
      break;
  }

  // ── Step 2 (Shift): lock aspect ratio ────────────────────────────
  if (keepRatio) {
    const isHorizontal = handle === 'middle-left' || handle === 'middle-right';
    const isVertical   = handle === 'top-center'  || handle === 'bottom-center';

    if (isHorizontal) {
      height = width / aspectRatio;
    } else if (isVertical) {
      width = height * aspectRatio;
    } else {
      // Corner: drive from the dominant axis
      if (Math.abs(dx) >= Math.abs(dy)) {
        height = width / aspectRatio;
      } else {
        width = height * aspectRatio;
      }
    }
  }

  // ── Step 3 (Alt): resize from center ─────────────────────────────
  if (fromCenter) {
    const dw = width  - state.startW;
    const dh = height - state.startH;
    x      = state.startX - dw / 2;
    y      = state.startY - dh / 2;
    width  = state.startW + dw;
    height = state.startH + dh;
  }

  return { x, y, width, height };
}