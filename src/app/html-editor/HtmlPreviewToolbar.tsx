import { ChevronDown, Maximize2, RefreshCw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useHtmlEditor } from './store/useHtmlEditorStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

const ZOOM_OPTIONS = [50, 75, 100, 150, 200, 300, 400];

export function HtmlPreviewToolbar() {
  const { zoomLevel, setZoomLevel, refreshPreview } = useHtmlEditor();
  const [open, setOpen] = useState(false);
  const [fitMode, setFitMode] = useState(false);
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
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[#E2E2E2] bg-white shrink-0">
        {/* Zoom dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(o => !o)}
            aria-label="Zoom level"
            aria-expanded={open}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#E2E2E2] text-[12px] font-medium text-[#1f1d25] hover:bg-[#F5F5F5] transition-colors"
          >
            {zoomLevel}%
            <ChevronDown size={12} className="text-[#9c99a9]" />
          </button>
          {open && (
            <div className="absolute bottom-full left-0 mb-1 bg-white rounded-xl shadow-lg border border-[#E2E2E2] py-1 w-28 z-50">
              {ZOOM_OPTIONS.map(z => (
                <button
                  key={z}
                  onClick={() => { setZoomLevel(z); setOpen(false); setFitMode(false); }}
                  className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors ${
                    zoomLevel === z && !fitMode
                      ? 'text-[#5B4EFF] font-medium bg-[rgba(91,78,255,0.06)]'
                      : 'text-[#1f1d25] hover:bg-[#F5F5F5]'
                  }`}
                >
                  {z}%
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fit to screen */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => { setFitMode(f => !f); setZoomLevel(100); }}
              aria-label="Fit to screen"
              aria-pressed={fitMode}
              className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                fitMode
                  ? 'border-[#5B4EFF] text-[#5B4EFF] bg-[rgba(91,78,255,0.06)]'
                  : 'border-[#E2E2E2] text-[#6B6B6B] hover:bg-[#F5F5F5]'
              }`}
            >
              <Maximize2 size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Fit to screen</TooltipContent>
        </Tooltip>

        {/* Refresh */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleRefresh}
              aria-label="Refresh preview"
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#E2E2E2] text-[#6B6B6B] hover:bg-[#F5F5F5] transition-colors"
            >
              <RefreshCw size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Refresh preview</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
