import { useRef } from 'react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import type { CanvasElementType } from '../store/useDesignWorkspaceStore';
import { computeResize } from '../utils/computeResize';
import type { ResizeHandle } from '../utils/computeResize';
import { HANDLE_POSITIONS, HANDLE_CURSORS, ALL_HANDLES } from '../constants/canvasHandles';

const TEXT_TYPES: CanvasElementType[] = [
  'text-header', 'text-subheader', 'text-body', 'text-template',
];

// ─────────────────────────────────────────────────────────────────────────────
// MultiSelectionBoundingBox
//
// Rendered inside CanvasFrame when ≥ 2 elements are selected.
//
// V38 z-index model:
//   Container: z-70, pointer-events-none  → above InteractionOverlay (z-50)
//   Border:    visual only, no pointer events
//   Handles:   pointer-events-auto + stopPropagation → capture resize events
//              before the overlay sees them
//
// Group DRAG is handled by InteractionOverlay (hit-test detects multi-selection).
// This component only handles group RESIZE via the 8 corner/edge handles.
// ─────────────────────────────────────────────────────────────────────────────

interface MultiSelectionBoundingBoxProps {
  selectedIds: string[];
}

export function MultiSelectionBoundingBox({ selectedIds }: MultiSelectionBoundingBoxProps) {
  const { canvasElements, updateElement, commitHistory, canvasScale } = useDesignWorkspace();
  const scaleRef = useRef(canvasScale);
  scaleRef.current = canvasScale;

  const selected = canvasElements.filter(el => selectedIds.includes(el.id));
  if (selected.length < 2) return null;

  // ── Unified bounding box dimensions ──────────────────────────────
  const minX   = Math.min(...selected.map(el => el.x));
  const minY   = Math.min(...selected.map(el => el.y));
  const maxX   = Math.max(...selected.map(el => el.x + el.width));
  const maxY   = Math.max(...selected.map(el => el.y + el.height));
  const groupW = maxX - minX;
  const groupH = maxY - minY;

  // ── Proportional resize — called by each handle ───────────────────
  function handleResizeMouseDown(e: React.MouseEvent, handle: ResizeHandle) {
    e.preventDefault();
    e.stopPropagation(); // ← prevent InteractionOverlay from seeing this

    const startState = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX:      minX,
      startY:      minY,
      startW:      groupW,
      startH:      groupH,
      handle,
      aspectRatio: groupH !== 0 ? groupW / groupH : 1,
    };

    // Capture scale at drag-start — stays consistent mid-drag
    const scale = scaleRef.current;

    function onMouseMove(ev: globalThis.MouseEvent) {
      // Divide by scale: screen-px → canvas-units
      const dx = (ev.clientX - startState.startMouseX) / scale;
      const dy = (ev.clientY - startState.startMouseY) / scale;

      let { x: newX, y: newY, width: newW, height: newH } = computeResize({
        dx,
        dy,
        handle,
        keepRatio:  ev.shiftKey,
        fromCenter: ev.altKey,
        state:      startState,
      });

      newW = Math.max(10, newW);
      newH = Math.max(10, newH);

      // Scale every element proportionally within the group
      const scaleX = newW / groupW;
      const scaleY = newH / groupH;

      selected.forEach(el => {
        const isText = TEXT_TYPES.includes(el.type as CanvasElementType);
        updateElement(el.id, {
          x:      newX + (el.x - minX) * scaleX,
          y:      newY + (el.y - minY) * scaleY,
          width:  Math.max(1, el.width  * scaleX),
          height: Math.max(1, el.height * scaleY),
          ...(isText && {
            style: {
              ...el.style,
              fontSize: Math.round(
                Math.max(6, Math.min(400,
                  (el.style?.fontSize ?? 16) * Math.min(scaleX, scaleY)
                ))
              ),
            },
          }),
        });
      });
    }

    function onMouseUp() {
      commitHistory();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
  }

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left:   minX,
        top:    minY,
        width:  groupW,
        height: groupH,
        // z-70: above InteractionOverlay (z-50) so handles receive events first.
        // pointer-events-none on container: clicks pass through to the overlay.
        // Only handles override with pointer-events-auto.
        zIndex: 70,
      }}
    >
      {/* ── Bounding box border — visual only ── */}
      <div className="absolute inset-0 border-2 border-[#5B4EFF] rounded-[1px]" />

      {/* ── 8 resize handles — pointer-events-auto, stopPropagation ── */}
      {ALL_HANDLES.map(handle => (
        <div
          key={handle}
          className="absolute w-2 h-2 bg-white border-2 border-[#5B4EFF] rounded-[1px] pointer-events-auto"
          style={{
            ...HANDLE_POSITIONS[handle],
            cursor: HANDLE_CURSORS[handle],
          }}
          onMouseDown={e => handleResizeMouseDown(e, handle as ResizeHandle)}
        />
      ))}
    </div>
  );
}
