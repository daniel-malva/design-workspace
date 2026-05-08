import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageCircle, Send,
} from 'lucide-react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import { PageStrip } from './PageStrip';
import { UndoRedoButtons } from './UndoRedoButtons';
import { zoomBridge } from '../utils/canvasZoomBridge';
import { getInitialCanvasOffset } from '../utils/getInitialCanvasOffset';
import {
  BREADCRUMB_LEFT_PANE_OPEN,
  BREADCRUMB_LEFT_PANE_CLOSED,
  ACTION_BUTTONS_RIGHT,
  PANEL_INNER_GAP,
} from '../constants/layout';
import { BreadcrumbNav } from './BreadcrumbNav';
import { SaveSplitButton } from './SaveSplitButton';
import { PreviewToggle } from './PreviewToggle';
import { AllCanvasFrames } from './AllCanvasFrames';
import { ZoomToolbar } from './ZoomToolbar';
import { CommentThreadPopup } from './CommentThreadPopup';
import { PAGE_GAP } from './CanvasPageHeader';

const PADDING = 60; // px — breathing room around canvas on fit-to-screen

// ─── Page geometry helpers ─────────────────────────────────────────
// These must stay in sync with AllCanvasFrames's flex layout.
const HEADER_H  = 32;  // CanvasPageHeader h-8
const SPACER_H  = 4;   // explicit height:4 div
const LABEL_H   = 24;  // mt-2 (8px) + ~16px text

/** Y position (in transform-space) of the top of the canvas box for page at index i */
function canvasBoxTopY(index: number, canvasHeight: number): number {
  const unitH = HEADER_H + SPACER_H + canvasHeight + LABEL_H;
  return index * (unitH + PAGE_GAP) + HEADER_H + SPACER_H;
}

// ─── Animated pan helper ───────────────────────────────────────────
// Easing: ease-out-quart — quick start, cushioned stop. Feels natural for
// spatial navigation in canvas tools. Duration ~300 ms.
const PAN_DURATION = 300; // ms

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

/**
 * Smoothly animates canvasOffset from the current value to (toX, toY).
 * Returns a cancel function — call it if a newer animation starts.
 */
