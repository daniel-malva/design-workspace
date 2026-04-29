Prompt direto e focado nessa funcionalidade:

---

## 🧱 PROMPT V40 — Design Workspace — Layers: renomear layers com duplo clique

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

### REGRA PRINCIPAL

Duplo clique no nome de qualquer layer no `LayersPanel` entra em modo de edição inline. O nome é editado diretamente no painel, sem modal ou popover. Confirma com `Enter` ou perda de foco (`onBlur`). Cancela com `Escape` — restaurando o nome original.

---

### STORE — Campo `name` em `CanvasElement`

```tsx
// types/canvas.ts
interface CanvasElement {
  // ...campos existentes...
  name: string   // ← nome editável da layer
}
```

```tsx
// store/useDesignWorkspaceStore.ts
interface DesignWorkspaceActions {
  // ...existentes...
  renameElement: (id: string, name: string) => void
}

renameElement: (id, name) => set(state => ({
  canvasElements: state.canvasElements.map(el =>
    el.id === id ? { ...el, name: name.trim() || defaultLayerName(el.type) } : el
  )
})),
```

```tsx
// utils/defaultLayerName.ts
// Nome padrão gerado automaticamente ao inserir um elemento
export function defaultLayerName(type: ElementType): string {
  const map: Record<ElementType, string> = {
    'text-header':            'Header',
    'text-subheader':         'Subheader',
    'text-body':              'Body text',
    'text-template':          'Text',
    'placeholder-logo':       'Logo',
    'placeholder-background': 'Background',
    'placeholder-jellybean':  'Jellybean',
    'placeholder-media':      'Media',
    'placeholder-audio':      'Audio',
    'shape':                  'Shape',
    'icon':                   'Icon',
    'line':                   'Line',
    'group':                  'Group',
  }
  return map[type] ?? 'Layer'
}
```

```tsx
// store — insertElement: gerar nome padrão automaticamente
insertElement: (element) => {
  const newId = crypto.randomUUID()
  const name = element.name ?? defaultLayerName(element.type)
  set(state => ({
    canvasElements: [...state.canvasElements, { ...element, id: newId, name }],
    selectedElementIds: [newId],
    selectedElementType: element.type,
  }))
},
```

---

### COMPONENTE — `LayerNode` com rename inline

```tsx
// LayerNode.tsx
export function LayerNode({ node, depth, selectedIds, onSelect }: LayerNodeProps) {
  const { renameElement } = useDesignWorkspaceStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(node.element.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const isSelected = selectedIds.includes(node.element.id)
  const hasChildren = node.children.length > 0
  const [expanded, setExpanded] = useState(true)

  // Focar o input ao entrar em modo de edição
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation()
    setEditValue(node.element.name) // resetar para o valor atual
    setIsEditing(true)
  }

  function handleConfirm() {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== node.element.name) {
      renameElement(node.element.id, trimmed)
    }
    setIsEditing(false)
  }

  function handleCancel() {
    setEditValue(node.element.name) // restaurar nome original
    setIsEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  return (
    <div className="w-full">
      <div
        className={`
          flex items-center gap-1 py-[5px] cursor-pointer select-none
          border-l-2 transition-colors group
          ${isSelected
            ? 'bg-[#5B4EFF10] border-l-[#5B4EFF]'
            : 'border-l-transparent hover:bg-gray-50'
          }
        `}
        style={{ paddingLeft: `${16 + depth * 16}px`, paddingRight: '12px' }}
        onClick={() => !isEditing && onSelect(node.element.id)}
      >
        {/* Chevron expandir/colapsar — apenas grupos */}
        {hasChildren ? (
          <button
            className="w-4 h-4 flex items-center justify-center shrink-0 text-gray-400 hover:text-gray-700"
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
          >
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
        ) : (
          <div className="w-4 shrink-0" />
        )}

        {/* Ícone do tipo */}
        <LayerTypeIcon type={node.element.type} />

        {/* Nome — texto ou input inline */}
        <div className="flex-1 min-w-0 ml-1">
          {isEditing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={handleConfirm}
              onKeyDown={handleKeyDown}
              onClick={e => e.stopPropagation()}
              className="
                w-full text-xs text-[#1f1d25] bg-white
                border border-[#5B4EFF] rounded-[3px]
                px-1 py-0.5 outline-none
                focus:ring-1 focus:ring-[#5B4EFF]
              "
              style={{ fontFamily: "'Roboto', sans-serif" }}
            />
          ) : (
            <span
              className="block text-xs text-gray-700 truncate"
              onDoubleClick={handleDoubleClick}
              title={`Double-click to rename "${node.element.name}"`}
            >
              {node.element.name}
            </span>
          )}
        </div>

        {/* Indicador de seleção */}
        {isSelected && !isEditing && (
          <div className="w-1.5 h-1.5 rounded-full bg-[#5B4EFF] shrink-0 ml-1" />
        )}
      </div>

      {/* Filhos do grupo */}
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

### COMPORTAMENTO COMPLETO

```
Usuário dá duplo clique no nome "Header" no LayersPanel
  → isEditing = true
  → input aparece com valor "Header" pré-selecionado
  → cursor posicionado no input

Usuário digita "Hero Title" e pressiona Enter
  → handleConfirm()
  → renameElement(id, "Hero Title")
  → canvasElements[n].name = "Hero Title"
  → isEditing = false
  → LayerNode exibe "Hero Title" ✓

Usuário dá duplo clique, começa a editar, pressiona Escape
  → handleCancel()
  → editValue restaurado para nome original
  → isEditing = false
  → nome não muda ✓

Usuário dá duplo clique, começa a editar, clica fora (onBlur)
  → handleConfirm() automaticamente
  → nome salvo com o valor atual do input ✓

Usuário apaga tudo e confirma com Enter (nome vazio)
  → trimmed = ""
  → fallback: defaultLayerName(type) → "Header"
  → nome não fica vazio ✓
```

---

### DIAGRAMA VISUAL — LayersPanel com rename ativo

**Estado normal:**
```
┌─────────────────────────────────────┐
│  ▾  □  Group (2)               ●   │
│      ◑  Jellybean                   │  ← duplo clique aqui
│      T  Hero Title                  │
│     T  Body text                    │
└─────────────────────────────────────┘
```

**Com rename ativo em "Jellybean":**
```
┌─────────────────────────────────────┐
│  ▾  □  Group (2)               ●   │
│      ◑  ┌───────────────────────┐  │
│         │ Jellybean█            │  │  ← input inline com borda roxa
│         └───────────────────────┘  │
│      T  Hero Title                  │
│     T  Body text                    │
└─────────────────────────────────────┘
```

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Trigger | Duplo clique no nome da layer |
| Input border | `1px solid #5B4EFF` |
| Input border-radius | `3px` |
| Input focus ring | `1px #5B4EFF` |
| Input font | Roboto Regular 12px |
| Input background | `#FFFFFF` |
| Confirmar | `Enter` ou `onBlur` |
| Cancelar | `Escape` — restaura nome original |
| Nome vazio | fallback para `defaultLayerName(type)` |
| Nome padrão ao inserir | gerado por `defaultLayerName(type)` automaticamente |
| Layer row height | `py-[5px]` + conteúdo ≈ `32px` |
| Indentação base | `16px` |
| Indentação por nível | `+16px` por `depth` |