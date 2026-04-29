import { useRef, type MouseEvent } from 'react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import type { CanvasElementType, ChildSnapshot } from '../store/useDesignWorkspaceStore';
import { computeResize } from '../utils/computeResize';
import type { ResizeHandle, ResizeState } from '../utils/computeResize';
import { computeScaledFontSize } from '../utils/computeScaledFontSize';
import { useResizeGuides, isLeftHandle, isTopHandle } from './useResizeGuides';
import type { ResizeGuide } from './useResizeGuides';

export { type ResizeHandle } from '../utils/computeResize';
export type { ResizeGuide } from './useResizeGuides';

// ─────────────────────────────────────────────────────────────────────────────
// useResizeHandler — V69
//
// V69 additions:
//   • Group resize: all children scale proportionally with the bounding box.
//   • ChildSnapshot captured at mousedown (immutable during drag).
//   • updateGroupWithChildren called atomically on every mousemove for groups.
//   • Text children inside groups also get proportional font-size scaling.
//
// V54 additions:
//   • startFontSize captured at drag-start for text elements
//   • font-size scales proportionally to the bounding box during resize
//   • computeScaledFontSize selects the correct axis per handle type
//
// Modifier key support (read live on each mousemove — never stale):
//   none         → free resize
//   Shift        → maintain aspect ratio + uniform font scale
//   Alt/Option   → resize from center
//   Shift + Alt  → both
//
// V45: integrates useResizeGuides for dimension-match snap.
// Coordinate translation: mouse-pixels → canvas-units via canvasScale.
// ─────────────────────────────────────────────────────────────────────────────

/** Element types whose font-size should scale with the bounding box. */
const TEXT_TYPES: CanvasElementType[] = [
  'text-header', 'text-subheader', 'text-body', 'text-template',
];

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

    const isGroup       = el.type === 'group';
    const isTextElement = TEXT_TYPES.includes(el.type);

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

    // Capture immutable start snapshot — aspect ratio and font-size fixed at drag-start
    const state: ResizeState = {
      startMouseX:  e.clientX,
      startMouseY:  e.clientY,
      startX:       el.x,
      startY:       el.y,
      startW:       el.width,
      startH:       el.height,
      handle,
      aspectRatio:  el.height !== 0 ? el.width / el.height : 1,
      startFontSize: isTextElement ? (el.style?.fontSize ?? 16) : null,
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

      // ── V54: Text resize — scale font-size proportionally ────────
      const updates: Parameters<typeof updateElement>[1] = { x, y, width, height };

      if (isTextElement && state.startFontSize !== null) {
        updates.style = {
          ...el.style,
          fontSize: computeScaledFontSize({
            startW:        state.startW,
            startH:        state.startH,
            startFontSize: state.startFontSize,
            newW:          width,
            newH:          height,
            handle,
            keepRatio,
          }),
        };
      }

      updateElement(elementId, updates);
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
