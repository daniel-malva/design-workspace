import { Minus, Plus, Maximize2 } from 'lucide-react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import { zoomBridge } from '../utils/canvasZoomBridge';
import {
  PANEL_GAP,
  TIMELINE_HEIGHT,
  TIMELINE_HEIGHT_EXPANDED,
  PAGE_STRIP_HEIGHT,
} from '../constants/layout';
import { PAGE_GAP } from './CanvasPageHeader';

// Horizontally fixed: always spans from LeftRail's right edge to the screen's right edge.
// Only the vertical axis (bottom) reacts to timeline state.
export function ZoomToolbar({ fitToScreen }: { fitToScreen: () => void }) {
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
