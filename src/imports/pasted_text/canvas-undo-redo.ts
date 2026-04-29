Prompt direto e focado nessa funcionalidade:

---

## 🧱 PROMPT V49 — Design Workspace — Undo/Redo com histórico de estados do canvas

---

### STACK & BOAS PRÁTICAS

```
Stack: React + TypeScript + Tailwind CSS + shadcn/ui components
Boas práticas:
- Componentes reutilizáveis nomeados semanticamente por função
- TypeScript com interfaces e tipos explícitos para todas as props
- Tailwind para estilização, sem CSS inline ou arquivos .css separados
- Estado global via Zustand (useDesignWorkspaceStore)
```

---

### ARQUITETURA — Histórico de estados

O undo/redo funciona como uma **pilha de snapshots do estado do canvas**. A cada ação relevante, um snapshot é salvo. `Cmd+Z` restaura o snapshot anterior. `Cmd+Shift+Z` avança.

```tsx
// Estrutura do histórico no store
interface HistorySnapshot {
  canvasElements:    CanvasElement[]
  selectedElementIds: string[]
  editingGroupId:    string | null
}

interface DesignWorkspaceState {
  // ...existentes...
  history: HistorySnapshot[]   // pilha de snapshots anteriores
  future:  HistorySnapshot[]   // pilha de snapshots "à frente" (para redo)
  // canvasElements já existente — estado atual
}
```

---

### QUAIS AÇÕES GERAM SNAPSHOT

Nem toda operação gera um snapshot — apenas as que alteram o canvas de forma significativa. Operações contínuas (drag e resize) geram snapshot apenas no `mouseup`:

| Ação | Gera snapshot |
|---|---|
| `insertElement` | ✅ sim |
| `deleteElement` / `deleteElements` | ✅ sim |
| `groupElements` | ✅ sim |
| `ungroupElements` | ✅ sim |
| `renameElement` | ✅ sim |
| `updateElement` chamado via drag (mouseup) | ✅ sim — apenas ao soltar |
| `updateElement` chamado via resize (mouseup) | ✅ sim — apenas ao soltar |
| `updateElement` durante mousemove | ❌ não — contínuo, sem snapshot |
| `selectElement` / `clearSelection` | ❌ não — não altera canvas |
| `setActivePanel` | ❌ não — não altera canvas |

---

### IMPLEMENTAÇÃO — `pushHistory` e middleware de histórico

```tsx
// store/useDesignWorkspaceStore.ts

// Limite de undo para não explodir memória
const MAX_HISTORY = 50

// Função auxiliar — salva snapshot atual antes de mudar o estado
function pushHistory(state: DesignWorkspaceState): Partial<DesignWorkspaceState> {
  const snapshot: HistorySnapshot = {
    canvasElements:     [...state.canvasElements],
    selectedElementIds: [...state.selectedElementIds],
    editingGroupId:     state.editingGroupId,
  }

  return {
    history: [...state.history, snapshot].slice(-MAX_HISTORY),
    future:  [],  // qualquer nova ação limpa o redo
  }
}
```

---

### STORE — Ações com snapshot automático

