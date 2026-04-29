Prompt direto e focado nessa funcionalidade:

---

## 🧱 PROMPT V33 — Design Workspace — Redimensionamento avançado + Atalhos de edição sincronizados com Layers e Timeline

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

### PARTE 1 — Redimensionamento avançado com modificadores

#### REGRA PRINCIPAL

Os 8 handles de resize do `SelectionOverlay` devem detectar teclas modificadoras durante o drag e aplicar o comportamento correspondente:

| Modificadores | Comportamento |
|---|---|
| Nenhum | Redimensiona livremente |
| `Shift` | Mantém proporção (aspect ratio) |
| `Alt/Option` | Redimensiona a partir do centro |
| `Shift + Alt` | Proporcional + a partir do centro |

---

### HOOK — `useResizeHandler`

Centraliza toda a lógica de resize em um único hook reutilizável:

```tsx
// hooks/useResizeHandler.ts
type ResizeHandle =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'

interface ResizeState {
  startMouseX: number
  startMouseY: number
  startX: number
  startY: number
  startW: number
  startH: number
  handle: ResizeHandle
  aspectRatio: number   // startW / startH
}

export function useResizeHandler(elementId: string) {
  const { updateElement, canvasElements } = useDesignWorkspaceStore()

  function startResize(e: React.MouseEvent, handle: ResizeHandle) {
    e.preventDefault()
    e.stopPropagation()

    const el = canvasElements.find(el => el.id === elementId)!
    const state: ResizeState = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: el.x,
      startY: el.y,
      startW: el.width,
      startH: el.height,
      handle,
      aspectRatio: el.width / el.height,
    }

    function onMouseMove(ev: MouseEvent) {
      const dx = ev.clientX - state.startMouseX
      const dy = ev.clientY - state.startMouseY
      const keepRatio  = ev.shiftKey
      const fromCenter = ev.altKey

      let { x, y, width, height } = computeResize({
        dx, dy, handle, keepRatio, fromCenter, state
      })

      // Garantir dimensões mínimas
      width  = Math.max(8, width)
      height = Math.max(8, height)

      updateElement(elementId, { x, y, width, height })
    }

    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return { startResize }
}
```

---

### FUNÇÃO — `computeResize`

Núcleo do cálculo de redimensionamento com suporte a todos os modificadores:

```tsx
// utils/computeResize.ts
interface ComputeResizeParams {
  dx: number
  dy: number
  handle: ResizeHandle
  keepRatio: boolean
  fromCenter: boolean
  state: ResizeState
}

export function computeResize({
  dx, dy, handle, keepRatio, fromCenter, state
}: ComputeResizeParams) {
  let { startX: x, startY: y, startW: width, startH: height, aspectRatio } = state

  // ── Calcular novo tamanho conforme handle ─────────────────────────────────
  switch (handle) {
    case 'top-left':
      width  = state.startW - dx
      height = state.startH - dy
      if (!fromCenter) { x = state.startX + dx; y = state.startY + dy }
      break
    case 'top-center':
      height = state.startH - dy
      if (!fromCenter) { y = state.startY + dy }
      break
    case 'top-right':
      width  = state.startW + dx
      height = state.startH - dy
      if (!fromCenter) { y = state.startY + dy }
      break
    case 'middle-left':
      width = state.startW - dx
      if (!fromCenter) { x = state.startX + dx }
      break
    case 'middle-right':
      width = state.startW + dx
      break
    case 'bottom-left':
      width  = state.startW - dx
      height = state.startH + dy
      if (!fromCenter) { x = state.startX + dx }
      break
    case 'bottom-center':
      height = state.startH + dy
      break
    case 'bottom-right':
      width  = state.startW + dx
      height = state.startH + dy
      break
  }

  // ── Shift: manter proporção ───────────────────────────────────────────────
  if (keepRatio) {
    const isHorizontalHandle = ['middle-left', 'middle-right'].includes(handle)
    const isVerticalHandle   = ['top-center', 'bottom-center'].includes(handle)

    if (isHorizontalHandle) {
      height = width / aspectRatio
    } else if (isVerticalHandle) {
      width = height * aspectRatio
    } else {
      // Cantos: usar a maior dimensão como referência
      if (Math.abs(dx) > Math.abs(dy)) {
        height = width / aspectRatio
      } else {
        width = height * aspectRatio
      }
    }
  }

  // ── Alt: redimensionar a partir do centro ─────────────────────────────────
  if (fromCenter) {
    const dw = width  - state.startW
    const dh = height - state.startH
    x = state.startX - dw / 2
    y = state.startY - dh / 2
    width  = state.startW + dw
    height = state.startH + dh
  }

  return { x, y, width, height }
}
```

