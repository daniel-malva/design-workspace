import { useRef, useState, useEffect } from 'react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import type { CanvasElement, CanvasElementType } from '../store/useDesignWorkspaceStore';
import { useAlignmentGuides } from '../hooks/useAlignmentGuides';
import type { AlignmentGuide } from '../hooks/useAlignmentGuides';

const DRAG_THRESHOLD  = 3;    // px (screen) before drag fires
const DOUBLE_CLICK_MS = 350;  // ms window for double-click
const DOUBLE_CLICK_PX = 8;    // px (screen) max distance between two clicks — raised for reliability

/** Text element types that support inline editing — module-level constant */
const INLINE_EDIT_TEXT_TYPES: CanvasElementType[] = [
  'text-header', 'text-subheader', 'text-body', 'text-template',
];

export interface MarqueeRect { x: number; y: number; w: number; h: number; }

interface InteractionOverlayProps {
  frameRef: React.RefObject<HTMLDivElement | null>;
  onMarqueeChange: (m: MarqueeRect | null) => void;
  onGuidesChange:  (guides: AlignmentGuide[]) => void;
  /** V53: called whenever the drag target group changes (for canvas highlight) */
  onDragTargetChange?: (groupId: string | null) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// InteractionOverlay — z-50 transparent div covering the entire CanvasFrame.
//
// V44: Double-click via lastClick ref (time + distance + same element).
// V44: No canvas clamp — elements may extend beyond the artboard.
// V46: Alignment guides for single-element and group drag (snap + visual lines).
// V47: Group child editing — updateElement on child recalculates group bounds.
// V48: Multi-selection drag with guides via '__multi__' virtual ID.
//       Atomic enterGroupAndSelectChild (one state update, no flicker).
//       lastClick stores canvas coords for child hit-test on group double-click.
// V50: Alt+drag duplicates element (original stays, copy moves).
//       Alt+Shift+drag duplicates with axis-lock.
//       insertElementSilent / insertGroupWithChildrenSilent used so that
//       duplication + movement collapse into one undo step via commitHistory().
// V53: Canvas reparenting — when a single element is dragged into another
//       group's bounding box on mouseup, reparentElement is called.
//       onDragTargetChange fires each frame so CanvasFrame can show the highlight.
// V55: text elements open inline edit mode on double-click
// V62: Space-pan — holding spacebar turns the overlay into a pan surface;
//       cursor switches to grab/grabbing and mouse drags pan canvasOffset.
// ─────────────────────────────────────────────────────────────────────────────

export function InteractionOverlay({ frameRef, onMarqueeChange, onGuidesChange, onDragTargetChange }: InteractionOverlayProps) {
  const {
    canvasElements,
    layers,
    selectedElementIds,
    editingGroupId,
    setSelectedElement,
    selectElement,
    toggleElementSelection,
    clearSelection,
    setSelection,
    enterGroup,
    exitGroup,
    enterGroupAndSelectChild,
    updateElement,
    commitHistory,
    insertElementSilent,
    insertGroupWithChildrenSilent,
    reparentElement,
    canvasScale,
    canvasOffset,
    setCanvasOffset,
    startTextEdit,
    commitTextEdit,
    editingTextId,
  } = useDesignWorkspace();

  const { computeGuides, getEffectiveBounds } = useAlignmentGuides();

  // ── Live refs — closures always read current values ──────────────────────
  const scaleRef              = useRef(canvasScale);
  scaleRef.current            = canvasScale;
  const canvasOffsetRef       = useRef(canvasOffset);
  canvasOffsetRef.current     = canvasOffset;
  const elementsRef           = useRef(canvasElements);
  elementsRef.current         = canvasElements;
  const selectedIdsRef        = useRef(selectedElementIds);
  selectedIdsRef.current      = selectedElementIds;
  const editingGroupRef       = useRef(editingGroupId);
  editingGroupRef.current     = editingGroupId;
  const guidesRef             = useRef(computeGuides);
  guidesRef.current           = computeGuides;
  const getEffBoundsRef       = useRef(getEffectiveBounds);
  getEffBoundsRef.current     = getEffectiveBounds;

  // Stable action refs — closures capture the ref object (stable), not the value
  const enterGroupRef                = useRef(enterGroup);
  enterGroupRef.current              = enterGroup;
  const exitGroupRef                 = useRef(exitGroup);
  exitGroupRef.current               = exitGroup;
  const selectElementRef             = useRef(selectElement);
  selectElementRef.current           = selectElement;
  const enterGroupAndSelectChildRef  = useRef(enterGroupAndSelectChild);
  enterGroupAndSelectChildRef.current = enterGroupAndSelectChild;
  const insertElementSilentRef       = useRef(insertElementSilent);
  insertElementSilentRef.current     = insertElementSilent;
  const insertGroupSilentRef         = useRef(insertGroupWithChildrenSilent);
  insertGroupSilentRef.current       = insertGroupWithChildrenSilent;
  const setSelectionRef              = useRef(setSelection);
  setSelectionRef.current            = setSelection;
  const reparentElementRef           = useRef(reparentElement);
  reparentElementRef.current         = reparentElement;
  const onDragTargetChangeRef        = useRef(onDragTargetChange);
  onDragTargetChangeRef.current      = onDragTargetChange;
  const startTextEditRef             = useRef(startTextEdit);
  startTextEditRef.current           = startTextEdit;
  const commitTextEditRef            = useRef(commitTextEdit);
  commitTextEditRef.current          = commitTextEdit;
  const editingTextIdRef             = useRef(editingTextId);
  editingTextIdRef.current           = editingTextId;

  // ── V50: Alt key tracking for copy cursor ───────────────────────────────
  const [altActive, setAltActive] = useState(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Alt') setAltActive(true);  };
    const onKeyUp   = (e: KeyboardEvent) => { if (e.key === 'Alt') setAltActive(false); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
    };
  }, []);

