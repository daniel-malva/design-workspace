import { ChevronDown, Maximize2, RefreshCw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useHtmlEditor } from './store/useHtmlEditorStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

const ZOOM_OPTIONS = [50, 75, 100, 150, 200, 300, 400];

export function HtmlPreviewToolbar() {
  const { zoomLevel, setZoomLevel, fitMode, setFitMode, refreshPreview } = useHtmlEditor();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', handle);
    return () => window.removeEventListener('mousedown', handle);
  }, [open]);

  function handleRefresh() {
    refreshPreview();
  }

  return (
    <TooltipProvider delayDuration={400}>
      {/* Floating controls — no border-t, no bg, no padding; parent handles absolute positioning */}
      <div className="flex items-center gap-[4px]">
        {/* Zoom dropdown — rounded-[4px], border rgba(0,0,0,0.12) from Figma CanvaZoom */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(o => !o)}
            aria-label="Zoom level"
            aria-expanded={open}
            className="flex items-center gap-1 px-3 py-1.5 rounded-[4px] bg-white border border-[rgba(0,0,0,0.12)] text-[12px] font-medium text-[#1f1d25] hover:bg-[#F5F5F5] transition-colors"
          >
            {fitMode ? 'Fit' : `${zoomLevel}%`}
            <ChevronDown size={12} className="text-[#9c99a9]" />
          </button>
          {open && (
            <div className="absolute bottom-full left-0 mb-1 bg-white rounded-xl shadow-lg border border-[rgba(0,0,0,0.12)] py-1 w-28 z-50">
              {ZOOM_OPTIONS.map(z => (
                <button
                  key={z}
                  onClick={() => { setZoomLevel(z); setOpen(false); setFitMode(false); }}
                  className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors ${
                    zoomLevel === z && !fitMode
                      ? 'text-[#473bab] font-medium bg-[rgba(99,86,225,0.06)]'
                      : 'text-[#1f1d25] hover:bg-[#F5F5F5]'
                  }`}
                >
                  {z}%
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fit to screen — rounded-full (100px), border rgba(0,0,0,0.12), p-5px icon */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setFitMode(!fitMode)}
              aria-label="Fit to screen"
              aria-pressed={fitMode}
              className={`flex items-center justify-center p-[5px] rounded-full border transition-colors ${
                fitMode
                  ? 'border-[rgba(99,86,225,0.5)] text-[#473bab] bg-[rgba(99,86,225,0.06)]'
                  : 'border-[rgba(0,0,0,0.12)] text-[#6B6B6B] bg-white hover:bg-[#F5F5F5]'
              }`}
            >
              <Maximize2 size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Fit to screen</TooltipContent>
        </Tooltip>

        {/* Refresh — rounded-full, border rgba(0,0,0,0.12), p-5px icon */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleRefresh}
              aria-label="Refresh preview"
              className="flex items-center justify-center p-[5px] rounded-full border border-[rgba(0,0,0,0.12)] bg-white text-[#6B6B6B] hover:bg-[#F5F5F5] transition-colors"
            >
              <RefreshCw size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Refresh preview</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
