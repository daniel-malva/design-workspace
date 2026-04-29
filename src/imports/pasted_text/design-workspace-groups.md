Prompt direto e focado nos dois problemas:

---

## 🧱 PROMPT V39 — Design Workspace — Grupos visíveis no canvas + Layers com indentação hierárquica

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

### PROBLEMA 1 — Elementos somem ao agrupar

#### CAUSA

A função `groupElements` no store remove os elementos individuais do array `canvasElements` e os substitui por um único elemento do tipo `'group'`. O `CanvasElementView` não sabe renderizar `type: 'group'` — e mesmo que soubesse, os filhos não estão sendo renderizados.

#### SOLUÇÃO — Grupos não removem elementos, apenas os marcam

Em vez de remover os elementos filhos do array, a estratégia correta é:
- Manter **todos os elementos** em `canvasElements`
- Adicionar um campo `groupId` a cada elemento que pertence a um grupo
- Criar um elemento separado `type: 'group'` que representa o container
- O canvas renderiza os filhos normalmente — o grupo apenas adiciona o bounding box visual

```tsx
// types/canvas.ts

interface CanvasElement {
  id: string
  type: ElementType
  x: number; y: number
  width: number; height: number
  groupId?: string        // ← se definido, este elemento pertence a um grupo
  groupedIds?: string[]   // ← apenas para type === 'group': IDs dos filhos
  // ...outros campos existentes
}
```

```tsx
// store — groupElements corrigido
groupElements: (ids: string[]) => {
  const elements = get().canvasElements.filter(el => ids.includes(el.id))
  if (elements.length < 2) return

  const minX = Math.min(...elements.map(el => el.x))
  const minY = Math.min(...elements.map(el => el.y))
  const maxX = Math.max(...elements.map(el => el.x + el.width))
  const maxY = Math.max(...elements.map(el => el.y + el.height))

  const groupId = crypto.randomUUID()

  set(state => ({
    canvasElements: [
      // ✅ Mantém todos os elementos existentes — apenas adiciona groupId
      ...state.canvasElements.map(el =>
        ids.includes(el.id)
          ? { ...el, groupId }      // marca cada filho com o groupId
          : el
      ),
      // ✅ Adiciona o elemento de grupo (apenas container visual)
      {
        id: groupId,
        type: 'group' as ElementType,
        x: minX, y: minY,
        width: maxX - minX,
        height: maxY - minY,
        groupedIds: ids,            // referência aos filhos
      },
    ],
    selectedElementIds: [groupId],
    selectedElementType: 'group',
  }))
},
```

---

#### `CanvasElementView` — renderizar grupos corretamente

O elemento `type: 'group'` é renderizado como um container **transparente** — apenas o bounding box visual, sem background. Os filhos são renderizados normalmente pelo `CanvasFrame` porque continuam no array `canvasElements`:

```tsx
// CanvasElementView.tsx
export function CanvasElementView({ element, zIndex, isSelected, isMultiSelected }: Props) {
  // Elementos filhos de um grupo renderizam normalmente
  // Elementos do tipo 'group' renderizam apenas o container visual
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        zIndex,
      }}
    >
      {element.type === 'group' ? (
        // Container do grupo — transparente, apenas para seleção visual
        <div className="w-full h-full" />
      ) : (
        // Elemento normal
        <ElementContent element={element} />
      )}

      {/* Bounding box de seleção */}
      {isSelected && !isMultiSelected && (
        <SelectionOverlay elementId={element.id} />
      )}
    </div>
  )
}
```

---

#### Ordem de renderização — filhos acima do grupo

O elemento `type: 'group'` deve ser renderizado **abaixo** dos seus filhos para que o bounding box do grupo não cubra o conteúdo. Ordenar o array de renderização colocando os grupos antes dos seus filhos:

```tsx
// CanvasFrame.tsx — ordenar para renderização correta
const orderedElements = useMemo(() => {
  // Grupos primeiro (z-index menor), filhos depois (z-index maior)
  const groups   = canvasElements.filter(el => el.type === 'group')
  const children = canvasElements.filter(el => el.type !== 'group')
  return [...groups, ...children]
}, [canvasElements])
```

---

### PROBLEMA 2 — Layers sem hierarquia de grupo

#### SOLUÇÃO — `LayersPanel` com estrutura hierárquica e indentação

```tsx
// LayersPanel.tsx
export function LayersPanel() {
  const { canvasElements, selectedElementIds, selectElement } = useDesignWorkspaceStore()

  // Construir árvore hierárquica: grupos com seus filhos aninhados
  const layerTree = useMemo(() => buildLayerTree(canvasElements), [canvasElements])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 shrink-0 flex items-center justify-between">
        <span className="text-xs text-gray-400">{canvasElements.length} layers</span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {layerTree.length === 0 ? (
          <EmptyLayersState />
        ) : (
          layerTree.map(node => (
            <LayerNode
              key={node.element.id}
              node={node}
              depth={0}
              selectedIds={selectedElementIds}
              onSelect={selectElement}
            />
          ))
        )}
      </div>
    </div>
  )
}
```

