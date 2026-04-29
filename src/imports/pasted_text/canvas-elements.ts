Prompt direto e focado nessa funcionalidade do canvas interativo:

---

## 🧱 PROMPT V17 — Design Workspace — Canvas vazio + Inserção e Manipulação de Elementos

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

### REGRA PRINCIPAL — Canvas começa vazio

O `CanvasFrame` (o square banner branco de 600×600px) deve ser inicializado **completamente vazio**, sem nenhum elemento pré-populado. Nenhum placeholder, nenhum texto, nenhuma shape. A área de trabalho é uma folha em branco.

```tsx
// store/useDesignWorkspaceStore.ts
const initialState = {
  canvasElements: [],          // array vazio — canvas começa limpo
  selectedElementId: null,
}
```

---

### MODELO DE DADOS — `CanvasElement`

Cada elemento inserido no canvas é representado por um objeto tipado:

```tsx
type ElementType =
  | 'text-header'
  | 'text-subheader'
  | 'text-body'
  | 'text-template'
  | 'placeholder-logo'
  | 'placeholder-background'
  | 'placeholder-jellybean'
  | 'placeholder-media'
  | 'placeholder-audio'
  | 'shape'
  | 'icon'
  | 'line'

interface CanvasElement {
  id: string               // uuid gerado no momento da inserção
  type: ElementType
  x: number                // posição X em px dentro do CanvasFrame
  y: number                // posição Y em px dentro do CanvasFrame
  width: number            // largura em px
  height: number           // altura em px
  content?: string         // texto, para elementos de texto
  shapeVariant?: string    // qual shape (star, heart, circle, etc.)
  iconSrc?: string         // URL do ícone, para elementos de ícone
  placeholderVariant?: 'logo' | 'background' | 'jellybean' | 'media' | 'audio'
  lineVariant?: 'solid' | 'dashed' | 'dotted' | 'arrow'
  style?: ElementStyle     // cor, font-size, font-weight, etc.
}

interface ElementStyle {
  color?: string
  backgroundColor?: string
  fontSize?: number
  fontWeight?: string
  fontFamily?: string
  borderColor?: string
  opacity?: number
}
```

---

### STORE — Ações de Canvas

```tsx
// store/useDesignWorkspaceStore.ts
interface DesignWorkspaceActions {
  insertElement: (element: Omit<CanvasElement, 'id'>) => void
  updateElement: (id: string, updates: Partial<CanvasElement>) => void
  deleteElement: (id: string) => void
  selectElement: (id: string | null) => void
}

// insertElement — gera um uuid e adiciona ao array
insertElement: (element) => set(state => ({
  canvasElements: [
    ...state.canvasElements,
    { ...element, id: crypto.randomUUID() }
  ]
}))

// deleteElement — remove pelo id
deleteElement: (id) => set(state => ({
  canvasElements: state.canvasElements.filter(el => el.id !== id),
  selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
}))

// updateElement — atualiza posição, tamanho ou estilo
updateElement: (id, updates) => set(state => ({
  canvasElements: state.canvasElements.map(el =>
    el.id === id ? { ...el, ...updates } : el
  )
}))
```

---

### INSERÇÃO A PARTIR DO INSERT MENU

Cada item clicável do `InsertPanel` chama `insertElement` com os valores padrão corretos para aquele tipo:

