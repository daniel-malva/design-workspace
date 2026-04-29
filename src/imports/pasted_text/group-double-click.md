Prompt direto e focado nessa funcionalidade:

---

## 🧱 PROMPT V42 — Design Workspace — Duplo clique em elemento dentro de grupo seleciona o filho diretamente

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

### REGRA PRINCIPAL — Dois níveis de seleção no canvas

| Interação | Comportamento |
|---|---|
| Click simples em elemento agrupado | Seleciona o **grupo** inteiro |
| Duplo clique em elemento agrupado | Entra no grupo e seleciona o **filho** específico |
| Click fora enquanto dentro de um grupo | Sai do modo de edição de grupo, deseleciona |
| Escape enquanto filho selecionado | Volta a selecionar o grupo pai |

---

### STORE — Estado de "grupo em edição"

```tsx
// store/useDesignWorkspaceStore.ts

interface DesignWorkspaceState {
  // ...existentes...
  editingGroupId: string | null  // ID do grupo cujos filhos estão acessíveis
}

interface DesignWorkspaceActions {
  // ...existentes...
  enterGroup:  (groupId: string) => void  // entra no grupo (duplo clique)
  exitGroup:   () => void                 // sai do grupo (Escape ou click fora)
}

enterGroup: (groupId) => set(() => ({
  editingGroupId: groupId,
})),

exitGroup: () => set(state => {
  // Ao sair do grupo, seleciona o grupo pai
  const groupEl = state.canvasElements.find(el => el.id === state.editingGroupId)
  return {
    editingGroupId: null,
    selectedElementIds:  groupEl ? [groupEl.id] : [],
    selectedElementType: groupEl ? 'group' : null,
  }
}),
```

---

### `InteractionOverlay` — lógica de duplo clique

O `InteractionOverlay` já gerencia todos os eventos de mouse no canvas. Adicionar detecção de duplo clique:

```tsx
// InteractionOverlay.tsx
export function InteractionOverlay({ frameRef, onMarqueeChange }: Props) {
  const {
    canvasElements,
    selectedElementIds,
    editingGroupId,
    selectElement,
    toggleElementSelection,
    clearSelection,
    setSelection,
    enterGroup,
    exitGroup,
    updateElement,
  } = useDesignWorkspaceStore()

  const lastClickTime  = useRef<number>(0)
  const lastClickedId  = useRef<string | null>(null)
  const DOUBLE_CLICK_MS = 300  // threshold para duplo clique

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return

    const rect = frameRef.current!.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const now    = Date.now()

    // ── Detectar elemento sob o cursor ───────────────────────────────────
    const hitElement = [...canvasElements]
      .reverse()
      .find(el =>
        mouseX >= el.x &&
        mouseX <= el.x + el.width &&
        mouseY >= el.y &&
        mouseY <= el.y + el.height
      )

    // ── Detectar duplo clique ─────────────────────────────────────────────
    const isDoubleClick =
      now - lastClickTime.current < DOUBLE_CLICK_MS &&
      lastClickedId.current === hitElement?.id

    lastClickTime.current  = now
    lastClickedId.current  = hitElement?.id ?? null

    if (!hitElement) {
      // Clique na área vazia
      if (editingGroupId) {
        // Estava editando um grupo → sai do grupo
        exitGroup()
      } else {
        // Comportamento normal → deseleciona + marquee
        handleEmptyAreaInteraction(e, mouseX, mouseY, rect)
      }
      return
    }

    if (isDoubleClick) {
      // ── Duplo clique ────────────────────────────────────────────────────
      handleDoubleClick(hitElement)
      return
    }

    // ── Click simples ────────────────────────────────────────────────────
    handleSingleClick(e, hitElement, mouseX, mouseY, rect)
  }

  function handleDoubleClick(element: CanvasElement) {
    if (element.type === 'group') {
      // Duplo clique num grupo → entra no grupo (próximo duplo clique selecionará filho)
      enterGroup(element.id)
      // Não seleciona nenhum filho ainda — aguarda próxima interação dentro do grupo
      return
    }

    if (element.groupId) {
      // Duplo clique em filho de grupo:
      // Se o grupo está em edição → seleciona o filho diretamente
      if (editingGroupId === element.groupId) {
        selectElement(element.id)
        return
      }
      // Se o grupo NÃO está em edição → entra no grupo E seleciona o filho
      enterGroup(element.groupId)
      selectElement(element.id)
      return
    }

    // Duplo clique em elemento sem grupo → sem ação especial por ora
  }

  function handleSingleClick(
    e: React.MouseEvent,
    element: CanvasElement,
    mouseX: number,
    mouseY: number,
    rect: DOMRect
  ) {
    if (e.shiftKey) {
      toggleElementSelection(element.id)
      return
    }

    // Se estamos editando um grupo:
    if (editingGroupId) {
      if (element.groupId === editingGroupId) {
        // Clique em filho do grupo em edição → seleciona o filho
        selectElement(element.id)
      } else {
        // Clique fora do grupo em edição → sai do grupo
        exitGroup()
        // Depois seleciona o elemento clicado (se não for filho de outro grupo)
        if (!element.groupId) selectElement(element.id)
      }
    } else {
      // Comportamento normal
      const isAlreadySelected = selectedElementIds.includes(element.id)
      if (!isAlreadySelected) selectElement(element.id)
    }

    // Iniciar drag
    startElementDrag(e, element, rect)
  }

  // ...handleEmptyAreaInteraction e startElementDrag existentes...

  return (
    <div
      className="absolute inset-0 cursor-default"
      style={{ zIndex: 50 }}
      onMouseDown={handleMouseDown}
    />
  )
}
```

