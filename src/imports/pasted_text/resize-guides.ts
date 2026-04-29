Prompt direto e focado nessa funcionalidade:

---

## 🧱 PROMPT V45 — Design Workspace — Resize Guides + Snap para dimensões de elementos próximos

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

Durante o **resize** (não o drag de posição), exibir:

1. **Guides de dimensão** — linhas horizontais e verticais indicando quando a largura ou altura do elemento em resize coincide com a largura ou altura de qualquer outro elemento no canvas
2. **Snap de dimensão** — quando W ou H do elemento em resize chega a ±`SNAP_THRESHOLD`px de W ou H de outro elemento, o resize snapa para esse valor exato

---

### TIPOS — `ResizeGuide`

```tsx
// types/canvas.ts

interface ResizeGuide {
  orientation: 'horizontal' | 'vertical'
  // Posição da linha no canvas (px)
  position: number
  // Tipo de match
  matchType: 'width' | 'height'
  // Valor que foi matchado (para exibir o label)
  matchValue: number
  // Nome do elemento que serviu de referência
  sourceName: string
}
```

---

### HOOK — `useResizeGuides`

Calcula guides e snap durante o resize, baseado nas dimensões dos outros elementos:

```tsx
// hooks/useResizeGuides.ts

const SNAP_THRESHOLD = 6    // px — distância para ativar snap
const CANVAS_WIDTH   = 600
const CANVAS_HEIGHT  = 600

export function useResizeGuides() {
  const { canvasElements } = useDesignWorkspaceStore()

  function computeResizeGuides(
    resizingId: string,
    currentW: number,
    currentH: number,
    currentX: number,
    currentY: number,
    handle: ResizeHandle
  ): {
    guides: ResizeGuide[]
    snappedW: number
    snappedH: number
  } {
    const guides: ResizeGuide[] = []
    let snappedW = currentW
    let snappedH = currentH

    // Fontes de snap: outros elementos + dimensões do canvas
    const sources = [
      // Dimensões do canvas como referência
      { id: 'canvas-w', name: 'Canvas', width: CANVAS_WIDTH,  height: CANVAS_HEIGHT },
      // Outros elementos
      ...canvasElements
        .filter(el => el.id !== resizingId && el.type !== 'group')
        .map(el => ({
          id:     el.id,
          name:   el.name,
          width:  el.width,
          height: el.height,
        })),
    ]

    // Deduplicar por valor de largura e altura
    const seenWidths  = new Set<number>()
    const seenHeights = new Set<number>()

    for (const src of sources) {
      // ── Snap de LARGURA ───────────────────────────────────────────────
      if (!seenWidths.has(src.width)) {
        const deltaW = Math.abs(currentW - src.width)

        if (deltaW <= SNAP_THRESHOLD) {
          seenWidths.add(src.width)
          snappedW = src.width

          // Linha vertical mostrando onde está a borda direita (ou esquerda)
          // do elemento com essa largura
          const guideX = isLeftHandle(handle)
            ? currentX + currentW - src.width   // borda esquerda ajustada
            : currentX + src.width              // borda direita

          guides.push({
            orientation: 'vertical',
            position:    guideX,
            matchType:   'width',
            matchValue:  src.width,
            sourceName:  src.name,
          })
        }
      }

      // ── Snap de ALTURA ────────────────────────────────────────────────
      if (!seenHeights.has(src.height)) {
        const deltaH = Math.abs(currentH - src.height)

        if (deltaH <= SNAP_THRESHOLD) {
          seenHeights.add(src.height)
          snappedH = src.height

          // Linha horizontal mostrando onde está a borda inferior (ou superior)
          const guideY = isTopHandle(handle)
            ? currentY + currentH - src.height  // borda superior ajustada
            : currentY + src.height             // borda inferior

          guides.push({
            orientation: 'horizontal',
            position:    guideY,
            matchType:   'height',
            matchValue:  src.height,
            sourceName:  src.name,
          })
        }
      }
    }

    return { guides, snappedW, snappedH }
  }

  return { computeResizeGuides }
}

// Helpers para identificar tipo de handle
function isLeftHandle(handle: ResizeHandle): boolean {
  return ['top-left', 'middle-left', 'bottom-left'].includes(handle)
}
function isTopHandle(handle: ResizeHandle): boolean {
  return ['top-left', 'top-center', 'top-right'].includes(handle)
}
```

---

### INTEGRAÇÃO — `useResizeHandler` com guides

O hook de resize existente passa a chamar `computeResizeGuides` a cada `mousemove` e expõe as guides via callback:

