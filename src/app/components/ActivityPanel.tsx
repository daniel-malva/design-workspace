import { useState, useRef } from 'react';
import { Send, LayoutGrid, List, CheckCircle2, Circle, Plus, Check, X, CornerDownRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Separator } from './ui/separator';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import type { CanvasComment } from '../store/useDesignWorkspaceStore';
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

const CATEGORY_COLORS = {
  Frame:     '#3B82F6',
  Style:     '#8B5CF6',
  Component: '#10B981',
  Layer:     '#6B7280',
  Text:      '#F59E0B',
  Image:     '#EC4899',
};

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
    switchCanvasPage, addCanvasPage, renameCanvasPage,
    canvasWidth, canvasHeight,
  } = useDesignWorkspace();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Thumbnail dimensions — preserve canvas aspect ratio
  const GRID_W = 104;
  const GRID_H = Math.max(52, Math.round(GRID_W * canvasHeight / canvasWidth));
  const LIST_W = 52;
  const LIST_H = Math.max(28, Math.round(LIST_W * canvasHeight / canvasWidth));

  const thumbW = viewMode === 'grid' ? GRID_W : LIST_W;
  const thumbH = viewMode === 'grid' ? GRID_H : LIST_H;

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

  // Get elements for a given page (active page uses live canvasElements for up-to-date thumbnail)
  function getPageElements(page: typeof canvasPages[0]) {
    return page.id === activePageId ? canvasElements : page.elementSnapshot;
  }

  // ── Grid view ─────────────────────────────────────────────────
  if (viewMode === 'grid') {
    return (
      <div className="flex flex-col w-full h-full">
        <PageToolbar viewMode={viewMode} onViewChange={setViewMode} count={canvasPages.length} onAdd={addCanvasPage} />
        <Separator className="m-0 shrink-0" />

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="grid grid-cols-2 gap-3 p-3">
            {canvasPages.map(page => {
              const isActive   = page.id === activePageId;
              const isRenaming = renamingId === page.id;
              const els        = getPageElements(page);
              return (
                <div key={page.id} className="flex flex-col items-center gap-1.5">
                  {/* Thumbnail button */}
                  <button
                    onClick={() => switchCanvasPage(page.id)}
                    onDoubleClick={() => startRename(page.id, page.name)}
                    className="w-full"
                    title={page.name}
                  >
                    <div
                      className="relative overflow-hidden transition-all w-full"
                      style={{
                        height:       thumbH,
                        borderRadius: 6,
                        borderWidth:  2,
                        borderStyle:  'solid',
                        borderColor:  isActive ? '#5B4EFF' : '#D8D8D8',
                        boxShadow:    isActive ? '0 0 0 2px rgba(91,78,255,0.18)' : undefined,
                      }}
                    >
                      <MiniCanvas
                        elements={els}
                        canvasW={canvasWidth}
                        canvasH={canvasHeight}
                        thumbW={thumbW - 4}
                        thumbH={thumbH - 4}
                      />
                      {isActive && (
                        <div className="absolute bottom-0 inset-x-0 bg-[#5B4EFF] py-0.5">
                          <span className="block text-center text-[9px] text-white font-medium leading-none py-0.5">active</span>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Inline rename or label */}
                  {isRenaming ? (
                    <div className="flex items-center gap-0.5 w-full">
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter')  { e.preventDefault(); commitRename(); }
                          if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
                        }}
                        onBlur={commitRename}
                        className="flex-1 text-[10px] font-medium text-[#111111] bg-white border border-[#5B4EFF] rounded px-1 py-0.5 outline-none min-w-0"
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
                      className="text-[10px] font-medium leading-none truncate w-full text-center cursor-text"
                      style={{ color: isActive ? '#5B4EFF' : '#5A5770' }}
                      onDoubleClick={() => startRename(page.id, page.name)}
                      title="Double-click to rename"
                    >
                      {page.name}
                    </span>
                  )}
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
    <div className="flex flex-col w-full h-full">
      <PageToolbar viewMode={viewMode} onViewChange={setViewMode} count={canvasPages.length} onAdd={addCanvasPage} />
      <Separator className="m-0 shrink-0" />

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {canvasPages.map(page => {
          const isActive   = page.id === activePageId;
          const isRenaming = renamingId === page.id;
          const els        = getPageElements(page);
          return (
            <div key={page.id}>
              <button
                onClick={() => switchCanvasPage(page.id)}
                onDoubleClick={() => startRename(page.id, page.name)}
                className={`flex items-center gap-3 w-full px-3 py-2 transition-colors text-left ${
                  isActive ? 'bg-[rgba(91,78,255,0.06)]' : 'hover:bg-gray-50'
                }`}
              >
                {/* Thumbnail */}
                <div
                  className="relative overflow-hidden shrink-0"
                  style={{
                    width: LIST_W, height: LIST_H,
                    borderRadius: 4,
                    borderWidth:  2,
                    borderStyle:  'solid',
                    borderColor:  isActive ? '#5B4EFF' : '#D8D8D8',
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

                {/* Name — inline rename or label */}
                <div className="flex-1 min-w-0">
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

                {/* Active dot */}
                {isActive && !isRenaming && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5B4EFF] shrink-0" />
                )}
              </button>
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
