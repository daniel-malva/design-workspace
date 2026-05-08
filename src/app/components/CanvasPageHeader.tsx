import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Check, X } from 'lucide-react';
import type { CanvasPage, FeedVariant } from '../store/useDesignWorkspaceStore';

export const PAGE_GAP = 80; // px between the bottom of one canvas and the top of the next

function CanvasMenuOption({ label, onSelect, disabled }: { label: string; onSelect: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors ${
        disabled
          ? 'text-[#BBBBBB] cursor-not-allowed'
          : 'text-[#111111] hover:bg-[#f5f5f5]'
      }`}
    >
      {label}
    </button>
  );
}

export function CanvasPageHeader({
  page,
  isActive,
  canvasWidth,
  canvasHeight,
  canvasPages,
  activeVariantId,
  variants,
  addCanvasPage,
  duplicateCanvasPage,
  deleteCanvasPage,
  renameCanvasPage,
}: {
  page:               CanvasPage;
  isActive:           boolean;
  canvasWidth:        number;
  canvasHeight:       number;
  canvasPages:        CanvasPage[];
  activeVariantId:    string | null;
  variants:           FeedVariant[];
  addCanvasPage:      () => void;
  duplicateCanvasPage:(id: string) => void;
  deleteCanvasPage:   (id: string) => void;
  renameCanvasPage:   (id: string, name: string) => void;
}) {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [renaming,    setRenaming]    = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const activeVariant = variants.find(v => v.id === activeVariantId) ?? null;
  // Show feed variant name only when this is the active page and we're on a variant
  const displayName = isActive && activeVariantId !== null
    ? (activeVariant?.name ?? 'Variant')
    : page.name;

  function startRename() {
    setMenuOpen(false);
    setRenameValue(page.name);
    setRenaming(true);
  }

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed) renameCanvasPage(page.id, trimmed);
    setRenaming(false);
  }

  function cancelRename() { setRenaming(false); }

  // Auto-focus the input once it appears in the DOM
  useEffect(() => {
    if (renaming) {
      const t = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
      return () => clearTimeout(t);
    }
  }, [renaming]);

  const showKebab = activeVariantId === null; // kebab only on master template view

  return (
    <div className="flex items-center justify-between gap-2 h-8">
      {/* Name or rename input */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {renaming ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter')  { e.preventDefault(); commitRename(); }
                if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
              }}
              onBlur={commitRename}
              className="text-[11px] font-medium text-[#111111] bg-white border border-[#5B4EFF] rounded px-1.5 py-0.5 outline-none"
              style={{ width: Math.min(canvasWidth * 0.4, 160) }}
            />
            <button
              onMouseDown={e => { e.preventDefault(); commitRename(); }}
              className="w-4 h-4 flex items-center justify-center text-[#5B4EFF] hover:text-[#4a3ee0] shrink-0"
            >
              <Check size={10} />
            </button>
            <button
              onMouseDown={e => { e.preventDefault(); cancelRename(); }}
              className="w-4 h-4 flex items-center justify-center text-[#6B6B6B] hover:text-[#111111] shrink-0"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <span
            className="text-[11px] text-[#111111] font-medium truncate cursor-default select-none"
            onDoubleClick={showKebab ? startRename : undefined}
            title={showKebab ? `${displayName} (double-click to rename)` : displayName}
          >
            {displayName}
          </span>
        )}
        {isActive && activeVariant?.isDetached && (
          <span
            className="text-[9px] font-medium px-1.5 py-0.5 rounded-full leading-none shrink-0"
            style={{ color: '#92400e', backgroundColor: '#fef3c7' }}
          >
            modified
          </span>
        )}
      </div>

      {/* Kebab menu — only on master template pages */}
      {showKebab && (
        <div className="relative shrink-0">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 text-[#111111] transition-colors"
          >
            <MoreVertical size={13} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-[#E2E2E2] py-1 w-44 z-50">
              <CanvasMenuOption label="Rename canvas"    onSelect={startRename} />
              <CanvasMenuOption
                label="Duplicate canvas"
                onSelect={() => { setMenuOpen(false); duplicateCanvasPage(page.id); }}
              />
              <CanvasMenuOption
                label="Delete canvas"
                onSelect={() => { setMenuOpen(false); deleteCanvasPage(page.id); }}
                disabled={canvasPages.length <= 1}
              />
              <CanvasMenuOption
                label="Add new canvas"
                onSelect={() => { setMenuOpen(false); addCanvasPage(); }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
