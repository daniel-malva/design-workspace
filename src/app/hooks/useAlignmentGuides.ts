import { useCallback, useEffect, useRef } from 'react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';

// ── Types ─────────────────────────────────────────────────────────

export interface AlignmentGuide {
  orientation: 'horizontal' | 'vertical';
  position: number;          // px within the CanvasFrame coordinate space
  type: 'edge' | 'center';   // drives colour: #5B4EFF vs #FF6B6B
}

// ── Constants ─────────────────────────────────────────────────────

const SNAP_THRESHOLD = 5;   // px — max distance that activates snap
const CANVAS_W       = 600;
const CANVAS_H       = 600;

// ── Hook ──────────────────────────────────────────────────────────

export function useAlignmentGuides() {
  const { canvasElements, selectedElementIds } = useDesignWorkspace();

  // Keep elements and selection in refs so computeGuides / getEffectiveBounds
  // are stable functions that always read latest values inside window event listeners.
  const elementsRef     = useRef(canvasElements);
  const selectedIdsRef  = useRef(selectedElementIds);
  useEffect(() => { elementsRef.current    = canvasElements;     }, [canvasElements]);
  useEffect(() => { selectedIdsRef.current = selectedElementIds; }, [selectedElementIds]);

  // ── V46: Effective bounds ────────────────────────────────────────
  // For a group element, returns the bounding box derived from its children
  // (the group container coordinates can lag behind during a live drag).
  // For non-group elements, returns the element's own x/y/width/height.
  const getEffectiveBounds = useCallback(
    (elementId: string): { x: number; y: number; width: number; height: number } => {
      const el = elementsRef.current.find(e => e.id === elementId);
      if (!el) return { x: 0, y: 0, width: 0, height: 0 };

      if (el.type === 'group') {
        const children = elementsRef.current.filter(e => e.groupId === el.id);
        if (children.length === 0) {
          return { x: el.x, y: el.y, width: el.width, height: el.height };
        }
        const minX = Math.min(...children.map(c => c.x));
        const minY = Math.min(...children.map(c => c.y));
        const maxX = Math.max(...children.map(c => c.x + c.width));
        const maxY = Math.max(...children.map(c => c.y + c.height));
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      }

      return { x: el.x, y: el.y, width: el.width, height: el.height };
    },
    [], // stable — reads from elementsRef which is always fresh via the useEffect
  );

  // ── V46 + V48: computeGuides — group-aware + multi-selection aware ────────
  //
  // draggingId can be:
  //   - A real element ID → single-element drag or group drag
  //   - '__multi__'       → V48 multi-selection drag; excluded set = all selectedElementIds
  //
  const computeGuides = useCallback(
    (
      draggingId: string,
      dragX:      number,
      dragY:      number,
      dragW:      number,
      dragH:      number,
    ): { guides: AlignmentGuide[]; snappedX: number; snappedY: number } => {
      const guides: AlignmentGuide[] = [];
      let snappedX = dragX;
      let snappedY = dragY;

      // Reference points of the dragged element (or group/multi bounding box)
      const dp = {
        left:    dragX,
        centerX: dragX + dragW / 2,
        right:   dragX + dragW,
        top:     dragY,
        centerY: dragY + dragH / 2,
        bottom:  dragY + dragH,
      };

      // ── Build excluded IDs ──────────────────────────────────────
      // V48: '__multi__' → exclude all currently selected elements
      // V46: group drag → exclude the group element + all its children
      // Default: exclude only the single dragging element
      const isMulti = draggingId === '__multi__';
      const draggingEl = isMulti
        ? undefined
        : elementsRef.current.find(e => e.id === draggingId);
      const isGroup = draggingEl?.type === 'group';

      const excludedIds = new Set<string>(
        isMulti ? selectedIdsRef.current : [draggingId],
      );

      if (isGroup) {
        // Exclude all children of the group being dragged
        elementsRef.current
          .filter(e => e.groupId === draggingId)
          .forEach(c => excludedIds.add(c.id));
      }

      // V48: For multi-selection, also exclude parent groups of any selected element
      // (prevents snapping against the group that owns one of the selected children)
      if (isMulti) {
        elementsRef.current
          .filter(el => excludedIds.has(el.id) && el.groupId)
          .forEach(el => excludedIds.add(el.groupId!));
      }

      // Alignment sources: canvas frame borders + all non-excluded, non-group elements
      const sources = [
        {
          left: 0,         centerX: CANVAS_W / 2, right: CANVAS_W,
          top:  0,         centerY: CANVAS_H / 2, bottom: CANVAS_H,
        },
        ...elementsRef.current
          .filter(el => !excludedIds.has(el.id) && el.type !== 'group')
          .map(el => ({
            left:    el.x,
            centerX: el.x + el.width  / 2,
            right:   el.x + el.width,
            top:     el.y,
            centerY: el.y + el.height / 2,
            bottom:  el.y + el.height,
          })),
      ];

      for (const src of sources) {
        // ── Vertical guides (lines running top→bottom at a fixed X) ──

        const vertChecks: [keyof typeof dp, number, 'edge' | 'center'][] = [
          ['left',    src.left,    'edge'],
          ['centerX', src.centerX, 'center'],
          ['right',   src.right,   'edge'],
          ['right',   src.left,    'edge'],   // drag-right aligns with src-left
          ['left',    src.right,   'edge'],   // drag-left aligns with src-right
        ];

        for (const [dragPoint, srcPos, type] of vertChecks) {
          if (Math.abs(dp[dragPoint] - srcPos) <= SNAP_THRESHOLD) {
            if (dragPoint === 'left')    snappedX = srcPos;
            if (dragPoint === 'centerX') snappedX = srcPos - dragW / 2;
            if (dragPoint === 'right')   snappedX = srcPos - dragW;

            guides.push({ orientation: 'vertical', position: srcPos, type });
          }
        }

        // ── Horizontal guides (lines running left→right at a fixed Y) ──

        const horizChecks: [keyof typeof dp, number, 'edge' | 'center'][] = [
          ['top',     src.top,     'edge'],
          ['centerY', src.centerY, 'center'],
          ['bottom',  src.bottom,  'edge'],
          ['bottom',  src.top,     'edge'],   // drag-bottom aligns with src-top
          ['top',     src.bottom,  'edge'],   // drag-top aligns with src-bottom
        ];

        for (const [dragPoint, srcPos, type] of horizChecks) {
          if (Math.abs(dp[dragPoint] - srcPos) <= SNAP_THRESHOLD) {
            if (dragPoint === 'top')     snappedY = srcPos;
            if (dragPoint === 'centerY') snappedY = srcPos - dragH / 2;
            if (dragPoint === 'bottom')  snappedY = srcPos - dragH;

            guides.push({ orientation: 'horizontal', position: srcPos, type });
          }
        }
      }

      // Deduplicate guides at the same position/orientation
      const seen = new Set<string>();
      const uniqueGuides = guides.filter(g => {
        const key = `${g.orientation}-${g.position}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return { guides: uniqueGuides, snappedX, snappedY };
    },
    [], // stable — always reads via elementsRef / selectedIdsRef
  );

  return { computeGuides, getEffectiveBounds };
}
