Prompt direto e focado nos dois ajustes:

---

## 🧱 PROMPT V24 — Design Workspace — Permanecer no sub-painel após inserção + Smart Alignment Guides

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

### AJUSTE 1 — Permanecer no sub-painel após inserção

#### REGRA PRINCIPAL

Inserir um elemento via Insert Menu **não deve alterar o estado de navegação do LeftPane**. O `activeInsertItem` permanece inalterado após a inserção — o usuário continua no sub-painel onde estava, podendo inserir mais elementos da mesma categoria sem precisar navegar de volta.

#### O QUE MUDA

A ação `insertElement` no store **não deve tocar em `activePanel` nem em `activeInsertItem`**. Ela só manipula `canvasElements`, `selectedElementId` e `selectedElementType`:

```tsx
// store/useDesignWorkspaceStore.ts

// ✅ CORRETO — insertElement não altera navegação do LeftPane
insertElement: (element) => {
  const newId = crypto.randomUUID()
  set(state => ({
    canvasElements: [
      ...state.canvasElements,
      { ...element, id: newId }
    ],
    selectedElementId: newId,           // seleciona o novo elemento
    selectedElementType: element.type,  // abre o RightPanel correto
    // activePanel → NÃO TOCAR
    // activeInsertItem → NÃO TOCAR
  }))
},
```

```tsx
// ❌ ERRADO — resetar a navegação após inserção
insertElement: (element) => {
  set(() => ({
    // ...
    activeInsertItem: null,   // ← isso fecha o sub-painel, não deve acontecer
    activePanel: null,        // ← isso fecha o LeftPane, não deve acontecer
  }))
},
```

#### ÚNICO MOMENTO em que o sub-painel fecha

O sub-painel só fecha (volta ao nível 1 do Insert Menu) quando o usuário:
- Clica no botão **X** do header do sub-painel
- Pressiona **Escape** (já implementado no V23)
- Clica na **área cinza** do canvas (fecha ambos os painéis — já implementado no V20)

Nenhum outro evento deve fechar o sub-painel.

---

### AJUSTE 2 — Smart Alignment Guides no canvas

#### REGRA PRINCIPAL

Durante o drag de qualquer elemento no canvas, linhas de guia devem aparecer automaticamente quando o elemento em movimento se alinhar com:

- **Bordas** de outros elementos (esquerda, direita, topo, base)
- **Centros** de outros elementos (centro horizontal, centro vertical)
- **Bordas e centro do próprio CanvasFrame** (0px, 300px, 600px nos dois eixos)

As linhas desaparecem imediatamente ao soltar o elemento.

---

### MODELO DE DADOS — `AlignmentGuide`

```tsx
// types/canvas.ts
interface AlignmentGuide {
  orientation: 'horizontal' | 'vertical'
  position: number        // px dentro do CanvasFrame
  type: 'edge' | 'center' // borda ou centro
}
```

---

### LÓGICA — Cálculo das guias durante o drag