```tsx
// Todas as ações que alteram canvas chamam pushHistory antes de mutar

insertElement: (element) => set(state => {
  const newId   = crypto.randomUUID()
  const name    = element.name ?? defaultLayerName(element.type)
  const isBackground = element.placeholderVariant === 'background'

  const finalElement = isBackground
    ? { ...element, id: newId, name, x: 0, y: 0, width: 600, height: 600 }
    : { ...element, id: newId, name }

  return {
    ...pushHistory(state),   // ← snapshot antes da mudança
    canvasElements: isBackground
      ? [finalElement, ...state.canvasElements]
      : [...state.canvasElements, finalElement],
    selectedElementIds:  [newId],
    selectedElementType: element.type,
  }
}),

deleteElement: (id) => set(state => {
  const element = state.canvasElements.find(el => el.id === id)
  if (!element) return state

  const idsToRemove = element.type === 'group'
    ? [id, ...state.canvasElements.filter(el => el.groupId === id).map(el => el.id)]
    : [id]

  return {
    ...pushHistory(state),   // ← snapshot
    canvasElements:      state.canvasElements.filter(el => !idsToRemove.includes(el.id)),
    selectedElementIds:  state.selectedElementIds.filter(sid => !idsToRemove.includes(sid)),
    selectedElementType: null,
    editingGroupId:      state.editingGroupId === id ? null : state.editingGroupId,
  }
}),

groupElements: (ids) => set(state => {
  const elements = state.canvasElements.filter(el => ids.includes(el.id))
  if (elements.length < 2) return state

  const minX = Math.min(...elements.map(el => el.x))
  const minY = Math.min(...elements.map(el => el.y))
  const maxX = Math.max(...elements.map(el => el.x + el.width))
  const maxY = Math.max(...elements.map(el => el.y + el.height))
  const groupId = crypto.randomUUID()

  return {
    ...pushHistory(state),   // ← snapshot
    canvasElements: [
      ...state.canvasElements.map(el =>
        ids.includes(el.id) ? { ...el, groupId } : el
      ),
      {
        id: groupId, type: 'group' as ElementType,
        x: minX, y: minY, width: maxX - minX, height: maxY - minY,
        groupedIds: ids, name: 'Group',
      },
    ],
    selectedElementIds:  [groupId],
    selectedElementType: 'group',
  }
}),

renameElement: (id, name) => set(state => ({
  ...pushHistory(state),     // ← snapshot
  canvasElements: state.canvasElements.map(el =>
    el.id === id ? { ...el, name: name.trim() || defaultLayerName(el.type) } : el
  ),
})),

// ── Undo e Redo ─────────────────────────────────────────────────────────────

undo: () => set(state => {
  if (state.history.length === 0) return state  // nada para desfazer

  const previous  = state.history[state.history.length - 1]
  const newHistory = state.history.slice(0, -1)

  // Salvar estado atual no future (para redo)
  const currentSnapshot: HistorySnapshot = {
    canvasElements:      [...state.canvasElements],
    selectedElementIds:  [...state.selectedElementIds],
    editingGroupId:      state.editingGroupId,
  }

  return {
    canvasElements:      previous.canvasElements,
    selectedElementIds:  previous.selectedElementIds,
    editingGroupId:      previous.editingGroupId,
    history:             newHistory,
    future:              [currentSnapshot, ...state.future].slice(0, MAX_HISTORY),
  }
}),

redo: () => set(state => {
  if (state.future.length === 0) return state  // nada para refazer

  const next       = state.future[0]
  const newFuture  = state.future.slice(1)

  // Salvar estado atual no history (para undo do redo)
  const currentSnapshot: HistorySnapshot = {
    canvasElements:      [...state.canvasElements],
    selectedElementIds:  [...state.selectedElementIds],
    editingGroupId:      state.editingGroupId,
  }

  return {
    canvasElements:      next.canvasElements,
    selectedElementIds:  next.selectedElementIds,
    editingGroupId:      next.editingGroupId,
    history:             [...state.history, currentSnapshot].slice(-MAX_HISTORY),
    future:              newFuture,
  }
}),
```

---

### SNAPSHOT NO MOUSEUP — Drag e resize

O `updateElement` durante mousemove **não** gera snapshot (seria um snapshot por pixel arrastado). O snapshot é gerado no `mouseup`, depois que a ação terminou:

```tsx
// hooks/useResizeHandler.ts — snapshot no mouseup
function onMouseUp() {
  // Gerar snapshot AGORA — após o resize terminar
  useDesignWorkspaceStore.getState().commitHistory()
  onGuidesChange?.([])
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

// InteractionOverlay.tsx — snapshot no mouseup do drag
function onMouseUp() {
  if (dragging) {
    // Gerar snapshot AGORA — após o drag terminar
    useDesignWorkspaceStore.getState().commitHistory()
  }
  onAlignmentGuidesChange([])
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}
```

```tsx
// store — commitHistory: salva snapshot do estado atual sem mudar o canvas
commitHistory: () => set(state => ({
  history: [
    ...state.history,
    {
      canvasElements:     [...state.canvasElements],
      selectedElementIds: [...state.selectedElementIds],
      editingGroupId:     state.editingGroupId,
    }
  ].slice(-MAX_HISTORY),
  future: [],   // nova ação limpa o redo
})),
```

---

### HOOK — `useCanvasKeyboardShortcuts` atualizado

```tsx
// hooks/useCanvasKeyboardShortcuts.ts

const { undo, redo } = useDesignWorkspaceStore()

// ── Cmd/Ctrl + Z — Undo ──────────────────────────────────────────────────
if (isMod && !e.shiftKey && e.key === 'z') {
  e.preventDefault()
  undo()
  return
}

// ── Cmd/Ctrl + Shift + Z — Redo ──────────────────────────────────────────
if (isMod && e.shiftKey && e.key === 'z') {
  e.preventDefault()
  redo()
  return
}

// ── Cmd/Ctrl + Y — Redo (alternativo, Windows) ───────────────────────────
if (isMod && e.key === 'y') {
  e.preventDefault()
  redo()
  return
}
```