  // ── V62: Spacebar pan mode ───────────────────────────────────────────────
  // Holding Space turns the overlay into a pan surface regardless of what is
  // under the cursor. Released on keyup or when the window loses focus.
  const [isSpaceHeld,    setIsSpaceHeld]    = useState(false);
  const [isSpaceDragging, setIsSpaceDragging] = useState(false);
  const isSpaceHeldRef = useRef(false);
  isSpaceHeldRef.current = isSpaceHeld;

  useEffect(() => {
    function isInputActive() {
      const el  = document.activeElement as HTMLElement | null;
      const tag = el?.tagName.toLowerCase();
      return (
        tag === 'input' || tag === 'textarea' || tag === 'select' ||
        el?.isContentEditable === true
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' && !e.repeat && !isInputActive()) {
        e.preventDefault(); // prevent page scroll
        setIsSpaceHeld(true);
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') {
        setIsSpaceHeld(false);
      }
    }

    // Also cancel if window loses focus mid-hold
    function onBlur() { setIsSpaceHeld(false); }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    window.addEventListener('blur',    onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
      window.removeEventListener('blur',    onBlur);
    };
  }, []);

  // ── V62: Pan the canvas while space is held ──────────────────────────────
  function startSpacePan(e: React.MouseEvent) {
    e.stopPropagation();

    setIsSpaceDragging(true);

    const startX     = e.clientX;
    const startY     = e.clientY;
    const originCopy = canvasOffsetRef.current ?? { x: 0, y: 0 }; // V66: null guard

    function onMouseMove(ev: MouseEvent) {
      setCanvasOffset({
        x: originCopy.x + (ev.clientX - startX),
        y: originCopy.y + (ev.clientY - startY),
      });
    }

    function onMouseUp() {
      setIsSpaceDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
  }

  // ── V44 + V48: Double-click detection ───────────────────────────────────
  // Stores time, element ID, screen coords (for distance check), and canvas
  // coords (for child hit-test when double-clicking a group container).
  const lastClick = useRef<{
    time:    number;
    id:      string | null;
    screenX: number;
    screenY: number;
    canvasX: number;
    canvasY: number;
  }>({ time: 0, id: null, screenX: 0, screenY: 0, canvasX: 0, canvasY: 0 });

  // ── Top-level mouse handler ──────────────────────────────────────────────
  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;

    // ── V62: Space pan takes priority over all element interactions ─────────
    if (isSpaceHeldRef.current) {
      startSpacePan(e);
      return;
    }

    const rect  = frameRef.current!.getBoundingClientRect();
    const scale = scaleRef.current;

    const canvasX = (e.clientX - rect.left) / scale;
    const canvasY = (e.clientY - rect.top)  / scale;
    const screenX = e.clientX;
    const screenY = e.clientY;
    const now     = Date.now();

    // V55: If a text element is being edited inline, check whether the click
    // is OUTSIDE the editing element's bounds. If so, commit and continue.
    // (The textarea's own onBlur also commits, but this is a belt-and-suspenders guard.)
    const editingId = editingTextIdRef.current;
    if (editingId) {
      const editingEl = elementsRef.current.find(el => el.id === editingId);
      if (editingEl) {
        const clickedInside =
          canvasX >= editingEl.x && canvasX <= editingEl.x + editingEl.width &&
          canvasY >= editingEl.y && canvasY <= editingEl.y + editingEl.height;
        if (clickedInside) {
          // Click is inside the textarea — let the textarea handle it, do not process drag/select
          return;
        }
        // Click outside — onBlur will commit; we fall through to normal processing
      }
    }

    const visibleIds = layers.length > 0
      ? new Set(layers.filter(l => l.visible && !l.locked).map(l => l.id))
      : null;

    const activeGroupId = editingGroupRef.current;
    const hitElement = [...elementsRef.current]
      .reverse()
      .find(el => {
        if (visibleIds && !visibleIds.has(el.id)) return false;
        if (activeGroupId && el.id === activeGroupId) return false;
        return canvasX >= el.x
            && canvasX <= el.x + el.width
            && canvasY >= el.y
            && canvasY <= el.y + el.height;
      });

    const prev      = lastClick.current;
    const timeDelta = now - prev.time;
    const distDelta = Math.hypot(screenX - prev.screenX, screenY - prev.screenY);
    const sameId    = prev.id === (hitElement?.id ?? null);

    const isDoubleClick =
      timeDelta < DOUBLE_CLICK_MS &&
      distDelta < DOUBLE_CLICK_PX &&
      sameId;

    lastClick.current = { time: now, id: hitElement?.id ?? null, screenX, screenY, canvasX, canvasY };

    if (isDoubleClick) {
      handleDoubleClickElement(hitElement ?? null);
      return;
    }

    if (!hitElement) {
      handleEmptyAreaClick(e, canvasX, canvasY, rect);
      return;
    }

    handleSingleClickElement(e, hitElement, canvasX, canvasY, rect);
  }

