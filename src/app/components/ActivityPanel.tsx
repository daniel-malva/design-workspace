import { useState, useRef, useEffect } from 'react';
import { Send, LayoutGrid, List, CheckCircle2, Circle, Plus, Check, X, CornerDownRight, MoreHorizontal, Copy, Trash2, PenLine, FilePlus, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Separator } from './ui/separator';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { CanvasComment, EventLogEntry } from '../store/useDesignWorkspaceStore';
import { MiniCanvas } from './PageStrip';

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

interface ActivityUser {
  name: string;
  initials: string;
  avatarColor: string;
}

interface ActivityEvent {
  id: string;
  user: ActivityUser;
  action: string;
  category: string;
  categoryColor: string;
  timestamp: string;
}

interface Comment {
  id: string;
  user: ActivityUser;
  text: string;
  timestamp: string;
  resolved?: boolean;
}

// ══════════════════════════════════════════════════════════════════
// MOCK DATA
// ══════════════════════════════════════════════════════════════════

const AVATAR_COLORS = {
  lucas: '#7BB3E0',
  sofia: '#E8A598',
  ana:   '#6EC4A7',
  joao:  '#9B8EC4',
};

const CATEGORY_COLORS: Record<string, string> = {
  Frame:     '#3B82F6',
  Style:     '#8B5CF6',
  Component: '#10B981',
  Layer:     '#6B7280',
  Text:      '#F59E0B',
  Image:     '#EC4899',
  Comment:   '#5B4EFF',
};

function formatEventTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)  return 'just';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  return `${Math.floor(diff / 3600)} hr`;
}

function entryToEvent(e: EventLogEntry, userName: string, userInitials: string, userColor: string): ActivityEvent {
  return {
    id:            e.id,
    user:          { name: userName, initials: userInitials, avatarColor: userColor },
    action:        e.action,
    category:      e.category,
    categoryColor: e.categoryColor,
    timestamp:     formatEventTime(e.timestamp),
  };
}

