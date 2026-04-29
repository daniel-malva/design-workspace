Prompt direto e focado apenas nessa funcionalidade:

---

## 🧱 PROMPT V19 — Design Workspace — Layers Panel com reordenação sincronizada ao canvas

---

### STACK & BOAS PRÁTICAS

```
Stack: React + TypeScript + Tailwind CSS + shadcn/ui components
Boas práticas:
- Componentes reutilizáveis nomeados semanticamente por função
- TypeScript com interfaces e tipos explícitos para todas as props
- Tailwind para estilização, sem CSS inline ou arquivos .css separados
- shadcn/ui para elementos de UI base
- Estado global via Zustand (useDesignWorkspaceStore)
```

---

### REGRA PRINCIPAL — Layers e canvas são a mesma fonte de verdade

O array `canvasElements` no store é **simultaneamente** a lista de layers e a ordem de renderização do canvas. A ordem dos itens no array determina o z-index de cada elemento:

- **Primeiro item do array** → camada mais abaixo (renderizado primeiro, coberto pelos outros)
- **Último item do array** → camada mais acima (renderizado por último, fica na frente)

Reordenar no painel de layers = reordenar no array = reordenar no canvas. Não existe estado separado para layers.

```tsx
// A ordem de renderização do CanvasFrame já respeita a ordem do array
canvasElements.map((element, index) => (
  <CanvasElementRenderer
    key={element.id}
    element={element}
    zIndex={index}         // index = posição no array = z-index visual
    isSelected={element.id === selectedElementId}
    onSelect={() => selectElement(element.id)}
  />
))
```

---

### STORE — Ação de reordenação

```tsx
// store/useDesignWorkspaceStore.ts

reorderElement: (fromIndex: number, toIndex: number) => {
  set(state => {
    const elements = [...state.canvasElements]
    const [moved] = elements.splice(fromIndex, 1)  // remove do índice original
    elements.splice(toIndex, 0, moved)              // insere no novo índice
    return { canvasElements: elements }
  })
}
```

---

### COMPONENTE: `LayersPanel`

Exibido quando `activePanel === 'layers'` no `LeftPane`. Lista todos os elementos do canvas em **ordem inversa** — o elemento do topo do canvas aparece primeiro na lista (convenção padrão de editores como Figma).

```tsx
// LayersPanel.tsx
export function LayersPanel() {
  const { canvasElements, selectedElementId, selectElement, reorderElement } =
    useDesignWorkspaceStore()

  // Invertemos para exibição — o último do array (topo do canvas) aparece primeiro na lista
  const reversedElements = [...canvasElements].reverse()

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header com contador */}
      <div className="px-4 py-3 border-b border-gray-100 shrink-0 flex items-center justify-between">
        <span className="text-xs text-gray-400">{canvasElements.length} layers</span>
      </div>

      {/* Lista de layers com drag-and-drop */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {canvasElements.length === 0 ? (
          <EmptyLayersState />
        ) : (
          <DraggableLayerList
            elements={reversedElements}
            selectedElementId={selectedElementId}
            onSelect={selectElement}
            onReorder={(fromDisplayIndex, toDisplayIndex) => {
              // Converter índices de display (invertidos) para índices reais do array
              const lastIndex = canvasElements.length - 1
              const fromReal = lastIndex - fromDisplayIndex
              const toReal   = lastIndex - toDisplayIndex
              reorderElement(fromReal, toReal)
            }}
          />
        )}
      </div>

    </div>
  )
}
```

---

### COMPONENTE: `DraggableLayerList`

Implementa drag-and-drop nativo com `draggable` HTML5, sem biblioteca externa:

```tsx
// DraggableLayerList.tsx
export function DraggableLayerList({ elements, selectedElementId, onSelect, onReorder }: Props) {
  const dragIndexRef = useRef<number | null>(null)

  function handleDragStart(index: number) {
    dragIndexRef.current = index
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault() // necessário para permitir drop
  }

  function handleDrop(toIndex: number) {
    if (dragIndexRef.current === null || dragIndexRef.current === toIndex) return
    onReorder(dragIndexRef.current, toIndex)
    dragIndexRef.current = null
  }

  return (
    <div className="flex flex-col py-1">
      {elements.map((element, displayIndex) => (
        <LayerRow
          key={element.id}
          element={element}
          isSelected={element.id === selectedElementId}
          onSelect={() => onSelect(element.id)}
          draggable
          onDragStart={() => handleDragStart(displayIndex)}
          onDragOver={(e) => handleDragOver(e, displayIndex)}
          onDrop={() => handleDrop(displayIndex)}
        />
      ))}
    </div>
  )
}
```