---

### FEEDBACK VISUAL — Indicar que está dentro de um grupo

Quando `editingGroupId` está ativo, exibir um indicador visual no `CanvasFrame` para comunicar ao usuário que está no modo de edição de grupo:

```tsx
// CanvasFrame.tsx — overlay de modo de edição de grupo
{editingGroupId && (
  <>
    {/* Overlay escurecido sobre os elementos FORA do grupo */}
    <GroupEditOverlay editingGroupId={editingGroupId} />

    {/* Badge no topo indicando modo de edição */}
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[80] pointer-events-none">
      <span className="text-[10px] text-white bg-[#5B4EFF] px-2 py-1 rounded-full whitespace-nowrap shadow-md">
        Editing group — press Esc to exit
      </span>
    </div>
  </>
)}
```

```tsx
// GroupEditOverlay.tsx
// Escurece levemente os elementos que NÃO pertencem ao grupo em edição
export function GroupEditOverlay({ editingGroupId }: { editingGroupId: string }) {
  const { canvasElements } = useDesignWorkspaceStore()

  return (
    <>
      {canvasElements
        .filter(el => el.id !== editingGroupId && el.groupId !== editingGroupId)
        .map(el => (
          <div
            key={el.id}
            className="absolute pointer-events-none bg-white/40 z-[45]"
            style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
          />
        ))
      }
    </>
  )
}
```

---

### ATALHO `Escape` — sair do grupo

```tsx
// hooks/useCanvasKeyboardShortcuts.ts — adição

if (e.key === 'Escape') {
  const { editingGroupId, selectedElementIds, exitGroup, clearSelection, setActiveInsertItem } =
    useDesignWorkspaceStore.getState()

  if (editingGroupId) {
    // Estava editando grupo → sai do grupo
    exitGroup()
    return
  }

  if (selectedElementIds.length > 0) {
    clearSelection()
    return
  }

  if (setActiveInsertItem) {
    setActiveInsertItem(null)
  }
}
```

---

### COMPORTAMENTO NO LAYERS PANEL

O `LayerNode` já permite selecionar filhos de grupo via click simples. Ao selecionar um filho via LayersPanel, deve também entrar automaticamente no modo de edição do grupo pai:

```tsx
// LayerNode.tsx — ao selecionar um filho via LayersPanel
function handleSelectFromPanel(id: string) {
  const element = canvasElements.find(el => el.id === id)
  if (element?.groupId) {
    // Filho de grupo → entra no grupo e seleciona o filho
    enterGroup(element.groupId)
  }
  onSelect(id)
}

// Usar handleSelectFromPanel em vez de onSelect diretamente
<div onClick={() => !isEditing && handleSelectFromPanel(node.element.id)}>
```

---

### DIAGRAMA — Fluxo de seleção com grupos

```
Canvas: [Background] [TextA] [Group → ShapeB, IconC]

CLICK SIMPLES em Group:
  → editingGroupId = null
  → selectedElementIds = ['group-id']
  → RightPanel: GroupPropertiesPanel
  → canvas: bounding box do grupo inteiro

DUPLO CLIQUE em Group (ou em ShapeB diretamente):
  → editingGroupId = 'group-id'
  → selectedElementIds = ['shapeB-id']
  → RightPanel: ShapePropertiesPanel
  → canvas: ShapeB com bounding box próprio
             IconC e outros elementos com overlay branco sutil
             Badge "Editing group — press Esc to exit"

ESCAPE:
  → editingGroupId = null
  → selectedElementIds = ['group-id']  ← volta a selecionar o grupo
  → Badge some

CLICK fora do grupo enquanto editando:
  → editingGroupId = null
  → clearSelection()
```

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Double click threshold | `300ms` |
| `editingGroupId` padrão | `null` |
| Entrar no grupo | duplo clique no grupo ou duplo clique em filho |
| Sair do grupo | `Escape` ou click fora |
| Ao sair | seleciona grupo pai |
| Overlay elementos fora do grupo | `bg-white/40` (`rgba(255,255,255,0.4)`) |
| Badge de edição | `bg-[#5B4EFF]` texto branco, `rounded-full` |
| Badge z-index | `80` — acima de tudo |
| LayersPanel | selecionar filho → entra no grupo automaticamente |