import React from 'react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import type { CanvasElement } from '../store/useDesignWorkspaceStore';
import {
  PANEL_GAP,
  PANEL_OFFSET,
  FLOATING_LEFT_PANE_OPEN,
  FLOATING_LEFT_PANE_CLOSED,
  FLOATING_RIGHT,
  TIMELINE_HEIGHT,
  TIMELINE_HEIGHT_EXPANDED,
  PAGE_STRIP_HEIGHT,
} from '../constants/layout';

// ─── Placeholder config — mirrors CanvasFrame.tsx exactly ─────────

const PLACEHOLDER_CFG: Record<string, { color: string; label: string; shortLabel: string }> = {
  logo:               { color: '#7b1fa2', label: 'Logo',             shortLabel: 'Logo'       },
  background:         { color: '#4caf50', label: 'Background',       shortLabel: 'Background' },
  jellybean:          { color: '#3949ab', label: 'Jellybean',        shortLabel: 'Jellybean'  },
  media:              { color: '#0277bd', label: 'Media',            shortLabel: 'Media'      },
  audio:              { color: '#ff7043', label: 'Audio',            shortLabel: 'Audio'      },
  product:            { color: '#3949ab', label: 'Product',          shortLabel: 'Product'    },
  image:              { color: '#0277bd', label: 'Image',            shortLabel: 'Image'      },
  'background-image': { color: '#4caf50', label: 'Background Image', shortLabel: 'Background' },
  'background-video': { color: '#4caf50', label: 'Background Video', shortLabel: 'Bg. Video'  },
  'primary-logo':     { color: '#7b1fa2', label: 'Primary Logo',     shortLabel: 'Primary'    },
  'secondary-logo':   { color: '#c62828', label: 'Secondary Logo',   shortLabel: 'Secondary'  },
  'event-logo':       { color: '#1565c0', label: 'Event Logo',       shortLabel: 'Event'      },
};

// ─── Mini canvas renderer ──────────────────────────────────────────