```tsx
// hooks/useAlignmentGuides.ts
const SNAP_THRESHOLD = 5  // px — distância máxima para snap ativar

export function useAlignmentGuides() {
  const { canvasElements } = useDesignWorkspaceStore()

  function computeGuides(
    draggingId: string,
    dragX: number,
    dragY: number,
    dragW: number,
    dragH: number
  ): { guides: AlignmentGuide[]; snappedX: number; snappedY: number } {
    const guides: AlignmentGuide[] = []
    let snappedX = dragX
    let snappedY = dragY

    // Pontos de referência do elemento em movimento
    const dragPoints = {
      left:   dragX,
      centerX: dragX + dragW / 2,
      right:  dragX + dragW,
      top:    dragY,
      centerY: dragY + dragH / 2,
      bottom: dragY + dragH,
    }

    // Fontes de alinhamento: outros elementos + bordas do frame
    const sources = [
      // Bordas e centro do CanvasFrame (600×600)
      { left: 0,   centerX: 300, right: 600, top: 0,   centerY: 300, bottom: 600 },
      // Outros elementos no canvas
      ...canvasElements
        .filter(el => el.id !== draggingId)
        .map(el => ({
          left:    el.x,
          centerX: el.x + el.width / 2,
          right:   el.x + el.width,
          top:     el.y,
          centerY: el.y + el.height / 2,
          bottom:  el.y + el.height,
        })),
    ]

    // ── Verificar alinhamentos verticais (linhas verticais) ───────────────
    for (const src of sources) {
      for (const [dragPoint, srcPoint, type] of [
        ['left',    src.left,    'edge'  ],
        ['centerX', src.centerX, 'center'],
        ['right',   src.right,   'edge'  ],
        ['right',   src.left,    'edge'  ],  // borda direita alinha com esquerda de outro
        ['left',    src.right,   'edge'  ],  // borda esquerda alinha com direita de outro
      ] as const) {
        const delta = dragPoints[dragPoint] - srcPoint
        if (Math.abs(delta) <= SNAP_THRESHOLD) {
          // Snap: ajustar X para alinhar perfeitamente
          if (dragPoint === 'left')    snappedX = srcPoint
          if (dragPoint === 'centerX') snappedX = srcPoint - dragW / 2
          if (dragPoint === 'right')   snappedX = srcPoint - dragW

          guides.push({
            orientation: 'vertical',
            position: srcPoint,
            type: type as 'edge' | 'center',
          })
        }
      }

      // ── Verificar alinhamentos horizontais (linhas horizontais) ──────────
      for (const [dragPoint, srcPoint, type] of [
        ['top',     src.top,     'edge'  ],
        ['centerY', src.centerY, 'center'],
        ['bottom',  src.bottom,  'edge'  ],
        ['bottom',  src.top,     'edge'  ],
        ['top',     src.bottom,  'edge'  ],
      ] as const) {
        const delta = dragPoints[dragPoint] - srcPoint
        if (Math.abs(delta) <= SNAP_THRESHOLD) {
          if (dragPoint === 'top')     snappedY = srcPoint
          if (dragPoint === 'centerY') snappedY = srcPoint - dragH / 2
          if (dragPoint === 'bottom')  snappedY = srcPoint - dragH

          guides.push({
            orientation: 'horizontal',
            position: srcPoint,
            type: type as 'edge' | 'center',
          })
        }
      }
    }

    // Deduplicar guias na mesma posição
    const seen = new Set<string>()
    const uniqueGuides = guides.filter(g => {
      const key = `${g.orientation}-${g.position}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return { guides: uniqueGuides, snappedX, snappedY }
  }

  return { computeGuides }
}
```

---

### COMPONENTE — `AlignmentGuidesOverlay`

Renderizado dentro do `CanvasFrame`, acima de todos os elementos mas abaixo do `SelectionOverlay`:

```tsx
// AlignmentGuidesOverlay.tsx
interface AlignmentGuidesOverlayProps {
  guides: AlignmentGuide[]
  canvasWidth: number   // 600
  canvasHeight: number  // 600
}

export function AlignmentGuidesOverlay({
  guides,
  canvasWidth,
  canvasHeight,
}: AlignmentGuidesOverlayProps) {
  if (guides.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {guides.map((guide, i) => (
        guide.orientation === 'vertical' ? (
          // Linha vertical — percorre toda a altura do canvas
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: guide.position,
              backgroundColor: guide.type === 'center' ? '#FF6B6B' : '#5B4EFF',
              opacity: 0.8,
            }}
          />
        ) : (
          // Linha horizontal — percorre toda a largura do canvas
          <div
            key={i}
            className="absolute left-0 right-0 h-px"
            style={{
              top: guide.position,
              backgroundColor: guide.type === 'center' ? '#FF6B6B' : '#5B4EFF',
              opacity: 0.8,
            }}
          />
        )
      ))}
    </div>
  )
}
```

> **Cores das guias:**
> - `#5B4EFF` (roxo) → alinhamento de **borda** entre elementos
> - `#FF6B6B` (vermelho/coral) → alinhamento de **centro** entre elementos

---

### INTEGRAÇÃO — `CanvasElementRenderer` com guias

O estado das guias ativas é local ao componente durante o drag, não vai ao store global:

```tsx
// CanvasElementRenderer.tsx
export function CanvasElementRenderer({ element, isSelected, onSelect, zIndex }: Props) {
  const { updateElement, canvasElements } = useDesignWorkspaceStore()
  const { computeGuides } = useAlignmentGuides()

  const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([])
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; elX: number; elY: number } | null>(null)

  function handleMouseDown(e: React.MouseEvent) {
    e.stopPropagation()
    onSelect()
    isDraggingRef.current = true
    dragStartRef.current = {
      mouseX: e.clientX, mouseY: e.clientY,
      elX: element.x,   elY: element.y,
    }

    function onMouseMove(ev: MouseEvent) {
      if (!dragStartRef.current) return

      const rawX = dragStartRef.current.elX + (ev.clientX - dragStartRef.current.mouseX)
      const rawY = dragStartRef.current.elY + (ev.clientY - dragStartRef.current.mouseY)

      // Calcular guias e posição com snap
      const { guides, snappedX, snappedY } = computeGuides(
        element.id,
        rawX, rawY,
        element.width, element.height
      )

      setActiveGuides(guides)
      updateElement(element.id, {
        x: Math.max(0, snappedX),
        y: Math.max(0, snappedY),
      })
    }

    function onMouseUp() {
      isDraggingRef.current = false
      setActiveGuides([])  // ← guias somem ao soltar
      dragStartRef.current = null
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <>
      <div
        className="absolute"
        style={{ left: element.x, top: element.y, width: element.width, height: element.height, zIndex }}
        onMouseDown={handleMouseDown}
      >
        <ElementContent element={element} />
        {isSelected && <SelectionOverlay element={element} onResize={...} />}
      </div>

      {/* Guias — renderizadas no CanvasFrame via portal ou passadas como prop */}
      {activeGuides.length > 0 && (
        <AlignmentGuidesPortal guides={activeGuides} />
      )}
    </>
  )
}
```

---

### ALTERNATIVA — Guias via estado no `CanvasFrame`

Para evitar problemas de z-index com o portal, a abordagem mais limpa é o `CanvasFrame` ser o dono do estado das guias:

```tsx
// CanvasFrame.tsx
export function CanvasFrame() {
  const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([])

  return (
    <div className="relative bg-white shadow-xl overflow-hidden" style={{ width: 600, height: 600 }}>

      {/* Elementos do canvas */}
      {canvasElements.map((element, index) => (
        <CanvasElementRenderer
          key={element.id}
          element={element}
          zIndex={index}
          isSelected={element.id === selectedElementId}
          onSelect={() => selectElement(element.id)}
          onDragGuides={setActiveGuides}    // ← callback para atualizar guias
          onDragEnd={() => setActiveGuides([])}  // ← limpa ao soltar
        />
      ))}

      {/* Overlay de guias — sempre no topo, pointer-events-none */}
      <AlignmentGuidesOverlay
        guides={activeGuides}
        canvasWidth={600}
        canvasHeight={600}
      />

    </div>
  )
}
```

---

### DIAGRAMA — Comportamento das guias

```
Elemento A em drag na posição X=120

Elemento B estático em X=120 (borda esquerda)
        ↓
delta = |120 - 120| = 0 ≤ SNAP_THRESHOLD (5px)
        ↓
Snap: elemento A snapa para X=120
Guia vertical renderizada em X=120 — cor #5B4EFF (borda)

Elemento B estático com centro em X=300
        ↓
Elemento A centrox = 120 + width/2 = 220 ≠ 300
Sem snap (delta > 5px) — sem guia
        ↓
Elemento A arrasta até centro X = 298
delta = |298 - 300| = 2 ≤ 5
Snap: elemento A centraliza em X=300 - width/2
Guia vertical em X=300 — cor #FF6B6B (centro)

Usuário solta o mouse
        ↓
activeGuides = [] — todas as guias somem
```

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Guia de borda | `#5B4EFF` — roxo |
| Guia de centro | `#FF6B6B` — coral |
| Guia opacidade | `0.8` |
| Guia espessura | `1px` |
| Snap threshold | `5px` |
| Guias z-index | `z-30` — acima dos elementos, abaixo do SelectionOverlay |
| `pointer-events` das guias | `none` — nunca bloqueiam interação |
| Guias aparecem quando | `isDragging === true` |
| Guias somem quando | `mouseup` — elemento solto |
| `activeInsertItem` após inserção | **inalterado** — permanece no sub-painel |
| Fecha sub-painel quando | X button, Escape, clique no fundo cinza |