const nowEvents: ActivityEvent[] = [
  { id: '1', user: { name: 'Lucas', initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, action: 'Frame resized · 1440×900',       category: 'Frame',     categoryColor: CATEGORY_COLORS.Frame,     timestamp: 'just'   },
  { id: '2', user: { name: 'Sofia', initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, action: 'Color changed · #378ADD',         category: 'Style',     categoryColor: CATEGORY_COLORS.Style,     timestamp: '1 min'  },
  { id: '3', user: { name: 'Ana',   initials: 'AN', avatarColor: AVATAR_COLORS.ana   }, action: 'Component added · Button...',     category: 'Component', categoryColor: CATEGORY_COLORS.Component, timestamp: '2 min'  },
];

const earlierTodayEvents: ActivityEvent[] = [
  { id: '4', user: { name: 'João',  initials: 'JP', avatarColor: AVATAR_COLORS.joao  }, action: 'Layer renamed · "Hero sec...',   category: 'Layer',     categoryColor: CATEGORY_COLORS.Layer,     timestamp: '18 min' },
  { id: '5', user: { name: 'Lucas', initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, action: 'Frame created · Canvas 1',       category: 'Frame',     categoryColor: CATEGORY_COLORS.Frame,     timestamp: '32 min' },
  { id: '6', user: { name: 'Sofia', initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, action: 'Text edited · "Hero heading"',   category: 'Text',      categoryColor: CATEGORY_COLORS.Text,      timestamp: '45 min' },
];

const yesterdayEvents: ActivityEvent[] = [
  { id: '7', user: { name: 'Ana',   initials: 'AN', avatarColor: AVATAR_COLORS.ana   }, action: 'Image replaced · hero-bg.png',   category: 'Image',     categoryColor: CATEGORY_COLORS.Image,     timestamp: 'yesterday' },
  { id: '8', user: { name: 'João',  initials: 'JP', avatarColor: AVATAR_COLORS.joao  }, action: 'Component updated · Nav Bar',    category: 'Component', categoryColor: CATEGORY_COLORS.Component, timestamp: 'yesterday' },
  { id: '9', user: { name: 'Lucas', initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, action: 'Style applied · Heading/H1',     category: 'Style',     categoryColor: CATEGORY_COLORS.Style,     timestamp: 'yesterday' },
];

const lastWeekEvents: ActivityEvent[] = [
  { id: '10', user: { name: 'Sofia', initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, action: 'Frame duplicated · Mobile view', category: 'Frame',     categoryColor: CATEGORY_COLORS.Frame,     timestamp: 'Mon' },
  { id: '11', user: { name: 'Ana',   initials: 'AN', avatarColor: AVATAR_COLORS.ana   }, action: 'Layer grouped · Footer items',   category: 'Layer',     categoryColor: CATEGORY_COLORS.Layer,     timestamp: 'Tue' },
  { id: '12', user: { name: 'João',  initials: 'JP', avatarColor: AVATAR_COLORS.joao  }, action: 'Component detached · Card',      category: 'Component', categoryColor: CATEGORY_COLORS.Component, timestamp: 'Wed' },
];

const monthAgoEvents: ActivityEvent[] = [
  { id: '13', user: { name: 'Lucas', initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, action: 'File created · Homepage v3',    category: 'Frame',     categoryColor: CATEGORY_COLORS.Frame,     timestamp: 'Mar 2' },
  { id: '14', user: { name: 'Sofia', initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, action: 'Palette added · Brand Colors',  category: 'Style',     categoryColor: CATEGORY_COLORS.Style,     timestamp: 'Mar 5' },
];

const mockComments: Comment[] = [
  { id: 'c1', user: { name: 'Sofia',  initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, text: 'The hero section looks great! Can we try a slightly darker shade for the CTA button?', timestamp: '2 min',       resolved: false },
  { id: 'c2', user: { name: 'Lucas',  initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, text: 'Sure, I\'ll bump it to #3A2F8F. Also, the font size on mobile needs a review.',        timestamp: '5 min',       resolved: false },
  { id: 'c3', user: { name: 'Ana',    initials: 'AN', avatarColor: AVATAR_COLORS.ana   }, text: 'Agreed on mobile. The heading drops below the fold on 375px screens.',                  timestamp: '18 min',      resolved: true  },
  { id: 'c4', user: { name: 'João',   initials: 'JP', avatarColor: AVATAR_COLORS.joao  }, text: 'I\'ll create a breakpoint variant for it. Should be ready by EOD.',                    timestamp: '1 hr',        resolved: true  },
  { id: 'c5', user: { name: 'Sofia',  initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, text: 'Perfect. Let\'s also revisit the nav spacing — it feels a bit tight at 1280px.',       timestamp: '3 hr',        resolved: false },
  { id: 'c6', user: { name: 'Lucas',  initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, text: 'On it. I\'ll update the component and ping everyone once it\'s published.',            timestamp: 'yesterday',   resolved: false },
];

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

function PagesTab() {
  const {
    canvasPages, activePageId, canvasElements,
    switchCanvasPage, addCanvasPage, duplicateCanvasPage, deleteCanvasPage, renameCanvasPage,
    moveCanvasPage,
    canvasWidth, canvasHeight,
  } = useDesignWorkspace();

  const [renamingId,  setRenamingId]  = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [openMenuId,  setOpenMenuId]  = useState<string | null>(null);
  const [hoveredId,   setHoveredId]   = useState<string | null>(null);
  // Drag-to-reorder state
  const [dragSrcId,   setDragSrcId]   = useState<string | null>(null);
  const [dragOverId,  setDragOverId]  = useState<string | null>(null);
  const [dragOverPos, setDragOverPos] = useState<'before' | 'after'>('after');

  const renameInputRef = useRef<HTMLInputElement>(null);
  const menuRef        = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openMenuId) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openMenuId]);

  // Panel inner width: 268px − 24px (px-3 × 2) − 4px (border × 2) = 240px → scaled 75%
  const THUMB_W = 180;
  const THUMB_H = Math.max(120, Math.round(THUMB_W * canvasHeight / canvasWidth));

  function startRename(pageId: string, currentName: string) {
    setOpenMenuId(null);
    setRenamingId(pageId);
    setRenameValue(currentName);
    requestAnimationFrame(() => renameInputRef.current?.select());
  }
  function commitRename() {
    if (renamingId && renameValue.trim()) renameCanvasPage(renamingId, renameValue.trim());
    setRenamingId(null);
  }
  function cancelRename() { setRenamingId(null); }

  function getPageElements(page: typeof canvasPages[0]) {
    return page.id === activePageId ? canvasElements : page.elementSnapshot;
  }

  // ── Drag handlers ─────────────────────────────────────────────────
  function onDragStart(e: React.DragEvent, pageId: string) {
    setDragSrcId(pageId);
    e.dataTransfer.effectAllowed = 'move';
    // Make the ghost semi-transparent
    e.dataTransfer.setData('text/plain', pageId);
  }
  function onDragOver(e: React.DragEvent, pageId: string) {
    e.preventDefault();
    if (pageId === dragSrcId) return;
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOverId(pageId);
    setDragOverPos(e.clientY < rect.top + rect.height / 2 ? 'before' : 'after');
  }
  function onDrop(e: React.DragEvent, targetPageId: string) {
    e.preventDefault();
    if (!dragSrcId || dragSrcId === targetPageId) { resetDrag(); return; }
    const fromIdx = canvasPages.findIndex(p => p.id === dragSrcId);
    let   toIdx   = canvasPages.findIndex(p => p.id === targetPageId);
    if (dragOverPos === 'after') toIdx = Math.min(toIdx + 1, canvasPages.length - 1);
    // Adjust for the shift after removal
    const adjustedTo = fromIdx < toIdx ? toIdx - 1 : toIdx;
    if (fromIdx !== adjustedTo) moveCanvasPage(fromIdx, adjustedTo);
    resetDrag();
  }
  function resetDrag() {
    setDragSrcId(null);
    setDragOverId(null);
  }

  const canDelete = canvasPages.length > 1;

  return (
    <div className="flex flex-col w-full h-full">
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2.5 shrink-0">
        <span className="text-[11px] text-[#9c99a9] font-medium">
          {canvasPages.length} {canvasPages.length === 1 ? 'page' : 'pages'}
        </span>
        <button
          onClick={addCanvasPage}
          className="w-6 h-6 flex items-center justify-center rounded-md text-[#9c99a9] hover:text-[#473bab] hover:bg-[#f0eeff] transition-colors"
          title="Add new canvas"
        >
          <Plus size={13} />
        </button>
      </div>
      <Separator className="m-0 shrink-0" />

      {/* ── Single-column vertical list ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div
          className="flex flex-col items-center gap-1 p-3"
          onDragLeave={() => setDragOverId(null)}
        >
          {canvasPages.map((page, index) => {
            const isActive   = page.id === activePageId;
            const isRenaming = renamingId === page.id;
            const isHovered  = hoveredId === page.id;
            const menuOpen   = openMenuId === page.id;
            const isDragging = dragSrcId === page.id;
            const isOver     = dragOverId === page.id;
            const els        = getPageElements(page);
            const isFirst    = index === 0;
            const isLast     = index === canvasPages.length - 1;

            return (
              <div
                key={page.id}
                draggable
                onDragStart={e => onDragStart(e, page.id)}
                onDragOver={e => onDragOver(e, page.id)}
                onDrop={e => onDrop(e, page.id)}
                onDragEnd={resetDrag}
                onMouseEnter={() => setHoveredId(page.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`relative flex flex-col gap-1.5 p-2 rounded-xl transition-colors ${
                  isDragging  ? 'opacity-40' :
                  isActive    ? 'bg-[rgba(91,78,255,0.06)]' :
                                'hover:bg-gray-50'
                }`}
                style={{ cursor: 'grab', width: THUMB_W + 16 }}
              >
                {/* ── Drop indicator — before ── */}
                {isOver && dragOverPos === 'before' && (
                  <div className="absolute left-1 right-1 top-0 h-[2px] bg-[#5B4EFF] rounded-full -translate-y-[5px] z-10 pointer-events-none" />
                )}

                {/* ── Header row: grip · index · name · kebab ── */}
                <div className="flex items-center gap-1 px-0.5 min-h-[22px]">
                  {/* Grip handle */}
                  <GripVertical size={11} className="text-[#c5c3ce] shrink-0 cursor-grab" />

                  {/* Page number */}
                  <span className="text-[10px] text-[#b5b3bf] font-medium shrink-0 tabular-nums w-4 text-center">
                    {index + 1}
                  </span>

                  {isRenaming ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter')  { e.preventDefault(); commitRename(); }
                          if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
                        }}
                        onBlur={commitRename}
                        className="flex-1 text-[11px] font-medium text-[#111111] bg-white border border-[#5B4EFF] rounded px-1.5 py-0.5 outline-none min-w-0"
                        autoFocus
                      />
                      <button onMouseDown={e => { e.preventDefault(); commitRename(); }} className="text-[#5B4EFF] shrink-0"><Check size={11} /></button>
                      <button onMouseDown={e => { e.preventDefault(); cancelRename(); }}  className="text-[#9c99a9] shrink-0"><X size={11} /></button>
                    </div>
                  ) : (
                    <>
                      <span
                        className="text-[11px] font-medium truncate flex-1 cursor-text"
                        style={{ color: isActive ? '#5B4EFF' : '#1f1d25' }}
                        onDoubleClick={() => startRename(page.id, page.name)}
                        title="Double-click to rename"
                      >
                        {page.name}
                      </span>

                      {/* ── Kebab ── */}
                      <div className="relative shrink-0" ref={menuOpen ? menuRef : undefined}>
                        <button
                          onClick={e => { e.stopPropagation(); setOpenMenuId(menuOpen ? null : page.id); }}
                          className={`w-5 h-5 flex items-center justify-center rounded transition-all ${
                            menuOpen
                              ? 'opacity-100 text-[#473bab] bg-[#f0eeff]'
                              : isHovered
                              ? 'opacity-100 text-[#686576] hover:text-[#473bab] hover:bg-[#f0eeff]'
                              : 'opacity-0 pointer-events-none'
                          }`}
                          title="Page options"
                        >
                          <MoreHorizontal size={13} />
                        </button>

                        {menuOpen && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 top-full mt-1 z-50 min-w-[164px] bg-white rounded-xl shadow-lg border border-[rgba(0,0,0,0.1)] py-1 overflow-hidden"
                          >
                            <button onClick={() => startRename(page.id, page.name)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-[#1f1d25] hover:bg-[#f5f4ff] transition-colors text-left">
                              <PenLine size={12} className="text-[#686576] shrink-0" /> Rename
                            </button>
                            <button onClick={() => { duplicateCanvasPage(page.id); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-[#1f1d25] hover:bg-[#f5f4ff] transition-colors text-left">
                              <Copy size={12} className="text-[#686576] shrink-0" /> Duplicate
                            </button>
                            <button onClick={() => { addCanvasPage(); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-[#1f1d25] hover:bg-[#f5f4ff] transition-colors text-left">
                              <FilePlus size={12} className="text-[#686576] shrink-0" /> Add new page
                            </button>
                            <div className="my-1 border-t border-[rgba(0,0,0,0.07)]" />
                            <button onClick={() => { if (!canDelete) return; deleteCanvasPage(page.id); setOpenMenuId(null); }}
                              disabled={!canDelete}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] transition-colors text-left ${canDelete ? 'text-red-500 hover:bg-red-50' : 'text-[#c5c3ce] cursor-not-allowed'}`}>
                              <Trash2 size={12} className="shrink-0" /> Delete
                            </button>
                            <div className="my-1 border-t border-[rgba(0,0,0,0.07)]" />
                            <button onClick={() => { moveCanvasPage(index, index - 1); setOpenMenuId(null); }}
                              disabled={isFirst}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] transition-colors text-left ${!isFirst ? 'text-[#1f1d25] hover:bg-[#f5f4ff]' : 'text-[#c5c3ce] cursor-not-allowed'}`}>
                              <ArrowUp size={12} className="shrink-0" /> Move up
                            </button>
                            <button onClick={() => { moveCanvasPage(index, index + 1); setOpenMenuId(null); }}
                              disabled={isLast}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] transition-colors text-left ${!isLast ? 'text-[#1f1d25] hover:bg-[#f5f4ff]' : 'text-[#c5c3ce] cursor-not-allowed'}`}>
                              <ArrowDown size={12} className="shrink-0" /> Move down
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* ── Thumbnail ── */}
                <button
                  onClick={() => switchCanvasPage(page.id)}
                  title={page.name}
                  style={{ cursor: 'pointer', display: 'block' }}
                >
                  <div
                    className="relative overflow-hidden transition-all"
                    style={{
                      width:        THUMB_W,
                      height:       THUMB_H,
                      borderRadius: 8,
                      borderWidth:  2,
                      borderStyle:  'solid',
                      borderColor:  isActive ? '#5B4EFF' : '#D8D8D8',
                      boxShadow:    isActive ? '0 0 0 3px rgba(91,78,255,0.15)' : undefined,
                    }}
                  >
                    <MiniCanvas
                      elements={els}
                      canvasW={canvasWidth}
                      canvasH={canvasHeight}
                      thumbW={THUMB_W - 4}
                      thumbH={THUMB_H - 4}
                    />
                    {isActive && (
                      <div className="absolute top-1.5 right-1.5">
                        <span className="text-[9px] text-white bg-[#5B4EFF] px-1.5 py-0.5 rounded-full font-medium leading-none">
                          active
                        </span>
                      </div>
                    )}
                  </div>
                </button>

                {/* ── Drop indicator — after ── */}
                {isOver && dragOverPos === 'after' && (
                  <div className="absolute left-1 right-1 bottom-0 h-[2px] bg-[#5B4EFF] rounded-full translate-y-[5px] z-10 pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
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

function EventLogTab() {
  const { eventLog } = useDesignWorkspace();
  const { user } = useCurrentUser();
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  // Replace "Lucas" placeholder entries in mock data with the current user
  function substituteUser(evs: ActivityEvent[]): ActivityEvent[] {
    return evs.map(e =>
      e.user.initials === 'LM'
        ? { ...e, user: { name: user.name, initials: user.initials, avatarColor: user.color } }
        : e
    );
  }

  const filterFn = (evs: ActivityEvent[]) =>
    filter === 'mine' ? evs.filter(e => e.user.initials === user.initials) : evs;

  // Real actions from this session (always "mine")
  const realEvents: ActivityEvent[] = eventLog.map(e => entryToEvent(e, user.name, user.initials, user.color));
  const filteredReal = filter === 'all' || filter === 'mine' ? realEvents : [];

  const sections = [
    { title: 'EARLIER TODAY', events: filterFn(substituteUser(earlierTodayEvents)) },
    { title: 'YESTERDAY',     events: filterFn(substituteUser(yesterdayEvents))    },
    { title: 'LAST WEEK',     events: filterFn(substituteUser(lastWeekEvents))     },
    { title: 'A MONTH AGO',   events: filterFn(substituteUser(monthAgoEvents))     },
  ];

  const hasAny = filteredReal.length > 0 || sections.some(s => s.events.length > 0);

  return (
    <div className="flex flex-col w-full h-full">
      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0">
        <FilterChip label="All Activity"  active={filter === 'all'}  onClick={() => setFilter('all')} />
        <FilterChip label="My Activity"   active={filter === 'mine'} onClick={() => setFilter('mine')} />
      </div>
      <Separator className="m-0 shrink-0" />

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {hasAny ? (
          <>
            {/* ── Live events from this session ── */}
            {filteredReal.length > 0 && (
              <ActivitySection title="THIS SESSION" events={filteredReal} />
            )}
            {/* ── Historical mock events ── */}
            {sections.map(s => <ActivitySection key={s.title} title={s.title} events={s.events} />)}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 px-6 text-center gap-2">
            <p className="text-[12px] text-[#9c99a9]">No activity yet.</p>
            <p className="text-[11px] text-[#b5b3bf]">Actions performed in this workspace will appear here.</p>
          </div>
        )}
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
  userInitials,
  userColor,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  userInitials?: string;
  userColor?: string;
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
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: userColor ?? '#7BB3E0' }}
      >
        <span className="text-[10px] font-semibold text-white">{userInitials ?? 'YO'}</span>
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
  const { user } = useCurrentUser();

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
              {user.name}
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
                  <span className="text-[11px] font-semibold text-[#1f1d25]">{user.name}</span>
                  <span className="text-[10px] text-[#9c99a9]">{reply.timestamp}</span>
                </div>
                <p className="text-[12px] text-[#686576] leading-[1.4] break-words">{reply.text}</p>
              </div>
            </div>
          ))}

          {/* Reply input */}
          <div className="flex items-start gap-2.5 pt-2 border-t border-[rgba(0,0,0,0.06)]">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-1"
              style={{ backgroundColor: user.color }}
            >
              <span className="text-[8px] font-semibold text-white">{user.initials}</span>
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
  const { user } = useCurrentUser();

  const [filter, setFilter] = useState<CommentFilter>('all');
  const [commentText, setCommentText] = useState('');
  // Replace "Lucas" placeholder in initial mock comments with the current user
  const [panelComments, setPanelComments] = useState<Comment[]>(() =>
    mockComments.map(c =>
      c.user.initials === 'LM'
        ? { ...c, user: { name: user.name, initials: user.initials, avatarColor: user.color } }
        : c
    )
  );
  const listRef = useRef<HTMLDivElement>(null);

  function handleSubmit() {
    if (!commentText.trim()) return;
    setPanelComments(prev => [{
      id:        `c${Date.now()}`,
      user:      { name: user.name, initials: user.initials, avatarColor: user.color },
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
    if (filter === 'mine')     return c.user.initials === user.initials;
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
          userInitials={user.initials}
          userColor={user.color}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ACTIVITY PANEL — ROOT
// ══════════════════════════════════════════════════════════════════

export function ActivityPanel() {
  const {
    activityPanelTab, setActivityPanelTab,
    setCommentMode, setHighlightedCommentId,
  } = useDesignWorkspace();

  function handleTabChange(v: string) {
    const tab = v as 'pages' | 'eventLog' | 'comments';
    setActivityPanelTab(tab);
    if (tab === 'comments') {
      setCommentMode(true);
    } else {
      setCommentMode(false);
      setHighlightedCommentId(null);
    }
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <Tabs
        value={activityPanelTab}
        onValueChange={handleTabChange}
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