function animatePan(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  setter: (offset: { x: number; y: number }) => void,
): () => void {
  const start = performance.now();
  let rafId: number;

  function tick(now: number) {
    const t    = Math.min((now - start) / PAN_DURATION, 1);
    const ease = easeOutQuart(t);
    setter({
      x: fromX + (toX - fromX) * ease,
      y: fromY + (toY - fromY) * ease,
    });
    if (t < 1) rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}

// ─── Main CanvasArea ───────────────────────────────────────────────
export function CanvasArea() {
  const {
    templateName, selectElement, setSelection, setActivePanel,
    activePanel, canvasScale, setCanvasScale,
    selectedElementIds, activityPanelOpen, activityPanelTab,
    setActivityPanelOpen, setActivityPanelTab,
    canvasOffset, setCanvasOffset,
    fitCanvasToScreen,
    canvasWidth, canvasHeight,
    canvasPages, activePageId, canvasElements,
    commentMode, canvasComments, highlightedCommentId,
    setCommentMode, addCanvasComment, setHighlightedCommentId, addCommentReply,
    isPreviewMode,
  } = useDesignWorkspace();

  // Live refs so stable callbacks read current canvas dimensions
  const canvasWRef = useRef(canvasWidth);
  canvasWRef.current = canvasWidth;
  const canvasHRef = useRef(canvasHeight);
  canvasHRef.current = canvasHeight;

  const isLeftPaneVisible = activePanel !== null && activePanel !== 'settings' && activePanel !== 'configure';
  const breadcrumbLeft = isLeftPaneVisible
    ? BREADCRUMB_LEFT_PANE_OPEN
    : BREADCRUMB_LEFT_PANE_CLOSED;

  // RightPanel is visible under the same conditions as RightPanel.tsx,
  // plus when PreviewPanel is open (isPreviewMode).
  const isRightPanelVisible =
    isPreviewMode ||
    activePanel === 'settings' ||
    activePanel === 'configure' ||
    selectedElementIds.length > 0 ||
    activityPanelOpen;

  const buttonsRight = isRightPanelVisible
    ? ACTION_BUTTONS_RIGHT
    : PANEL_INNER_GAP;

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, originX: 0, originY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Live refs — wheel/zoom closures always read current values without stale captures
  const scaleRef = useRef(canvasScale);
  scaleRef.current = canvasScale;
  const offsetRef = useRef(canvasOffset);
  offsetRef.current = canvasOffset;

  // ── Comment mode state ────────────────────────────────────────────────────
  const commentModeRef = useRef(commentMode);
  commentModeRef.current = commentMode;

  // Live refs so global listeners always read the latest canvas data
  const canvasElementsLocalRef = useRef(canvasElements);
  canvasElementsLocalRef.current = canvasElements;
  const canvasPagesLocalRef = useRef(canvasPages);
  canvasPagesLocalRef.current = canvasPages;
  const activePageIdLocalRef = useRef(activePageId);
  activePageIdLocalRef.current = activePageId;

  // Pending comment state — covers both single-click and drag-area modes
  const [pendingComment, setPendingComment] = useState<{
    screenX: number; screenY: number;
    // Single element
    elementId?: string; elementName?: string;
    // Area selection
    selectionRect?: { x: number; y: number; width: number; height: number };
    selectionElementIds?: string[];
    selectionElementCount?: number;
  } | null>(null);
  const pendingCommentRef = useRef(pendingComment);
  pendingCommentRef.current = pendingComment;

  const [pendingText, setPendingText] = useState('');

  // Cursor follower position (updated by global listener)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // ID of the comment whose thread popup is currently open (null = closed)
  const [openThreadCommentId, setOpenThreadCommentId] = useState<string | null>(null);

  // Drag state: start position stored in a ref (no re-render on move), visual rect in state
  const commentDragStartRef = useRef<{ containerX: number; containerY: number } | null>(null);
  const [commentSelRect, setCommentSelRect] = useState<{
    left: number; top: number; width: number; height: number;
  } | null>(null);

  // ── Combined comment-mode global listeners (cursor + drag) ────────────────
  // Activated when commentMode turns on; cleaned up when it turns off.
  useEffect(() => {
    if (!commentMode) {
      setCursorPos(null);
      return;
    }

    function onMove(e: MouseEvent) {
      // Cursor follower
      setCursorPos({ x: e.clientX, y: e.clientY });

      // Selection rectangle (during drag)
      if (!commentDragStartRef.current) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const curX = e.clientX - rect.left;
      const curY = e.clientY - rect.top;
      const { containerX: sx, containerY: sy } = commentDragStartRef.current;
      if (Math.abs(curX - sx) > 3 || Math.abs(curY - sy) > 3) {
        setCommentSelRect({
          left:   Math.min(sx, curX),
          top:    Math.min(sy, curY),
          width:  Math.abs(curX - sx),
          height: Math.abs(curY - sy),
        });
      }
    }

    function onUp(e: MouseEvent) {
      if (!commentDragStartRef.current) return;
      const start = commentDragStartRef.current;
      commentDragStartRef.current = null;
      // NOTE: do NOT clear commentSelRect here for the drag case —
      // it stays visible until the user submits or cancels the comment.

      const rect   = containerRef.current?.getBoundingClientRect();
      const offset = offsetRef.current;
      if (!rect || !offset) return;

      const curX = e.clientX - rect.left;
      const curY = e.clientY - rect.top;
      const dist  = Math.hypot(curX - start.containerX, curY - start.containerY);
      const scale = scaleRef.current;
      const pages = canvasPagesLocalRef.current;
      const pid   = activePageIdLocalRef.current;
      const topY  = canvasBoxTopY(pages.findIndex(p => p.id === pid), canvasHRef.current);
      const els   = canvasElementsLocalRef.current;

      if (dist < 5) {
        // Single click — clear any lingering drag rect, hit-test the topmost element
        setCommentSelRect(null);
        const cx = (start.containerX - offset.x) / scale;
        const cy = (start.containerY - offset.y) / scale - topY;
        const hit = [...els].reverse().find(el =>
          cx >= el.x && cx <= el.x + el.width && cy >= el.y && cy <= el.y + el.height
        );
        setPendingComment({
          screenX: e.clientX, screenY: e.clientY,
          elementId: hit?.id, elementName: hit?.name,
        });
      } else {
        // Drag — area selection
        const x1 = (Math.min(start.containerX, curX) - offset.x) / scale;
        const y1 = (Math.min(start.containerY, curY) - offset.y) / scale - topY;
        const x2 = (Math.max(start.containerX, curX) - offset.x) / scale;
        const y2 = (Math.max(start.containerY, curY) - offset.y) / scale - topY;
        const selRect = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
        // Center-point test (same rule as the live drag highlight)
        const selEls  = els.filter(el => {
          const ecx = el.x + el.width  / 2;
          const ecy = el.y + el.height / 2;
          return ecx >= x1 && ecx <= x2 && ecy >= y1 && ecy <= y2;
        });
        setPendingComment({
          screenX: e.clientX, screenY: e.clientY,
          selectionRect: selRect,
          selectionElementIds:   selEls.map(el => el.id),
          selectionElementCount: selEls.length,
        });
      }
      setPendingText('');
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      setCursorPos(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentMode]);

  // Clear comment highlight when the activity panel is closed (so no stale overlay lingers)
  useEffect(() => {
    if (!activityPanelOpen) {
      setHighlightedCommentId(null);
      setOpenThreadCommentId(null);
    }
  }, [activityPanelOpen, setHighlightedCommentId]);

  // When a comment is highlighted (from panel or balloon), open its thread popup
  useEffect(() => {
    if (highlightedCommentId !== null) {
      setOpenThreadCommentId(highlightedCommentId);
    } else {
      setOpenThreadCommentId(null);
    }
  }, [highlightedCommentId]);

  // C key → enter comment mode; Escape → dismiss popover or exit mode
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!commentModeRef.current) {
          setCommentMode(true);
          setActivityPanelOpen(true);
          setActivityPanelTab('comments');
        } else {
          // C pressed again → same full teardown as Escape
          setCommentMode(false);
          setPendingComment(null);
          setPendingText('');
          setOpenThreadCommentId(null);
          setHighlightedCommentId(null);
          setActivityPanelOpen(false);
        }
        return;
      }

      if (e.key === 'Escape') {
        if (pendingCommentRef.current) {
          // First Escape: dismiss the pending popover only
          setPendingComment(null);
          setPendingText('');
          setCommentSelRect(null);
        } else if (commentModeRef.current) {
          // Second (or sole) Escape: fully exit comment mode
          setCommentMode(false);
          setOpenThreadCommentId(null);
          setHighlightedCommentId(null);
          setActivityPanelOpen(false);
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setCommentMode, setActivityPanelOpen, setActivityPanelTab, setHighlightedCommentId]);

  // ── V66: ResizeObserver-based fit-to-screen on first mount ───────────────
  // Runs after paint — guarantees real DOM dimensions are available.
  // Falls back to ResizeObserver when getBoundingClientRect() returns 0
  // (e.g. when the component mounts before layout is complete).
  const initializedRef = useRef(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function initializeOffset(width: number, height: number) {
      if (initializedRef.current) return;
      if (width === 0 || height === 0) return;
      initializedRef.current = true;
      const fitScale = Math.min(
        (width  - PADDING * 2) / canvasWRef.current,
        (height - PADDING * 2) / canvasHRef.current,
        1, // never upscale beyond 100%
      );
      setCanvasScale(fitScale);
      setCanvasOffset(getInitialCanvasOffset(width, height, fitScale));
    }

    // Try immediately — usually has real dimensions after first paint
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      initializeOffset(rect.width, rect.height);
      return; // already initialized — ResizeObserver not needed
    }

    // Fallback: fire when container acquires real dimensions
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          initializeOffset(width, height);
          observer.disconnect();
          break;
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Animated pan to active canvas page when activePageId changes ─────────
  // Skips the initial mount (fit-to-screen handles that).
  // On add / duplicate / delete / panel click it smoothly slides to the newly
  // active page, keeping the current zoom level.
  const prevActivePageIdRef = useRef(activePageId);
  const cancelPanRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!initializedRef.current) return;
    if (activePageId === prevActivePageIdRef.current) return;
    prevActivePageIdRef.current = activePageId;

    const pageIndex = canvasPages.findIndex(p => p.id === activePageId);
    if (pageIndex < 0) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scale   = scaleRef.current;
    const topY    = canvasBoxTopY(pageIndex, canvasHRef.current);
    const targetX = rect.width  / 2 - (canvasWRef.current / 2) * scale;
    const targetY = rect.height / 2 - (topY + canvasHRef.current / 2) * scale;

    // Cancel any animation still in flight
    cancelPanRef.current?.();

    const from = offsetRef.current ?? { x: targetX, y: targetY };
    cancelPanRef.current = animatePan(from.x, from.y, targetX, targetY, setCanvasOffset);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageId]);

  // ── V62: Zoom helpers — all keep a visible focal point fixed ──────────────
  const zoomBy = useCallback((delta: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width  / 2 : 400;
    const cy = rect ? rect.height / 2 : 400;
    const prevScale = scaleRef.current;
    const nextScale = Math.min(4, Math.max(0.05, prevScale + delta));
    const ratio = nextScale / prevScale;
    const prev = offsetRef.current ?? { x: 0, y: 0 };
    setCanvasOffset({
      x: cx - (cx - prev.x) * ratio,
      y: cy - (cy - prev.y) * ratio,
    });
    setCanvasScale(nextScale);
  }, [setCanvasScale, setCanvasOffset]);

  const zoomTo = useCallback((targetScale: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width  / 2 : 400;
    const cy = rect ? rect.height / 2 : 400;
    const prevScale = scaleRef.current;
    const nextScale = Math.min(4, Math.max(0.05, targetScale));
    const ratio = nextScale / prevScale;
    const prev = offsetRef.current ?? { x: 0, y: 0 };
    setCanvasOffset({
      x: cx - (cx - prev.x) * ratio,
      y: cy - (cy - prev.y) * ratio,
    });
    setCanvasScale(nextScale);
  }, [setCanvasScale, setCanvasOffset]);

  const fitToScreen = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const newScale = Math.min(
      (rect.width  - PADDING * 2) / canvasWRef.current,
      (rect.height - PADDING * 2) / canvasHRef.current,
      1,
    );
    setCanvasScale(newScale);
    setCanvasOffset(getInitialCanvasOffset(rect.width, rect.height, newScale));
  }, [setCanvasScale, setCanvasOffset]);

  const resetZoom = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    const cw = rect?.width  ?? 800;
    const ch = rect?.height ?? 600;
    setCanvasScale(1);
    setCanvasOffset(getInitialCanvasOffset(cw, ch, 1));
  }, [setCanvasScale, setCanvasOffset]);

  // Register zoom actions with the bridge so keyboard shortcuts and the
  // ZoomToolbar can call them without needing a ref chain.
  useEffect(() => {
    zoomBridge.zoomBy      = zoomBy;
    zoomBridge.zoomTo      = zoomTo;
    zoomBridge.fitToScreen = fitToScreen;
    zoomBridge.resetZoom   = resetZoom;
  }, [zoomBy, zoomTo, fitToScreen, resetZoom]);

  // ── V62: Native wheel handler ─────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();

      const isMod = e.ctrlKey || e.metaKey;
      const prev = offsetRef.current;
      if (!prev) return; // guard: canvas not yet initialised

      if (isMod) {
        const rect   = el!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomDelta = e.deltaMode === 0
          ? -e.deltaY * 0.005
          : -e.deltaY * 0.05;

        const prevScale = scaleRef.current;
        const nextScale = Math.min(4, Math.max(0.05, prevScale + zoomDelta));
        const ratio     = nextScale / prevScale;

        setCanvasOffset({
          x: mouseX - (mouseX - prev.x) * ratio,
          y: mouseY - (mouseY - prev.y) * ratio,
        });
        setCanvasScale(nextScale);

      } else {
        const multiplier = e.deltaMode === 1 ? 20 : 1;
        setCanvasOffset({
          x: prev.x - e.deltaX * multiplier,
          y: prev.y - e.deltaY * multiplier,
        });
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [setCanvasOffset, setCanvasScale]);

  // ── Mouse-drag pan (gray background only) ──────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.button !== 0) return;
    const curr = offsetRef.current;
    if (!curr) return; // guard: canvas not yet initialised
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: curr.x, originY: curr.y };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setCanvasOffset({
      x: dragRef.current.originX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.originY + (e.clientY - dragRef.current.startY),
    });
  }, [isDragging, setCanvasOffset]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  function handleBackgroundClick() {
    if (commentModeRef.current) return; // comment mode captures canvas clicks
    setActivePanel(null);
    selectElement(null);
    setActivityPanelOpen(!activityPanelOpen);
  }

  // Start a comment drag/click on mousedown — global listeners (registered in the
  // commentMode effect above) handle mousemove + mouseup to finalize the action.
  function handleCommentMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    commentDragStartRef.current = {
      containerX: e.clientX - rect.left,
      containerY: e.clientY - rect.top,
    };
  }

  function submitComment() {
    if (!pendingCommentRef.current || !pendingText.trim()) return;
    const p = pendingCommentRef.current;
    addCanvasComment(
      pendingText.trim(),
      p.elementId,
      p.elementName,
      p.selectionRect,
      p.selectionElementIds,
      activePageId,
    );
    setPendingComment(null);
    setPendingText('');
    setCommentSelRect(null);
    setActivityPanelOpen(true);
    setActivityPanelTab('comments');
  }

  function dismissPendingComment() {
    setPendingComment(null);
    setPendingText('');
    setCommentSelRect(null);
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#E8E8E8]">
      {/* Dot grid + pan/zoom surface — containerRef always mounted so
          ResizeObserver can measure dimensions even before canvas is shown */}
      <div
        ref={containerRef}
        data-canvas-container
        className={`absolute inset-0 select-none ${
          isDragging ? 'cursor-grabbing' : commentMode ? 'cursor-none' : 'cursor-grab'
        }`}
        style={{
          backgroundImage: 'radial-gradient(circle, #B4B4B4 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleBackgroundClick}
      >
        {/*
          V66 guard: only render canvas content once offset is known.
          canvasOffset starts as null — on first mount the ResizeObserver
          calculates the correct centred offset and sets it.  Until that
          point we render the grey dotted background only (no flash at 0,0).

          transform: translate(ox, oy) scale(s)   ← translate BEFORE scale
          transformOrigin: '0 0'                  ← scale from top-left corner
          No willChange here — it would cause the browser to rasterize the
          subtree into a bitmap before scaling, making text and SVGs blurry
          at high zoom. Without it the browser re-renders vector content at
          each zoom level, preserving sharpness.
        */}
        {canvasOffset !== null && (() => {
          const activePageIndex = canvasPages.findIndex(p => p.id === activePageId);
          const topY = canvasBoxTopY(activePageIndex, canvasHeight);

          return (
            <>
              {/* Scaled canvas content */}
              <div
                style={{
                  position:        'absolute',
                  left:            0,
                  top:             0,
                  transform:       `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
                  transformOrigin: '0 0',
                }}
              >
                <AllCanvasFrames />
              </div>

              {/* ── Comment mode overlay — covers active canvas only ── */}
              {commentMode && (
                <div
                  style={{
                    position: 'absolute',
                    left:     canvasOffset.x,
                    top:      canvasOffset.y + topY * canvasScale,
                    width:    canvasWidth  * canvasScale,
                    height:   canvasHeight * canvasScale,
                    zIndex:   30,
                    cursor:   'none',
                  }}
                  onMouseDown={handleCommentMouseDown}
                />
              )}

              {/* ── Drag selection rectangle + element highlight feedback ── */}
              {commentMode && commentSelRect && commentSelRect.width > 3 && commentSelRect.height > 3 && (() => {
                // commentSelRect is already in container-space coords — NO canvasOffset needed.
                // Convert to canvas-space so we can intersect-test elements.
                const cx1 = (commentSelRect.left                          - canvasOffset.x) / canvasScale;
                const cy1 = (commentSelRect.top                           - canvasOffset.y) / canvasScale - topY;
                const cx2 = (commentSelRect.left + commentSelRect.width   - canvasOffset.x) / canvasScale;
                const cy2 = (commentSelRect.top  + commentSelRect.height  - canvasOffset.y) / canvasScale - topY;

                // Center-point test: element's center must be inside the drag rect.
                // Much more precise than AABB overlap — avoids picking up large elements
                // (e.g. background) that merely touch the rect boundary.
                const hovered = canvasElements.filter(el => {
                  const ecx = el.x + el.width  / 2;
                  const ecy = el.y + el.height / 2;
                  return ecx >= cx1 && ecx <= cx2 && ecy >= cy1 && ecy <= cy2;
                });

                return (
                  <>
                    {/* Selection marquee */}
                    <div
                      style={{
                        position:      'absolute',
                        left:          commentSelRect.left,
                        top:           commentSelRect.top,
                        width:         commentSelRect.width,
                        height:        commentSelRect.height,
                        border:        '2px dashed #5B4EFF',
                        background:    'rgba(91,78,255,0.07)',
                        borderRadius:  3,
                        zIndex:        31,
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Per-element highlight overlays */}
                    {hovered.map(el => {
                      const elLeft = canvasOffset.x + el.x            * canvasScale;
                      const elTop  = canvasOffset.y + (topY + el.y)   * canvasScale;
                      const elW    = el.width  * canvasScale;
                      const elH    = el.height * canvasScale;
                      return (
                        <div
                          key={el.id}
                          style={{
                            position:      'absolute',
                            left:          elLeft,
                            top:           elTop,
                            width:         elW,
                            height:        elH,
                            border:        '2px solid #5B4EFF',
                            background:    'rgba(91,78,255,0.13)',
                            borderRadius:  2,
                            zIndex:        32,
                            pointerEvents: 'none',
                          }}
                        />
                      );
                    })}
                  </>
                );
              })()}

              {/* ── Avatar balloons — visible in comment mode OR when Comments tab is active ── */}
              {(commentMode || (activityPanelOpen && activityPanelTab === 'comments')) &&
                canvasComments
                  .filter(c => !c.resolved &&
                    // Only show balloons for comments on the active page
                    (!c.pageId || c.pageId === activePageId) &&
                    (
                      (c.elementId && canvasElements.some(e => e.id === c.elementId)) ||
                      c.selectionRect
                    )
                  )
                  .map(comment => {
                    // Anchor: element top-left (single) or selection rect top-left (area)
                    let bx: number, by: number;
                    if (comment.selectionRect) {
                      bx = canvasOffset.x + comment.selectionRect.x * canvasScale;
                      by = canvasOffset.y + (topY + comment.selectionRect.y) * canvasScale;
                    } else {
                      const el = canvasElements.find(e => e.id === comment.elementId)!;
                      bx = canvasOffset.x + el.x * canvasScale;
                      by = canvasOffset.y + (topY + el.y) * canvasScale;
                    }
                    const isArea      = !!comment.selectionRect;
                    const threadCount = 1 + (comment.replies?.length ?? 0);
                    const hasReplies  = threadCount > 1;
                    return (
                      <button
                        key={comment.id}
                        style={{
                          position:   'absolute',
                          left:       bx - 12,
                          top:        by - 26,
                          zIndex:     21,
                          cursor:     'pointer',
                          padding:    0,
                          border:     'none',
                          background: 'none',
                        }}
                        title={comment.text}
                        onClick={e => {
                          e.stopPropagation();
                          // Highlight only — no selectElement() so Properties panel doesn't take over
                          setHighlightedCommentId(comment.id);
                          setActivityPanelOpen(true);
                          setActivityPanelTab('comments');
                        }}
                      >
                        {/* Wrapper — relative so the count badge can be absolutely positioned */}
                        <div style={{ position: 'relative', display: 'inline-flex' }}>
                          {/* Balloon body — rounded pill for area, circle for single */}
                          <div style={{
                            minWidth:        24,
                            height:          24,
                            paddingInline:   isArea ? 6 : 0,
                            borderRadius:    isArea ? '12px 12px 12px 4px' : '50% 50% 50% 4px',
                            backgroundColor: comment.authorColor,
                            border:          '2px solid white',
                            boxShadow:       '0 2px 8px rgba(0,0,0,0.25)',
                            display:         'flex',
                            alignItems:      'center',
                            justifyContent:  'center',
                            gap:             3,
                          }}>
                            <span style={{ fontSize: 8, color: 'white', fontWeight: 700, letterSpacing: '-0.5px' }}>
                              {comment.authorInitials}
                            </span>
                            {isArea && comment.selectionElementCount !== undefined && (
                              <span style={{ fontSize: 8, color: 'white', fontWeight: 600 }}>
                                ·{comment.selectionElementCount}
                              </span>
                            )}
                          </div>

                          {/* Thread-count badge — only visible when there are replies */}
                          {hasReplies && (
                            <div style={{
                              position:        'absolute',
                              top:             -5,
                              right:           -5,
                              minWidth:        14,
                              height:          14,
                              paddingInline:   3,
                              borderRadius:    7,
                              backgroundColor: '#1f1d25',
                              border:          '1.5px solid white',
                              display:         'flex',
                              alignItems:      'center',
                              justifyContent:  'center',
                              boxSizing:       'border-box',
                            }}>
                              <span style={{ fontSize: 7, color: 'white', fontWeight: 700, lineHeight: 1 }}>
                                {threadCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
              }

              {/* ── Highlighted comment — canvas overlay for referenced element(s) ──
                  Driven by highlightedCommentId set when the user clicks a comment row
                  or a balloon. Does NOT call selectElement(), so the Comments tab stays
                  visible (RightPanel hides ActivityPanel when selectedElementIds > 0).   */}
              {highlightedCommentId && (() => {
                const hc = canvasComments.find(c => c.id === highlightedCommentId);
                if (!hc) return null;

                // Collect element IDs to highlight
                const ids: string[] = hc.selectionElementIds?.length
                  ? hc.selectionElementIds
                  : hc.elementId ? [hc.elementId] : [];

                const highlights = ids
                  .map(id => canvasElements.find(el => el.id === id))
                  .filter(Boolean) as typeof canvasElements;

                if (highlights.length === 0) return null;

                return highlights.map(el => {
                  const hlLeft = canvasOffset.x + el.x          * canvasScale;
                  const hlTop  = canvasOffset.y + (topY + el.y) * canvasScale;
                  const hlW    = el.width  * canvasScale;
                  const hlH    = el.height * canvasScale;
                  return (
                    <div
                      key={`hl-${el.id}`}
                      style={{
                        position:      'absolute',
                        left:          hlLeft - 3,
                        top:           hlTop  - 3,
                        width:         hlW + 6,
                        height:        hlH + 6,
                        border:        '2px solid #5B4EFF',
                        background:    'rgba(91,78,255,0.08)',
                        borderRadius:  4,
                        boxShadow:     '0 0 0 4px rgba(91,78,255,0.15)',
                        zIndex:        19,
                        pointerEvents: 'none',
                      }}
                    />
                  );
                });
              })()}
            </>
          );
        })()}
      </div>

      {/* ── Floating shell overlays — only shown once canvas is ready ── */}
      {canvasOffset !== null && (
        <>
          {/* Breadcrumb — left-anchored, slides with left pane */}
          <div
            className="absolute top-1 z-30 flex items-center gap-2 h-8 pointer-events-none"
            style={{ left: breadcrumbLeft, transition: 'left 0.18s ease-out' }}
          >
            {/* Undo / Redo */}
            <div className="pointer-events-auto" onClick={e => e.stopPropagation()}>
              <UndoRedoButtons />
            </div>

            {/* Breadcrumb pill */}
            <div className="pointer-events-auto" onClick={e => e.stopPropagation()}>
              <BreadcrumbNav templateName={templateName} />
            </div>
          </div>

          {/* Save + Preview */}
          <div
            className="absolute top-1 z-30 flex items-center gap-2 h-8 transition-all duration-200 ease-in-out"
            style={{ right: buttonsRight }}
            onClick={e => e.stopPropagation()}
          >
            <PreviewToggle />
            <SaveSplitButton />
          </div>

          {/* Page strip — sits above the Timeline, below the ZoomToolbar */}
          <PageStrip />

          {/* Zoom toolbar — above PageStrip (or Timeline if no variants) */}
          <ZoomToolbar fitToScreen={fitToScreen} />

          {/* ── Comment mode: "C" indicator badge ── */}
          {commentMode && (
            <div
              className="absolute z-40 pointer-events-none"
              style={{ bottom: 48, left: '50%', transform: 'translateX(-50%)' }}
            >
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#5B4EFF] text-white rounded-full shadow-lg text-[11px] font-medium">
                <MessageCircle size={12} />
                Comment mode — click an element · <kbd className="bg-white/20 px-1 rounded text-[10px]">C</kbd> or <kbd className="bg-white/20 px-1 rounded text-[10px]">Esc</kbd> to exit
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Speech-bubble cursor follower (portal → body) ── */}
      {commentMode && cursorPos && createPortal(
        <div
          style={{
            position:      'fixed',
            left:          cursorPos.x,
            top:           cursorPos.y,
            pointerEvents: 'none',
            zIndex:        9999,
            transform:     'translate(2px, 2px)',
          }}
        >
          <MessageCircle
            size={22}
            fill="#5B4EFF"
            color="white"
            strokeWidth={1.5}
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
          />
        </div>,
        document.body,
      )}

      {/* ── Pending comment popover (portal → body) ── */}
      {pendingComment && createPortal(
        <div
          style={{
            position:     'fixed',
            left:         Math.min(pendingComment.screenX, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 284),
            top:          pendingComment.screenY + 12,
            width:        272,
            zIndex:       10000,
            background:   'white',
            borderRadius: 14,
            boxShadow:    '0 8px 32px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)',
            border:       '1px solid #E2E2E2',
            padding:      14,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Context badge */}
          {pendingComment.selectionRect ? (
            // Area selection mode
            <div className="flex items-center gap-1.5 mb-2.5">
              <div
                className="shrink-0 rounded"
                style={{ width: 8, height: 8, border: '2px dashed #5B4EFF' }}
              />
              <span className="text-[11px] text-[#5B4EFF] font-semibold">
                {pendingComment.selectionElementCount === 0
                  ? 'Empty area selected'
                  : `${pendingComment.selectionElementCount} element${pendingComment.selectionElementCount !== 1 ? 's' : ''} selected`}
              </span>
            </div>
          ) : pendingComment.elementName ? (
            // Single element hit
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-2 h-2 rounded-full bg-[#5B4EFF] shrink-0" />
              <span className="text-[11px] text-[#5B4EFF] font-semibold truncate">
                {pendingComment.elementName}
              </span>
            </div>
          ) : (
            // Click on empty canvas
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-2 h-2 rounded-full bg-[#9c99a9] shrink-0" />
              <span className="text-[11px] text-[#9c99a9] font-medium">Canvas (no element)</span>
            </div>
          )}

          {/* Textarea */}
          <textarea
            autoFocus
            value={pendingText}
            onChange={e => setPendingText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); }
              if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                dismissPendingComment();
              }
            }}
            placeholder="Add a comment… (Enter to send)"
            rows={3}
            className="w-full resize-none text-[12px] text-[#1f1d25] placeholder:text-[#9c99a9] leading-[1.5] bg-[#f9fafa] border border-[#dddce0] rounded-lg px-3 py-2 outline-none focus:border-[#473bab] focus:ring-1 focus:ring-[#473bab] transition-colors overflow-x-hidden"
          />

          {/* Actions */}
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[10px] text-[#b5b3bf]">Shift+Enter for new line</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={dismissPendingComment}
                className="px-2.5 py-1 text-[11px] text-[#686576] hover:text-[#1f1d25] rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitComment}
                disabled={!pendingText.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#473bab] hover:bg-[#3a2f8f] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-semibold rounded-full transition-colors"
              >
                <Send size={10} />
                Send
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ── Comment thread popup (portal → body) ── */}
      {openThreadCommentId && canvasOffset !== null && (() => {
        const hc = canvasComments.find(c => c.id === openThreadCommentId);
        if (!hc) return null;
        const activePageIndex = canvasPages.findIndex(p => p.id === activePageId);
        const tY = canvasBoxTopY(activePageIndex, canvasHeight);
        const cRect = containerRef.current?.getBoundingClientRect();
        if (!cRect) return null;
        return (
          <CommentThreadPopup
            comment={hc}
            canvasOffset={canvasOffset}
            canvasScale={canvasScale}
            topY={tY}
            containerRect={cRect}
            canvasElements={canvasElements}
            onClose={() => setOpenThreadCommentId(null)}
            addCommentReply={addCommentReply}
          />
        );
      })()}
    </div>
  );
}