function MiniElement({ el }: { el: CanvasElement }) {
  const base: React.CSSProperties = {
    position: 'absolute',
    left:     el.x,
    top:      el.y,
    width:    el.width,
    height:   el.height,
    overflow: 'hidden',
    opacity:  el.style?.opacity ?? 1,
  };

  // ── Text ──────────────────────────────────────────────────────────
  if (el.type.startsWith('text-')) {
    return (
      <div style={{
        ...base,
        fontSize:   el.style?.fontSize   ?? 16,
        fontWeight: el.style?.fontWeight ?? '400',
        fontFamily: el.style?.fontFamily ? `'${el.style.fontFamily}',sans-serif` : 'sans-serif',
        color:      el.style?.color      ?? '#111111',
        lineHeight: 1.2,
        whiteSpace: 'pre-wrap',
        wordBreak:  'break-word',
      }}>
        {el.content ?? ''}
      </div>
    );
  }

  // ── Shape ─────────────────────────────────────────────────────────
  if (el.type === 'shape') {
    return (
      <div style={{
        ...base,
        background:   el.style?.backgroundImage ?? el.style?.backgroundColor ?? '#D0D0D0',
        borderRadius: el.shapeVariant === 'circle' ? '50%' : undefined,
      }} />
    );
  }

  // ── Line ──────────────────────────────────────────────────────────
  if (el.type === 'line') {
    return <div style={{ ...base, backgroundColor: el.style?.color ?? '#111' }} />;
  }

  // ── Icon ──────────────────────────────────────────────────────────
  if (el.type === 'icon' && el.iconSrc) {
    return <img src={el.iconSrc} alt="" draggable={false} style={{ ...base, objectFit: 'contain' }} />;
  }

  // ── Placeholder ───────────────────────────────────────────────────
  if (el.type.startsWith('placeholder-')) {
    const variant   = el.placeholderVariant ?? el.type.replace('placeholder-', '');
    const cfg       = PLACEHOLDER_CFG[variant] ?? PLACEHOLDER_CFG['media'];
    const isBg      = variant === 'background' || variant === 'background-image' || variant === 'background-video';
    const isLogo    = variant === 'logo' || variant === 'primary-logo' || variant === 'secondary-logo' || variant === 'event-logo';
    const isProduct = variant === 'product' || variant === 'jellybean' || variant === 'image' || variant === 'media';
    const radius    = isBg ? 0 : 4;

    // When a feed image has been resolved, render the actual image
    if (el.src) {
      const objFit = isLogo ? 'contain' : 'cover';
      const mask   = isProduct
        ? 'linear-gradient(to top, transparent 0%, black 30%)'
        : undefined;
      return (
        <div style={{ ...base, borderRadius: radius, overflow: 'hidden' }}>
          <img src={el.src} alt="" draggable={false}
            style={{
              width: '100%', height: '100%',
              objectFit: objFit,
              objectPosition: 'center center',
              display: 'block',
              WebkitMaskImage: mask, maskImage: mask,
            }} />
        </div>
      );
    }

    // No image — render dashed border + badge (matches PlaceholderElement in CanvasFrame)
    const sw = 3;
    const minDim = Math.min(el.width, el.height);
    const showBadge = minDim >= 50;
    const text   = minDim >= 200 ? cfg.label : cfg.shortLabel;
    const fSize  = minDim >= 200 ? 14 : 12;
    const fWeight = minDim >= 200 ? 500 : 400;
    const pad    = minDim >= 200 ? '8px 6px' : '4px';

    return (
      <div style={{
        ...base,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        borderRadius:    radius,
        backgroundColor: 'rgba(17,16,20,0.04)',
      }}>
        {/* SVG dashed border */}
        <svg
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
        >
          <rect
            x={sw / 2} y={sw / 2}
            width={`calc(100% - ${sw}px)`} height={`calc(100% - ${sw}px)`}
            fill="none"
            stroke={cfg.color}
            strokeWidth={sw}
            strokeDasharray="12 10"
            rx={radius} ry={radius}
          />
        </svg>
        {/* Badge */}
        {showBadge && (
          <span style={{
            position:        'relative',
            color:           '#fff',
            backgroundColor: cfg.color,
            fontSize:        fSize,
            fontFamily:      "'Roboto',sans-serif",
            fontWeight:      fWeight,
            lineHeight:      minDim >= 200 ? '1.3' : '12px',
            padding:         pad,
            borderRadius:    4,
            whiteSpace:      'nowrap',
            letterSpacing:   '0.15px',
            overflow:        'hidden',
            maxHeight:       35,
          }}>
            {text}
          </span>
        )}
      </div>
    );
  }

  return null;
}

export const MiniCanvas = React.memo(function MiniCanvas({
  elements, canvasW, canvasH, thumbW, thumbH,
}: {
  elements: CanvasElement[];
  canvasW: number; canvasH: number; thumbW: number; thumbH: number;
}) {
  const scale = Math.min(thumbW / canvasW, thumbH / canvasH);
  return (
    <div style={{ width: thumbW, height: thumbH, position: 'relative', overflow: 'hidden', background: '#ffffff' }}>
      <div style={{
        position: 'absolute', left: 0, top: 0,
        width: canvasW, height: canvasH,
        transform: `scale(${scale})`, transformOrigin: '0 0',
        pointerEvents: 'none',
      }}>
        {elements.map(el => <MiniElement key={el.id} el={el} />)}
      </div>
    </div>
  );
});

