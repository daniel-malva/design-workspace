Prompt direto e focado nessa correção:

---

## 🧱 PROMPT V46 — Design Workspace — Alignment guides restaurados para grupos + Resize guides em grupos

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

### DIAGNÓSTICO — Por que as guides sumiram em grupos

Dois problemas distintos:

**Problema A — Alignment guides durante drag do grupo:**
O `InteractionOverlay` gerencia o drag de todos os elementos. Quando o elemento arrastado é do tipo `'group'`, o `computeGuides` (V24) usa as coordenadas do grupo como referência — mas o grupo é um container virtual cujas coordenadas são recalculadas dinamicamente a partir dos filhos. Se o grupo não está sendo atualizado com `updateElement` durante o drag (só os filhos são), as guides não têm referência correta.

**Problema B — Resize guides durante resize do grupo:**
O `useResizeHandler` (V45) busca outros elementos para snap excluindo o `resizingId`. Quando o elemento selecionado é um grupo, os filhos do grupo (`groupId === resizingId`) continuam sendo usados como fontes de snap — criando snap contra os próprios filhos, o que é incorreto e às vezes suprime as guides.

---

### CORREÇÃO A — Alignment guides durante drag de grupo

#### `InteractionOverlay` — calcular bounding box do grupo para guides

Durante o drag de um grupo, as guides devem ser calculadas usando o **bounding box do grupo** (calculado a partir dos filhos), não as coordenadas do elemento `type: 'group'` que pode estar desatualizado:

```tsx
// hooks/useAlignmentGuides.ts — versão corrigida

export function useAlignmentGuides() {
  const { canvasElements } = useDesignWorkspaceStore()

  // Calcula o bounding box real de um elemento, considerando grupos
  function getEffectiveBounds(elementId: string): {
    x: number; y: number; width: number; height: number
  } {
    const el = canvasElements.find(e => e.id === elementId)
    if (!el) return { x: 0, y: 0, width: 0, height: 0 }

    if (el.type === 'group') {
      // Bounding box calculado a partir dos filhos
      const children = canvasElements.filter(e => e.groupId === el.id)
      if (children.length === 0) return { x: el.x, y: el.y, width: el.width, height: el.height }

      const minX = Math.min(...children.map(c => c.x))
      const minY = Math.min(...children.map(c => c.y))
      const maxX = Math.max(...children.map(c => c.x + c.width))
      const maxY = Math.max(...children.map(c => c.y + c.height))
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    }

    return { x: el.x, y: el.y, width: el.width, height: el.height }
  }

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

    const dragPoints = {
      left:    dragX,
      centerX: dragX + dragW / 2,
      right:   dragX + dragW,
      top:     dragY,
      centerY: dragY + dragH / 2,
      bottom:  dragY + dragH,
    }

    // Fontes: canvas frame + outros elementos (excluindo o arrastado e seus filhos)
    const draggingElement = canvasElements.find(e => e.id === draggingId)
    const isGroup = draggingElement?.type === 'group'

    const excludedIds = new Set<string>([draggingId])
    if (isGroup) {
      // Excluir filhos do grupo — não fazer snap contra os próprios filhos
      canvasElements
        .filter(e => e.groupId === draggingId)
        .forEach(c => excludedIds.add(c.id))
    }

    const sources = [
      // Canvas frame
      { left: 0, centerX: 300, right: 600, top: 0, centerY: 300, bottom: 600 },
      // Outros elementos (excluindo arrastado e filhos de grupo arrastado)
      ...canvasElements
        .filter(el => !excludedIds.has(el.id) && el.type !== 'group')
        .map(el => ({
          left:    el.x,
          centerX: el.x + el.width / 2,
          right:   el.x + el.width,
          top:     el.y,
          centerY: el.y + el.height / 2,
          bottom:  el.y + el.height,
        })),
    ]

    // ── Verificar alinhamentos verticais ─────────────────────────────────
    for (const src of sources) {
      const verticalPairs = [
        ['left',    src.left,    'edge'  ],
        ['centerX', src.centerX, 'center'],
        ['right',   src.right,   'edge'  ],
        ['right',   src.left,    'edge'  ],
        ['left',    src.right,   'edge'  ],
      ] as const

      for (const [dragPoint, srcPoint, type] of verticalPairs) {
        const delta = dragPoints[dragPoint] - srcPoint
        if (Math.abs(delta) <= SNAP_THRESHOLD) {
          if (dragPoint === 'left')    snappedX = srcPoint
          if (dragPoint === 'centerX') snappedX = srcPoint - dragW / 2
          if (dragPoint === 'right')   snappedX = srcPoint - dragW
          guides.push({ orientation: 'vertical', position: srcPoint, type })
        }
      }

      // ── Verificar alinhamentos horizontais ────────────────────────────
      const horizontalPairs = [
        ['top',     src.top,     'edge'  ],
        ['centerY', src.centerY, 'center'],
        ['bottom',  src.bottom,  'edge'  ],
        ['bottom',  src.top,     'edge'  ],
        ['top',     src.bottom,  'edge'  ],
      ] as const

      for (const [dragPoint, srcPoint, type] of horizontalPairs) {
        const delta = dragPoints[dragPoint] - srcPoint
        if (Math.abs(delta) <= SNAP_THRESHOLD) {
          if (dragPoint === 'top')     snappedY = srcPoint
          if (dragPoint === 'centerY') snappedY = srcPoint - dragH / 2
          if (dragPoint === 'bottom')  snappedY = srcPoint - dragH
          guides.push({ orientation: 'horizontal', position: srcPoint, type })
        }
      }
    }

    // Deduplicar
    const seen = new Set<string>()
    const uniqueGuides = guides.filter(g => {
      const key = `${g.orientation}-${g.position}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return { guides: uniqueGuides, snappedX, snappedY }
  }

  return { computeGuides, getEffectiveBounds }
}
```

---

#### `InteractionOverlay` — passar bounding box correto para grupos

```tsx
// InteractionOverlay.tsx — startElementDrag corrigido para grupos

