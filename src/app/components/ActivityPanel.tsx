import { useState, useRef, useEffect } from 'react';
import { Send, LayoutGrid, List, CheckCircle2, Circle, Plus, Check, X, CornerDownRight, GripVertical, MoreHorizontal, Pencil, Copy, Trash2, PlusSquare, ChevronUp, ChevronDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Separator } from './ui/separator';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import type { CanvasComment } from '../store/useDesignWorkspaceStore';
import { MiniCanvas } from './PageStrip';
import {
  AVATAR_COLORS, CATEGORY_COLORS,
  earlierTodayEvents, yesterdayEvents, lastWeekEvents, monthAgoEvents, mockComments,
} from '../constants/mockData';
import type { ActivityUser, ActivityEvent, Comment } from '../constants/mockData';

// ══════════════════════════════════════════════════════════════════
// SHARED PRIMITIVES
// ══════════════════════════════════════════════════════════════════

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap
        ${active
          ? 'border-[#473bab] text-[#473bab] bg-[#473bab0f]'
          : 'border-[rgba(0,0,0,0.18)] text-[#686576] bg-transparent hover:bg-gray-50'
        }
      `}
    >
      {label}
    </button>
  );
}

function ActivityBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium w-fit"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      {label}
    </span>
  );
}

// Shared tab trigger style
const TAB_CLS = `
  relative px-3 py-[9px] rounded-none
  text-[13px] tracking-[0.4px] leading-6
  bg-transparent shadow-none border-0
  data-[state=active]:text-[#473bab]
  data-[state=inactive]:text-[#686576]
  hover:text-[#473bab] transition-colors
  data-[state=active]:after:content-['']
  data-[state=active]:after:absolute
  data-[state=active]:after:bottom-0
  data-[state=active]:after:left-0
  data-[state=active]:after:right-0
  data-[state=active]:after:h-[2px]
  data-[state=active]:after:bg-[#473bab]
  data-[state=active]:after:z-10
`;

// ══════════════════════════════════════════════════════════════════
// TAB 1 — PAGES OVERVIEW  (template canvas pages)
// ══════════════════════════════════════════════════════════════════

// ── Kebab dropdown for each page card ──────────────────────────
interface KebabMenuProps {
  pageId: string;
  pageIdx: number;
  totalPages: number;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddAfter: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onClose: () => void;
}

function PageKebabMenu({
  pageId, pageIdx, totalPages,
  onRename, onDuplicate, onDelete, onAddAfter, onMoveUp, onMoveDown, onClose,
}: KebabMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // slight delay so the same click that opened doesn't close it
    const t = setTimeout(() => document.addEventListener('mousedown', handleOutside), 50);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handleOutside); };
  }, [onClose]);

  const item = (icon: React.ReactNode, label: string, action: () => void, danger = false, disabled = false) => (
    <button
      key={label}
      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); if (!disabled) { action(); onClose(); } }}
      disabled={disabled}
      className={`flex items-center gap-2 w-full px-3 py-1.5 text-left text-[12px] font-medium transition-colors
        ${disabled ? 'opacity-30 cursor-not-allowed' :
          danger ? 'text-red-500 hover:bg-red-50' : 'text-[#2d2a38] hover:bg-[rgba(91,78,255,0.07)]'}`}
    >
      <span className="w-3.5 flex items-center justify-center shrink-0">{icon}</span>
      {label}
    </button>
  );

  return (
    <div
      ref={menuRef}
      className="absolute right-2 top-8 z-50 bg-white rounded-xl border border-[rgba(0,0,0,0.1)] shadow-lg overflow-hidden py-1 min-w-[160px]"
      onClick={e => e.stopPropagation()}
    >
      {item(<Pencil size={12} />,    'Rename',          onRename)}
      {item(<Copy size={12} />,      'Duplicate',       onDuplicate)}
      {item(<PlusSquare size={12} />, 'Add canvas after', onAddAfter)}
      <div className="my-1 h-px bg-[rgba(0,0,0,0.07)] mx-2" />
      {item(<ChevronUp size={12} />,   'Move up',   onMoveUp,   false, pageIdx === 0)}
      {item(<ChevronDown size={12} />, 'Move down', onMoveDown, false, pageIdx === totalPages - 1)}
      <div className="my-1 h-px bg-[rgba(0,0,0,0.07)] mx-2" />
      {item(<Trash2 size={12} />, 'Delete', onDelete, true, totalPages <= 1)}
    </div>
  );
}

export function PagesTab() {
  const {
    canvasPages, activePageId, canvasElements,
    switchCanvasPage, addCanvasPage, renameCanvasPage,
    duplicateCanvasPage, deleteCanvasPage, reorderCanvasPages,
    canvasWidth, canvasHeight,
  } = useDesignWorkspace();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [renamingId, setRenamingId]   = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [kebabOpenId, setKebabOpenId] = useState<string | null>(null);
  const [draggingId, setDraggingId]   = useState<string | null>(null);
  const [dragOverId, setDragOverId]   = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Thumbnail dimensions — preserve canvas aspect ratio
  // Single-column layout: +~30% larger than original 2-col size, then −10%
  const GRID_W = 162;
  const GRID_H = Math.max(90, Math.round(GRID_W * canvasHeight / canvasWidth));
  const LIST_W = 56;
  const LIST_H = Math.max(32, Math.round(LIST_W * canvasHeight / canvasWidth));

  function startRename(pageId: string, currentName: string) {
    setRenamingId(pageId);
    setRenameValue(currentName);
    requestAnimationFrame(() => renameInputRef.current?.select());
  }

  function commitRename() {
    if (renamingId && renameValue.trim()) renameCanvasPage(renamingId, renameValue.trim());
    setRenamingId(null);
  }

  function cancelRename() { setRenamingId(null); }

  // Get elements for a given page
  function getPageElements(page: typeof canvasPages[0]) {
    return page.id === activePageId ? canvasElements : page.elementSnapshot;
  }

  // ── Drag-and-drop handlers ────────────────────────────────────
  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(id);
  }
  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== dragOverId) setDragOverId(id);
  }
  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) { reset(); return; }
    const ids     = canvasPages.map(p => p.id);
    const fromIdx = ids.indexOf(draggingId);
    const toIdx   = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) { reset(); return; }
    const newIds = [...ids];
    newIds.splice(fromIdx, 1);
    newIds.splice(toIdx, 0, draggingId);
    reorderCanvasPages(newIds);
    reset();
  }
  function reset() { setDraggingId(null); setDragOverId(null); }

  // ── Move up / down ────────────────────────────────────────────
  function moveUp(pageId: string) {
    const ids = canvasPages.map(p => p.id);
    const idx = ids.indexOf(pageId);
    if (idx <= 0) return;
    const n = [...ids];
    [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]];
    reorderCanvasPages(n);
  }
  function moveDown(pageId: string) {
    const ids = canvasPages.map(p => p.id);
    const idx = ids.indexOf(pageId);
    if (idx >= ids.length - 1) return;
    const n = [...ids];
    [n[idx + 1], n[idx]] = [n[idx], n[idx + 1]];
    reorderCanvasPages(n);
  }

  // ── Grid view ─────────────────────────────────────────────────
  if (viewMode === 'grid') {
    return (
      <div className="flex flex-col w-full flex-1 min-h-0">
        <PageToolbar viewMode={viewMode} onViewChange={setViewMode} count={canvasPages.length} onAdd={addCanvasPage} />
        <Separator className="m-0 shrink-0" />

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col gap-2.5 p-3">
            {canvasPages.map((page, idx) => {
              const isActive   = page.id === activePageId;
              const isRenaming = renamingId === page.id;
              const isDragging = draggingId === page.id;
              const isDragOver = dragOverId === page.id && draggingId !== page.id;
              const els        = getPageElements(page);

              return (
                <div
                  key={page.id}
                  draggable
                  onDragStart={e => handleDragStart(e, page.id)}
                  onDragOver={e => handleDragOver(e, page.id)}
                  onDrop={e => handleDrop(e, page.id)}
                  onDragEnd={reset}
                  className="relative w-full rounded-xl transition-all"
                  style={{
                    backgroundColor: isActive ? 'rgba(91,78,255,0.09)' : 'rgba(91,78,255,0.04)',
                    border: isDragOver
                      ? '1.5px solid #5B4EFF'
                      : isActive
                        ? '1.5px solid rgba(91,78,255,0.35)'
                        : '1.5px solid transparent',
                    boxShadow: isDragOver
                      ? '0 0 0 3px rgba(91,78,255,0.18)'
                      : isActive
                        ? '0 0 0 2px rgba(91,78,255,0.12)'
                        : undefined,
                    opacity: isDragging ? 0.4 : 1,
                    cursor: 'default',
                  }}
                >
                  {/* ── Card header row ── */}
                  <div className="flex items-center gap-1.5 px-2.5 pt-2.5 pb-2">
                    <GripVertical
                      size={13}
                      className="text-[#C5C2D0] shrink-0 cursor-grab active:cursor-grabbing"
                    />
                    <span className="text-[10px] font-medium text-[#9c99a9] shrink-0 w-4 text-right">{idx + 1}</span>

                    {isRenaming ? (
                      <div className="flex items-center gap-0.5 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                        <input
                          ref={renameInputRef}
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter')  { e.preventDefault(); commitRename(); }
                            if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
                          }}
                          onBlur={commitRename}
                          className="flex-1 text-[11px] font-medium text-[#111111] bg-white border border-[#5B4EFF] rounded px-1.5 py-0 outline-none min-w-0"
                          autoFocus
                        />
                        <button onMouseDown={e => { e.preventDefault(); commitRename(); }} className="text-[#5B4EFF] shrink-0">
                          <Check size={10} />
                        </button>
                        <button onMouseDown={e => { e.preventDefault(); cancelRename(); }} className="text-[#9c99a9] shrink-0">
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <span
                        className="text-[11px] font-semibold truncate flex-1 min-w-0"
                        style={{ color: isActive ? '#5B4EFF' : '#5A5770' }}
                        onDoubleClick={e => { e.stopPropagation(); startRename(page.id, page.name); }}
                      >
                        {page.name}
                      </span>
                    )}

                    {/* Kebab trigger */}
                    <button
                      onMouseDown={e => { e.stopPropagation(); setKebabOpenId(kebabOpenId === page.id ? null : page.id); }}
                      className="shrink-0 w-5 h-5 flex items-center justify-center rounded-md text-[#B0AEC0] hover:text-[#5A5770] hover:bg-[rgba(0,0,0,0.07)] transition-colors"
                      title="Page options"
                    >
                      <MoreHorizontal size={13} />
                    </button>
                  </div>

                  {/* Kebab dropdown */}
                  {kebabOpenId === page.id && (
                    <PageKebabMenu
                      pageId={page.id}
                      pageIdx={idx}
                      totalPages={canvasPages.length}
                      onRename={() => startRename(page.id, page.name)}
                      onDuplicate={() => duplicateCanvasPage(page.id)}
                      onDelete={() => deleteCanvasPage(page.id)}
                      onAddAfter={() => {
                        // Add page, then reorder it to appear after current
                        addCanvasPage();
                      }}
                      onMoveUp={() => moveUp(page.id)}
                      onMoveDown={() => moveDown(page.id)}
                      onClose={() => setKebabOpenId(null)}
                    />
                  )}

                  {/* ── Mini canvas — centered, fixed width ── */}
                  <div className="flex justify-center pb-2.5">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => switchCanvasPage(page.id)}
                      onDoubleClick={() => startRename(page.id, page.name)}
                      onKeyDown={e => e.key === 'Enter' && switchCanvasPage(page.id)}
                      className="overflow-hidden bg-white rounded-lg cursor-pointer relative shrink-0"
                      style={{ width: GRID_W, height: GRID_H }}
                    >
                      <MiniCanvas
                        elements={els}
                        canvasW={canvasWidth}
                        canvasH={canvasHeight}
                        thumbW={GRID_W}
                        thumbH={GRID_H}
                      />
                      {/* "active" pill */}
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5">
                          <span className="bg-[#5B4EFF] text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                            active
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full flex-1 min-h-0">
      <PageToolbar viewMode={viewMode} onViewChange={setViewMode} count={canvasPages.length} onAdd={addCanvasPage} />
      <Separator className="m-0 shrink-0" />

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {canvasPages.map((page, idx) => {
          const isActive   = page.id === activePageId;
          const isRenaming = renamingId === page.id;
          const isDragging = draggingId === page.id;
          const isDragOver = dragOverId === page.id && draggingId !== page.id;
          const els        = getPageElements(page);
          return (
            <div
              key={page.id}
              draggable
              onDragStart={e => handleDragStart(e, page.id)}
              onDragOver={e => handleDragOver(e, page.id)}
              onDrop={e => handleDrop(e, page.id)}
              onDragEnd={reset}
              className={`group relative flex items-center gap-3 w-full px-3 py-2 transition-colors ${
                isDragOver ? 'bg-[rgba(91,78,255,0.08)] ring-1 ring-inset ring-[rgba(91,78,255,0.25)]' :
                isActive   ? 'bg-[rgba(91,78,255,0.06)]' : 'hover:bg-gray-50'
              }`}
              style={{ opacity: isDragging ? 0.4 : 1 }}
            >
              <GripVertical size={13} className="text-[#C5C2D0] shrink-0 cursor-grab active:cursor-grabbing" />

              {/* Thumbnail */}
              <div
                className="relative overflow-hidden shrink-0"
                style={{
                  width: LIST_W, height: LIST_H,
                  borderRadius: 5,
                  border: `2px solid ${isActive ? '#5B4EFF' : '#D8D8D8'}`,
                }}
              >
                <MiniCanvas
                  elements={els}
                  canvasW={canvasWidth}
                  canvasH={canvasHeight}
                  thumbW={LIST_W - 4}
                  thumbH={LIST_H - 4}
                />
              </div>

              {/* Name */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => switchCanvasPage(page.id)}
                onDoubleClick={() => startRename(page.id, page.name)}
              >
                {isRenaming ? (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  { e.preventDefault(); commitRename(); }
                        if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
                      }}
                      onBlur={commitRename}
                      className="flex-1 text-[12px] font-medium text-[#111111] bg-white border border-[#5B4EFF] rounded px-1.5 py-0.5 outline-none min-w-0"
                      autoFocus
                    />
                    <button onMouseDown={e => { e.preventDefault(); commitRename(); }} className="text-[#5B4EFF]">
                      <Check size={11} />
                    </button>
                    <button onMouseDown={e => { e.preventDefault(); cancelRename(); }} className="text-[#9c99a9]">
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <span
                    className="text-[12px] font-medium truncate block"
                    style={{ color: isActive ? '#5B4EFF' : '#1f1d25' }}
                  >
                    {page.name}
                  </span>
                )}
              </div>

              {/* Kebab trigger — visible on hover */}
              <div className="relative shrink-0">
                <button
                  onMouseDown={e => { e.stopPropagation(); setKebabOpenId(kebabOpenId === page.id ? null : page.id); }}
                  className={`w-6 h-6 flex items-center justify-center rounded-md text-[#B0AEC0] hover:text-[#5A5770] hover:bg-[rgba(0,0,0,0.07)] transition-all ${
                    kebabOpenId === page.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="Page options"
                >
                  <MoreHorizontal size={13} />
                </button>
                {kebabOpenId === page.id && (
                  <div className="absolute right-0 top-6 z-50">
                    <PageKebabMenu
                      pageId={page.id}
                      pageIdx={idx}
                      totalPages={canvasPages.length}
                      onRename={() => startRename(page.id, page.name)}
                      onDuplicate={() => duplicateCanvasPage(page.id)}
                      onDelete={() => deleteCanvasPage(page.id)}
                      onAddAfter={() => addCanvasPage()}
                      onMoveUp={() => moveUp(page.id)}
                      onMoveDown={() => moveDown(page.id)}
                      onClose={() => setKebabOpenId(null)}
                    />
                  </div>
                )}
              </div>

              {/* Active dot */}
              {isActive && !isRenaming && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#5B4EFF] shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PageToolbar({
  viewMode,
  onViewChange,
  count,
  onAdd,
}: {
  viewMode: 'grid' | 'list';
  onViewChange: (v: 'grid' | 'list') => void;
  count: number;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 shrink-0">
      <span className="text-[11px] text-[#9c99a9] font-medium">
        {count} {count === 1 ? 'page' : 'pages'}
      </span>
      <div className="flex items-center gap-1.5">
        {/* Grid / List toggle */}
        <div className="flex items-center gap-0.5 bg-[#f5f4f8] rounded-lg p-0.5">
          <button
            onClick={() => onViewChange('grid')}
            className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-[#473bab] shadow-sm'
                : 'text-[#9c99a9] hover:text-[#686576]'
            }`}
            title="Grid view"
          >
            <LayoutGrid size={13} />
          </button>
          <button
            onClick={() => onViewChange('list')}
            className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-[#473bab] shadow-sm'
                : 'text-[#9c99a9] hover:text-[#686576]'
            }`}
            title="List view"
          >
            <List size={13} />
          </button>
        </div>

        {/* Add new canvas page */}
        <button
          onClick={onAdd}
          className="w-6 h-6 flex items-center justify-center rounded-md text-[#9c99a9] hover:text-[#473bab] hover:bg-[#f0eeff] transition-colors"
          title="Add new canvas"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB 2 — EVENT LOG
// ══════════════════════════════════════════════════════════════════

function ActivityEventRow({ event }: { event: ActivityEvent }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-default w-full">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: event.user.avatarColor }}
      >
        <span className="text-[11px] font-semibold text-white tracking-wide">
          {event.user.initials}
        </span>
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2 w-full">
          <span className="text-[13px] font-semibold text-[#1f1d25] truncate">
            {event.user.name}
          </span>
          <span className="text-[11px] text-[#9c99a9] shrink-0 whitespace-nowrap">
            {event.timestamp}
          </span>
        </div>
        <p className="text-[12px] text-[#686576] leading-[1.4] truncate">
          {event.action}
        </p>
        <ActivityBadge label={event.category} color={event.categoryColor} />
      </div>
    </div>
  );
}

function ActivitySection({ title, events }: { title: string; events: ActivityEvent[] }) {
  if (events.length === 0) return null;
  return (
    <div className="flex flex-col w-full">
      <div className="px-4 pt-4 pb-1 shrink-0">
        <span className="text-[11px] font-semibold text-[#9c99a9] tracking-[0.8px] uppercase">{title}</span>
      </div>
      {events.map(event => <ActivityEventRow key={event.id} event={event} />)}
    </div>
  );
}

const MY_INITIALS = 'LM';

function EventLogTab() {
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  const filterFn = (evs: ActivityEvent[]) =>
    filter === 'mine' ? evs.filter(e => e.user.initials === MY_INITIALS) : evs;

  const sections = [
    { title: 'NOW',           events: filterFn(nowEvents)          },
    { title: 'EARLIER TODAY', events: filterFn(earlierTodayEvents) },
    { title: 'YESTERDAY',     events: filterFn(yesterdayEvents)    },
    { title: 'LAST WEEK',     events: filterFn(lastWeekEvents)     },
    { title: 'A MONTH AGO',   events: filterFn(monthAgoEvents)     },
  ];

  const hasAny = sections.some(s => s.events.length > 0);

  return (
    <div className="flex flex-col w-full h-full">
      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0">
        <FilterChip label="All Activity"  active={filter === 'all'}  onClick={() => setFilter('all')} />
        <FilterChip label="My Activity"   active={filter === 'mine'} onClick={() => setFilter('mine')} />
      </div>
      <Separator className="m-0 shrink-0" />

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {hasAny
          ? sections.map(s => <ActivitySection key={s.title} title={s.title} events={s.events} />)
          : (
            <div className="flex flex-col items-center justify-center h-32 px-6 text-center gap-2">
              <p className="text-[12px] text-[#9c99a9]">No activity yet.</p>
              <p className="text-[11px] text-[#b5b3bf]">Actions performed in this workspace will appear here.</p>
            </div>
          )
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB 3 — COMMENTS
// ══════════════════════════════════════════════════════════════════

type CommentFilter = 'all' | 'mine' | 'open' | 'resolved';

function CommentRow({
  comment,
  onToggleResolve,
}: {
  comment: Comment;
  onToggleResolve: (id: string) => void;
}) {
  return (
    <div
      className={`group flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors w-full ${
        comment.resolved ? 'opacity-60' : ''
      }`}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: comment.user.avatarColor }}
      >
        <span className="text-[10px] font-semibold text-white">{comment.user.initials}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`text-[12px] font-semibold truncate ${comment.resolved ? 'text-[#9c99a9]' : 'text-[#1f1d25]'}`}>
            {comment.user.name}
          </span>
          <span className="text-[10px] text-[#9c99a9] shrink-0">{comment.timestamp}</span>
        </div>
        <p className={`text-[12px] leading-[1.4] break-words ${comment.resolved ? 'line-through text-[#b5b3bf]' : 'text-[#686576]'}`}>
          {comment.text}
        </p>
        {/* Resolved badge */}
        {comment.resolved && (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
            <CheckCircle2 size={10} />
            Resolved
          </span>
        )}
      </div>

      {/* Resolve toggle button — appears on hover */}
      <button
        onClick={() => onToggleResolve(comment.id)}
        className={`shrink-0 mt-0.5 transition-all ${
          comment.resolved
            ? 'text-emerald-500 opacity-100'
            : 'text-[#9c99a9] opacity-0 group-hover:opacity-100'
        }`}
        title={comment.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
      >
        {comment.resolved
          ? <CheckCircle2 size={14} />
          : <Circle size={14} />
        }
      </button>
    </div>
  );
}

function CommentInputField({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter alone → submit. Shift+Enter → newline (default textarea behaviour).
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 w-full">
      <div className="w-7 h-7 rounded-full bg-[#7BB3E0] flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-semibold text-white">LM</span>
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Leave a comment..."
          rows={2}
          className="
            w-full resize-none text-[12px] text-[#1f1d25]
            placeholder:text-[#9c99a9] leading-[1.5]
            bg-[#f9fafa] border border-[#dddce0] rounded-lg
            px-3 py-2 outline-none
            focus:border-[#473bab] focus:ring-1 focus:ring-[#473bab]
            transition-colors overflow-x-hidden
          "
        />
        {value.trim().length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#9c99a9]">Shift + Enter for new line</span>
            <button
              onClick={onSubmit}
              className="
                flex items-center gap-1.5 px-3 py-1.5
                bg-[#473bab] hover:bg-[#3a2f8f]
                text-white text-[12px] font-medium
                rounded-full transition-colors
              "
            >
              <Send size={11} />
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Canvas comment row (element-anchored) ─────────────────────────
function CanvasCommentRow({
  comment,
  isHighlighted,
  onToggleResolve,
  onClick,
  addCommentReply,
}: {
  comment:          CanvasComment;
  isHighlighted:    boolean;
  onToggleResolve:  (id: string) => void;
  onClick:          () => void;
  addCommentReply:  (commentId: string, text: string) => void;
}) {
  const [replyText, setReplyText] = useState('');

  function submitReply() {
    if (!replyText.trim()) return;
    addCommentReply(comment.id, replyText.trim());
    setReplyText('');
  }

  return (
    <div
      className={`flex flex-col w-full transition-colors ${
        isHighlighted
          ? 'bg-[rgba(91,78,255,0.07)] ring-1 ring-inset ring-[rgba(91,78,255,0.2)]'
          : 'hover:bg-gray-50'
      } ${comment.resolved ? 'opacity-60' : ''}`}
    >
      {/* ── Main comment row ── */}
      <div
        onClick={onClick}
        className="group flex items-start gap-3 px-4 py-3 cursor-pointer w-full"
      >
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: comment.authorColor }}
        >
          <span className="text-[10px] font-semibold text-white">{comment.authorInitials}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className={`text-[12px] font-semibold truncate ${comment.resolved ? 'text-[#9c99a9]' : 'text-[#1f1d25]'}`}>
              Lucas
            </span>
            <span className="text-[10px] text-[#9c99a9] shrink-0">{comment.timestamp}</span>
          </div>

          {/* Context badge — area selection or single element */}
          {comment.selectionRect ? (
            <div className="flex items-center gap-1">
              <div className="shrink-0 rounded" style={{ width: 7, height: 7, border: '1.5px dashed #5B4EFF' }} />
              <span className="text-[10px] text-[#5B4EFF] font-medium">
                {comment.selectionElementCount === 0
                  ? 'Area selection'
                  : `${comment.selectionElementCount} element${comment.selectionElementCount !== 1 ? 's' : ''}`}
              </span>
            </div>
          ) : comment.elementName ? (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#5B4EFF] shrink-0" />
              <span className="text-[10px] text-[#5B4EFF] font-medium truncate">{comment.elementName}</span>
            </div>
          ) : null}

          <p className={`text-[12px] leading-[1.4] break-words ${comment.resolved ? 'line-through text-[#b5b3bf]' : 'text-[#686576]'}`}>
            {comment.text}
          </p>
          {comment.resolved && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
              <CheckCircle2 size={10} /> Resolved
            </span>
          )}
          {/* Reply count hint when not expanded */}
          {!isHighlighted && (comment.replies?.length ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[#9c99a9]">
              <CornerDownRight size={10} />
              {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
            </span>
          )}
        </div>

        {/* Resolve toggle */}
        <button
          onClick={e => { e.stopPropagation(); onToggleResolve(comment.id); }}
          className={`shrink-0 mt-0.5 transition-all ${
            comment.resolved ? 'text-emerald-500 opacity-100' : 'text-[#9c99a9] opacity-0 group-hover:opacity-100'
          }`}
          title={comment.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
        >
          {comment.resolved ? <CheckCircle2 size={14} /> : <Circle size={14} />}
        </button>
      </div>

      {/* ── Expanded thread (shown only when highlighted) ── */}
      {isHighlighted && (
        <div className="flex flex-col gap-0 pl-14 pr-4 pb-3">
          {/* Existing replies */}
          {(comment.replies ?? []).map(reply => (
            <div key={reply.id} className="flex items-start gap-2.5 py-2 border-t border-[rgba(0,0,0,0.06)] first:border-t-0">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: reply.authorColor }}
              >
                <span className="text-[8px] font-semibold text-white">{reply.authorInitials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold text-[#1f1d25]">Lucas</span>
                  <span className="text-[10px] text-[#9c99a9]">{reply.timestamp}</span>
                </div>
                <p className="text-[12px] text-[#686576] leading-[1.4] break-words">{reply.text}</p>
              </div>
            </div>
          ))}

          {/* Reply input */}
          <div className="flex items-start gap-2.5 pt-2 border-t border-[rgba(0,0,0,0.06)]">
            <div className="w-5 h-5 rounded-full bg-[#7BB3E0] flex items-center justify-center shrink-0 mt-1">
              <span className="text-[8px] font-semibold text-white">LM</span>
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(); }
                }}
                placeholder="Reply…"
                rows={2}
                className="w-full resize-none text-[12px] text-[#1f1d25] placeholder:text-[#9c99a9] leading-[1.5] bg-[#f9fafa] border border-[#dddce0] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#473bab] focus:ring-1 focus:ring-[#473bab] transition-colors overflow-x-hidden"
              />
              {replyText.trim().length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={submitReply}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#473bab] hover:bg-[#3a2f8f] text-white text-[11px] font-semibold rounded-full transition-colors"
                  >
                    <Send size={9} />
                    Reply
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CommentsTab() {
  const {
    canvasComments, highlightedCommentId, activePageId,
    toggleCanvasCommentResolved, setHighlightedCommentId, addCommentReply,
    switchCanvasPage,
  } = useDesignWorkspace();

  const [filter, setFilter] = useState<CommentFilter>('all');
  const [commentText, setCommentText] = useState('');
  const [panelComments, setPanelComments] = useState<Comment[]>(mockComments);
  const listRef = useRef<HTMLDivElement>(null);

  function handleSubmit() {
    if (!commentText.trim()) return;
    setPanelComments(prev => [{
      id:        `c${Date.now()}`,
      user:      { name: 'Lucas', initials: MY_INITIALS, avatarColor: AVATAR_COLORS.lucas },
      text:      commentText.trim(),
      timestamp: 'just now',
      resolved:  false,
    }, ...prev]);
    setCommentText('');
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = 0;
    });
  }

  function handleTogglePanelResolve(id: string) {
    setPanelComments(prev => prev.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c));
  }

  // Filter canvas comments
  const filteredCanvas = canvasComments.filter(c => {
    if (filter === 'mine')     return true; // canvas comments are always "mine" (LM)
    if (filter === 'open')     return !c.resolved;
    if (filter === 'resolved') return c.resolved;
    return true;
  });

  // Filter panel comments
  const filteredPanel = panelComments.filter(c => {
    if (filter === 'mine')     return c.user.initials === MY_INITIALS;
    if (filter === 'open')     return !c.resolved;
    if (filter === 'resolved') return c.resolved;
    return true;
  });

  const openCount     = canvasComments.filter(c => !c.resolved).length + panelComments.filter(c => !c.resolved).length;
  const resolvedCount = canvasComments.filter(c =>  c.resolved).length + panelComments.filter(c =>  c.resolved).length;

  const hasAny = filteredCanvas.length > 0 || filteredPanel.length > 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filters */}
      <div className="flex items-center gap-1.5 px-4 py-3 shrink-0 overflow-x-auto">
        <FilterChip label="All"                             active={filter === 'all'}      onClick={() => setFilter('all')} />
        <FilterChip label="My Comments"                     active={filter === 'mine'}     onClick={() => setFilter('mine')} />
        <FilterChip label={`Open · ${openCount}`}           active={filter === 'open'}     onClick={() => setFilter('open')} />
        <FilterChip label={`Resolved · ${resolvedCount}`}   active={filter === 'resolved'} onClick={() => setFilter('resolved')} />
      </div>

      <Separator className="m-0 shrink-0" />

      {/* Scrollable comment list */}
      <div ref={listRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        {!hasAny ? (
          <div className="flex flex-col items-center justify-center h-32 px-6 text-center gap-2">
            <p className="text-[12px] text-[#9c99a9]">
              {filter === 'resolved' ? 'No resolved comments yet.' :
               filter === 'open'     ? 'All comments are resolved!' :
               filter === 'mine'     ? 'You haven\'t commented yet.' :
               'No comments yet. Press C to enter comment mode.'}
            </p>
          </div>
        ) : (
          <>
            {/* Canvas (element-anchored) comments */}
            {filteredCanvas.length > 0 && (
              <div className="flex flex-col w-full">
                <div className="px-4 pt-3 pb-1 shrink-0">
                  <span className="text-[10px] font-semibold text-[#9c99a9] tracking-[0.8px] uppercase">Canvas</span>
                </div>
                {filteredCanvas.map(comment => (
                  <CanvasCommentRow
                    key={comment.id}
                    comment={comment}
                    isHighlighted={highlightedCommentId === comment.id}
                    onToggleResolve={toggleCanvasCommentResolved}
                    addCommentReply={addCommentReply}
                    onClick={() => {
                      // If the comment lives on a different page, pan there first.
                      // switchCanvasPage triggers the smooth animated scroll in CanvasArea.
                      if (comment.pageId && comment.pageId !== activePageId) {
                        switchCanvasPage(comment.pageId);
                      }
                      // Only set the highlight — do NOT call selectElement/setSelection.
                      // Selecting an element would trigger the Properties panel and hide
                      // the Comments tab (RightPanel hides ActivityPanel when selection > 0).
                      // The canvas highlight overlay in CanvasArea reads highlightedCommentId
                      // and draws a purple border around the referenced element(s).
                      setHighlightedCommentId(comment.id);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Panel comments */}
            {filteredPanel.length > 0 && (
              <div className="flex flex-col w-full">
                {filteredCanvas.length > 0 && (
                  <div className="px-4 pt-3 pb-1 shrink-0">
                    <span className="text-[10px] font-semibold text-[#9c99a9] tracking-[0.8px] uppercase">General</span>
                  </div>
                )}
                {filteredPanel.map(comment => (
                  <CommentRow
                    key={comment.id}
                    comment={comment}
                    onToggleResolve={handleTogglePanelResolve}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Fixed input at the bottom */}
      <div className="shrink-0 border-t border-[rgba(0,0,0,0.08)]">
        <CommentInputField
          value={commentText}
          onChange={setCommentText}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ACTIVITY PANEL — ROOT
// ══════════════════════════════════════════════════════════════════

export function ActivityPanel() {
  const { activityPanelTab, setActivityPanelTab } = useDesignWorkspace();

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <Tabs
        value={activityPanelTab}
        onValueChange={v => setActivityPanelTab(v as 'pages' | 'eventLog' | 'comments')}
        className="flex flex-col flex-1 overflow-hidden"
      >
        {/* ── Tab bar ──────────────────────────────────────────── */}
        <div className="shrink-0 relative">
          <TabsList className="w-full justify-start rounded-none bg-transparent px-0 h-auto pb-0 border-b-0">

            <TabsTrigger value="pages"    className={TAB_CLS} style={{ fontWeight: 500 }}>Pages</TabsTrigger>
            <TabsTrigger value="eventLog" className={TAB_CLS} style={{ fontWeight: 500 }}>Event log</TabsTrigger>
            <TabsTrigger value="comments" className={TAB_CLS} style={{ fontWeight: 500 }}>Comments</TabsTrigger>

          </TabsList>
          <Separator className="w-full m-0" />
        </div>

        <TabsContent value="pages"    className="flex flex-col flex-1 overflow-hidden mt-0">
          <PagesTab />
        </TabsContent>

        <TabsContent value="eventLog" className="flex flex-col flex-1 overflow-hidden mt-0">
          <EventLogTab />
        </TabsContent>

        <TabsContent value="comments" className="flex flex-col flex-1 overflow-hidden mt-0">
          <CommentsTab />
        </TabsContent>

      </Tabs>
    </div>
  );
}