```tsx
// Posição inicial: centro do CanvasFrame (600×600)
const DEFAULT_X = 300
const DEFAULT_Y = 300

// Text — Create header
onClick={() => insertElement({
  type: 'text-header',
  x: DEFAULT_X - 100, y: DEFAULT_Y - 20,
  width: 200, height: 40,
  content: 'Create header',
  style: { fontSize: 32, fontWeight: '700', color: '#111111' }
})}

// Text — Create sub header
onClick={() => insertElement({
  type: 'text-subheader',
  x: DEFAULT_X - 80, y: DEFAULT_Y - 12,
  width: 160, height: 28,
  content: 'Create sub header',
  style: { fontSize: 18, fontWeight: '600', color: '#111111' }
})}

// Text — Create body text
onClick={() => insertElement({
  type: 'text-body',
  x: DEFAULT_X - 60, y: DEFAULT_Y - 10,
  width: 120, height: 20,
  content: 'Create body text',
  style: { fontSize: 14, fontWeight: '400', color: '#374151' }
})}

// Placeholder — Logo
onClick={() => insertElement({
  type: 'placeholder-logo',
  placeholderVariant: 'logo',
  x: DEFAULT_X - 75, y: DEFAULT_Y - 50,
  width: 150, height: 100,
})}

// Shape — Star (exemplo)
onClick={() => insertElement({
  type: 'shape',
  shapeVariant: 'star',
  x: DEFAULT_X - 40, y: DEFAULT_Y - 40,
  width: 80, height: 80,
  style: { color: '#6B7280' }
})}

// Icon — (exemplo)
onClick={() => insertElement({
  type: 'icon',
  iconSrc: icon.src,
  x: DEFAULT_X - 32, y: DEFAULT_Y - 32,
  width: 64, height: 64,
})}
```

Cada elemento é inserido **centralizado no canvas** por padrão. Múltiplos elementos inseridos em sequência devem ser levemente deslocados para evitar sobreposição exata (offset de +16px a cada inserção consecutiva).

---

### COMPONENTE: `CanvasFrame`

O frame branco renderiza todos os elementos do store e gerencia seleção e deleção:

```tsx
// CanvasFrame.tsx
export function CanvasFrame() {
  const { canvasElements, selectedElementId, selectElement, deleteElement } =
    useDesignWorkspaceStore()

  // Deletar elemento selecionado com tecla Delete ou Backspace
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        // Só deleta se o foco não estiver em um input de texto
        const tag = document.activeElement?.tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          deleteElement(selectedElementId)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId, deleteElement])

  return (
    <div
      className="relative bg-white shadow-xl overflow-hidden"
      style={{ width: 600, height: 600 }}
      // Clicar no fundo vazio desseleciona tudo
      onClick={() => selectElement(null)}
    >
      {canvasElements.map(element => (
        <CanvasElementRenderer
          key={element.id}
          element={element}
          isSelected={element.id === selectedElementId}
          onSelect={() => selectElement(element.id)}
        />
      ))}
    </div>
  )
}
```

---

### COMPONENTE: `CanvasElementRenderer`

Renderiza cada elemento no canvas com suporte a **seleção**, **drag para mover** e **handles de redimensionamento**:

```tsx
// CanvasElementRenderer.tsx
export function CanvasElementRenderer({ element, isSelected, onSelect }: Props) {
  const { updateElement } = useDesignWorkspaceStore()
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{ mouseX: number; mouseY: number; elX: number; elY: number } | null>(null)

  // ─── Drag para mover ──────────────────────────────────────────────────────
  function handleMouseDown(e: React.MouseEvent) {
    e.stopPropagation()
    onSelect()
    setIsDragging(true)
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, elX: element.x, elY: element.y }

    function onMouseMove(ev: MouseEvent) {
      if (!dragStart.current) return
      const dx = ev.clientX - dragStart.current.mouseX
      const dy = ev.clientY - dragStart.current.mouseY
      updateElement(element.id, {
        x: Math.max(0, dragStart.current.elX + dx),
        y: Math.max(0, dragStart.current.elY + dy),
      })
    }

    function onMouseUp() {
      setIsDragging(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div
      className={`absolute ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ left: element.x, top: element.y, width: element.width, height: element.height }}
      onMouseDown={handleMouseDown}
    >
      {/* Conteúdo visual do elemento */}
      <ElementContent element={element} />

      {/* Bounding box + handles de resize — só visíveis quando selecionado */}
      {isSelected && (
        <SelectionOverlay
          element={element}
          onResize={(updates) => updateElement(element.id, updates)}
        />
      )}
    </div>
  )
}
```

---

### COMPONENTE: `SelectionOverlay`

Exibe o bounding box e os 8 handles de redimensionamento quando o elemento está selecionado:

```tsx
// SelectionOverlay.tsx
// Bounding box — borda azul ao redor do elemento
<div className="absolute inset-0 border-2 border-[#5B4EFF] pointer-events-none rounded-[1px]" />

