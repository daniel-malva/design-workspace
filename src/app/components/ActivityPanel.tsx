import { useState } from 'react';
import { Send } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Separator } from './ui/separator';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';

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
  { id: 'c1', user: { name: 'Sofia',  initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, text: 'The hero section looks great! Can we try a slightly darker shade for the CTA button?', timestamp: '2 min' },
  { id: 'c2', user: { name: 'Lucas',  initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, text: 'Sure, I\'ll bump it to #3A2F8F. Also, the font size on mobile needs a review.', timestamp: '5 min' },
  { id: 'c3', user: { name: 'Ana',    initials: 'AN', avatarColor: AVATAR_COLORS.ana   }, text: 'Agreed on mobile. The heading drops below the fold on 375px screens.', timestamp: '18 min' },
  { id: 'c4', user: { name: 'João',   initials: 'JP', avatarColor: AVATAR_COLORS.joao  }, text: 'I\'ll create a breakpoint variant for it. Should be ready by EOD.', timestamp: '1 hr' },
  { id: 'c5', user: { name: 'Sofia',  initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, text: 'Perfect. Let\'s also revisit the nav spacing — it feels a bit tight at 1280px.', timestamp: '3 hr' },
  { id: 'c6', user: { name: 'Lucas',  initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, text: 'On it. I\'ll update the component and ping everyone once it\'s published.', timestamp: 'yesterday' },
];

// ══════════════════════════════════════════════════════════════════
// PRIMITIVES
// ══════════════════════════════════════════════════════════════════

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1 rounded-full text-[13px] font-medium border transition-colors
        ${active
          ? 'border-[#473bab] text-[#473bab] bg-[#473bab0f]'
          : 'border-[rgba(0,0,0,0.23)] text-[#686576] bg-transparent hover:bg-gray-50'
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

// ══════════════════════════════════════════════════════════════════
// EVENT LOG SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════

function ActivityEventRow({ event }: { event: ActivityEvent }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-default w-full">
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: event.user.avatarColor }}
      >
        <span className="text-[11px] font-semibold text-white tracking-wide">
          {event.user.initials}
        </span>
      </div>

      {/* Content */}
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
        <span className="text-[11px] font-semibold text-[#9c99a9] tracking-[0.8px] uppercase">
          {title}
        </span>
      </div>
      {events.map(event => (
        <ActivityEventRow key={event.id} event={event} />
      ))}
    </div>
  );
}

function EventLogTab() {
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  return (
    <div className="flex flex-col w-full">
      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0">
        <FilterChip label="All"  active={filter === 'all'}  onClick={() => setFilter('all')} />
        <FilterChip label="Mine" active={filter === 'mine'} onClick={() => setFilter('mine')} />
      </div>

      <Separator className="m-0" />

      <ActivitySection title="NOW"           events={nowEvents} />
      <ActivitySection title="EARLIER TODAY" events={earlierTodayEvents} />
      <ActivitySection title="YESTERDAY"     events={yesterdayEvents} />
      <ActivitySection title="LAST WEEK"     events={lastWeekEvents} />
      <ActivitySection title="A MONTH AGO"   events={monthAgoEvents} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// COMMENTS SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════

function CommentRow({ comment }: { comment: Comment }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors w-full">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: comment.user.avatarColor }}
      >
        <span className="text-[10px] font-semibold text-white">{comment.user.initials}</span>
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[12px] font-semibold text-[#1f1d25] truncate">{comment.user.name}</span>
          <span className="text-[10px] text-[#9c99a9] shrink-0">{comment.timestamp}</span>
        </div>
        <p className="text-[12px] text-[#686576] leading-[1.4] break-words">{comment.text}</p>
      </div>
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
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 w-full">
      {/* Current user avatar */}
      <div className="w-7 h-7 rounded-full bg-[#7BB3E0] flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-semibold text-white">LM</span>
      </div>

      {/* Textarea + send */}
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
            <span className="text-[10px] text-[#9c99a9]">⌘ + Enter to send</span>
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

function CommentsTab() {
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [commentText, setCommentText] = useState('');

  function handleSubmit() {
    if (!commentText.trim()) return;
    setCommentText('');
  }

  const displayed = filter === 'mine'
    ? mockComments.filter(c => c.user.initials === 'LM')
    : mockComments;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0">
        <FilterChip label="All"  active={filter === 'all'}  onClick={() => setFilter('all')} />
        <FilterChip label="Mine" active={filter === 'mine'} onClick={() => setFilter('mine')} />
      </div>

      <Separator className="m-0 shrink-0" />

      {/* Scrollable comment list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 px-6 text-center">
            <p className="text-xs text-[#9c99a9]">No comments yet. Be the first!</p>
          </div>
        ) : (
          displayed.map(comment => (
            <CommentRow key={comment.id} comment={comment} />
          ))
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
        onValueChange={v => setActivityPanelTab(v as 'eventLog' | 'comments')}
        className="flex flex-col flex-1 overflow-hidden"
      >
        {/* ── Tab bar colada ao Separator ──────────────────────────── */}
        <div className="shrink-0 relative">
          <TabsList className="w-full justify-start rounded-none bg-transparent px-0 h-auto pb-0 border-b-0">

            <TabsTrigger
              value="eventLog"
              className="
                relative px-4 py-[9px] rounded-none
                text-[14px] tracking-[0.4px] leading-6
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
              "
              style={{ fontWeight: 500 }}
            >
              Event log
            </TabsTrigger>

            <TabsTrigger
              value="comments"
              className="
                relative px-4 py-[9px] rounded-none
                text-[14px] tracking-[0.4px] leading-6
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
              "
              style={{ fontWeight: 500 }}
            >
              Comments
            </TabsTrigger>

          </TabsList>

          {/* Separator flush below tabs — ::after bottom-0 touches this exactly */}
          <Separator className="w-full m-0" />
        </div>

        <TabsContent value="eventLog" className="flex-1 overflow-y-auto overflow-x-hidden mt-0">
          <EventLogTab />
        </TabsContent>

        <TabsContent value="comments" className="flex flex-col flex-1 overflow-hidden mt-0">
          <CommentsTab />
        </TabsContent>

      </Tabs>
    </div>
  );
}