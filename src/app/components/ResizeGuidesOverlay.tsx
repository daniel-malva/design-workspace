// ─────────────────────────────────────────────────────────────────────────────
// ResizeGuidesOverlay — V45
//
// Renders coral guide lines + labels while an element is being resized.
// Displayed when the resizing element's W or H comes within SNAP_THRESHOLD
// of another element's W or H.
//
// Visual tokens:
//   Line color   : #FF6B6B (coral)
//   Line width   : 1px
//   Line opacity : 0.9
//   Label bg     : #FF6B6B
//   Label text   : #FFFFFF, 10px Roboto Medium
//   z-index      : 46 (above elements, below CanvasOutOfBoundsOverlay at 48)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import type { ResizeGuide } from '../hooks/useResizeGuides';

// ── Label ─────────────────────────────────────────────────────────────────

interface ResizeGuideLabelProps {
  value:       number;
  sourceName:  string;
  orientation: 'horizontal' | 'vertical';
  position:    number;
  canvasWidth?:  number;
  canvasHeight?: number;
}

function ResizeGuideLabel({
  value,
  sourceName,
  orientation,
  position,
}: ResizeGuideLabelProps) {
  const isVertical = orientation === 'vertical';

  return (
    <div
      className="absolute pointer-events-none"
      style={
        isVertical
          ? { left: position + 4, top: 8 }
          : { top: position - 20, left: 8 }
      }
    >
      <span
        className="text-[10px] text-white px-1.5 py-0.5 rounded-[3px] whitespace-nowrap"
        style={{
          backgroundColor: '#FF6B6B',
          fontFamily:      "'Roboto', sans-serif",
          fontWeight:      500,
        }}
      >
        {isVertical ? `W: ${Math.round(value)}` : `H: ${Math.round(value)}`}
        {sourceName !== 'Canvas' && (
          <span className="opacity-70 ml-1">({sourceName})</span>
        )}
      </span>
    </div>
  );
}

// ── Overlay ───────────────────────────────────────────────────────────────

interface ResizeGuidesOverlayProps {
  guides:       ResizeGuide[];
  canvasWidth:  number;
  canvasHeight: number;
}

export function ResizeGuidesOverlay({
  guides,
  canvasWidth,
  canvasHeight,
}: ResizeGuidesOverlayProps) {
  if (guides.length === 0) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 46 }}
    >
      {guides.map((guide, i) => (
        <React.Fragment key={`${guide.orientation}-${guide.position}-${i}`}>
          {guide.orientation === 'vertical' ? (
            <>
              {/* Vertical line — spans full canvas height */}
              <div
                className="absolute top-0 bottom-0"
                style={{
                  left:            guide.position,
                  width:           1,
                  backgroundColor: '#FF6B6B',
                  opacity:         0.9,
                }}
              />
              <ResizeGuideLabel
                value={guide.matchValue}
                sourceName={guide.sourceName}
                orientation="vertical"
                position={guide.position}
                canvasHeight={canvasHeight}
              />
            </>
          ) : (
            <>
              {/* Horizontal line — spans full canvas width */}
              <div
                className="absolute left-0 right-0"
                style={{
                  top:             guide.position,
                  height:          1,
                  backgroundColor: '#FF6B6B',
                  opacity:         0.9,
                }}
              />
              <ResizeGuideLabel
                value={guide.matchValue}
                sourceName={guide.sourceName}
                orientation="horizontal"
                position={guide.position}
                canvasWidth={canvasWidth}
              />
            </>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