// 8 handles de resize — cantos e bordas
// Posições: top-left, top-center, top-right, middle-left,
//           middle-right, bottom-left, bottom-center, bottom-right
{resizeHandles.map(handle => (
  <ResizeHandle
    key={handle.position}
    position={handle.position}
    onResizeStart={(e) => handleResizeStart(e, handle.position)}
  />
))}

// ResizeHandle — pequeno quadrado branco com borda azul
<div
  className="absolute w-2 h-2 bg-white border-2 border-[#5B4EFF] rounded-[1px]"
  style={handle.style}  // posicionamento absoluto conforme handle.position
  onMouseDown={onResizeStart}
/>
```

---

### COMPONENTE: `ElementContent`

Renderiza o visual correto para cada tipo de elemento:

```tsx
// ElementContent.tsx
export function ElementContent({ element }: { element: CanvasElement }) {
  switch (element.type) {

    // ── Texto ───────────────────────────────────────────────────────────────
    case 'text-header':
    case 'text-subheader':
    case 'text-body':
    case 'text-template':
      return (
        <div
          className="w-full h-full flex items-start"
          style={{
            fontSize: element.style?.fontSize,
            fontWeight: element.style?.fontWeight,
            color: element.style?.color,
            fontFamily: element.style?.fontFamily,
          }}
        >
          {element.content}
        </div>
      )

    // ── Placeholders dinâmicos ───────────────────────────────────────────────
    case 'placeholder-logo':
    case 'placeholder-background':
    case 'placeholder-jellybean':
    case 'placeholder-media':
    case 'placeholder-audio':
      return <PlaceholderElement variant={element.placeholderVariant!} />

    // ── Shapes ──────────────────────────────────────────────────────────────
    case 'shape':
      return <ShapeElement variant={element.shapeVariant!} style={element.style} />

    // ── Ícones ──────────────────────────────────────────────────────────────
    case 'icon':
      return (
        <img
          src={element.iconSrc}
          alt="icon"
          className="w-full h-full object-contain"
          draggable={false}
        />
      )

    // ── Linhas ──────────────────────────────────────────────────────────────
    case 'line':
      return <LineElement variant={element.lineVariant!} />

    default:
      return null
  }
}
```

---

### COMPONENTE: `PlaceholderElement`

Representa visualmente os dynamic placeholders exatamente como aparecem no Figma — borda tracejada colorida + badge centralizado:

```tsx
// PlaceholderElement.tsx
const placeholderConfig = {
  logo:       { borderColor: '#7B2FFF', badgeColor: '#7B2FFF', label: 'Logo' },
  background: { borderColor: '#22C55E', badgeColor: '#22C55E', label: 'Background' },
  jellybean:  { borderColor: '#3B82F6', badgeColor: '#3B82F6', label: 'Jellybean' },
  media:      { borderColor: '#3B82F6', badgeColor: '#3B82F6', label: 'Media' },
  audio:      { borderColor: '#F97316', badgeColor: '#F97316', label: 'Audio' },
}

export function PlaceholderElement({ variant }: { variant: string }) {
  const config = placeholderConfig[variant]
  return (
    <div
      className="w-full h-full flex items-center justify-center rounded-lg"
      style={{ border: `2px dashed ${config.borderColor}`, backgroundColor: `${config.borderColor}10` }}
    >
      <span
        className="text-xs font-semibold text-white px-2 py-0.5 rounded-full"
        style={{ backgroundColor: config.badgeColor }}
      >
        {config.label}
      </span>
    </div>
  )
}
```

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Canvas frame background | `#FFFFFF` |
| Canvas frame size | `600 × 600px` |
| Canvas frame — initial elements | `[]` — vazio |
| Selection bounding box color | `#5B4EFF` |
| Selection handle size | `8px` |
| Selection handle bg | `#FFFFFF` |
| Delete key | `Delete` ou `Backspace` |
| Elemento inserido — posição padrão | centro do frame (300, 300) |
| Offset entre inserções consecutivas | `+16px` em X e Y |
| Placeholder border style | `2px dashed` |
| Placeholder Logo color | `#7B2FFF` |
| Placeholder Background color | `#22C55E` |
| Placeholder Jellybean/Media color | `#3B82F6` |
| Placeholder Audio color | `#F97316` |