  // ── Double-click: enter group / select child / start text edit ───────────
  // V55: text elements open inline edit mode on double-click
  function handleDoubleClickElement(element: CanvasElement | null) {
    if (!element) return;

    // ── Child of a group ─────────────────────────────────────────────────
    if (element.groupId) {
      enterGroupAndSelectChildRef.current(element.groupId, element.id);
      // If the child is a text element, also start inline editing
      if (INLINE_EDIT_TEXT_TYPES.includes(element.type)) {
        startTextEditRef.current(element.id);
      }
      return;
    }

    // ── Top-level text element ────────────────────────────────────────────
    if (INLINE_EDIT_TEXT_TYPES.includes(element.type)) {
      selectElementRef.current(element.id);
      startTextEditRef.current(element.id);
      return;
    }

    // ── Group container ───────────────────────────────────────────────────
    if (element.type === 'group') {
      const { canvasX, canvasY } = lastClick.current;
      const children = elementsRef.current
        .filter(el => el.groupId === element.id)
        .reverse();

      const hitChild = children.find(c =>
        canvasX >= c.x && canvasX <= c.x + c.width &&
        canvasY >= c.y && canvasY <= c.y + c.height,
      );

      if (hitChild) {
        enterGroupAndSelectChildRef.current(element.id, hitChild.id);
        // If the hit child is text, start inline editing
        if (INLINE_EDIT_TEXT_TYPES.includes(hitChild.type)) {
          startTextEditRef.current(hitChild.id);
        }
      } else {
        enterGroupRef.current(element.id);
      }
      return;
    }
  }