---

### COMPONENTE — `SelectionOverlay` atualizado

Os handles usam `startResize` do hook com o cursor correto por handle:

```tsx
// SelectionOverlay.tsx
const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  'top-left':      'nwse-resize',
  'top-center':    'ns-resize',
  'top-right':     'nesw-resize',
  'middle-left':   'ew-resize',
  'middle-right':  'ew-resize',
  'bottom-left':   'nesw-resize',
  'bottom-center': 'ns-resize',
  'bottom-right':  'nwse-resize',
}

const HANDLE_POSITIONS: Record<ResizeHandle, React.CSSProperties> = {
  'top-left':      { top: -4,  left: -4  },
  'top-center':    { top: -4,  left: '50%', transform: 'translateX(-50%)' },
  'top-right':     { top: -4,  right: -4 },
  'middle-left':   { top: '50%', left: -4, transform: 'translateY(-50%)' },
  'middle-right':  { top: '50%', right: -4, transform: 'translateY(-50%)' },
  'bottom-left':   { bottom: -4, left: -4  },
  'bottom-center': { bottom: -4, left: '50%', transform: 'translateX(-50%)' },
  'bottom-right':  { bottom: -4, right: -4 },
}

export function SelectionOverlay({ elementId }: { elementId: string }) {
  const { startResize } = useResizeHandler(elementId)

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Bounding box */}
      <div className="absolute inset-0 border-2 border-[#5B4EFF] rounded-[1px]" />

      {/* 8 handles */}
      {(Object.keys(HANDLE_POSITIONS) as ResizeHandle[]).map(handle => (
        <div
          key={handle}
          className="absolute w-2 h-2 bg-white border-2 border-[#5B4EFF] rounded-[1px] pointer-events-auto z-10"
          style={{
            ...HANDLE_POSITIONS[handle],
            cursor: HANDLE_CURSORS[handle],
          }}
          onMouseDown={(e) => startResize(e, handle)}
        />
      ))}
    </div>
  )
}
```

---

### PARTE 2 — Atalhos de teclado de edição

#### HOOK — `useCanvasKeyboardShortcuts`

Montado uma vez no componente raiz. Todos os atalhos operam sobre `selectedElementId` e sincronizam com `canvasElements`, layers e timeline:

```tsx
// hooks/useCanvasKeyboardShortcuts.ts
export function useCanvasKeyboardShortcuts() {
  const {
    selectedElementId,
    canvasElements,
    insertElement,
    deleteElement,
    updateElement,
    setSelectedElementId,
    setSelectedElementType,
    groupElements,
  } = useDesignWorkspaceStore()

  // Clipboard local (session-only)
  const clipboardRef = useRef<CanvasElement | null>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignorar se foco estiver em input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) return

      const isMod = e.metaKey || e.ctrlKey

      // ── Cmd/Ctrl + C — Copiar ─────────────────────────────────────────────
      if (isMod && e.key === 'c' && selectedElementId) {
        e.preventDefault()
        const el = canvasElements.find(el => el.id === selectedElementId)
        if (el) clipboardRef.current = { ...el }
        return
      }

      // ── Cmd/Ctrl + X — Recortar ───────────────────────────────────────────
      if (isMod && e.key === 'x' && selectedElementId) {
        e.preventDefault()
        const el = canvasElements.find(el => el.id === selectedElementId)
        if (el) {
          clipboardRef.current = { ...el }
          deleteElement(selectedElementId)
          // Layer e timeline atualizam reativamente via store
        }
        return
      }

      // ── Cmd/Ctrl + V — Colar ──────────────────────────────────────────────
      if (isMod && e.key === 'v' && clipboardRef.current) {
        e.preventDefault()
        const src = clipboardRef.current
        // Offset de 16px para distinguir do original
        insertElement({
          ...src,
          x: src.x + 16,
          y: src.y + 16,
        })
        // insertElement já seleciona o novo elemento → RightPanel abre
        // → Layer adicionada reativamente → Timeline track adicionada
        return
      }

      // ── Cmd/Ctrl + D — Duplicar ───────────────────────────────────────────
      if (isMod && e.key === 'd' && selectedElementId) {
        e.preventDefault()
        const el = canvasElements.find(el => el.id === selectedElementId)
        if (el) {
          insertElement({
            ...el,
            x: el.x + 16,
            y: el.y + 16,
          })
        }
        return
      }

      // ── Cmd/Ctrl + G — Agrupar ────────────────────────────────────────────
      if (isMod && e.key === 'g') {
        e.preventDefault()
        if (selectedElementId) {
          groupElements([selectedElementId])
          // groupElements cria um novo elemento do tipo 'group'
          // que engloba os elementos selecionados
          // Layer do grupo adicionada reativamente
          // Timeline recebe nova track do grupo
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId, canvasElements, insertElement, deleteElement, groupElements])
}
```