---

### FEEDBACK VISUAL — Indicadores de undo/redo disponível

Botões de undo/redo no `TopBar` ou flutuando no canvas, que refletem a disponibilidade de histórico:

```tsx
// UndoRedoButtons.tsx
export function UndoRedoButtons() {
  const { history, future, undo, redo } = useDesignWorkspaceStore()

  const canUndo = history.length > 0
  const canRedo = future.length  > 0

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={undo}
        disabled={!canUndo}
        title="Undo (⌘Z)"
        className={`
          w-8 h-8 flex items-center justify-center rounded-lg transition-colors
          ${canUndo
            ? 'text-[#1f1d25] hover:bg-gray-100 cursor-pointer'
            : 'text-gray-300 cursor-not-allowed'
          }
        `}
      >
        <Undo2 size={15} />
      </button>

      <button
        onClick={redo}
        disabled={!canRedo}
        title="Redo (⌘⇧Z)"
        className={`
          w-8 h-8 flex items-center justify-center rounded-lg transition-colors
          ${canRedo
            ? 'text-[#1f1d25] hover:bg-gray-100 cursor-pointer'
            : 'text-gray-300 cursor-not-allowed'
          }
        `}
      >
        <Redo2 size={15} />
      </button>
    </div>
  )
}
```

Posicionar os botões de undo/redo no topo do canvas, à esquerda do `BreadcrumbNav`:

```tsx
// CanvasArea.tsx — posicionamento dos botões undo/redo
<div
  className="absolute top-1 z-30 flex items-center"
  style={{ left: `${undoRedoLeft}px` }}  // mesmo left do BreadcrumbNav
>
  <UndoRedoButtons />
  <div className="w-2" /> {/* espaço entre botões e breadcrumb */}
  <BreadcrumbNav />
</div>
```

---

### DIAGRAMA — Pilha de histórico

```
Ações do usuário:
  1. Insert TextA      → history: [snap0]           future: []
  2. Insert ShapeB     → history: [snap0, snap1]    future: []
  3. Move ShapeB       → history: [snap0,snap1,snap2] future: []
  4. Group TextA+ShapeB→ history: [..., snap3]       future: []

Cmd+Z (undo uma vez):
  → restaura snap3 (antes do group)
  → history: [snap0,snap1,snap2]  future: [snap4(atual)]

Cmd+Z (undo outra vez):
  → restaura snap2 (antes do move)
  → history: [snap0,snap1]  future: [snap3,snap4]

Cmd+Shift+Z (redo):
  → restaura snap3
  → history: [snap0,snap1,snap2]  future: [snap4]

Nova ação (Insert IconC):
  → future LIMPO — não é mais possível redo
  → history: [snap0,snap1,snap2,snap3,snap5]  future: []
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] `Cmd+Z` desfaz inserção de elemento
- [ ] `Cmd+Z` desfaz deleção de elemento
- [ ] `Cmd+Z` desfaz agrupamento
- [ ] `Cmd+Z` desfaz drag (posição)
- [ ] `Cmd+Z` desfaz resize (dimensões)
- [ ] `Cmd+Z` desfaz rename de layer
- [ ] `Cmd+Shift+Z` refaz ação desfeita
- [ ] Nova ação após undo limpa o future (redo não disponível)
- [ ] Botões undo/redo desabilitados visualmente quando sem histórico
- [ ] Histórico limitado a `MAX_HISTORY` (50) snapshots
- [ ] LayersPanel e Timeline refletem o estado restaurado pelo undo

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| `MAX_HISTORY` | `50` snapshots |
| Undo | `Cmd/Ctrl + Z` |
| Redo | `Cmd/Ctrl + Shift + Z` ou `Cmd/Ctrl + Y` |
| Ações com snapshot automático | insert, delete, group, rename |
| Ações com `commitHistory` no mouseup | drag, resize |
| Ações sem snapshot | select, pan, zoom, abrir painéis |
| Nova ação após undo | limpa `future` completamente |
| Undo button icon | `Undo2` — lucide-react |
| Redo button icon | `Redo2` — lucide-react |
| Botão desabilitado | `text-gray-300 cursor-not-allowed` |