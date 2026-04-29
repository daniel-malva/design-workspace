// ─── getInitialCanvasOffset ──────────────────────────────────────────────────
//
// Calculates the (x, y) offset that places the CanvasFrame perfectly centred
// inside the available container area.
//
// Used by:
//   • CanvasArea   — on first mount (useLayoutEffect) to set the initial offset
//   • fitToScreen  — to re-centre after adjusting the scale
//
// The container dimensions are always read from the live DOM (getBoundingClientRect)
// so the calculation is accurate regardless of panel open/close state.
//
// Formula:
//   offsetX = (containerWidth  − canvasWidth  × scale) / 2
//   offsetY = (containerHeight − canvasHeight × scale) / 2
//
// V64
// ─────────────────────────────────────────────────────────────────────────────

export const CANVAS_WIDTH  = 600; // px — CanvasFrame fixed width
export const CANVAS_HEIGHT = 600; // px — CanvasFrame fixed height

/**
 * Returns the {x, y} canvas offset that centres a (CANVAS_WIDTH × CANVAS_HEIGHT)
 * frame inside a container of the given dimensions at the given scale.
 *
 * @param containerWidth  - Width  of the pan/zoom container (from getBoundingClientRect)
 * @param containerHeight - Height of the pan/zoom container (from getBoundingClientRect)
 * @param scale           - Current canvasScale (default 1)
 */
export function getInitialCanvasOffset(
  containerWidth:  number,
  containerHeight: number,
  scale = 1,
): { x: number; y: number } {
  return {
    x: (containerWidth  - CANVAS_WIDTH  * scale) / 2,
    y: (containerHeight - CANVAS_HEIGHT * scale) / 2,
  };
}