---

### STORE — Adições necessárias

```tsx
// store/useDesignWorkspaceStore.ts

interface DesignWorkspaceState {
  // ...existentes...
  groups: ElementGroup[]   // grupos de elementos
}

interface ElementGroup {
  id: string
  elementIds: string[]   // IDs dos elementos agrupados
  x: number; y: number
  width: number; height: number
}

interface DesignWorkspaceActions {
  // ...existentes...
  groupElements: (ids: string[]) => void
  ungroupElements: (groupId: string) => void
}

// groupElements — cria um elemento 'group' que engloba os IDs fornecidos
groupElements: (ids) => {
  if (ids.length === 0) return

  const elements = get().canvasElements.filter(el => ids.includes(el.id))
  if (elements.length === 0) return

  // Bounding box do grupo
  const minX = Math.min(...elements.map(el => el.x))
  const minY = Math.min(...elements.map(el => el.y))
  const maxX = Math.max(...elements.map(el => el.x + el.width))
  const maxY = Math.max(...elements.map(el => el.y + el.height))

  const groupId = crypto.randomUUID()

  set(state => ({
    canvasElements: [
      // Remove elementos individuais
      ...state.canvasElements.filter(el => !ids.includes(el.id)),
      // Adiciona elemento de grupo
      {
        id: groupId,
        type: 'group' as ElementType,
        x: minX, y: minY,
        width: maxX - minX,
        height: maxY - minY,
        groupedIds: ids,
      }
    ],
    selectedElementId: groupId,
    selectedElementType: 'group',
  }))
},
```

---

### SINCRONIZAÇÃO — Layers e Timeline

Todas as operações abaixo são **automaticamente refletidas** em Layers e Timeline porque ambos leem diretamente do `canvasElements` no store. Não há lógica adicional necessária:

| Operação | `canvasElements` | Layers | Timeline |
|---|---|---|---|
| **Copiar** | inalterado | inalterado | inalterada |
| **Colar** | +1 elemento | +1 layer row | +1 track |
| **Recortar** | -1 elemento | -1 layer row | -1 track |
| **Duplicar** | +1 elemento | +1 layer row | +1 track |
| **Agrupar** | -N +1 grupo | layers agrupadas sob grupo | tracks agrupadas |
| **Deletar** | -1 elemento | -1 layer row | -1 track |
| **Resize** | update W/H/X/Y | layer row atualiza (W/H no RightPanel) | track inalterada |

```tsx
// LayersPanel — reativo, sem lógica adicional
const { canvasElements } = useDesignWorkspaceStore()
// Qualquer mudança em canvasElements → LayersPanel re-renderiza automaticamente

// Timeline — reativa, sem lógica adicional
const { canvasElements } = useDesignWorkspaceStore()
// Qualquer mudança em canvasElements → TimelineTracks re-renderiza automaticamente
```

---

### TABELA COMPLETA DE ATALHOS — Referência

| Atalho | Ação | Sincroniza |
|---|---|---|
| Arrastar handle | Resize livre | RightPanel (X/Y/W/H) |
| `Shift` + arrastar handle | Resize proporcional | RightPanel (X/Y/W/H) |
| `Alt` + arrastar handle | Resize a partir do centro | RightPanel (X/Y/W/H) |
| `Shift + Alt` + arrastar | Proporcional + do centro | RightPanel (X/Y/W/H) |
| `Cmd/Ctrl + C` | Copiar elemento selecionado | — |
| `Cmd/Ctrl + V` | Colar (+16px offset) | Layers + Timeline |
| `Cmd/Ctrl + X` | Recortar | Layers + Timeline |
| `Cmd/Ctrl + D` | Duplicar (+16px offset) | Layers + Timeline |
| `Cmd/Ctrl + G` | Agrupar selecionado | Layers + Timeline |
| `Delete / Backspace` | Deletar selecionado | Layers + Timeline |
| `Escape` | Desselecionar | RightPanel fecha |

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Handle size | `8px` × `8px` |
| Handle bg | `#FFFFFF` |
| Handle border | `2px solid #5B4EFF` |
| Handle border-radius | `1px` |
| Bounding box border | `2px solid #5B4EFF` |
| Dimensão mínima | `8px` em W e H |
| Offset de paste/duplicate | `+16px` em X e Y |
| Clipboard | `useRef` local — session only |
| Teclas ignoradas em | `input`, `textarea`, `contenteditable` |