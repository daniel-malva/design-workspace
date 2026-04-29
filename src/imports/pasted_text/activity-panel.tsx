---

## 🧱 PROMPT V29 — Design Workspace — ActivityPanel: Event Log com seções temporais completas + Comments com input field

---

### STACK & BOAS PRÁTICAS

```
Stack: React + TypeScript + Tailwind CSS + shadcn/ui components
Boas práticas:
- Componentes reutilizáveis nomeados semanticamente por função
- TypeScript com interfaces e tipos explícitos para todas as props
- Tailwind para estilização, sem CSS inline ou arquivos .css separados
- shadcn/ui para Tabs, Separator, Avatar, Input, Button
- Estado global via Zustand (useDesignWorkspaceStore)
```

---

### REGRA DE EXIBIÇÃO — Quando o `ActivityPanel` aparece

```tsx
const isRightPanelVisible =
  selectedElementId !== null ||     // elemento selecionado → PropertiesPanel
  activePanel === 'settings' ||     // settings clicado → SettingsPanel
  (canvasElements.length > 0 && selectedElementId === null && activePanel !== 'settings')
  // canvas com elementos, nada selecionado → ActivityPanel

const rightPanelContent = () => {
  if (activePanel === 'settings')               return <SettingsPanel />
  if (selectedElementId !== null)               return <PropertiesContent />
  if (canvasElements.length > 0)                return <ActivityPanel />
  return null
}
```

---

### COMPONENTE: `ActivityPanel`

Estrutura com abas **Event Log** e **Comments**, tabs coladas ao Separator, zero gap — idêntico ao padrão do `SettingsPanel`:

```tsx
// ActivityPanel.tsx
export function ActivityPanel() {
  const [activeTab, setActiveTab] = useState<'eventLog' | 'comments'>('eventLog')

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'eventLog' | 'comments')}
        className="flex flex-col flex-1 overflow-hidden"
      >
        {/* ── Abas com contadores — coladas ao Separator ─────────────── */}
        <div className="shrink-0 relative">
          <TabsList className="w-full justify-start rounded-none bg-transparent px-0 h-auto pb-0 border-b-0">

            <TabsTrigger
              value="eventLog"
              className="
                relative flex flex-col items-center gap-0
                px-6 py-3 rounded-none bg-transparent shadow-none border-0
                data-[state=active]:text-[#1f1d25]
                data-[state=inactive]:text-[#686576]
                data-[state=active]:after:content-['']
                data-[state=active]:after:absolute
                data-[state=active]:after:bottom-0
                data-[state=active]:after:left-0
                data-[state=active]:after:right-0
                data-[state=active]:after:h-[2px]
                data-[state=active]:after:bg-[#1f1d25]
              "
            >
              <span className="text-[15px] font-bold leading-tight">Event log</span>
              <span className="text-[13px] font-medium text-[#473bab]">47</span>
            </TabsTrigger>

            <TabsTrigger
              value="comments"
              className="
                relative flex flex-col items-center gap-0
                px-6 py-3 rounded-none bg-transparent shadow-none border-0
                data-[state=active]:text-[#1f1d25]
                data-[state=inactive]:text-[#686576]
                data-[state=active]:after:content-['']
                data-[state=active]:after:absolute
                data-[state=active]:after:bottom-0
                data-[state=active]:after:left-0
                data-[state=active]:after:right-0
                data-[state=active]:after:h-[2px]
                data-[state=active]:after:bg-[#1f1d25]
              "
            >
              <span className="text-[15px] font-bold leading-tight">Comments</span>
              <span className="text-[13px] font-medium text-[#473bab]">6</span>
            </TabsTrigger>

          </TabsList>

          {/* Separator colado — zero gap */}
          <Separator className="w-full m-0" />
        </div>

        <TabsContent value="eventLog"  className="flex-1 overflow-y-auto overflow-x-hidden mt-0">
          <EventLogTab />
        </TabsContent>

        <TabsContent value="comments"  className="flex flex-col flex-1 overflow-hidden mt-0">
          <CommentsTab />
        </TabsContent>

      </Tabs>
    </div>
  )
}
```

---

