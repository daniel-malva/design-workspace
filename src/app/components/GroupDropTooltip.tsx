import { useEffect } from 'react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';

// ── Tooltip entrance animation — injected once into <head> ─────────
const TOOLTIP_CSS = `
@keyframes tooltip-appear {
  0%   { opacity: 0; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0);   }
}
.tooltip-appear {
  animation: tooltip-appear 150ms ease-out forwards;
}
`;

function injectTooltipStyles() {
  const STYLE_ID = 'group-drop-tooltip-styles';
  if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id    = STYLE_ID;
    style.textContent = TOOLTIP_CSS;
    document.head.appendChild(style);
  }
}

// ── Layout constants ────────────────────────────────────────────────
/** Minimum px gap between the top of the canvas and the group before we
 *  flip the tooltip to appear below instead of above. */
const CANVAS_TOP_MARGIN = 40;

// ═══════════════════════════════════════════════════════════════════
// GroupDropTooltip — V61
//
// Appears alongside GroupDropTargetOverlay (z-46) while an element is
// being dragged over a group. Shows "Drop to add to [group name]" with
// a small downward-pointing arrow.
//
// z-index: 47 — above the pulse overlay, below InteractionOverlay (z-50)
// pointer-events: none — never interferes with the drag
//
// Adaptive positioning:
//   Default   → above the group   (transform: translate(-50%, -100%))
//   Near-top  → below the group   (transform: translate(-50%, 0))
//   Arrow flips to always point toward the group.
// ═══════════════════════════════════════════════════════════════════

export function GroupDropTooltip() {
  const { dragTargetGroupId, canvasElements } = useDesignWorkspace();

  useEffect(() => { injectTooltipStyles(); }, []);

  if (!dragTargetGroupId) return null;

  const group = canvasElements.find(el => el.id === dragTargetGroupId);
  if (!group) return null;

  const showBelow = group.y < CANVAS_TOP_MARGIN;

  // Horizontal centre of the group's bounding box
  const centreX = group.x + group.width / 2;

  const containerStyle: React.CSSProperties = {
    left: centreX,
    top: showBelow
      ? group.y + group.height + 8   // below the group
      : group.y - 8,                 // above the group (default)
    transform: showBelow
      ? 'translate(-50%, 0)'         // anchor at top of tooltip
      : 'translate(-50%, -100%)',    // anchor at bottom of tooltip
  };

  const arrowAboveStyle: React.CSSProperties = {
    position:    'absolute',
    bottom:      -5,
    left:        '50%',
    transform:   'translateX(-50%)',
    width:       0,
    height:      0,
    borderLeft:  '5px solid transparent',
    borderRight: '5px solid transparent',
    borderTop:   '5px solid #1f1d25',
  };

  const arrowBelowStyle: React.CSSProperties = {
    position:     'absolute',
    top:          -5,
    left:         '50%',
    transform:    'translateX(-50%)',
    width:        0,
    height:       0,
    borderLeft:   '5px solid transparent',
    borderRight:  '5px solid transparent',
    borderBottom: '5px solid #1f1d25',
  };

  return (
    <div
      className="absolute pointer-events-none"
      style={{ ...containerStyle, zIndex: 47 }}
    >
      {/* Pill ─────────────────────────────────────────────────────── */}
      <div
        className="tooltip-appear flex items-center gap-1.5 bg-[#1f1d25] text-white px-2.5 py-1.5 rounded-[6px] shadow-md whitespace-nowrap"
        style={{
          fontSize:      11,
          fontFamily:    "'Roboto', sans-serif",
          fontWeight:    500,
          letterSpacing: '0.15px',
        }}
      >
        {/* Drop icon */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="shrink-0 opacity-80"
        >
          <path
            d="M6 1v7M6 8L3.5 5.5M6 8L8.5 5.5M1.5 10.5h9"
            stroke="white"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        Drop to add to&nbsp;
        <span style={{ fontWeight: 600 }}>
          {group.name ?? 'Group'}
        </span>
      </div>

      {/* Arrow — points toward the group ──────────────────────────── */}
      <div style={showBelow ? arrowBelowStyle : arrowAboveStyle} />
    </div>
  );
}