  // ── Single click (group-aware) ───────────────────────────────────────────
  function handleSingleClickElement(
    e: React.MouseEvent,
    element: CanvasElement,
    _canvasX: number,
    _canvasY: number,
    rect: DOMRect,
  ) {
    if (e.shiftKey) {
      toggleElementSelection(element.id);
      return;
    }

    const editingId = editingGroupRef.current;

    if (editingId) {
      if (element.groupId === editingId) {
        selectElement(element.id);
        startSingleDrag(e, element, rect);
      } else if (element.id === editingId) {
        startGroupElementDrag(e, element);
      } else {
        exitGroupRef.current();
        if (!element.groupId) {
          setSelectedElement(element.id, element.type);
        }
      }
      return;
    }

    if (element.groupId) {
      const groupEl = elementsRef.current.find(el => el.id === element.groupId);
      if (groupEl) {
        const isGroupAlreadySelected = selectedIdsRef.current.includes(groupEl.id);
        if (!isGroupAlreadySelected) {
          setSelectedElement(groupEl.id, 'group');
        }
        startGroupElementDrag(e, groupEl);
      }
      return;
    }

    const currentIds    = selectedIdsRef.current;
    const isInSelection = currentIds.includes(element.id);
    const isMulti       = currentIds.length > 1 && isInSelection;

    if (!isInSelection) {
      setSelectedElement(element.id, element.type);
    }

    if (isMulti) {
      startMultiDrag(e, () => {
        setSelectedElement(element.id, element.type);
      });
    } else if (element.type === 'group') {
      startGroupElementDrag(e, element);
    } else {
      startSingleDrag(e, element, rect);
    }
  }

  // ── Clicked on empty canvas area ────────────────────────────────────────
  function handleEmptyAreaClick(
    e: React.MouseEvent,
    canvasX: number,
    canvasY: number,
    rect: DOMRect,
  ) {
    if (editingGroupRef.current) {
      exitGroupRef.current();
      return;
    }

    const currentIds = selectedIdsRef.current;

    if (currentIds.length > 1) {
      const selected = elementsRef.current.filter(el => currentIds.includes(el.id));
      if (selected.length > 0) {
        const minX = Math.min(...selected.map(el => el.x));
        const minY = Math.min(...selected.map(el => el.y));
        const maxX = Math.max(...selected.map(el => el.x + el.width));
        const maxY = Math.max(...selected.map(el => el.y + el.height));

        if (canvasX >= minX && canvasX <= maxX && canvasY >= minY && canvasY <= maxY) {
          startMultiDrag(e);
          return;
        }
      }
    }

    clearSelection();
    startMarquee(canvasX, canvasY, rect);
  }

