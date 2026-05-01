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

// ─── Mini canvas renderer ──────────────────────────────────────────

function MiniElement({ el }: { el: CanvasElement }) {
  const base: React.CSSProperties = {
    position: 'absolute',
    left:     el.x,
    top:      el.y,
    width:    el.width,
    height:   el.height,
    overflow: 'hidden',
  };

  if (el.type.startsWith('text-')) {
    return (
      <div style={{
        ...base,
        fontSize:   el.style?.fontSize   ?? 16,
        fontWeight: el.style?.fontWeight ?? '400',
        fontFamily: el.style?.fontFamily ?? 'sans-serif',
        color:      el.style?.color      ?? '#111111',
        opacity:    el.style?.opacity    ?? 1,
        lineHeight: 1.2,
        whiteSpace: 'pre-wrap',
        wordBreak:  'break-word',
      }}>
        {el.content ?? ''}
      </div>
    );
  }

  if (el.type === 'shape') {
    return (
      <div style={{
        ...base,
        background:   el.style?.backgroundImage ?? el.style?.backgroundColor ?? '#D0D0D0',
        opacity:      el.style?.opacity ?? 1,
        borderRadius: el.shapeVariant === 'circle' ? '50%' : undefined,
      }} />
    );
  }

  if (el.type === 'line') {
    return <div style={{ ...base, backgroundColor: el.style?.color ?? '#111', opacity: el.style?.opacity ?? 1 }} />;
  }

  // Placeholder types
  const COLORS: Record<string, string> = {
    'placeholder-background-image': '#c8d8e8',
    'placeholder-background-video': '#c8cce8',
    'placeholder-primary-logo':     '#e8c8d0',
    'placeholder-secondary-logo':   '#e8d0c8',
    'placeholder-event-logo':       '#d0e8c8',
    'placeholder-product':          '#e8e8c8',
    'placeholder-image':            '#d8e8d8',
    'placeholder-audio':            '#e8d8e8',
  };
  return <div style={{ ...base, backgroundColor: COLORS[el.type] ?? '#E0E0E0', opacity: el.style?.opacity ?? 1 }} />;
}

const MiniCanvas = React.memo(function MiniCanvas({
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
}) {
  return (
    <button
      onClick={onClick}
      title={label}
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
      <div className="flex items-center h-full px-3 gap-2.5 overflow-x-auto">
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
          />
        ))}
      </div>
    </div>
  );
}
