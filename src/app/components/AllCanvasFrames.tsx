import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import { CanvasFrame } from './CanvasFrame';
import { MiniCanvas } from './PageStrip';
import { CanvasPageHeader, PAGE_GAP } from './CanvasPageHeader';

export function AllCanvasFrames() {
  const {
    canvasWidth, canvasHeight,
    canvasPages, activePageId,
    activeVariantId, variants,
    canvasElements,
    addCanvasPage, duplicateCanvasPage, deleteCanvasPage, renameCanvasPage,
    switchCanvasPage,
  } = useDesignWorkspace();

  // When on a variant, inactive pages should show the variant's substituted
  // elements — not the master snapshot stored in page.elementSnapshot.
  const currentVariant = activeVariantId !== null
    ? variants.find(v => v.id === activeVariantId) ?? null
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: PAGE_GAP, alignItems: 'flex-start' }}>
      {canvasPages.map(page => {
        const isActive = page.id === activePageId;
        // Active page: live canvasElements (already substituted when on a variant).
        // Inactive pages: variant pageSnapshot when on a variant, master snapshot otherwise.
        const elements = isActive
          ? canvasElements
          : (currentVariant?.pageSnapshots?.[page.id]?.elements ?? page.elementSnapshot);

        return (
          <div
            key={page.id}
            style={{ width: canvasWidth }}
          >
            {/*
              ── Page header ───────────────────────────────
              position:relative + zIndex:100 creates a stacking context that
              sits ABOVE CanvasFrame (which comes later in the DOM and would
              otherwise paint over the dropdown, swallowing all pointer events).
            */}
            <div style={{ position: 'relative', zIndex: 100 }}>
              <CanvasPageHeader
                page={page}
                isActive={isActive}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                canvasPages={canvasPages}
                activeVariantId={activeVariantId}
                variants={variants}
                addCanvasPage={addCanvasPage}
                duplicateCanvasPage={duplicateCanvasPage}
                deleteCanvasPage={deleteCanvasPage}
                renameCanvasPage={renameCanvasPage}
              />
            </div>

            {/* 4px gap between header and canvas */}
            <div style={{ height: 4 }} />

            {/* ── Canvas box ──────────────────────────────── */}
            {isActive ? (
              // Active page: full interactive canvas
              <CanvasFrame />
            ) : (
              // Inactive page: static preview, click to switch
              <div
                role="button"
                tabIndex={0}
                aria-label={`Switch to ${page.name}`}
                onClick={e => { e.stopPropagation(); switchCanvasPage(page.id); }}
                onKeyDown={e => e.key === 'Enter' && switchCanvasPage(page.id)}
                className="relative bg-white shadow-xl select-none cursor-pointer"
                style={{
                  width:  canvasWidth,
                  height: canvasHeight,
                  overflow: 'hidden',
                  outline: '2px solid transparent',
                  transition: 'outline-color 120ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.outlineColor = '#5B4EFF55')}
                onMouseLeave={e => (e.currentTarget.style.outlineColor = 'transparent')}
              >
                <MiniCanvas
                  elements={elements}
                  canvasW={canvasWidth}
                  canvasH={canvasHeight}
                  thumbW={canvasWidth}
                  thumbH={canvasHeight}
                />
                {/* Subtle "click to activate" overlay on hover */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ background: 'rgba(91,78,255,0.04)' }}
                />
              </div>
            )}

            {/* ── Size label ──────────────────────────────── */}
            <div className="text-center mt-2">
              <span className="text-[10px] text-[#6B6B6B] font-medium">
                {canvasWidth}px × {canvasHeight}px
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
