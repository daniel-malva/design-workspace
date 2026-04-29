Prompt direto e focado nessa correção:

---

## 🧱 PROMPT V34 — Design Workspace — Seleção múltipla no canvas para agrupamento

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

### REGRA PRINCIPAL — Dois modos de seleção

O canvas passa a suportar **seleção simples** (já existente) e **seleção múltipla** (nova), necessária para agrupar elementos:

| Interação | Comportamento |
|---|---|
| Clicar em elemento | Seleciona somente esse elemento |
| Clicar na área branca do canvas (CanvasFrame) | **Desseleciona tudo** |
| `Shift + clicar` em elemento | Adiciona/remove da seleção múltipla |
| Arrastar na área vazia do CanvasFrame | Desenha selection box (marquee) — seleciona todos os elementos tocados |
| `Cmd/Ctrl + G` com múltiplos selecionados | Agrupa todos os selecionados |

---

### STORE — Migração de single para multi-seleção

```tsx
// store/useDesignWorkspaceStore.ts

interface DesignWorkspaceState {
  // ❌ Antes — seleção única
  // selectedElementId: string | null
  // selectedElementType: ElementType | null

  // ✅ Agora — seleção múltipla
  selectedElementIds: string[]           // array vazio = nada selecionado
  selectedElementType: ElementType | null // tipo do elemento se só um selecionado
}

interface DesignWorkspaceActions {
  // Selecionar um único elemento (deseleciona os demais)
  selectElement: (id: string | null) => void

  // Adicionar/remover da seleção sem deselecionar os outros
  toggleElementSelection: (id: string) => void

  // Deselecionar tudo
  clearSelection: () => void

  // Substituir toda a seleção por uma lista
  setSelection: (ids: string[]) => void
}

// Implementações
selectElement: (id) => set(state => ({
  selectedElementIds: id ? [id] : [],
  selectedElementType: id
    ? state.canvasElements.find(el => el.id === id)?.type ?? null
    : null,
})),

toggleElementSelection: (id) => set(state => {
  const already = state.selectedElementIds.includes(id)
  const ids = already
    ? state.selectedElementIds.filter(x => x !== id)
    : [...state.selectedElementIds, id]
  return {
    selectedElementIds: ids,
    selectedElementType: ids.length === 1
      ? state.canvasElements.find(el => el.id === ids[0])?.type ?? null
      : null,
  }
}),

clearSelection: () => set(() => ({
  selectedElementIds: [],
  selectedElementType: null,
})),

setSelection: (ids) => set(state => ({
  selectedElementIds: ids,
  selectedElementType: ids.length === 1
    ? state.canvasElements.find(el => el.id === ids[0])?.type ?? null
    : null,
})),
```

> **Compatibilidade:** todos os lugares que antes liam `selectedElementId` devem ser atualizados para ler `selectedElementIds[0] ?? null` para manter comportamento de seleção simples.

---

### COMPONENTE — `CanvasFrame` com deselecionar ao clicar na área vazia

```tsx
// CanvasFrame.tsx
export function CanvasFrame() {
  const { canvasElements, selectedElementIds, clearSelection } = useDesignWorkspaceStore()

  // Clicar na área branca vazia do CanvasFrame → deseleciona tudo
  function handleFrameClick(e: React.MouseEvent) {
    // Só dispara se o clique foi diretamente no frame (não em um elemento filho)
    if (e.target === e.currentTarget) {
      clearSelection()
    }
  }

  return (
    <div
      className="relative bg-white shadow-xl overflow-hidden select-none"
      style={{ width: 600, height: 600 }}
      onClick={handleFrameClick}          // ← deseleciona ao clicar na área vazia
      onMouseDown={handleMarqueeStart}    // ← inicia selection box (ver abaixo)
    >
      {canvasElements.map((element, index) => (
        <CanvasElementRenderer
          key={element.id}
          element={element}
          zIndex={index}
          isSelected={selectedElementIds.includes(element.id)}
          isMultiSelected={selectedElementIds.length > 1 && selectedElementIds.includes(element.id)}
        />
      ))}

      {/* Selection box (marquee) — renderizado acima de tudo */}
      <MarqueeSelection />
    </div>
  )
}
```

---

### COMPONENTE — `CanvasElementRenderer` com Shift+click

