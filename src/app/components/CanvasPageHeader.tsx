import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Check, X, Pencil, Copy, PlusSquare, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import type { CanvasPage, FeedVariant } from '../store/useDesignWorkspaceStore';

export const PAGE_GAP = 80; // px between the bottom of one canvas and the top of the next

// ── Shared menu item ──────────────────────────────────────────────
function CanvasMenuOption({
  icon,
  label,
  onSelect,
  disabled = false,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); if (!disabled) onSelect(); }}
      disabled={disabled}
      className={`flex items-center gap-2 w-full px-3 py-1.5 text-left text-[12px] font-medium transition-colors
        ${disabled
          ? 'opacity-30 cursor-not-allowed text-[#2d2a38]'
          : danger
            ? 'text-red-500 hover:bg-red-50'
            : 'text-[#2d2a38] hover:bg-[rgba(91,78,255,0.07)]'
        }`}
    >
      <span className="w-3.5 flex items-center justify-center shrink-0">{icon}</span>
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
  reorderCanvasPages,
}: {
  page:                CanvasPage;
  isActive:            boolean;
  canvasWidth:         number;
  canvasHeight:        number;
  canvasPages:         CanvasPage[];
  activeVariantId:     string | null;
  variants:            FeedVariant[];
  addCanvasPage:       () => void;
  duplicateCanvasPage: (id: string) => void;
  deleteCanvasPage:    (id: string) => void;
  renameCanvasPage:    (id: string, name: string) => void;
  reorderCanvasPages:  (pageIds: string[]) => void;
}) {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [renaming,    setRenaming]    = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const inputRef  = useRef<HTMLInputElement>(null);
  const menuRef   = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const activeVariant = variants.find(v => v.id === activeVariantId) ?? null;
  const displayName = isActive && activeVariantId !== null
    ? (activeVariant?.name ?? 'Variant')
    : page.name;

  // Close on outside click — capture phase so canvas stopPropagation doesn't block it
  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (
        menuRef.current    && menuRef.current.contains(e.target as Node)    ||
        triggerRef.current && triggerRef.current.contains(e.target as Node)
      ) return;
      setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleOutside, true);
    return () => document.removeEventListener('mousedown', handleOutside, true);
  }, [menuOpen]);

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

  useEffect(() => {
    if (renaming) {
      const t = setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 30);
      return () => clearTimeout(t);
    }
  }, [renaming]);

  // Move helpers
  const pageIdx  = canvasPages.findIndex(p => p.id === page.id);
  const isFirst  = pageIdx === 0;
  const isLast   = pageIdx === canvasPages.length - 1;

  function moveUp() {
    if (isFirst) return;
    const ids = canvasPages.map(p => p.id);
    [ids[pageIdx - 1], ids[pageIdx]] = [ids[pageIdx], ids[pageIdx - 1]];
    reorderCanvasPages(ids);
    setMenuOpen(false);
  }

  function moveDown() {
    if (isLast) return;
    const ids = canvasPages.map(p => p.id);
    [ids[pageIdx + 1], ids[pageIdx]] = [ids[pageIdx], ids[pageIdx + 1]];
    reorderCanvasPages(ids);
    setMenuOpen(false);
  }

  const showKebab = activeVariantId === null;

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
            ref={triggerRef}
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 text-[#111111] transition-colors"
          >
            <MoreVertical size={13} />
          </button>

          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-[rgba(0,0,0,0.1)] py-1 min-w-[168px] z-50 overflow-hidden"
            >
              <CanvasMenuOption
                icon={<Pencil size={12} />}
                label="Rename"
                onSelect={startRename}
              />
              <CanvasMenuOption
                icon={<Copy size={12} />}
                label="Duplicate"
                onSelect={() => { setMenuOpen(false); duplicateCanvasPage(page.id); }}
              />
              <CanvasMenuOption
                icon={<PlusSquare size={12} />}
                label="Add canvas after"
                onSelect={() => { setMenuOpen(false); addCanvasPage(); }}
              />

              <div className="my-1 h-px bg-[rgba(0,0,0,0.07)] mx-2" />

              <CanvasMenuOption
                icon={<ChevronUp size={12} />}
                label="Move up"
                onSelect={moveUp}
                disabled={isFirst}
              />
              <CanvasMenuOption
                icon={<ChevronDown size={12} />}
                label="Move down"
                onSelect={moveDown}
                disabled={isLast}
              />

              <div className="my-1 h-px bg-[rgba(0,0,0,0.07)] mx-2" />

              <CanvasMenuOption
                icon={<Trash2 size={12} />}
                label="Delete"
                onSelect={() => { setMenuOpen(false); deleteCanvasPage(page.id); }}
                danger
                disabled={canvasPages.length <= 1}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
