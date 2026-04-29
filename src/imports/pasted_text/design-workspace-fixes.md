Prompt direto e focado nos três problemas:

---

## 🧱 PROMPT V44 — Design Workspace — Duplo clique em grupo corrigido + Handles do Background + Elementos além do canvas com opacidade reduzida

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

### PROBLEMA 1 — Duplo clique em grupo não funciona

#### CAUSA RAIZ

O `InteractionOverlay` usa um `div` com `pointer-events-auto` cobrindo tudo no `z-index: 50`. O problema é que o threshold de duplo clique está sendo avaliado pelo `id` do elemento — mas como o `InteractionOverlay` detecta o elemento por coordenadas (hit test), dois cliques rápidos sobre o mesmo ponto podem não encontrar o mesmo elemento se o elemento se mover entre os cliques, ou o `lastClickedId` não está sendo persistido corretamente entre eventos.

#### CORREÇÃO — Rastrear duplo clique por coordenada + id

```tsx
// InteractionOverlay.tsx — detecção de duplo clique robusta

const lastClick = useRef<{
  time: number
  id: string | null
  x: number
  y: number
}>({ time: 0, id: null, x: 0, y: 0 })

const DOUBLE_CLICK_MS = 350
const DOUBLE_CLICK_DISTANCE = 5 // px — tolerância de movimento entre cliques

function handleMouseDown(e: React.MouseEvent) {
  if (e.button !== 0) return

  const rect    = frameRef.current!.getBoundingClientRect()
  const mouseX  = e.clientX - rect.left
  const mouseY  = e.clientY - rect.top
  const now     = Date.now()

  // Hit test — elemento sob o cursor
  const hitElement = [...canvasElements]
    .reverse()
    .find(el =>
      mouseX >= el.x && mouseX <= el.x + el.width &&
      mouseY >= el.y && mouseY <= el.y + el.height
    )

  // ── Detectar duplo clique ─────────────────────────────────────────────
  const timeDelta = now - lastClick.current.time
  const distDelta = Math.hypot(
    mouseX - lastClick.current.x,
    mouseY - lastClick.current.y
  )
  const sameTarget = lastClick.current.id === (hitElement?.id ?? null)
  const isDoubleClick =
    timeDelta < DOUBLE_CLICK_MS &&
    distDelta < DOUBLE_CLICK_DISTANCE &&
    sameTarget

  // Atualizar registro do último clique ANTES de processar
  lastClick.current = {
    time: now,
    id:   hitElement?.id ?? null,
    x:    mouseX,
    y:    mouseY,
  }

  if (isDoubleClick) {
    handleDoubleClick(hitElement ?? null)
    return
  }

  if (!hitElement) {
    handleEmptyAreaInteraction(e, mouseX, mouseY, rect)
    return
  }

  handleSingleClick(e, hitElement, mouseX, mouseY, rect)
}

function handleDoubleClick(element: CanvasElement | null) {
  if (!element) return

  if (element.type === 'group') {
    // Duplo clique no container do grupo → entra no grupo
    enterGroup(element.id)
    return
  }

  if (element.groupId) {
    // Duplo clique em filho de grupo:
    // Independente de editingGroupId, entra no grupo e seleciona o filho
    enterGroup(element.groupId)
    selectElement(element.id)
    return
  }

  // Duplo clique em elemento simples → sem ação especial por ora
}
```

---

### PROBLEMA 2 — Background Placeholder sem handles de resize visíveis

#### CAUSA RAIZ

O `SelectionOverlay` é renderizado dentro do `CanvasElementView` com `position: absolute` e `inset-0`. Para o Background (600×600), os handles ficam nas bordas exatas do `CanvasFrame` — mas o `CanvasFrame` tem `overflow: hidden`, cortando os handles que ficam exatamente na borda.

#### CORREÇÃO — Handles do Background renderizados no `CanvasFrame` via portal interno

Os handles do Background precisam ser renderizados **fora** do elemento, diretamente no `CanvasFrame`, para não serem cortados pelo `overflow: hidden`.

Quando o elemento selecionado é o Background (ou qualquer elemento que toque as bordas do canvas), o `SelectionOverlay` deve compensar o clipping usando `inset` negativo no container e garantindo que os handles estejam sempre visíveis:

```tsx
// SelectionOverlay.tsx — versão com handles sempre visíveis

const HANDLE_OFFSET = 4 // px — quanto os handles ficam fora da borda do elemento

export function SelectionOverlay({ elementId }: { elementId: string }) {
  const { startResize } = useResizeHandler(elementId)
  const element = useDesignWorkspaceStore(s =>
    s.canvasElements.find(el => el.id === elementId)
  )

  const isBackground = element?.placeholderVariant === 'background'

  return (
    // overflow: visible garante que os handles não sejam cortados
    <div
      className="absolute pointer-events-none"
      style={{
        inset: isBackground ? `-${HANDLE_OFFSET}px` : 0,
        overflow: 'visible',
        zIndex: 55,
      }}
    >
      {/* Bounding box — ajusta para o tamanho real do elemento */}
      <div
        className="absolute border-2 border-[#5B4EFF] rounded-[1px] pointer-events-none"
        style={
          isBackground
            ? { inset: HANDLE_OFFSET } // compensa o inset negativo do container
            : { inset: 0 }
        }
      />

      {/* 8 handles de resize — sempre visíveis */}
      {(Object.keys(HANDLE_POSITIONS) as ResizeHandle[]).map(handle => (
        <div
          key={handle}
          className="absolute w-2 h-2 bg-white border-2 border-[#5B4EFF] rounded-[1px] pointer-events-auto"
          style={{
            ...HANDLE_POSITIONS[handle],
            cursor: HANDLE_CURSORS[handle],
            zIndex: 70,
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            startResize(e, handle)
          }}
        />
      ))}
    </div>
  )
}
```

Além disso, o `CanvasFrame` deve ter `overflow: visible` para não cortar os handles — o clipping visual do canvas deve ser feito pelo container pai:

```tsx
// CanvasFrame.tsx — overflow visible para handles, clip feito pelo pai
<div
  className="relative bg-white shadow-xl select-none"
  style={{
    width: 600,
    height: 600,
    overflow: 'visible', // ← permite que handles fiquem visíveis nas bordas
  }}
>
  {/* Clip visual interno — apenas para o conteúdo do canvas, não para os handles */}
  <div
    className="absolute inset-0 overflow-hidden"
    style={{ zIndex: 1 }}
  >
    {/* Elementos renderizados aqui são clippados */}
    {orderedElements.map((element, index) => (
      <CanvasElementView key={element.id} ... />
    ))}
  </div>

  {/* Overlays e handles fora do clip — visíveis além das bordas */}
  <div className="absolute inset-0" style={{ zIndex: 2, overflow: 'visible', pointerEvents: 'none' }}>
    {selectedElementIds.length === 1 && (
      <SelectionOverlay elementId={selectedElementIds[0]} />
    )}
    {selectedElementIds.length > 1 && (
      <MultiSelectionBoundingBox selectedIds={selectedElementIds} />
    )}
  </div>

  {/* InteractionOverlay e marquee */}
  <InteractionOverlay frameRef={frameRef} onMarqueeChange={setMarquee} />
  {/* ...marquee visual... */}
</div>
```

---

### PROBLEMA 3 — Elementos além do canvas com opacidade reduzida

#### REGRA

Elementos podem ser movidos para além das bordas do `CanvasFrame` (600×600). A parte do elemento que está **fora** da área útil do canvas deve aparecer com opacidade reduzida — comunicando visualmente que esse conteúdo não será exportado.

#### IMPLEMENTAÇÃO — Máscara de opacidade por clip

A solução é renderizar cada elemento **duas vezes**:
1. Uma vez dentro de um container com `overflow: hidden` (clip do canvas) — opacidade normal
2. Uma vez no container pai sem clip — opacidade reduzida

Mas a abordagem mais simples e performática é usar um overlay de máscara sobre as bordas do canvas:

```tsx
// CanvasFrame.tsx — overlay que escurece área fora do canvas

// O CanvasFrame renderiza em overflow: visible para suportar elementos que
// ultrapassam as bordas. Um overlay de máscara comunica a área não utilizável.

{/* Overlay de área externa — renderizado sobre o canvas, fora dos 600×600 */}
{/* Implementado como 4 faixas nos 4 lados, estendendo para o infinito */}
<CanvasOutOfBoundsOverlay canvasWidth={600} canvasHeight={600} />
```