function startElementDrag(
  e: React.MouseEvent,
  element: CanvasElement,
  rect: DOMRect
) {
  const startMouseX = e.clientX - rect.left
  const startMouseY = e.clientY - rect.top

  // Usar bounding box efetivo (considera filhos de grupos)
  const { getEffectiveBounds } = useAlignmentGuides()
  const bounds = getEffectiveBounds(element.id)

  const startElX = bounds.x
  const startElY = bounds.y
  let dragging = false

  function onMouseMove(ev: MouseEvent) {
    const mouseX = ev.clientX - rect.left
    const mouseY = ev.clientY - rect.top
    const dx = mouseX - startMouseX
    const dy = mouseY - startMouseY

    if (!dragging && Math.hypot(dx, dy) > 3) dragging = true
    if (!dragging) return

    const rawX = startElX + dx
    const rawY = startElY + dy

    // Calcular guides usando bounding box efetivo
    const { guides, snappedX, snappedY } = computeGuides(
      element.id,
      rawX, rawY,
      bounds.width, bounds.height
    )

    onAlignmentGuidesChange(guides)

    // Aplicar deslocamento
    const finalDx = snappedX - startElX
    const finalDy = snappedY - startElY

    if (element.type === 'group') {
      // Mover grupo → mover todos os filhos juntos
      const children = canvasElements.filter(c => c.groupId === element.id)
      children.forEach(child => {
        updateElement(child.id, {
          x: child.x + (finalDx - (child.x - startElX) + (startElX - bounds.x)),
          y: child.y + (finalDy - (child.y - startElY) + (startElY - bounds.y)),
        })
      })
      // Atualizar também o container do grupo
      updateElement(element.id, {
        x: snappedX,
        y: snappedY,
      })
    } else {
      updateElement(element.id, {
        x: Math.max(-element.width  + 8, snappedX),
        y: Math.max(-element.height + 8, snappedY),
      })
    }
  }

  function onMouseUp() {
    onAlignmentGuidesChange([])
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
```

---

### CORREÇÃO B — Resize guides em grupos

O `useResizeGuides` (V45) precisa excluir os filhos do grupo sendo redimensionado das fontes de snap:

```tsx
// hooks/useResizeGuides.ts — versão corrigida

export function useResizeGuides() {
  const { canvasElements } = useDesignWorkspaceStore()

  function computeResizeGuides(
    resizingId: string,
    currentW: number,
    currentH: number,
    currentX: number,
    currentY: number,
    handle: ResizeHandle
  ): { guides: ResizeGuide[]; snappedW: number; snappedH: number } {

    const resizingEl = canvasElements.find(el => el.id === resizingId)

    // IDs a excluir das fontes de snap: o próprio elemento + seus filhos se for grupo
    const excludedIds = new Set<string>([resizingId])
    if (resizingEl?.type === 'group') {
      canvasElements
        .filter(el => el.groupId === resizingId)
        .forEach(c => excludedIds.add(c.id))
    }
    // Se for filho de grupo, excluir também os irmãos do mesmo grupo
    if (resizingEl?.groupId) {
      canvasElements
        .filter(el => el.groupId === resizingEl.groupId)
        .forEach(s => excludedIds.add(s.id))
      excludedIds.add(resizingEl.groupId)
    }

    const guides: ResizeGuide[] = []
    let snappedW = currentW
    let snappedH = currentH

    const sources = [
      { id: 'canvas', name: 'Canvas', width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      ...canvasElements
        .filter(el => !excludedIds.has(el.id) && el.type !== 'group')
        .map(el => ({
          id:     el.id,
          name:   el.name,
          width:  el.width,
          height: el.height,
        })),
    ]

    const seenWidths  = new Set<number>()
    const seenHeights = new Set<number>()

    for (const src of sources) {
      if (!seenWidths.has(src.width)) {
        const deltaW = Math.abs(currentW - src.width)
        if (deltaW <= SNAP_THRESHOLD) {
          seenWidths.add(src.width)
          snappedW = src.width
          const guideX = isLeftHandle(handle)
            ? currentX + currentW - src.width
            : currentX + src.width
          guides.push({
            orientation: 'vertical',
            position:    guideX,
            matchType:   'width',
            matchValue:  src.width,
            sourceName:  src.name,
          })
        }
      }

      if (!seenHeights.has(src.height)) {
        const deltaH = Math.abs(currentH - src.height)
        if (deltaH <= SNAP_THRESHOLD) {
          seenHeights.add(src.height)
          snappedH = src.height
          const guideY = isTopHandle(handle)
            ? currentY + currentH - src.height
            : currentY + src.height
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
```

---

### `CanvasFrame` — receber alignment guides do InteractionOverlay

O `CanvasFrame` precisa de dois estados separados: um para alignment guides (drag) e outro para resize guides (resize):

```tsx
// CanvasFrame.tsx
export function CanvasFrame() {
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([])
  const [resizeGuides,    setResizeGuides]    = useState<ResizeGuide[]>([])

  return (
    <div ref={frameRef} ... >
      {/* Camada 1: Elementos */}
      ...

      {/* Camada 2: Selection overlays */}
      {selectedElementIds.length === 1 && (
        <SelectionOverlay
          elementId={selectedElementIds[0]}
          onResizeGuidesChange={setResizeGuides}
        />
      )}

      {/* Camada 3: Alignment guides — drag de posição */}
      <AlignmentGuidesOverlay
        guides={alignmentGuides}
        canvasWidth={600}
        canvasHeight={600}
      />

      {/* Camada 4: Resize guides — resize de dimensão */}
      <ResizeGuidesOverlay
        guides={resizeGuides}
        canvasWidth={600}
        canvasHeight={600}
      />

      {/* InteractionOverlay passa alignment guides para cima */}
      <InteractionOverlay
        frameRef={frameRef}
        onMarqueeChange={setMarquee}
        onAlignmentGuidesChange={setAlignmentGuides}  // ← novo prop
      />
    </div>
  )
}
```

```tsx
// InteractionOverlay.tsx — aceita o callback de guides
export function InteractionOverlay({
  frameRef,
  onMarqueeChange,
  onAlignmentGuidesChange,  // ← novo prop
}: {
  frameRef: React.RefObject<HTMLDivElement>
  onMarqueeChange: (m: MarqueeRect | null) => void
  onAlignmentGuidesChange: (guides: AlignmentGuide[]) => void  // ← novo prop
}) {
  // ...
  // Passar onAlignmentGuidesChange para startElementDrag
  // Chamar onAlignmentGuidesChange([]) no mouseup
}
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Arrastar grupo → alignment guides aparecem em relação a outros elementos
- [ ] Arrastar grupo → snap de posição funciona nas bordas e centros
- [ ] Arrastar grupo → guides somem ao soltar
- [ ] Redimensionar grupo → resize guides aparecem para W e H
- [ ] Resize guides não fazem snap contra os filhos do próprio grupo
- [ ] Alignment guides não fazem snap contra os filhos do próprio grupo
- [ ] Arrastar elemento simples → guides continuam funcionando (regressão)
- [ ] Redimensionar elemento simples → resize guides continuam funcionando (regressão)

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Alignment guide — borda | `#5B4EFF` (roxo) |
| Alignment guide — centro | `#FF6B6B` (coral) |
| Resize guide | `#FF6B6B` (coral) com label |
| `SNAP_THRESHOLD` (posição) | `5px` |
| `SNAP_THRESHOLD` (dimensão) | `6px` |
| Excluídos das fontes de snap | elemento arrastado/redimensionado + filhos do grupo |
| Guides pointer-events | `none` |
| Guides z-index (alignment) | `45` |
| Guides z-index (resize) | `45` |
| Guides somem quando | `mouseup` |