---

### COMPONENTE: `LayerRow`

Uma linha da lista de layers. Exibe ícone do tipo, nome do elemento, e indicador de seleção:

```tsx
// LayerRow.tsx
export function LayerRow({
  element, isSelected, onSelect,
  draggable, onDragStart, onDragOver, onDrop
}: LayerRowProps) {

  return (
    <div
      className={`
        flex items-center gap-2 px-4 py-2 cursor-pointer select-none
        border-l-2 transition-colors
        ${isSelected
          ? 'bg-[#5B4EFF10] border-l-[#5B4EFF]'
          : 'border-l-transparent hover:bg-gray-50'
        }
      `}
      draggable={draggable}
      onClick={onSelect}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Handle de drag */}
      <GripVertical size={12} className="text-gray-300 shrink-0 cursor-grab" />

      {/* Ícone do tipo de elemento */}
      <LayerTypeIcon type={element.type} />

      {/* Nome do elemento */}
      <span className="flex-1 min-w-0 text-xs text-gray-700 truncate">
        {elementTypeLabel[element.type]}
      </span>

      {/* Indicador visual de seleção */}
      {isSelected && (
        <div className="w-1.5 h-1.5 rounded-full bg-[#5B4EFF] shrink-0" />
      )}
    </div>
  )
}
```

---

### COMPONENTE: `LayerTypeIcon`

Ícone pequeno que representa visualmente o tipo de cada layer:

```tsx
// LayerTypeIcon.tsx
export function LayerTypeIcon({ type }: { type: ElementType }) {
  const iconProps = { size: 12, className: 'text-gray-400 shrink-0' }

  switch (type) {
    case 'text-header':
    case 'text-subheader':
    case 'text-body':
    case 'text-template':
      return <Type {...iconProps} />

    case 'placeholder-logo':
    case 'placeholder-background':
    case 'placeholder-jellybean':
    case 'placeholder-media':
      return <Image {...iconProps} />

    case 'placeholder-audio':
      return <Music {...iconProps} />

    case 'shape':
      return <Pentagon {...iconProps} />

    case 'icon':
      return <Smile {...iconProps} />

    case 'line':
      return <Minus {...iconProps} />

    default:
      return <Square {...iconProps} />
  }
}
```

---

### COMPONENTE: `EmptyLayersState`

Estado vazio quando o canvas não tem elementos:

```tsx
// EmptyLayersState.tsx
export function EmptyLayersState() {
  return (
    <div className="flex flex-col items-center justify-center h-32 px-6 text-center">
      <Layers size={24} className="text-gray-200 mb-2" />
      <p className="text-xs text-gray-400">
        No layers yet. Add elements via the Insert menu.
      </p>
    </div>
  )
}
```

---

### SINCRONIZAÇÃO — Como a reordenação afeta o canvas

O `CanvasFrame` já renderiza `canvasElements` na ordem do array. Ao chamar `reorderElement`, o Zustand atualiza o array e o React re-renderiza o canvas com a nova ordem automaticamente. Não há lógica adicional necessária — a reatividade do store garante a sincronização:

```
Usuário draga "Text" para baixo de "Jellybean" no LayersPanel
        ↓
onReorder(fromDisplayIndex=0, toDisplayIndex=1) é chamado
        ↓
Índices reais calculados (invertidos): fromReal=1, toReal=0
        ↓
reorderElement(1, 0) no store:
  array antes:  [jellybean (idx 0), text (idx 1)]
  array depois: [text (idx 0), jellybean (idx 1)]
        ↓
CanvasFrame re-renderiza:
  text renderizado primeiro (z-index 0) → atrás
  jellybean renderizado depois (z-index 1) → na frente
        ↓
LayersPanel re-renderiza com a nova ordem invertida para display:
  jellybean aparece primeiro na lista (topo)
  text aparece segundo na lista (baixo)
```

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Layer selecionada — fundo | `#5B4EFF10` (roxo 6% opacidade) |
| Layer selecionada — borda esquerda | `2px solid #5B4EFF` |
| Layer hover — fundo | `bg-gray-50` |
| Layer row height | `py-2` ≈ `36px` |
| Drag handle icon | `GripVertical` — `lucide-react` |
| Ícone de tipo | `12px` — `lucide-react` |
| Nome truncado | `truncate` — nunca quebra linha |
| Ordem de display | **Invertida** em relação ao array (topo do canvas = topo da lista) |
| Fonte de verdade | `canvasElements` — array único para layers e canvas |