---

#### `buildLayerTree` — constrói a árvore de layers

```tsx
// utils/buildLayerTree.ts
interface LayerNode {
  element: CanvasElement
  children: LayerNode[]
}

export function buildLayerTree(elements: CanvasElement[]): LayerNode[] {
  // Invertemos para que o topo do canvas apareça primeiro na lista
  const reversed = [...elements].reverse()

  // Grupos com seus filhos
  const groups = reversed.filter(el => el.type === 'group')
  const standalone = reversed.filter(el => el.type !== 'group' && !el.groupId)

  const groupNodes: LayerNode[] = groups.map(group => ({
    element: group,
    children: reversed
      .filter(el => el.groupId === group.id)
      .map(child => ({ element: child, children: [] })),
  }))

  const standaloneNodes: LayerNode[] = standalone.map(el => ({
    element: el,
    children: [],
  }))

  // Grupos primeiro, depois elementos soltos
  return [...groupNodes, ...standaloneNodes]
}
```

---

#### `LayerNode` — renderiza cada nó com indentação

```tsx
// LayerNode.tsx
export function LayerNode({
  node,
  depth,
  selectedIds,
  onSelect,
}: {
  node: LayerNode
  depth: number
  selectedIds: string[]
  onSelect: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const isSelected = selectedIds.includes(node.element.id)
  const hasChildren = node.children.length > 0

  return (
    <div className="w-full">
      {/* Linha da layer */}
      <div
        className={`
          flex items-center gap-1 py-2 cursor-pointer select-none
          border-l-2 transition-colors
          ${isSelected
            ? 'bg-[#5B4EFF10] border-l-[#5B4EFF]'
            : 'border-l-transparent hover:bg-gray-50'
          }
        `}
        // Indentação proporcional à profundidade
        style={{ paddingLeft: `${16 + depth * 16}px`, paddingRight: '16px' }}
        onClick={() => onSelect(node.element.id)}
      >
        {/* Botão de expandir/colapsar — apenas para grupos */}
        {hasChildren ? (
          <button
            className="w-4 h-4 flex items-center justify-center shrink-0 text-gray-400 hover:text-gray-700"
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
          >
            {expanded
              ? <ChevronDown size={12} />
              : <ChevronRight size={12} />
            }
          </button>
        ) : (
          // Espaço reservado para alinhar com itens que têm chevron
          <div className="w-4 shrink-0" />
        )}

        {/* Ícone do tipo */}
        <LayerTypeIcon type={node.element.type} />

        {/* Nome */}
        <span className="flex-1 min-w-0 text-xs text-gray-700 truncate ml-1">
          {node.element.type === 'group'
            ? `Group (${node.children.length})`
            : elementTypeLabel[node.element.type]
          }
        </span>

        {/* Indicador de seleção */}
        {isSelected && (
          <div className="w-1.5 h-1.5 rounded-full bg-[#5B4EFF] shrink-0" />
        )}
      </div>

      {/* Filhos — renderizados com depth + 1 */}
      {hasChildren && expanded && (
        <div className="w-full">
          {node.children.map(child => (
            <LayerNode
              key={child.element.id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### DIAGRAMA — Layers com hierarquia

**Canvas com 3 elementos, dois agrupados:**

```
Elementos no canvasElements:
  [textA, placeholderB, shapeC(groupId: g1), textD(groupId: g1), group-g1]

LayerTree resultante:
  Group (2)          ← depth 0, expandível
    ShapeC           ← depth 1, indentado
    TextD            ← depth 1, indentado
  TextA              ← depth 0, elemento solto
  PlaceholderB       ← depth 0, elemento solto
```

**Visualmente no LayersPanel:**

```
┌─────────────────────────────────────────┐
│  5 layers                               │
├─────────────────────────────────────────┤
│  ▾  □  Group (2)                    ●  │  ← selecionado
│      ◑  ShapeC                         │  ← indentado 16px
│      T  TextD                          │  ← indentado 16px
│     T  TextA                           │  ← sem indentação
│     ◑  PlaceholderB                    │
└─────────────────────────────────────────┘
```

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Indentação base | `16px` |
| Indentação por nível | `+16px` por `depth` |
| Chevron expandido | `ChevronDown` size 12 |
| Chevron colapsado | `ChevronRight` size 12 |
| Layer selecionada | `bg-[#5B4EFF10]` + `border-l-[#5B4EFF]` |
| Layer hover | `hover:bg-gray-50` |
| Group label | `"Group (N)"` onde N = número de filhos |
| Grupo no canvas | `type: 'group'` — container transparente, sem background |
| Filhos no canvas | permanecem em `canvasElements` com `groupId` preenchido |
| Filhos **não** removidos | `groupElements` apenas adiciona `groupId`, não remove |
| Render order | grupos renderizados antes dos filhos (z-index menor) |