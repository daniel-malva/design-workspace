import type { AlignmentGuide } from '../hooks/useAlignmentGuides';

interface AlignmentGuidesOverlayProps {
  guides: AlignmentGuide[];
  canvasWidth:  number;   // 600
  canvasHeight: number;   // 600
}

/**
 * Renders snap alignment guides inside the CanvasFrame.
 *
 * - Vertical guides:   1px-wide lines spanning the full canvas height
 * - Horizontal guides: 1px-tall lines spanning the full canvas width
 * - Edge colour:   #5B4EFF (purple)
 * - Center colour: #FF6B6B (coral)
 * - pointer-events: none — never blocks interactions
 * - z-index: 30 — above all canvas elements, below nothing
 */
export function AlignmentGuidesOverlay({
  guides,
  canvasWidth,
  canvasHeight,
}: AlignmentGuidesOverlayProps) {
  if (guides.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {guides.map((guide, i) =>
        guide.orientation === 'vertical' ? (
          // Vertical line — runs top to bottom at a fixed X
          <div
            key={`v-${i}`}
            className="absolute top-0 bottom-0 w-px"
            style={{
              left:            guide.position,
              backgroundColor: guide.type === 'center' ? '#FF6B6B' : '#5B4EFF',
              opacity:         0.8,
            }}
          />
        ) : (
          // Horizontal line — runs left to right at a fixed Y
          <div
            key={`h-${i}`}
            className="absolute left-0 right-0 h-px"
            style={{
              top:             guide.position,
              backgroundColor: guide.type === 'center' ? '#FF6B6B' : '#5B4EFF',
              opacity:         0.8,
            }}
          />
        ),
      )}

      {/* Small square intersection dots where guides cross */}
      {guides
        .filter(g => g.orientation === 'vertical')
        .flatMap(vg =>
          guides
            .filter(g => g.orientation === 'horizontal')
            .map((hg, j) => (
              <div
                key={`dot-${vg.position}-${hg.position}-${j}`}
                className="absolute w-1.5 h-1.5 rounded-sm"
                style={{
                  left:            vg.position - 3,
                  top:             hg.position - 3,
                  backgroundColor: vg.type === 'center' || hg.type === 'center'
                    ? '#FF6B6B'
                    : '#5B4EFF',
                  opacity: 1,
                  zIndex:  31,
                }}
              />
            )),
        )}
    </div>
  );
}
