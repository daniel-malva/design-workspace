import { useState, useRef, useCallback, useEffect } from 'react';
import {
  MoreVertical, ChevronRight, Cloud, Save, RefreshCw,
  ChevronDown, Minus, Plus, Maximize2,
} from 'lucide-react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import { CanvasFrame } from './CanvasFrame';
import { PageStrip } from './PageStrip';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import { UndoRedoButtons } from './UndoRedoButtons';
import { zoomBridge } from '../utils/canvasZoomBridge';
import { getInitialCanvasOffset } from '../utils/getInitialCanvasOffset';
import {
  BREADCRUMB_LEFT_PANE_OPEN,
  BREADCRUMB_LEFT_PANE_CLOSED,
  ACTION_BUTTONS_RIGHT,
  PANEL_INNER_GAP,
  PANEL_GAP,
  TIMELINE_HEIGHT,
  TIMELINE_HEIGHT_EXPANDED,
  PAGE_STRIP_HEIGHT,
} from '../constants/layout';

const PADDING = 60; // px — breathing room around canvas on fit-to-screen

// ─── Floating breadcrumb ───────────────────────────────────────────
function BreadcrumbNav({ templateName }: { templateName: string }) {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-[#E2E2E2]">
      <span className="text-[11px] text-[#6B6B6B]">Design Workspace</span>
      <ChevronRight size={11} className="text-[#6B6B6B]" />
      <span className="text-[11px] text-[#111111] font-medium">{templateName}</span>
    </div>
  );
}

