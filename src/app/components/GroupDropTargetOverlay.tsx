import { useEffect } from 'react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';

// ── Pulse animation keyframes ──────────────────────────────────────
// Injected once into <head> so it's available globally without a CSS file.
const PULSE_CSS = `
@keyframes group-drop-pulse {
  0%, 100% {
    box-shadow:
      0 0 0 2px #5B4EFF,
      inset 0 0 0 2px #5B4EFF;
    background-color: rgba(91, 78, 255, 0.06);
  }
  50% {
    box-shadow:
      0 0 0 3px #5B4EFF,
      0 0 12px rgba(91, 78, 255, 0.35),
      inset 0 0 0 2px #5B4EFF;
    background-color: rgba(91, 78, 255, 0.12);
  }
}

.group-drop-pulse {
  animation: group-drop-pulse 700ms ease-in-out infinite;
  border-radius: 4px;
}
`;

function injectPulseStyles() {
  const STYLE_ID = 'group-drop-pulse-styles';
  if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = PULSE_CSS;
    document.head.appendChild(style);
  }
}

// ═══════════════════════════════════════════════════════════════════
// GroupDropTargetOverlay
//
// Rendered inside CanvasFrame at z-46 (above elements, below resize
// handles and the InteractionOverlay). Reads dragTargetGroupId from
// the shared store so both canvas drags and layer-panel drags
// activate the same highlight.
//
// Design tokens (V59):
//   Pulse color      #5B4EFF
//   Border repose    2px solid #5B4EFF (inset box-shadow)
//   Border peak      3px + 12px glow
//   Fill repose      rgba(91,78,255,0.06)
//   Fill peak        rgba(91,78,255,0.12)
//   Cycle            700ms ease-in-out infinite
//   Offset           −3px all sides (so it sits just outside the group)
//   z-index          46
//   pointer-events   none
// ═══════════════════════════════════════════════════════════════════

export function GroupDropTargetOverlay() {
  const { dragTargetGroupId, canvasElements } = useDesignWorkspace();

  // Inject styles once on mount
  useEffect(() => {
    injectPulseStyles();
  }, []);

  if (!dragTargetGroupId) return null;

  const group = canvasElements.find(el => el.id === dragTargetGroupId);
  if (!group) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left:   group.x   - 3,
        top:    group.y   - 3,
        width:  group.width  + 6,
        height: group.height + 6,
        borderRadius: 4,
        zIndex: 46,
      }}
    >
      {/* Pulsing border + background — full-bleed within the offset container */}
      <div className="absolute inset-0 group-drop-pulse" />
    </div>
  );
}