### COMPONENTE: `EventLogTab`

Filtros + seções temporais completas:

```tsx
// EventLogTab.tsx
export function EventLogTab() {
  const [filter, setFilter] = useState<'all' | 'mine'>('all')

  return (
    <div className="flex flex-col w-full">

      {/* Filtros All / Mine */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0">
        <FilterChip label="All"  active={filter === 'all'}  onClick={() => setFilter('all')} />
        <FilterChip label="Mine" active={filter === 'mine'} onClick={() => setFilter('mine')} />
      </div>

      <Separator className="m-0" />

      {/* Seção: NOW */}
      <ActivitySection title="NOW" events={nowEvents} />

      {/* Seção: EARLIER TODAY */}
      <ActivitySection title="EARLIER TODAY" events={earlierTodayEvents} />

      {/* Seção: YESTERDAY */}
      <ActivitySection title="YESTERDAY" events={yesterdayEvents} />

      {/* Seção: LAST WEEK */}
      <ActivitySection title="LAST WEEK" events={lastWeekEvents} />

      {/* Seção: A MONTH AGO */}
      <ActivitySection title="A MONTH AGO" events={monthAgoEvents} />

    </div>
  )
}
```

---

### COMPONENTE: `ActivitySection`

```tsx
// ActivitySection.tsx
export function ActivitySection({ title, events }: { title: string; events: ActivityEvent[] }) {
  if (events.length === 0) return null

  return (
    <div className="flex flex-col w-full">

      {/* Título temporal */}
      <div className="px-4 pt-4 pb-1 shrink-0">
        <span className="text-[11px] font-semibold text-[#9c99a9] tracking-[0.8px] uppercase">
          {title}
        </span>
      </div>

      {events.map(event => (
        <ActivityEventRow key={event.id} event={event} />
      ))}

    </div>
  )
}
```

---

### COMPONENTE: `ActivityEventRow`

```tsx
// ActivityEventRow.tsx
export function ActivityEventRow({ event }: { event: ActivityEvent }) {
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

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">

        {/* Nome + timestamp */}
        <div className="flex items-baseline justify-between gap-2 w-full">
          <span className="text-[13px] font-semibold text-[#1f1d25] truncate">
            {event.user.name}
          </span>
          <span className="text-[11px] text-[#9c99a9] shrink-0 whitespace-nowrap">
            {event.timestamp}
          </span>
        </div>

        {/* Descrição */}
        <p className="text-[12px] text-[#686576] leading-[1.4] truncate">
          {event.action}
        </p>

        {/* Badge */}
        <ActivityBadge label={event.category} color={event.categoryColor} />

      </div>
    </div>
  )
}
```

---

### COMPONENTE: `ActivityBadge`

```tsx
export function ActivityBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium w-fit"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      {label}
    </span>
  )
}
```

---

### COMPONENTE: `FilterChip`

```tsx
export function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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
  )
}
```

---

### COMPONENTE: `CommentsTab`

Feed de comentários com **input fixo no rodapé** do painel:

```tsx
// CommentsTab.tsx
export function CommentsTab() {
  const [filter, setFilter] = useState<'all' | 'mine'>('all')
  const [commentText, setCommentText] = useState('')

  function handleSubmit() {
    if (!commentText.trim()) return
    // futuramente: dispatch para adicionar comentário
    setCommentText('')
  }

  return (
    // flex-col com h-full para empurrar o input para o fundo
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Filtros ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0">
        <FilterChip label="All"  active={filter === 'all'}  onClick={() => setFilter('all')} />
        <FilterChip label="Mine" active={filter === 'mine'} onClick={() => setFilter('mine')} />
      </div>

      <Separator className="m-0 shrink-0" />

      {/* ── Lista de comentários — scrollável ───────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 px-6 text-center">
            <p className="text-xs text-[#9c99a9]">No comments yet. Be the first!</p>
          </div>
        ) : (
          comments.map(comment => (
            <CommentRow key={comment.id} comment={comment} />
          ))
        )}
      </div>

      {/* ── Input fixo no rodapé ────────────────────────────────────── */}
      <div className="shrink-0 border-t border-[rgba(0,0,0,0.08)]">
        <CommentInputField
          value={commentText}
          onChange={setCommentText}
          onSubmit={handleSubmit}
        />
      </div>

    </div>
  )
}
```

