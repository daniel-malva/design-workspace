/**
 * canvasCoordinates.ts — V62
 *
 * Coordinate conversion for the vectorial CSS-transform zoom system.
 *
 * Architecture:
 *   The canvas container uses:
 *     position: absolute; left: 0; top: 0;
 *     transform: translate(offset.x px, offset.y px) scale(canvasScale);
 *     transform-origin: 0 0;
 *
 *   A canvas-space point (cx, cy) maps to container-space as:
 *     containerX = offset.x + cx * canvasScale
 *     containerY = offset.y + cy * canvasScale
 *
 *   This file inverts that mapping.
 *
 * NOTE: InteractionOverlay uses frameRef.getBoundingClientRect() which already
 * returns the scaled visual rect, so (e.clientX − frameRect.left) / canvasScale
 * is equivalent to screenToCanvas() and needs no changes.
 */

/**
 * Converts mouse coordinates from screen space to canvas space.
 *
 * @param screenX       - e.clientX
 * @param screenY       - e.clientY
 * @param canvasOffset  - { x, y } translation applied to the canvas container
 * @param canvasScale   - current zoom scale
 * @param containerRect - getBoundingClientRect() of the outer pan/scroll div
 */
export function screenToCanvas(
  screenX:       number,
  screenY:       number,
  canvasOffset:  { x: number; y: number },
  canvasScale:   number,
  containerRect: DOMRect,
): { x: number; y: number } {
  // 1. Position relative to the container's top-left corner
  const relX = screenX - containerRect.left;
  const relY = screenY - containerRect.top;
  // 2. Remove the pan translation
  const pannedX = relX - canvasOffset.x;
  const pannedY = relY - canvasOffset.y;
  // 3. Remove the scale
  return {
    x: pannedX / canvasScale,
    y: pannedY / canvasScale,
  };
}

/**
 * Converts a canvas-space point back to screen space.
 *
 * Inverse of screenToCanvas().
 */
export function canvasToScreen(
  canvasX:       number,
  canvasY:       number,
  canvasOffset:  { x: number; y: number },
  canvasScale:   number,
  containerRect: DOMRect,
): { x: number; y: number } {
  return {
    x: containerRect.left + canvasOffset.x + canvasX * canvasScale,
    y: containerRect.top  + canvasOffset.y + canvasY * canvasScale,
  };
}
