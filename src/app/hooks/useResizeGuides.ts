// ─────────────────────────────────────────────────────────────────────────────
// useResizeGuides — V45
//
// Computes resize dimension-match guides and snap during an element resize drag.
// Snap sources: all other non-group canvas elements + the canvas itself (600×600).
//
// Called once per mousemove inside useResizeHandler.
// ─────────────────────────────────────────────────────────────────────────────

import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import type { ResizeHandle } from '../utils/computeResize';

export const RESIZE_SNAP_THRESHOLD = 6; // px (canvas units) to activate snap

const CANVAS_WIDTH  = 600;
const CANVAS_HEIGHT = 600;

// ─── Types ────────────────────────────────────────────────────────

export interface ResizeGuide {
  orientation: 'horizontal' | 'vertical';
  /** Position of the guide line in canvas coordinates (px) */
  position:    number;
  matchType:   'width' | 'height';
  /** The snapped value (displayed in the label) */
  matchValue:  number;
  /** Human-readable name of the reference element */
  sourceName:  string;
}

// ─── Handle helpers ───────────────────────────────────────────────

/** True for handles that move the LEFT edge (so the RIGHT edge is the anchor) */
export function isLeftHandle(handle: ResizeHandle): boolean {
  return ['top-left', 'middle-left', 'bottom-left'].includes(handle);
}

/** True for handles that move the TOP edge (so the BOTTOM edge is the anchor) */
export function isTopHandle(handle: ResizeHandle): boolean {
  return ['top-left', 'top-center', 'top-right'].includes(handle);
}

// ─── Hook ─────────────────────────────────────────────────────────

export function useResizeGuides() {
  const { canvasElements } = useDesignWorkspace();

  function computeResizeGuides(
    resizingId: string,
    currentW:   number,
    currentH:   number,
    currentX:   number,
    currentY:   number,
    handle:     ResizeHandle,
  ): { guides: ResizeGuide[]; snappedW: number; snappedH: number } {
    const guides: ResizeGuide[] = [];
    let snappedW = currentW;
    let snappedH = currentH;

    // ── V46: Build excluded-IDs set ────────────────────────────────
    // Always exclude the element being resized.
    // If it is a group: also exclude all its children.
    // If it is a child: also exclude all siblings and the parent group.
    const resizingEl  = canvasElements.find(el => el.id === resizingId);
    const excludedIds = new Set<string>([resizingId]);

    if (resizingEl?.type === 'group') {
      // Exclude children of this group
      canvasElements
        .filter(el => el.groupId === resizingId)
        .forEach(c => excludedIds.add(c.id));
    }

    if (resizingEl?.groupId) {
      // Exclude siblings and parent
      canvasElements
        .filter(el => el.groupId === resizingEl.groupId)
        .forEach(s => excludedIds.add(s.id));
      excludedIds.add(resizingEl.groupId);
    }

    // Sources: canvas dimensions first, then non-excluded non-group elements
    const sources = [
      { id: '__canvas__', name: 'Canvas', width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      ...canvasElements
        .filter(el => !excludedIds.has(el.id) && el.type !== 'group')
        .map(el => ({
          id:     el.id,
          name:   el.name ?? el.type,
          width:  el.width,
          height: el.height,
        })),
    ];

    // De-duplicate by value so we never emit two guides at the same measurement
    const seenWidths  = new Set<number>();
    const seenHeights = new Set<number>();

    for (const src of sources) {
      // ── Width snap ──────────────────────────────────────────────
      if (!seenWidths.has(src.width)) {
        const deltaW = Math.abs(currentW - src.width);
        if (deltaW <= RESIZE_SNAP_THRESHOLD) {
          seenWidths.add(src.width);
          snappedW = src.width;

          // Guide line shows the moving edge after snap:
          //   left handle  → left edge moves  → guide at new left edge
          //   right handle → right edge moves → guide at new right edge
          const guideX = isLeftHandle(handle)
            ? currentX + currentW - src.width   // new left-edge position
            : currentX + src.width;             // new right-edge position

          guides.push({
            orientation: 'vertical',
            position:    guideX,
            matchType:   'width',
            matchValue:  src.width,
            sourceName:  src.name,
          });
        }
      }

      // ── Height snap ─────────────────────────────────────────────
      if (!seenHeights.has(src.height)) {
        const deltaH = Math.abs(currentH - src.height);
        if (deltaH <= RESIZE_SNAP_THRESHOLD) {
          seenHeights.add(src.height);
          snappedH = src.height;

          // Guide line shows the moving edge after snap:
          //   top handle    → top edge moves    → guide at new top edge
          //   bottom handle → bottom edge moves → guide at new bottom edge
          const guideY = isTopHandle(handle)
            ? currentY + currentH - src.height   // new top-edge position
            : currentY + src.height;             // new bottom-edge position

          guides.push({
            orientation: 'horizontal',
            position:    guideY,
            matchType:   'height',
            matchValue:  src.height,
            sourceName:  src.name,
          });
        }
      }
    }

    return { guides, snappedW, snappedH };
  }

  return { computeResizeGuides };
}