```tsx
// CanvasElementRenderer.tsx
export function CanvasElementRenderer({
  element, zIndex, isSelected, isMultiSelected
}: Props) {
  const { selectElement, toggleElementSelection } = useDesignWorkspaceStore()

  function handleMouseDown(e: React.MouseEvent) {
    e.stopPropagation()

    if (e.shiftKey) {
      // Shift + click → adiciona/remove da seleção múltipla
      toggleElementSelection(element.id)
    } else {
      // Click simples → seleciona somente este
      selectElement(element.id)
    }

    // Iniciar drag apenas se não for Shift (Shift é só para seleção)
    if (!e.shiftKey) {
      startDrag(e)
    }
  }

  return (
    <div
      className="absolute"
      style={{ left: element.x, top: element.y, width: element.width, height: element.height, zIndex }}
      onMouseDown={handleMouseDown}
    >
      <ElementContent element={element} />

      {/* Bounding box — exibido para qualquer elemento selecionado */}
      {isSelected && (
        <SelectionOverlay
          elementId={element.id}
          // Handles de resize só aparecem quando é seleção única
          showResizeHandles={!isMultiSelected}
        />
      )}
    </div>
  )
}
```

---

### COMPONENTE — `SelectionOverlay` com suporte a multi-seleção

Quando múltiplos elementos estão selecionados, o bounding box aparece mas **sem handles de resize** — para evitar conflito de redimensionamento em múltiplos elementos:

```tsx
// SelectionOverlay.tsx
export function SelectionOverlay({
  elementId,
  showResizeHandles = true,
}: {
  elementId: string
  showResizeHandles?: boolean
}) {
  const { startResize } = useResizeHandler(elementId)

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Bounding box — sempre visível quando selecionado */}
      <div className="absolute inset-0 border-2 border-[#5B4EFF] rounded-[1px]" />

      {/* Handles de resize — apenas em seleção única */}
      {showResizeHandles && (Object.keys(HANDLE_POSITIONS) as ResizeHandle[]).map(handle => (
        <div
          key={handle}
          className="absolute w-2 h-2 bg-white border-2 border-[#5B4EFF] rounded-[1px] pointer-events-auto z-10"
          style={{ ...HANDLE_POSITIONS[handle], cursor: HANDLE_CURSORS[handle] }}
          onMouseDown={(e) => startResize(e, handle)}
        />
      ))}
    </div>
  )
}
```

---

### COMPONENTE — `MarqueeSelection` (selection box por arrastar)

Permite selecionar múltiplos elementos arrastando na área vazia do canvas:

```tsx
// MarqueeSelection.tsx
export function MarqueeSelection() {
  const { canvasElements, setSelection } = useDesignWorkspaceStore()
  const [marquee, setMarquee] = useState<{
    startX: number; startY: number
    currentX: number; currentY: number
    active: boolean
  } | null>(null)

  // Iniciado pelo CanvasFrame via onMouseDown na área vazia
  function handleMarqueeStart(e: React.MouseEvent) {
    // Só inicia se clicou na área vazia (não em elemento)
    if (e.target !== e.currentTarget) return
    if (e.shiftKey) return // Shift + drag não faz marquee

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setMarquee({ startX: x, startY: y, currentX: x, currentY: y, active: true })

    function onMouseMove(ev: MouseEvent) {
      const cx = ev.clientX - rect.left
      const cy = ev.clientY - rect.top
      setMarquee(m => m ? { ...m, currentX: cx, currentY: cy } : null)
    }

    function onMouseUp(ev: MouseEvent) {
      const cx = ev.clientX - rect.left
      const cy = ev.clientY - rect.top

      // Calcular bounding box da seleção
      const selX = Math.min(x, cx)
      const selY = Math.min(y, cy)
      const selW = Math.abs(cx - x)
      const selH = Math.abs(cy - y)

      // Selecionar elementos que se intersectam com o marquee
      if (selW > 4 && selH > 4) {
        const hit = canvasElements.filter(el =>
          el.x < selX + selW &&
          el.x + el.width > selX &&
          el.y < selY + selH &&
          el.y + el.height > selY
        )
        setSelection(hit.map(el => el.id))
      }

      setMarquee(null)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  if (!marquee?.active) return null

  const x = Math.min(marquee.startX, marquee.currentX)
  const y = Math.min(marquee.startY, marquee.currentY)
  const w = Math.abs(marquee.currentX - marquee.startX)
  const h = Math.abs(marquee.currentY - marquee.startY)

  return (
    <div
      className="absolute pointer-events-none border border-[#5B4EFF] bg-[#5B4EFF1A] z-50"
      style={{ left: x, top: y, width: w, height: h }}
    />
  )
}
```

