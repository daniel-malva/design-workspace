import { useRef, type MouseEvent } from 'react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import type { ChildSnapshot } from '../store/useDesignWorkspaceStore';
import { computeResize } from '../utils/computeResize';
import type { ResizeHandle, ResizeState } from '../utils/computeResize';
import { useResizeGuides, isLeftHandle, isTopHandle } from './useResizeGuides';
import type { ResizeGuide } from './useResizeGuides';

export { type ResizeHandle } from '../utils/computeResize';
export type { ResizeGuide } from './useResizeGuides';

// ─────────────────────────────────────────────────────────────────────────────
// useResizeHandler
//
// Handles element resize via 8 corner/edge handles. Key behaviours:
//   • Text elements: width/height change only — font-size is preserved,
//     text reflows (wraps) automatically inside the new bounding box.
//   • Group elements: all children scale proportionally. Child snapshots are
//     captured at mousedown so scaling is always relative to the original size.
//   • Dimension-match snap via useResizeGuides.
//   • Modifier keys (read live per-frame, never stale):
//       Shift       → maintain aspect ratio
//       Alt/Option  → resize from center
//       Shift+Alt   → both
//   • Coordinates: screen pixels → canvas units via canvasScale.
// ─────────────────────────────────────────────────────────────────────────────

export function useResizeHandler(
  elementId: string,
  onGuidesChange?: (guides: ResizeGuide[]) => void,
) {
  const {
    updateElement,
    updateGroupWithChildren,
    commitHistory,
    canvasElements,
    canvasScale,
  } = useDesignWorkspace();

  // Fresh computeResizeGuides on every render — ref prevents stale closures
  // inside the onMouseMove event listener.
  const { computeResizeGuides } = useResizeGuides();
  const computeResizeGuidesRef  = useRef(computeResizeGuides);
  computeResizeGuidesRef.current = computeResizeGuides;

  function startResize(e: MouseEvent, handle: ResizeHandle) {
    e.preventDefault();
    e.stopPropagation();

    const el = canvasElements.find(el => el.id === elementId);
    if (!el) return;

    const isGroup = el.type === 'group';

    // V69: Capture child snapshots BEFORE any transformation begins.
    // These are immutable throughout the entire drag — scale is always
    // relative to the original size, never to the partially-resized state.
    const childSnapshots: ChildSnapshot[] = isGroup
      ? canvasElements
          .filter(child => child.groupId === elementId)
          .map(child => ({
            id:       child.id,
            x:        child.x,
            y:        child.y,
            width:    child.width,
            height:   child.height,
            groupX:   el.x,
            groupY:   el.y,
            fontSize: child.style?.fontSize ?? null,
          }))
      : [];

    // Capture immutable start snapshot — aspect ratio fixed at drag-start
    const state: ResizeState = {
      startMouseX:  e.clientX,
      startMouseY:  e.clientY,
      startX:       el.x,
      startY:       el.y,
      startW:       el.width,
      startH:       el.height,
      handle,
      aspectRatio:  el.height !== 0 ? el.width / el.height : 1,
      startFontSize: null,
    };

    // Capture scale at drag-start so it stays consistent mid-drag
    const scale = canvasScale;

    function onMouseMove(ev: globalThis.MouseEvent) {
      // Translate screen pixels → canvas units
      const dx = (ev.clientX - state.startMouseX) / scale;
      const dy = (ev.clientY - state.startMouseY) / scale;

      const keepRatio  = ev.shiftKey;
      const fromCenter = ev.altKey;

      let { x, y, width, height } = computeResize({
        dx, dy, handle, keepRatio, fromCenter, state,
      });

      width  = Math.max(8, width);
      height = Math.max(8, height);

      // ── V45: Dimension snap + guides ──────────────────────────────
      const { guides, snappedW, snappedH } = computeResizeGuidesRef.current(
        elementId, width, height, x, y, handle,
      );

      if (snappedW !== width) {
        if (isLeftHandle(handle)) x += width - snappedW;
        width = snappedW;
      }
      if (snappedH !== height) {
        if (isTopHandle(handle)) y += height - snappedH;
        height = snappedH;
      }

      onGuidesChange?.(guides);

      // ── V69: Group resize — update container + all children atomically ──
      if (isGroup) {
        updateGroupWithChildren(
          elementId,
          { x, y, width, height },
          { x: state.startX, y: state.startY, width: state.startW, height: state.startH },
          childSnapshots,
        );
        return;
      }

      // V70: Text reflows (wraps) at the new width — font-size never changes.
      updateElement(elementId, { x, y, width, height });
    }

    function onMouseUp() {
      commitHistory();
      onGuidesChange?.([]);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
  }

  return { startResize };
}