```tsx
// hooks/useResizeHandler.ts

export function useResizeHandler(
  elementId: string,
  onGuidesChange?: (guides: ResizeGuide[]) => void  // ← callback para o CanvasFrame
) {
  const { updateElement, canvasElements } = useDesignWorkspaceStore()
  const { computeResizeGuides } = useResizeGuides()

  function startResize(e: React.MouseEvent, handle: ResizeHandle) {
    e.preventDefault()
    e.stopPropagation()

    const el = canvasElements.find(el => el.id === elementId)!
    const state: ResizeState = {
      startMouseX: e.clientX, startMouseY: e.clientY,
      startX: el.x, startY: el.y,
      startW: el.width, startH: el.height,
      handle,
      aspectRatio: el.width / el.height,
    }

    function onMouseMove(ev: MouseEvent) {
      const dx = ev.clientX - state.startMouseX
      const dy = ev.clientY - state.startMouseY

      // Calcular novo tamanho via computeResize existente
      let { x, y, width, height } = computeResize({
        dx, dy, handle,
        keepRatio:  ev.shiftKey,
        fromCenter: ev.altKey,
        state,
      })

      width  = Math.max(8, width)
      height = Math.max(8, height)

      // ── Calcular guides e snap de dimensão ──────────────────────────
      const { guides, snappedW, snappedH } = computeResizeGuides(
        elementId, width, height, x, y, handle
      )

      // Aplicar snap — ajustar posição se handle é esquerdo/superior
      if (snappedW !== width) {
        if (isLeftHandle(handle)) x = x + (width - snappedW)
        width = snappedW
      }
      if (snappedH !== height) {
        if (isTopHandle(handle)) y = y + (height - snappedH)
        height = snappedH
      }

      onGuidesChange?.(guides)
      updateElement(elementId, { x, y, width, height })
    }

    function onMouseUp() {
      onGuidesChange?.([])  // ← limpa guides ao soltar
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

### COMPONENTE — `ResizeGuidesOverlay`

Renderizado no `CanvasFrame`, sobreposto acima dos elementos e abaixo do `InteractionOverlay`:

```tsx
// ResizeGuidesOverlay.tsx
export function ResizeGuidesOverlay({
  guides,
  canvasWidth,
  canvasHeight,
}: {
  guides: ResizeGuide[]
  canvasWidth:  number
  canvasHeight: number
}) {
  if (guides.length === 0) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 45 }}
    >
      {guides.map((guide, i) => (
        <React.Fragment key={i}>
          {guide.orientation === 'vertical' ? (
            // Linha vertical — percorre toda a altura do canvas
            <>
              <div
                className="absolute top-0 bottom-0"
                style={{
                  left:            guide.position,
                  width:           1,
                  backgroundColor: '#FF6B6B',
                  opacity:         0.9,
                }}
              />
              {/* Label com o valor */}
              <ResizeGuideLabel
                value={guide.matchValue}
                sourceName={guide.sourceName}
                orientation="vertical"
                position={guide.position}
                canvasHeight={canvasHeight}
              />
            </>
          ) : (
            // Linha horizontal — percorre toda a largura do canvas
            <>
              <div
                className="absolute left-0 right-0"
                style={{
                  top:             guide.position,
                  height:          1,
                  backgroundColor: '#FF6B6B',
                  opacity:         0.9,
                }}
              />
              <ResizeGuideLabel
                value={guide.matchValue}
                sourceName={guide.sourceName}
                orientation="horizontal"
                position={guide.position}
                canvasWidth={canvasWidth}
              />
            </>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
```

---

### COMPONENTE — `ResizeGuideLabel`

Label flutuante mostrando o valor snappado e o nome do elemento de referência:

```tsx
// ResizeGuideLabel.tsx
export function ResizeGuideLabel({
  value,
  sourceName,
  orientation,
  position,
  canvasWidth,
  canvasHeight,
}: ResizeGuideLabelProps) {

  const isVertical = orientation === 'vertical'

  return (
    <div
      className="absolute pointer-events-none"
      style={
        isVertical
          ? {
              left:      position + 4,
              top:       8,
              transform: 'none',
            }
          : {
              top:       position - 18,
              left:      8,
              transform: 'none',
            }
      }
    >
      <span
        className="text-[10px] font-medium text-white bg-[#FF6B6B] px-1.5 py-0.5 rounded-[3px] whitespace-nowrap"
        style={{ fontFamily: "'Roboto', sans-serif" }}
      >
        {isVertical ? `W: ${Math.round(value)}` : `H: ${Math.round(value)}`}
        {sourceName !== 'Canvas' && (
          <span className="opacity-70 ml-1">({sourceName})</span>
        )}
      </span>
    </div>
  )
}
```

---

### INTEGRAÇÃO — `CanvasFrame` conecta guides ao `SelectionOverlay`

O `CanvasFrame` mantém o estado das resize guides e as passa para o `ResizeGuidesOverlay`:

```tsx
// CanvasFrame.tsx
export function CanvasFrame() {
  const [resizeGuides, setResizeGuides] = useState<ResizeGuide[]>([])
  // ...estado existente...

  return (
    <div
      ref={frameRef}
      className="relative bg-white shadow-xl select-none"
      style={{ width: 600, height: 600, overflow: 'visible' }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Camada 1: Elementos */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 1 }}>
        {orderedElements.map((element, index) => (
          <CanvasElementView key={element.id} element={element} zIndex={index} ... />
        ))}
      </div>

      {/* Camada 2: Selection overlays com handles */}
      <div className="absolute inset-0" style={{ zIndex: 2, overflow: 'visible', pointerEvents: 'none' }}>
        {selectedElementIds.length === 1 && (
          <SelectionOverlay
            elementId={selectedElementIds[0]}
            onResizeGuidesChange={setResizeGuides}  // ← recebe guides do resize
          />
        )}
        {selectedElementIds.length > 1 && (
          <MultiSelectionBoundingBox selectedIds={selectedElementIds} />
        )}
      </div>

      {/* Camada 3: Resize guides — visíveis durante resize */}
      <ResizeGuidesOverlay
        guides={resizeGuides}
        canvasWidth={600}
        canvasHeight={600}
      />

      {/* Camada 4: Alignment guides — visíveis durante drag (já existente do V24) */}
      <AlignmentGuidesOverlay guides={alignmentGuides} canvasWidth={600} canvasHeight={600} />

      {/* Camada 5: Out-of-bounds overlay */}
      <CanvasOutOfBoundsOverlay canvasWidth={600} canvasHeight={600} />

      {/* Camada 6: Marquee visual */}
      {marquee && <MarqueeVisual marquee={marquee} />}

      {/* Camada 7: InteractionOverlay — captura todos os eventos */}
      <InteractionOverlay frameRef={frameRef} onMarqueeChange={setMarquee} />
    </div>
  )
}
```

---

### `SelectionOverlay` — passa `onResizeGuidesChange` para o hook

```tsx
// SelectionOverlay.tsx
export function SelectionOverlay({
  elementId,
  onResizeGuidesChange,
}: {
  elementId: string
  onResizeGuidesChange?: (guides: ResizeGuide[]) => void
}) {
  const { startResize } = useResizeHandler(elementId, onResizeGuidesChange)
  // ...resto igual...
}
```

---

### DIFERENÇA VISUAL — Resize guides vs. Alignment guides

| Tipo | Quando aparece | Cor | Label |
|---|---|---|---|
| **Alignment guides** (V24) | Durante **drag** de posição | `#5B4EFF` (roxo) — bordas / `#FF6B6B` (coral) — centros | sem label |
| **Resize guides** (V45) | Durante **resize** de dimensão | `#FF6B6B` (coral) | `W: 120 (TextA)` ou `H: 80` |

---

### DIAGRAMA — Resize guide em ação

```
Canvas com TextA (W:200, H:48) e ShapeB sendo redimensionado:

ShapeB.width = 197px → delta = |197 - 200| = 3 ≤ SNAP_THRESHOLD(6)
  → snappedW = 200
  → guide vertical em x = shapeB.x + 200

┌────────────────────────────────────────────┐
│                                            │
│  ┌────────────────────────┐                │
│  │  TextA (W:200)         │                │
│  └────────────────────────┘                │
│                             |              │ ← guide vertical
│  ┌────────────────────────-┐  W:200 (TextA)│
│  │  ShapeB (snap W→200)    │              │
│  └─────────────────────────┘              │
└────────────────────────────────────────────┘
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Redimensionar elemento → guides aparecem quando W ou H coincide com outro elemento
- [ ] Guide label mostra o valor e o nome do elemento de referência
- [ ] Snap ativa dentro de `SNAP_THRESHOLD` (6px) e ajusta o resize exatamente
- [ ] Guides somem ao soltar o handle
- [ ] Múltiplos snaps simultâneos (W e H) funcionam independentemente
- [ ] Canvas (600×600) também é fonte de snap
- [ ] Resize guides e alignment guides coexistem sem conflito visual
- [ ] Background placeholder com handles visíveis também tem guides e snap

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| `SNAP_THRESHOLD` | `6px` |
| Resize guide color | `#FF6B6B` (coral) |
| Resize guide width | `1px` |
| Resize guide opacity | `0.9` |
| Label background | `#FF6B6B` |
| Label text | `#FFFFFF` |
| Label font | Roboto Medium 10px |
| Label border-radius | `3px` |
| Label formato W | `W: {value} ({sourceName})` |
| Label formato H | `H: {value} ({sourceName})` |
| Canvas como fonte | sim — `W: 600` e `H: 600` |
| Guides z-index | `45` — acima dos elementos, abaixo do overlay |
| Guides pointer-events | `none` — nunca bloqueiam interação |