---

### ATALHO `Cmd/Ctrl + G` — Agrupar múltiplos selecionados

```tsx
// hooks/useCanvasKeyboardShortcuts.ts — atualização do Cmd+G
if (isMod && e.key === 'g') {
  e.preventDefault()

  const { selectedElementIds } = useDesignWorkspaceStore.getState()

  if (selectedElementIds.length >= 2) {
    // Agrupa todos os selecionados
    groupElements(selectedElementIds)
  } else if (selectedElementIds.length === 1) {
    // Apenas 1 elemento — não agrupa, sem ação
    console.info('Selecione 2 ou mais elementos para agrupar')
  }
  return
}
```

---

### DIRETRIZES — RightPanel com multi-seleção

```tsx
// RightPanel.tsx — comportamento com multi-seleção
const { selectedElementIds, selectedElementType } = useDesignWorkspaceStore()

const hasSingleSelection  = selectedElementIds.length === 1
const hasMultiSelection   = selectedElementIds.length > 1
const hasSelection        = selectedElementIds.length > 0

// RightPanel visível
const isRightPanelVisible =
  hasSelection ||
  activePanel === 'settings' ||
  (canvasElements.length > 0 && !hasSelection && activePanel !== 'settings')

// Conteúdo do RightPanel
if (hasMultiSelection) return <MultiSelectionPanel count={selectedElementIds.length} />
if (hasSingleSelection) return <PropertiesContent elementId={selectedElementIds[0]} elementType={selectedElementType} />
```

---

### COMPONENTE — `MultiSelectionPanel`

Exibido no RightPanel quando múltiplos elementos estão selecionados:

```tsx
// MultiSelectionPanel.tsx
export function MultiSelectionPanel({ count }: { count: number }) {
  const { groupElements, selectedElementIds } = useDesignWorkspaceStore()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <RightPanelHeader title={`${count} elements selected`} />

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-xs text-[#686576] text-center">
          {count} elementos selecionados
        </p>

        {/* Botão de agrupar */}
        <button
          onClick={() => groupElements(selectedElementIds)}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#5B4EFF] hover:bg-[#473bab] text-white text-sm font-medium rounded-full transition-colors"
        >
          <Group size={14} />
          Group elements
          <span className="text-xs opacity-70 ml-1">⌘G</span>
        </button>
      </div>
    </div>
  )
}
```

---

### DIAGRAMA — Fluxo de seleção múltipla para agrupamento

```
Canvas tem 3 elementos: TextA, PlaceholderB, ShapeC

1. Usuário clica em TextA
   → selectedElementIds = ['textA-id']
   → RightPanel: TextPropertiesPanel

2. Usuário clica na área branca do CanvasFrame
   → clearSelection()
   → selectedElementIds = []
   → RightPanel: ActivityPanel

3. Usuário Shift+clica em PlaceholderB
   → toggleElementSelection('placeholderB-id')
   → selectedElementIds = ['placeholderB-id']

4. Usuário Shift+clica em ShapeC
   → toggleElementSelection('shapeC-id')
   → selectedElementIds = ['placeholderB-id', 'shapeC-id']
   → RightPanel: MultiSelectionPanel ("2 elements selected")

5. Usuário pressiona Cmd+G
   → groupElements(['placeholderB-id', 'shapeC-id'])
   → canvasElements: PlaceholderB e ShapeC removidos, Group adicionado
   → selectedElementIds = ['group-id']
   → Layers: layer do grupo criada
   → Timeline: track do grupo criada
   → RightPanel: GroupPropertiesPanel (futuro)
```

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Selection box border | `1px solid #5B4EFF` |
| Selection box fill | `#5B4EFF1A` (10% opacidade) |
| Bounding box (simples) | `2px solid #5B4EFF` com handles |
| Bounding box (multi) | `2px solid #5B4EFF` sem handles |
| Shift+click | Adiciona/remove da seleção |
| Click em área vazia | `clearSelection()` |
| Arrastar área vazia | Marquee selection |
| Marquee threshold | `> 4px` antes de ativar seleção |
| `Cmd+G` mínimo | `2 elementos` selecionados |