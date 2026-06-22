import { useEffect, useRef, useState } from 'react';
import { useHtmlEditor } from './store/useHtmlEditorStore';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function HtmlTemplatePreview() {
  const { document: doc, zoomLevel, fitMode, previewRefreshKey } = useHtmlEditor();
  const debouncedHtml = useDebounce(doc.html, 400);
  const [dimensions, setDimensions] = useState({ w: 200, h: 650 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Track container size for fit-to-screen calculation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Extract ad dimensions from HTML for the dimension badge
  useEffect(() => {
    const wMatch = debouncedHtml.match(/width:\s*(\d+)px/);
    const hMatch = debouncedHtml.match(/height:\s*(\d+)px/);
    if (wMatch && hMatch) {
      const w = parseInt(wMatch[1], 10);
      const h = parseInt(hMatch[1], 10);
      if (w > 0 && w < 2000 && h > 0 && h < 4000) {
        setDimensions({ w, h });
      }
    }
  }, [debouncedHtml]);

  // When fitMode, compute scale to fill the container with padding
  const PADDING = 64;
  const scale = fitMode && containerSize.w > 0 && containerSize.h > 0
    ? Math.min(
        (containerSize.w - PADDING * 2) / dimensions.w,
        (containerSize.h - PADDING * 2) / dimensions.h,
      )
    : zoomLevel / 100;

  const scaledW = Math.round(dimensions.w * scale);
  const scaledH = Math.round(dimensions.h * scale);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-h-0 bg-[#f4f5f6] rounded-[16px] overflow-auto"
    >
      {/* Dimension badge */}
      <div className="sticky top-4 left-4 z-10 inline-block pointer-events-none ml-4 mt-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-[#D0D0D0] bg-white text-[11px] font-medium text-[#4B4B4B]">
          {dimensions.w}x{dimensions.h}
        </span>
      </div>

      {/* Centering wrapper — takes up the full scrollable area */}
      <div className="flex items-center justify-center p-12 min-h-full min-w-full box-border">
        {/* Outer div sized to scaled dimensions — sets scrollable content size */}
        <div
          style={{ width: scaledW, height: scaledH, flexShrink: 0, position: 'relative' }}
        >
          {/* Iframe at natural dimensions, scaled via transform */}
          <iframe
            key={`preview-${dimensions.w}-${dimensions.h}-${previewRefreshKey}`}
            srcDoc={debouncedHtml}
            title="HTML template preview"
            sandbox="allow-scripts"
            aria-label="HTML template preview"
            style={{
              width: dimensions.w,
              height: dimensions.h,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              border: 'none',
              display: 'block',
            }}
          />
        </div>
      </div>
    </div>
  );
}