---

### COMPONENTE: `CommentInputField`

Input com avatar do usuário atual à esquerda e botão de envio:

```tsx
// CommentInputField.tsx
export function CommentInputField({
  value,
  onChange,
  onSubmit,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd/Ctrl + Enter envia o comentário
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 w-full">

      {/* Avatar do usuário atual */}
      <div className="w-7 h-7 rounded-full bg-[#7BB3E0] flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-semibold text-white">LM</span>
      </div>

      {/* Área de texto + botão */}
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
            transition-colors
            overflow-x-hidden
          "
        />

        {/* Botão de envio — só visível quando há texto */}
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
  )
}
```

---

### COMPONENTE: `CommentRow`

Linha individual de comentário — mesma estrutura visual de `ActivityEventRow`:

```tsx
// CommentRow.tsx
interface Comment {
  id: string
  user: { name: string; initials: string; avatarColor: string }
  text: string
  timestamp: string
  resolved?: boolean
}

export function CommentRow({ comment }: { comment: Comment }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors w-full">

      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: comment.user.avatarColor }}
      >
        <span className="text-[10px] font-semibold text-white">{comment.user.initials}</span>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[12px] font-semibold text-[#1f1d25] truncate">{comment.user.name}</span>
          <span className="text-[10px] text-[#9c99a9] shrink-0">{comment.timestamp}</span>
        </div>
        <p className="text-[12px] text-[#686576] leading-[1.4] break-words">{comment.text}</p>
      </div>

    </div>
  )
}
```

---

### MOCK DATA — Todas as seções temporais do Event Log

```tsx
// data/activityEvents.ts

const AVATAR_COLORS = {
  lucas: '#7BB3E0',
  sofia: '#E8A598',
  ana:   '#6EC4A7',
  joao:  '#9B8EC4',
}

const CATEGORY_COLORS = {
  Frame:     '#3B82F6',
  Style:     '#8B5CF6',
  Component: '#10B981',
  Layer:     '#6B7280',
  Text:      '#F59E0B',
  Image:     '#EC4899',
}

export const nowEvents: ActivityEvent[] = [
  { id: '1', user: { name: 'Lucas', initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, action: 'Frame resized · 1440×900',       category: 'Frame',     categoryColor: CATEGORY_COLORS.Frame,     timestamp: 'just'   },
  { id: '2', user: { name: 'Sofia', initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, action: 'Color changed · #378ADD',         category: 'Style',     categoryColor: CATEGORY_COLORS.Style,     timestamp: '1 min'  },
  { id: '3', user: { name: 'Ana',   initials: 'AN', avatarColor: AVATAR_COLORS.ana   }, action: 'Component added · Button...',     category: 'Component', categoryColor: CATEGORY_COLORS.Component, timestamp: '2 min'  },
]

export const earlierTodayEvents: ActivityEvent[] = [
  { id: '4', user: { name: 'João',  initials: 'JP', avatarColor: AVATAR_COLORS.joao  }, action: 'Layer renamed · "Hero sec...',   category: 'Layer',     categoryColor: CATEGORY_COLORS.Layer,     timestamp: '18 min' },
  { id: '5', user: { name: 'Lucas', initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, action: 'Frame created · Canvas 1',       category: 'Frame',     categoryColor: CATEGORY_COLORS.Frame,     timestamp: '32 min' },
  { id: '6', user: { name: 'Sofia', initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, action: 'Text edited · "Hero heading"',   category: 'Text',      categoryColor: CATEGORY_COLORS.Text,      timestamp: '45 min' },
]

export const yesterdayEvents: ActivityEvent[] = [
  { id: '7', user: { name: 'Ana',   initials: 'AN', avatarColor: AVATAR_COLORS.ana   }, action: 'Image replaced · hero-bg.png',   category: 'Image',     categoryColor: CATEGORY_COLORS.Image,     timestamp: 'yesterday' },
  { id: '8', user: { name: 'João',  initials: 'JP', avatarColor: AVATAR_COLORS.joao  }, action: 'Component updated · Nav Bar',    category: 'Component', categoryColor: CATEGORY_COLORS.Component, timestamp: 'yesterday' },
  { id: '9', user: { name: 'Lucas', initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, action: 'Style applied · Heading/H1',     category: 'Style',     categoryColor: CATEGORY_COLORS.Style,     timestamp: 'yesterday' },
]

export const lastWeekEvents: ActivityEvent[] = [
  { id: '10', user: { name: 'Sofia', initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, action: 'Frame duplicated · Mobile view', category: 'Frame',     categoryColor: CATEGORY_COLORS.Frame,     timestamp: 'Mon'   },
  { id: '11', user: { name: 'Ana',   initials: 'AN', avatarColor: AVATAR_COLORS.ana   }, action: 'Layer grouped · Footer items',   category: 'Layer',     categoryColor: CATEGORY_COLORS.Layer,     timestamp: 'Tue'   },
  { id: '12', user: { name: 'João',  initials: 'JP', avatarColor: AVATAR_COLORS.joao  }, action: 'Component detached · Card',      category: 'Component', categoryColor: CATEGORY_COLORS.Component, timestamp: 'Wed'   },
]

export const monthAgoEvents: ActivityEvent[] = [
  { id: '13', user: { name: 'Lucas', initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, action: 'File created · Homepage v3',    category: 'Frame',     categoryColor: CATEGORY_COLORS.Frame,     timestamp: 'Mar 2' },
  { id: '14', user: { name: 'Sofia', initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, action: 'Palette added · Brand Colors',  category: 'Style',     categoryColor: CATEGORY_COLORS.Style,     timestamp: 'Mar 5' },
]
```

