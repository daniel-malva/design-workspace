/**
 * canvasZoomBridge.ts — V62
 *
 * Module-singleton that lets CanvasArea register its zoom functions once,
 * then any other module (keyboard shortcuts, toolbar, etc.) can call them
 * without prop-drilling or extra context.
 *
 * CanvasArea populates these in a useEffect on mount.
 * Before mount they are harmless no-ops.
 */
export const zoomBridge = {
  /** Adjust zoom by a delta (e.g. +0.1 or -0.1). Keeps the viewport centre fixed. */
  zoomBy:      (_delta: number) => {},
  /** Zoom to an exact scale. Keeps the viewport centre fixed. */
  zoomTo:      (_targetScale: number) => {},
  /** Scale to fit the entire canvas in the viewport with padding. */
  fitToScreen: () => {},
  /** Reset to 100 % zoom and re-centre the canvas. */
  resetZoom:   () => {},
};