  // ── V50: Drag a group element (Alt+drag duplicates the entire group) ─────
  function startGroupElementDrag(e: React.MouseEvent, groupElement: CanvasElement) {
    const groupId = groupElement.id;

    const altHeld   = e.altKey;
    const shiftHeld = e.shiftKey;

    // Effective bounds of the group (derived from children — more accurate than container x/y)
    const bounds   = getEffBoundsRef.current(groupId);
    const children = elementsRef.current.filter(el => el.groupId === groupId);
    const involved  = [groupElement, ...children];

    // activeDragList: (id, startX, startY) of every element to move each frame.
    // Starts as the originals; after Alt duplication switches to the copies.
    let activeDragList = involved.map(el => ({ id: el.id, startX: el.x, startY: el.y }));
    // activeDragId: the container ID used for guide exclusion
    let activeDragId   = groupId;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    let dragging   = false;
    let duplicated = false;

    function onMouseMove(ev: MouseEvent) {
      const rawDx = (ev.clientX - startClientX) / scaleRef.current;
      const rawDy = (ev.clientY - startClientY) / scaleRef.current;

      if (!dragging && Math.hypot(ev.clientX - startClientX, ev.clientY - startClientY) > DRAG_THRESHOLD) {
        dragging = true;

        // ── Alt+drag: duplicate the entire group once at drag threshold ──
        if (altHeld && !duplicated) {
          duplicated = true;
          const result = insertGroupSilentRef.current(groupElement, children);
          activeDragId   = result.containerId;
          // Build new move list: new container + new children at original positions
          activeDragList = [
            { id: result.containerId, startX: groupElement.x, startY: groupElement.y },
            ...children.map((child, i) => ({
              id:     result.childIds[i],
              startX: child.x,
              startY: child.y,
            })),
          ];
        }
      }

      if (!dragging) return;

      // Axis-lock for Alt+Shift
      let finalDx = rawDx;
      let finalDy = rawDy;
      if (altHeld && shiftHeld) {
        if (Math.abs(rawDx) >= Math.abs(rawDy)) finalDy = 0;
        else                                      finalDx = 0;
      }

      const rawX = bounds.x + finalDx;
      const rawY = bounds.y + finalDy;

      const { guides, snappedX, snappedY } = guidesRef.current(
        activeDragId, rawX, rawY, bounds.width, bounds.height,
      );
      onGuidesChange(guides);

      const snapDx = snappedX - bounds.x;
      const snapDy = snappedY - bounds.y;

      activeDragList.forEach(({ id, startX, startY }) => {
        updateElement(id, { x: startX + snapDx, y: startY + snapDy });
      });
    }

    function onMouseUp() {
      if (dragging) commitHistory();
      onGuidesChange([]);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
  }

  // ── V50: Drag a single element (Alt+drag duplicates it) ──────────────────
  function startSingleDrag(e: React.MouseEvent, element: CanvasElement, _rect: DOMRect) {
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startElX     = element.x;
    const startElY     = element.y;
    const { width, height } = element;

    const altHeld   = e.altKey;
    const shiftHeld = e.shiftKey;

    // activeDragId: which element moves. Starts as the original; after Alt
    // duplication switches to the duplicate's ID.
    let activeDragId = element.id;
    let dragging   = false;
    let duplicated = false;

    // V53: Track final canvas position for reparent hit-test
    let currentDragX = startElX;
    let currentDragY = startElY;
    // Track last drag target to avoid noisy state updates
    let lastTargetGroupId: string | null | undefined = undefined;

    function onMouseMove(ev: MouseEvent) {
      const rawDx = (ev.clientX - startClientX) / scaleRef.current;
      const rawDy = (ev.clientY - startClientY) / scaleRef.current;

      if (!dragging && Math.hypot(ev.clientX - startClientX, ev.clientY - startClientY) > DRAG_THRESHOLD) {
        dragging = true;

        // ── Alt+drag: create duplicate and drag it; original stays ────────
        if (altHeld && !duplicated) {
          duplicated   = true;
          activeDragId = insertElementSilentRef.current({
            ...element,
            x: startElX,
            y: startElY,
          });
        }
      }

      if (!dragging) return;

      // Axis-lock for Alt+Shift
      let finalDx = rawDx;
      let finalDy = rawDy;
      if (altHeld && shiftHeld) {
        if (Math.abs(rawDx) >= Math.abs(rawDy)) finalDy = 0;
        else                                      finalDx = 0;
      }

      const rawX = startElX + finalDx;
      const rawY = startElY + finalDy;

      const { guides, snappedX, snappedY } = guidesRef.current(
        activeDragId, rawX, rawY, width, height,
      );
      onGuidesChange(guides);

      currentDragX = snappedX;
      currentDragY = snappedY;

      updateElement(activeDragId, { x: snappedX, y: snappedY });

      // V53: Compute drag target group for canvas highlight
      const currentGroupId = element.groupId;
      const targetGroup = elementsRef.current
        .filter(el =>
          el.type === 'group' &&
          el.id !== currentGroupId &&
          el.id !== activeDragId &&
          currentDragX >= el.x && currentDragX <= el.x + el.width &&
          currentDragY >= el.y && currentDragY <= el.y + el.height
        )
        .pop();
      const newTargetId = targetGroup?.id ?? null;
      if (newTargetId !== lastTargetGroupId) {
        lastTargetGroupId = newTargetId;
        onDragTargetChangeRef.current?.(newTargetId);
      }
    }

    function onMouseUp() {
      if (dragging) {
        // V53: Reparenting hit-test on mouseup
        const currentGroupId = element.groupId ?? null;
        const targetGroup = elementsRef.current
          .filter(el =>
            el.type === 'group' &&
            el.id !== currentGroupId &&
            el.id !== activeDragId &&
            currentDragX >= el.x && currentDragX <= el.x + el.width &&
            currentDragY >= el.y && currentDragY <= el.y + el.height
          )
          .pop();

        if (targetGroup) {
          // Dropped inside a different group → reparent
          reparentElementRef.current(activeDragId, targetGroup.id);
        } else if (currentGroupId) {
          // Check if dragged completely outside the origin group
          const originGroup = elementsRef.current.find(el => el.id === currentGroupId);
          const isOutside = originGroup && (
            currentDragX < originGroup.x ||
            currentDragX > originGroup.x + originGroup.width ||
            currentDragY < originGroup.y ||
            currentDragY > originGroup.y + originGroup.height
          );
          if (isOutside) {
            // Promoted to top-level
            reparentElementRef.current(activeDragId, null);
          } else {
            // Stayed inside origin group — regular commit
            commitHistory();
          }
        } else {
          commitHistory();
        }

        // Clear canvas highlight
        onDragTargetChangeRef.current?.(null);
      }

      onGuidesChange([]);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
  }

  // ── V50: Multi-selection drag (Alt+drag duplicates all selected) ──────────
  //
  // Uses '__multi__' as the virtual dragging ID so computeGuides excludes ALL
  // selected elements (and their parent groups) from snap sources.
  // For group containers in the selection, the entire group (container + children)
  // is duplicated via insertGroupWithChildrenSilent.
  function startMultiDrag(
    e: React.MouseEvent | MouseEvent,
    onClickOnly?: () => void,
  ) {
    const currentIds  = selectedIdsRef.current;
    const allSelected = elementsRef.current.filter(el => currentIds.includes(el.id));
    if (allSelected.length === 0) return;

    const altHeld   = (e as MouseEvent).altKey;
    const shiftHeld = (e as MouseEvent).shiftKey;

    // Snapshot of each selected element's start position — used to build the
    // duplicate list and for displacement math.
    type SnapEntry = { el: CanvasElement; startX: number; startY: number };
    const originalSnapshots: SnapEntry[] = allSelected.map(el => ({
      el, startX: el.x, startY: el.y,
    }));

    // Virtual bounding box of the entire selection — used as guide reference.
    const groupMinX = Math.min(...allSelected.map(el => el.x));
    const groupMinY = Math.min(...allSelected.map(el => el.y));
    const groupMaxX = Math.max(...allSelected.map(el => el.x + el.width));
    const groupMaxY = Math.max(...allSelected.map(el => el.y + el.height));
    const groupW    = groupMaxX - groupMinX;
    const groupH    = groupMaxY - groupMinY;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    let dragging   = false;
    let duplicated = false;

    // activeMoveList: (id, startX, startY) for every element to move each frame.
    // Starts as the original selection; after Alt duplication switches to copies.
    // ⚠️ MUST include the children of any selected group containers — updateElement
    // on a container alone only moves the container div; children don't follow.
    type MoveEntry = { id: string; startX: number; startY: number };
    const activeMoveList: MoveEntry[] = [];
    for (const { el } of originalSnapshots) {
      activeMoveList.push({ id: el.id, startX: el.x, startY: el.y });
      if (el.type === 'group') {
        // Expand children at drag-start so they move with their container
        elementsRef.current
          .filter(c => c.groupId === el.id)
          .forEach(child => activeMoveList.push({ id: child.id, startX: child.x, startY: child.y }));
      }
    }
    // mutable so Alt+drag can swap it for the duplicate IDs
    let moveList = activeMoveList;

    function onMouseMove(ev: MouseEvent) {
      const rawDx = (ev.clientX - startClientX) / scaleRef.current;
      const rawDy = (ev.clientY - startClientY) / scaleRef.current;

      if (!dragging && Math.hypot(ev.clientX - startClientX, ev.clientY - startClientY) > DRAG_THRESHOLD) {
        dragging = true;

        // ── Alt+drag: duplicate every selected element / group ─────────────
        if (altHeld && !duplicated) {
          duplicated = true;
          const newSelectedIds: string[]  = [];
          const newMoveList:    MoveEntry[] = [];

          for (const { el, startX, startY } of originalSnapshots) {
            if (el.type === 'group') {
              // Duplicate the group container + all its children atomically
              const groupChildren = elementsRef.current.filter(c => c.groupId === el.id);
              const result        = insertGroupSilentRef.current(el, groupChildren);
              newSelectedIds.push(result.containerId);
              // Container
              newMoveList.push({ id: result.containerId, startX, startY });
              // Each child — start positions are from the originals at drag-start
              groupChildren.forEach((child, i) => {
                newMoveList.push({ id: result.childIds[i], startX: child.x, startY: child.y });
              });
            } else {
              const newId = insertElementSilentRef.current({ ...el, x: startX, y: startY });
              newSelectedIds.push(newId);
              newMoveList.push({ id: newId, startX, startY });
            }
          }

          moveList = newMoveList;
          setSelectionRef.current(newSelectedIds);
        }
      }

      if (!dragging) return;

      // Axis-lock for Alt+Shift
      let finalDx = rawDx;
      let finalDy = rawDy;
      if (altHeld && shiftHeld) {
        if (Math.abs(rawDx) >= Math.abs(rawDy)) finalDy = 0;
        else                                      finalDx = 0;
      }

      const rawGroupX = groupMinX + finalDx;
      const rawGroupY = groupMinY + finalDy;

      const { guides, snappedX, snappedY } = guidesRef.current(
        '__multi__', rawGroupX, rawGroupY, groupW, groupH,
      );
      onGuidesChange(guides);

      const snapDx = snappedX - groupMinX;
      const snapDy = snappedY - groupMinY;

      moveList.forEach(({ id, startX, startY }) => {
        updateElement(id, { x: startX + snapDx, y: startY + snapDy });
      });
    }

    function onMouseUp() {
      if (dragging) commitHistory();
      onGuidesChange([]);
      if (!dragging && onClickOnly) onClickOnly();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
  }

  // ── Marquee selection ────────────────────────────────────────────────────
  function startMarquee(startX: number, startY: number, rect: DOMRect) {
    let curX          = startX;
    let curY          = startY;
    let marqueeActive = false;
    const scale       = scaleRef.current;

    function onMouseMove(ev: MouseEvent) {
      curX = (ev.clientX - rect.left) / scale;
      curY = (ev.clientY - rect.top)  / scale;
      const w = Math.abs(curX - startX);
      const h = Math.abs(curY - startY);

      if (w > DRAG_THRESHOLD || h > DRAG_THRESHOLD) {
        marqueeActive = true;
        onMarqueeChange({ x: Math.min(startX, curX), y: Math.min(startY, curY), w, h });
      }
    }

    function onMouseUp() {
      if (marqueeActive) {
        const selX = Math.min(startX, curX);
        const selY = Math.min(startY, curY);
        const selW = Math.abs(curX - startX);
        const selH = Math.abs(curY - startY);

        const hit = elementsRef.current.filter(el =>
          el.x            < selX + selW &&
          el.x + el.width > selX &&
          el.y            < selY + selH &&
          el.y + el.height > selY
        );
        if (hit.length > 0) setSelection(hit.map(el => el.id));
      }

      onMarqueeChange(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
  }

  // ── Cursor priority: space-pan > alt-copy > default ─────────────────────
  const overlayStyle: React.CSSProperties = {
    zIndex: 50,
    cursor: isSpaceHeld
      ? (isSpaceDragging ? 'grabbing' : 'grab')
      : (altActive && selectedElementIds.length > 0 ? 'copy' : 'default'),
  };

  return (
    <div
      className="absolute inset-0"
      style={overlayStyle}
      onMouseDown={handleMouseDown}
      onClick={e => e.stopPropagation()}
    />
  );
}