// ─────────────────────────────────────────────────────────────────────────────
// computeScaledFontSize — V54
//
// Pure function: given the element's dimensions at drag-start and the new
// dimensions after resize, returns a proportionally scaled font-size.
//
// Scale axis selection:
//   corner handles   → Math.min(scaleX, scaleY)  — font must fit both axes
//   middle-left/right→ scaleX only                — horizontal stretch
//   top/bottom-center→ scaleY only                — vertical stretch
//   keepRatio (Shift)→ same as corner (uniform)
// ─────────────────────────────────────────────────────────────────────────────

import type { ResizeHandle } from './computeResize';

export const MIN_FONT_SIZE = 6;    // px — minimum allowed font-size
export const MAX_FONT_SIZE = 400;  // px — maximum allowed font-size

interface ComputeScaledFontSizeParams {
  startW:        number;
  startH:        number;
  startFontSize: number;
  newW:          number;
  newH:          number;
  handle:        ResizeHandle;
  keepRatio:     boolean;
}

export function computeScaledFontSize({
  startW,
  startH,
  startFontSize,
  newW,
  newH,
  handle,
  keepRatio,
}: ComputeScaledFontSizeParams): number {
  // Guard against division by zero
  const scaleX = startW > 0 ? newW / startW : 1;
  const scaleY = startH > 0 ? newH / startH : 1;

  const isCorner         = ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(handle);
  const isHorizontalOnly = ['middle-left', 'middle-right'].includes(handle);
  const isVerticalOnly   = ['top-center', 'bottom-center'].includes(handle);

  let scale: number;

  if (keepRatio || isCorner) {
    // Proportional: use the smaller scale so text always fits
    scale = Math.min(scaleX, scaleY);
  } else if (isHorizontalOnly) {
    scale = scaleX;
  } else if (isVerticalOnly) {
    scale = scaleY;
  } else {
    scale = Math.min(scaleX, scaleY);
  }

  const raw = startFontSize * scale;

  // Clamp and round — no sub-pixel font sizes
  return Math.round(Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, raw)));
}