```tsx
// CanvasOutOfBoundsOverlay.tsx
// Renderiza uma máscara semi-transparente sobre a área FORA do canvas
// para indicar que elementos ali não serão exportados

export function CanvasOutOfBoundsOverlay({
  canvasWidth,
  canvasHeight,
}: {
  canvasWidth: number
  canvasHeight: number
}) {
  const EXTEND = 2000 // px — quanto a máscara se estende além do canvas

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        // Posicionado para cobrir a área além do canvas em todas as direções
        left:   -EXTEND,
        top:    -EXTEND,
        right:  -EXTEND,
        bottom: -EXTEND,
        zIndex: 3,
      }}
    >
      {/* Usar SVG com clipPath para criar o "buraco" na área do canvas */}
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <clipPath id="canvas-hole">
            <path
              // Retângulo externo (cobre tudo) com buraco no centro (área do canvas)
              fillRule="evenodd"
              d={`
                M ${-EXTEND} ${-EXTEND}
                H ${EXTEND * 2 + canvasWidth}
                V ${EXTEND * 2 + canvasHeight}
                H ${-EXTEND}
                Z
                M ${EXTEND} ${EXTEND}
                H ${EXTEND + canvasWidth}
                V ${EXTEND + canvasHeight}
                H ${EXTEND}
                Z
              `}
            />
          </clipPath>
        </defs>
        <rect
          x={-EXTEND}
          y={-EXTEND}
          width={EXTEND * 2 + canvasWidth}
          height={EXTEND * 2 + canvasHeight}
          fill="rgba(232, 232, 232, 0.75)"   // mesmo tom do canvas cinza, 75% opacidade
          clipPath="url(#canvas-hole)"
        />
      </svg>
    </div>
  )
}
```

#### ALTERNATIVA MAIS SIMPLES — Opacidade no elemento via cálculo de intersecção

Se o SVG clipPath apresentar problemas, a alternativa é calcular se o elemento está parcialmente fora e reduzir sua opacidade:

```tsx
// CanvasElementView.tsx — opacidade reduzida se fora dos limites

function isPartiallyOutOfBounds(el: CanvasElement, cw: number, ch: number): boolean {
  return el.x < 0 || el.y < 0 || el.x + el.width > cw || el.y + el.height > ch
}

// Na renderização do elemento:
const outOfBounds = isPartiallyOutOfBounds(element, CANVAS_WIDTH, CANVAS_HEIGHT)

<div
  className="absolute pointer-events-none"
  style={{
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    zIndex,
    opacity: outOfBounds ? 0.35 : 1,  // reduz opacidade se além do canvas
    transition: 'opacity 150ms ease',
  }}
>
  <ElementContent element={element} />
  ...
</div>
```

> **Preferir a abordagem de overlay SVG** — ela preserva a opacidade original do elemento e é visualmente mais fiel ao comportamento de editores como Figma, onde o conteúdo fora do frame fica visível mas claramente fora da área de exportação.

---

### DIAGRAMA — Camadas do CanvasFrame após as correções

```
CanvasFrame (overflow: visible)
  │
  ├── z-1: Clip container (overflow: hidden, 600×600)
  │         └── Elementos renderizados (clippados visualmente)
  │
  ├── z-2: Overlays (overflow: visible)
  │         ├── SelectionOverlay (handles visíveis além da borda)
  │         └── MultiSelectionBoundingBox
  │
  ├── z-3: CanvasOutOfBoundsOverlay (SVG mask, pointer-events-none)
  │         └── Área fora do canvas com rgba(232,232,232,0.75)
  │
  ├── z-50: InteractionOverlay (captura todos os cliques)
  │
  └── z-70: Handles de resize (pointer-events-auto, acima de tudo)
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Duplo clique no bounding box do grupo → entra no grupo (`editingGroupId` ativo)
- [ ] Duplo clique em filho visível no canvas → seleciona o filho diretamente
- [ ] Escape após entrar no grupo → volta a selecionar o grupo pai
- [ ] Background selecionado → 8 handles visíveis nas bordas do canvas
- [ ] Handles do Background clicáveis e funcionais para resize
- [ ] Mover elemento além da borda → área fora do canvas com opacidade reduzida
- [ ] Mover elemento de volta para dentro → opacidade restaurada
- [ ] Canvas branco ainda não arrasta (pan apenas no cinza)

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Duplo clique threshold | `350ms` |
| Duplo clique distância | `5px` |
| Handle offset (Background) | `4px` fora da borda |
| `CanvasFrame` overflow | `visible` |
| Clip container overflow | `hidden` — apenas para conteúdo |
| Out-of-bounds overlay | `rgba(232, 232, 232, 0.75)` |
| Out-of-bounds opacity (alternativa) | `0.35` |
| Out-of-bounds transition | `opacity 150ms ease` |
| `EXTEND` da máscara SVG | `2000px` |