// ─── Save split button ─────────────────────────────────────────────
function SaveSplitButton() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="relative flex">
      <button
        onClick={handleSave}
        className="flex items-center gap-1.5 bg-[#5B4EFF] hover:bg-[#4a3ee0] text-white text-[11px] font-medium pl-3 pr-2 py-1.5 rounded-l-lg transition-colors"
      >
        <Cloud size={12} />
        {saved ? 'Saved!' : 'Save'}
      </button>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center bg-[#5B4EFF] hover:bg-[#4a3ee0] text-white px-1.5 py-1.5 rounded-r-lg border-l border-white/25 transition-colors"
      >
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-[#E2E2E2] py-1 w-48 z-50">
          <button onClick={() => { handleSave(); setOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-[#111111] hover:bg-[#f5f5f5] transition-colors">
            <Save size={12} className="text-[#6B6B6B]" /> Save new version
          </button>
          <button onClick={() => setOpen(false)} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-[#111111] hover:bg-[#f5f5f5] transition-colors">
            <RefreshCw size={12} className="text-[#6B6B6B]" /> Push changes
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Preview toggle ────────────────────────────────────────────────
function PreviewToggle() {
  const { isPreviewMode, setIsPreviewMode } = useDesignWorkspace();
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-[#E2E2E2]">
      <span className="text-[11px] text-[#6B6B6B]">Preview</span>
      <button
        onClick={() => setIsPreviewMode(!isPreviewMode)}
        className={`relative w-8 h-4 rounded-full transition-colors ${isPreviewMode ? 'bg-[#5B4EFF]' : 'bg-[#D0D0D0]'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${isPreviewMode ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

// ─── Canvas context menu option ───────────────────────────────────
function CanvasMenuOption({ label, onSelect }: { label: string; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-3 py-1.5 text-[12px] text-[#111111] hover:bg-[#f5f5f5] transition-colors"
    >
      {label}
    </button>
  );
}

// ─── Canvas frame (the white template box) ────────────────────────
function CanvasFrameWrapper() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { canvasWidth, canvasHeight, activeVariantId, variants } = useDesignWorkspace();

  const activeVariant  = variants.find(v => v.id === activeVariantId) ?? null;
  const currentPageName = activeVariant ? activeVariant.name : 'Master Template';

  return (
    <div className="relative" style={{ width: canvasWidth, height: canvasHeight + 72 }}>
      {/* Canvas name row — above the frame */}
      <div className="absolute -top-8 left-0 right-0 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#111111] font-medium">{currentPageName}</span>
          {activeVariant?.isDetached && (
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded-full leading-none"
              style={{ color: '#92400e', backgroundColor: '#fef3c7' }}
            >
              modified
            </span>
          )}
        </div>
        {activeVariantId === null && (
        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 text-[#111111] transition-colors"
          >
            <MoreVertical size={13} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-[#E2E2E2] py-1 w-44 z-50">
              {['Rename canvas', 'Duplicate canvas', 'Delete canvas', 'Add new canvas'].map(opt => (
                <CanvasMenuOption key={opt} label={opt} onSelect={() => setMenuOpen(false)} />
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      {/* White canvas frame — all element rendering lives here */}
      <CanvasFrame />

      {/* Size label — below frame */}
      <div className="absolute left-0 right-0 text-center mt-3" style={{ top: canvasHeight + 8 }}>
        <span className="text-[10px] text-[#6B6B6B] font-medium">{canvasWidth}px × {canvasHeight}px</span>
      </div>
    </div>
  );
}

// ─── Zoom Toolbar ──────────────────────────────────────────────────
// Horizontally fixed: always spans from LeftRail's right edge to the screen's right edge.
// Only the vertical axis (bottom) reacts to timeline state.
function ZoomToolbar({ fitToScreen }: { fitToScreen: () => void }) {
  const {
    isTimelineVisible, isTimelineExpanded,
    canvasScale,
    variants,
    // ⚠️ activePanel deliberately NOT used — horizontal position never changes
  } = useDesignWorkspace();

  const hasPageStrip = variants.length > 0;

  // Vertical only — the one dynamic axis
  const timelineHeight = isTimelineExpanded ? TIMELINE_HEIGHT_EXPANDED : TIMELINE_HEIGHT;
  const baseBottom = isTimelineVisible
    ? PANEL_GAP + timelineHeight + PANEL_GAP   // 8 + height + 8
    : PANEL_GAP;                               // 8px from bottom edge
  const toolbarBottom = hasPageStrip
    ? baseBottom + PAGE_STRIP_HEIGHT + PANEL_GAP
    : baseBottom;

  return (
    <div
      className="absolute z-30 flex items-center justify-center pointer-events-none"
      style={{
        left: 0,    // fixed: left edge of canvas container = right edge of LeftRail
        right: 0,   // fixed: right edge of screen
        bottom: toolbarBottom,
        height: 32,
        transition: 'bottom 200ms ease-in-out', // horizontal axis intentionally excluded
      }}
    >
      <div className="pointer-events-auto flex items-center gap-2 bg-white rounded-xl shadow-md px-3 h-8 border border-[#E2E2E2]">
        {/* Zoom out */}
        <button
          className="text-[#6B6B6B] hover:text-[#111111] transition-colors"
          onClick={() => zoomBridge.zoomBy(-0.1)}
          title="Zoom out (Cmd/Ctrl + −)"
        >
          <Minus size={12} />
        </button>

        {/* Slider — min 5%, max 400% */}
        <Slider
          className="w-24"
          min={5}
          max={400}
          step={5}
          value={[Math.round(canvasScale * 100)]}
          onValueChange={([v]) => zoomBridge.zoomTo(v / 100)}
        />

        {/* Zoom in */}
        <button
          className="text-[#6B6B6B] hover:text-[#111111] transition-colors"
          onClick={() => zoomBridge.zoomBy(0.1)}
          title="Zoom in (Cmd/Ctrl + =)"
        >
          <Plus size={12} />
        </button>

        <Separator orientation="vertical" className="h-4 mx-1" />

        <span className="text-[11px] text-[#6B6B6B] w-10 text-center font-mono tabular-nums">
          {Math.round(canvasScale * 100)}%
        </span>

        <Separator orientation="vertical" className="h-4 mx-1" />

        {/* Fit to screen / re-centre (⌘⇧H) — Cmd+0 resets to 100% */}
        <button
          className="text-[#6B6B6B] hover:text-[#111111] transition-colors"
          onClick={fitToScreen}
          title="Fit to screen (Cmd/Ctrl + Shift + H)"
        >
          <Maximize2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Main CanvasArea ───────────────────────────────────────────────
export function CanvasArea() {
  const {
    templateName, selectElement, setActivePanel,
    activePanel, canvasScale, setCanvasScale,
    selectedElementIds, activityPanelOpen, setActivityPanelOpen,
    canvasOffset, setCanvasOffset,
    fitCanvasToScreen,
    canvasWidth, canvasHeight,
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

  // RightPanel is visible under the same conditions as RightPanel.tsx
  const isRightPanelVisible =
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
    setActivePanel(null);
    selectElement(null);
    setActivityPanelOpen(!activityPanelOpen);
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#E8E8E8]">
      {/* Dot grid + pan/zoom surface — containerRef always mounted so
          ResizeObserver can measure dimensions even before canvas is shown */}
      <div
        ref={containerRef}
        data-canvas-container
        className={`absolute inset-0 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
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
        {canvasOffset !== null && (
          <div
            style={{
              position:        'absolute',
              left:            0,
              top:             0,
              transform:       `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
              transformOrigin: '0 0',
            }}
          >
            <CanvasFrameWrapper />
          </div>
        )}
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
        </>
      )}
    </div>
  );
}