// ─── Single page card ──────────────────────────────────────────────
function PageCard({
  label,
  isActive,
  isDetached,
  thumbW,
  thumbH,
  elements,
  canvasW,
  canvasH,
  onClick,
  pageId,
}: {
  label:      string;
  isActive:   boolean;
  isDetached: boolean;
  thumbW:     number;
  thumbH:     number;
  elements:   CanvasElement[];
  canvasW:    number;
  canvasH:    number;
  onClick:    () => void;
  pageId:     string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      data-page-id={pageId}
      className="flex flex-col items-center gap-1 shrink-0 group"
    >
      {/* Thumbnail */}
      <div
        className="relative overflow-hidden transition-all"
        style={{
          width:       thumbW,
          height:      thumbH,
          borderRadius: 4,
          borderWidth:  2,
          borderStyle:  'solid',
          borderColor:  isActive ? '#5B4EFF' : '#D0D0D0',
        }}
      >
        <MiniCanvas
          elements={elements}
          canvasW={canvasW}
          canvasH={canvasH}
          thumbW={thumbW - 4}
          thumbH={thumbH - 4}
        />
        {/* Detached indicator dot */}
        {isDetached && (
          <div
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#f59e0b' }}
          />
        )}
      </div>

      {/* Label */}
      <span
        className="text-[9px] font-medium leading-none truncate"
        style={{
          maxWidth: thumbW + 4,
          color:    isActive ? '#5B4EFF' : '#6B6B6B',
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Strip container ───────────────────────────────────────────────
export function PageStrip() {
  const {
    variants,
    activeVariantId,
    switchToPage,
    canvasWidth,
    canvasHeight,
    masterElements,
    canvasElements,
    activePanel,
    selectedElementIds,
    activityPanelOpen,
    isTimelineVisible,
    isTimelineExpanded,
  } = useDesignWorkspace();

  const masterThumbElements = activeVariantId === null ? canvasElements : masterElements;

  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Scroll active card into view whenever activeVariantId changes
  React.useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const pageId = activeVariantId ?? 'master';
    const card = container.querySelector<HTMLElement>(`[data-page-id="${pageId}"]`);
    if (!card) return;
    // Smooth-scroll so the card is fully visible inside the strip
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeVariantId]);

  // Keyboard navigation: ArrowLeft / ArrowRight moves through Master + variants
  React.useEffect(() => {
    if (variants.length === 0) return;
    const pages: Array<string | null> = [null, ...variants.map(v => v.id)];
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const idx = pages.indexOf(activeVariantId);
      if (idx === -1) return;
      const next = e.key === 'ArrowRight' ? Math.min(idx + 1, pages.length - 1) : Math.max(idx - 1, 0);
      if (next !== idx) { e.preventDefault(); switchToPage(pages[next]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [variants, activeVariantId, switchToPage]);

  if (variants.length === 0) return null;

  const isLeftPaneVisible =
    activePanel !== null && activePanel !== 'settings' && activePanel !== 'configure';
  const isRightPanelVisible =
    activePanel === 'settings' ||
    activePanel === 'configure' ||
    selectedElementIds.length > 0 ||
    activityPanelOpen;

  const leftPosition  = isLeftPaneVisible   ? FLOATING_LEFT_PANE_OPEN  : FLOATING_LEFT_PANE_CLOSED;
  const rightPosition = isRightPanelVisible ? FLOATING_RIGHT            : PANEL_GAP;

  const timelineHeight = isTimelineExpanded ? TIMELINE_HEIGHT_EXPANDED : TIMELINE_HEIGHT;
  const bottom = isTimelineVisible
    ? PANEL_OFFSET + timelineHeight + PANEL_GAP
    : PANEL_OFFSET;

  // Thumbnail dimensions preserving canvas aspect ratio
  const THUMB_W = 44;
  const THUMB_H = Math.max(28, Math.round(THUMB_W * canvasHeight / canvasWidth));

  return (
    <div
      className="absolute z-20 bg-white rounded-2xl shadow-lg overflow-hidden"
      style={{
        bottom,
        left:   leftPosition,
        right:  rightPosition,
        height: PAGE_STRIP_HEIGHT,
        transition: 'left 200ms ease-in-out, right 200ms ease-in-out, bottom 200ms ease-in-out',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div ref={scrollRef} className="flex items-center h-full px-3 gap-2.5 overflow-x-auto">
        {/* Master card */}
        <PageCard
          label="Master"
          isActive={activeVariantId === null}
          isDetached={false}
          thumbW={THUMB_W}
          thumbH={THUMB_H}
          elements={masterThumbElements}
          canvasW={canvasWidth}
          canvasH={canvasHeight}
          onClick={() => switchToPage(null)}
          pageId="master"
        />

        {/* Separator */}
        <div className="w-px h-8 bg-[#E2E2E2] shrink-0" />

        {/* Variant cards */}
        {variants.map(v => (
          <PageCard
            key={v.id}
            label={v.name}
            isActive={activeVariantId === v.id}
            isDetached={v.isDetached}
            thumbW={THUMB_W}
            thumbH={THUMB_H}
            elements={v.elements}
            canvasW={canvasWidth}
            canvasH={canvasHeight}
            onClick={() => switchToPage(v.id)}
            pageId={v.id}
          />
        ))}
      </div>
    </div>
  );
}
