// CanvasOutOfBoundsOverlay.tsx
//
// V44 — SVG mask that dims the area OUTSIDE the canvas artboard.
// Rendered at z-48 (above elements, below InteractionOverlay at z-50).
// The SVG uses an evenodd fill rule to create a transparent "hole" over
// the 600×600 canvas area — only the surrounding region is filled with
// the semi-transparent gray.

const EXTEND = 2000; // px the mask extends beyond each canvas edge

interface CanvasOutOfBoundsOverlayProps {
  canvasWidth:  number;
  canvasHeight: number;
}

export function CanvasOutOfBoundsOverlay({
  canvasWidth,
  canvasHeight,
}: CanvasOutOfBoundsOverlayProps) {
  const totalW = EXTEND * 2 + canvasWidth;
  const totalH = EXTEND * 2 + canvasHeight;

  // evenodd path: outer rectangle (fills everything) minus inner rectangle
  // (the canvas area) → produces a "donut" shape — transparent over canvas,
  // filled outside.
  const path = [
    // Outer rectangle — covers the entire SVG
    `M 0 0 H ${totalW} V ${totalH} H 0 Z`,
    // Inner rectangle — the canvas area (this becomes the "hole")
    `M ${EXTEND} ${EXTEND}`,
    `H ${EXTEND + canvasWidth}`,
    `V ${EXTEND + canvasHeight}`,
    `H ${EXTEND} Z`,
  ].join(' ');

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left:   -EXTEND,
        top:    -EXTEND,
        width:  totalW,
        height: totalH,
        zIndex: 48,
      }}
    >
      <svg
        width={totalW}
        height={totalH}
        style={{ position: 'absolute', inset: 0, display: 'block' }}
        // Prevent SVG from intercepting mouse events
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d={path}
          fill="rgba(232, 232, 232, 0.50)"
        />
      </svg>
    </div>
  );
}