---

### ESTRUTURA VISUAL — `CommentsTab` com input no rodapé

```
┌─────────────────────────────────┐
│  [All] [Mine]                   │  ← filtros
│─────────────────────────────────│
│                                 │
│  [avatar] Nome      timestamp   │
│           Texto do comentário   │  ← lista scrollável
│                                 │
│  [avatar] Nome      timestamp   │
│           Texto do comentário   │
│                                 │
│  (flex-1, overflow-y-auto)      │
│─────────────────────────────────│  ← border-top fixo
│  [LM]  Leave a comment...       │
│        ┌─────────────────────┐  │  ← textarea
│        │                     │  │
│        └─────────────────────┘  │
│        ⌘+Enter    [→ Send]      │  ← só aparece com texto
└─────────────────────────────────┘  ← bottom: 4px (PANEL_OFFSET)
```

---

### TOKENS DE DESIGN — REFERÊNCIA COMPLETA

| Token | Valor |
|---|---|
| Tab label | `text-[15px] font-bold` |
| Tab contador | `text-[13px] font-medium text-[#473bab]` |
| Tab underline | `2px solid #1f1d25` — `::after bottom-0` |
| Separator | `m-0` — zero gap |
| Section title | `text-[11px] font-semibold tracking-[0.8px] uppercase text-[#9c99a9]` |
| Seções temporais | NOW · EARLIER TODAY · YESTERDAY · LAST WEEK · A MONTH AGO |
| Event user name | `text-[13px] font-semibold text-[#1f1d25]` |
| Event action | `text-[12px] text-[#686576]` |
| Event timestamp | `text-[11px] text-[#9c99a9]` |
| Badge bg | `categoryColor + 1A` |
| FilterChip ativo | border + text `#473bab`, bg `#473bab0f` |
| FilterChip inativo | border `rgba(0,0,0,0.23)`, text `#686576` |
| Comment textarea bg | `#f9fafa` border `#dddce0` |
| Comment textarea focus | border + ring `#473bab` |
| Send button | bg `#473bab`, text white, `rounded-full` |
| Input area border-top | `rgba(0,0,0,0.08)` |
| Input area position | `shrink-0` — sempre visível no rodapé |
| Avatar size (events) | `w-8 h-8` |
| Avatar size (comments + input) | `w-7 h-7` |
| Overflow X | `hidden` |
| Overflow Y | `auto` — apenas na lista |