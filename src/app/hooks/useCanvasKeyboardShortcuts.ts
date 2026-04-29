import { useEffect, useRef } from 'react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import type { CanvasElement } from '../store/useDesignWorkspaceStore';
import { zoomBridge } from '../utils/canvasZoomBridge';

// V65: Arrow-key movement step sizes
const ARROW_STEP       = 1;   // px — plain arrow
const ARROW_STEP_LARGE = 10;  // px — Shift + arrow

/** Typed clipboard — a single element OR a full group (container + children). */
type ClipboardEntry =
  | { kind: 'single'; el: CanvasElement }
  | { kind: 'group';  container: CanvasElement; children: CanvasElement[] };

export function useCanvasKeyboardShortcuts() {
  const {
    insertElement,
    insertGroupWithChildren,
    deleteElement,
    clearSelection,
    groupElements,
    ungroupElements,
    exitGroup,
    setSelection,
    undo,
    redo,
    cancelTextEdit,
    updateElement,
    commitHistory,
  } = useDesignWorkspace();

  // Session-only clipboard — never persisted
  const clipboardRef = useRef<ClipboardEntry | null>(null);

  // Live ref so the stable effect closure always reads current state
  const liveRef = useRef({
    selectedElementIds: [] as string[],
    canvasElements:     [] as CanvasElement[],
    editingGroupId:     null as string | null,
    editingTextId:      null as string | null,
  });
  const { selectedElementIds, canvasElements, editingGroupId, editingTextId } = useDesignWorkspace();
  liveRef.current = { selectedElementIds, canvasElements, editingGroupId, editingTextId };

  const cancelTextEditRef = useRef(cancelTextEdit);
  cancelTextEditRef.current = cancelTextEdit;

  // V65: Debounce timer for arrow-key commitHistory
  // Multiple consecutive arrow presses → ONE undo snapshot after 500 ms of silence
  const arrowCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable action refs for use inside the effect without adding to deps
  const updateElementRef  = useRef(updateElement);
  updateElementRef.current = updateElement;
  const commitHistoryRef  = useRef(commitHistory);
  commitHistoryRef.current = commitHistory;

  useEffect(() => {
    function scheduleArrowCommit() {
      if (arrowCommitTimerRef.current) clearTimeout(arrowCommitTimerRef.current);
      arrowCommitTimerRef.current = setTimeout(() => {
        commitHistoryRef.current();
        arrowCommitTimerRef.current = null;
      }, 500);
    }

    function handleKeyDown(e: KeyboardEvent) {
      // Never intercept keypresses while typing
      const target = e.target as HTMLElement;
      const tag    = target?.tagName?.toLowerCase();
      if (
        tag === 'input' || tag === 'textarea' || tag === 'select' ||
        target?.isContentEditable
      ) return;

      // V55: While inline text editing, only Escape is processed globally
      // (Enter / typing is handled by the textarea's own onKeyDown)
      if (liveRef.current.editingTextId) {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelTextEditRef.current();
        }
        // Block ALL other canvas shortcuts during text edit
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;
      const { selectedElementIds, canvasElements } = liveRef.current;

      // Convenience: first selected element
      const primaryId = selectedElementIds[0] ?? null;
      const primaryEl = primaryId
        ? canvasElements.find(el => el.id === primaryId) ?? null
        : null;

      // Helper: get all children of a group
      const groupChildren = (groupId: string) =>
        canvasElements.filter(c => c.groupId === groupId);

      // ── V65: Arrow keys — move selected elements ──────────────────────────
      const arrowKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
      if (arrowKeys.includes(e.key) && !isMod && selectedElementIds.length > 0) {
        e.preventDefault(); // prevent page scroll

        const step  = e.shiftKey ? ARROW_STEP_LARGE : ARROW_STEP;
        const dx    = e.key === 'ArrowLeft'  ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy    = e.key === 'ArrowUp'    ? -step : e.key === 'ArrowDown'  ? step : 0;

        selectedElementIds.forEach(id => {
          const el = canvasElements.find(el => el.id === id);
          if (!el) return;

          if (el.type === 'group') {
            // Move all children; group bounds recalculate automatically (V47)
            groupChildren(id).forEach(child => {
              updateElementRef.current(child.id, { x: child.x + dx, y: child.y + dy });
            });
            return;
          }

          updateElementRef.current(id, { x: el.x + dx, y: el.y + dy });
        });

        scheduleArrowCommit();
        return;
      }

      // ── Cmd/Ctrl + Z — Undo ───────────────────────────────────────────────
      if (isMod && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      // ── Cmd/Ctrl + Shift + Z — Redo ───────────────────────────────────────
      if (isMod && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
        return;
      }

      // ── Cmd/Ctrl + Y — Redo (Windows alternative) ─────────────────────────
      if (isMod && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      // ── Cmd/Ctrl + A — Select all ─────────────────────────────────────────
      if (isMod && e.key === 'a') {
        e.preventDefault();
        const { canvasElements, editingGroupId } = liveRef.current;

        if (editingGroupId) {
          // Inside a group being edited → select only its direct children
          const childIds = canvasElements
            .filter(el => el.groupId === editingGroupId)
            .map(el => el.id);
          setSelection(childIds);
        } else {
          // Normal mode → select all top-level elements:
          // elements without a groupId (includes group containers, excludes children)
          const topLevelIds = canvasElements
            .filter(el => !el.groupId)
            .map(el => el.id);
          setSelection(topLevelIds);
        }
        return;
      }

      // ── Delete / Backspace — delete all selected ──────────────────
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        selectedElementIds.forEach(id => {
          const el = canvasElements.find(c => c.id === id);
          if (el?.type === 'group') {
            // Delete all children; when the last child is removed the group
            // container auto-removes (0 children → group removed).
            groupChildren(id).forEach(c => deleteElement(c.id));
            // Safety: delete the container in case the group had no children
            deleteElement(id);
          } else {
            deleteElement(id);
          }
        });
        return;
      }

      // ── Escape — exit group or deselect all ──────────────────────
      if (e.key === 'Escape') {
        if (liveRef.current.editingGroupId) {
          exitGroup();
          return;
        }
        if (selectedElementIds.length > 0) {
          clearSelection();
          return;
        }
        return;
      }

      // ── Cmd/Ctrl + C — Copy ───────────────────────────────────────
      if (isMod && e.key === 'c' && primaryEl) {
        e.preventDefault();
        if (primaryEl.type === 'group') {
          clipboardRef.current = {
            kind:      'group',
            container: { ...primaryEl },
            children:  groupChildren(primaryEl.id).map(c => ({ ...c })),
          };
        } else {
          clipboardRef.current = { kind: 'single', el: { ...primaryEl } };
        }
        return;
      }

      // ── Cmd/Ctrl + X — Cut ───────────────────────────────────────
      if (isMod && e.key === 'x' && primaryEl) {
        e.preventDefault();
        if (primaryEl.type === 'group') {
          // Snapshot before deletion
          const children = groupChildren(primaryEl.id).map(c => ({ ...c }));
          clipboardRef.current = {
            kind:      'group',
            container: { ...primaryEl },
            children,
          };
          // Delete container first (unlinks children), then remove children
          deleteElement(primaryEl.id);
          children.forEach(c => deleteElement(c.id));
        } else {
          clipboardRef.current = { kind: 'single', el: { ...primaryEl } };
          deleteElement(primaryEl.id);
        }
        return;
      }

      // ── Cmd/Ctrl + V — Paste (+16 px offset) ─────────────────────
      if (isMod && e.key === 'v' && clipboardRef.current) {
        e.preventDefault();
        const cb = clipboardRef.current;
        if (cb.kind === 'group') {
          insertGroupWithChildren(cb.container, cb.children, 16, 16);
        } else {
          const { id: _id, ...rest } = cb.el;
          insertElement({ ...rest, x: rest.x + 16, y: rest.y + 16 });
        }
        return;
      }

      // ── Cmd/Ctrl + D — Duplicate (+16 px offset) ──────────────────
      if (isMod && e.key === 'd' && primaryEl) {
        e.preventDefault();
        if (primaryEl.type === 'group') {
          // Read children from live state so we always get the latest positions
          const children = groupChildren(primaryEl.id);
          insertGroupWithChildren(primaryEl, children, 16, 16);
        } else {
          const { id: _id, ...rest } = primaryEl;
          insertElement({ ...rest, x: rest.x + 16, y: rest.y + 16 });
        }
        return;
      }

      // ── Cmd/Ctrl + Shift + H — Fit to screen ──────────────────────
      if (isMod && e.shiftKey && e.key === 'h') {
        e.preventDefault();
        zoomBridge.fitToScreen();
        return;
      }

      // ── Cmd/Ctrl + = or + — Zoom in ───────────────────────────────
      // e.key === '=' is the = key; e.key === '+' is Shift+= (the + key)
      if (isMod && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomBridge.zoomBy(0.1);
        return;
      }

      // ── Cmd/Ctrl + - — Zoom out ────────────────────────────────────
      if (isMod && e.key === '-') {
        e.preventDefault();
        zoomBridge.zoomBy(-0.1);
        return;
      }

      // ── Cmd/Ctrl + 0 — Reset zoom to 100% ─────────────────────────
      if (isMod && e.key === '0') {
        e.preventDefault();
        zoomBridge.resetZoom();
        return;
      }

      // ── Cmd/Ctrl + Shift + G — Ungroup ───────────────────────────
      if (isMod && e.shiftKey && e.key === 'g') {
        e.preventDefault();
        const { selectedElementIds: ids, canvasElements: els } = liveRef.current;
        ids.forEach(id => {
          const el = els.find(c => c.id === id);
          if (el?.type === 'group') ungroupElements(id);
        });
        return;
      }

      // ── Cmd/Ctrl + G — Group (≥2 selected) ───────────────────────
      if (isMod && !e.shiftKey && e.key === 'g') {
        e.preventDefault();
        if (selectedElementIds.length >= 2) {
          groupElements(selectedElementIds);
        }
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // Stable action refs only — live state is read through liveRef
  }, [insertElement, insertGroupWithChildren, deleteElement, clearSelection, groupElements, ungroupElements, exitGroup, setSelection, undo, redo, cancelTextEdit]);

  // Cleanup the arrow debounce timer on unmount
  useEffect(() => {
    return () => {
      if (arrowCommitTimerRef.current) clearTimeout(arrowCommitTimerRef.current);
    };
  }, []);
}