Prompt direto e focado nessa correção:

---

## 🧱 PROMPT V62 — Design Workspace — Zoom vetorial: CSS transform em vez de re-renderização rasterizada

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

### PROBLEMA

O zoom atual está sendo aplicado de forma rasterizada — possivelmente usando `zoom` CSS, `scale()` em `width`/`height` reais dos elementos, ou re-renderizando os elementos com dimensões escaladas em pixels. Isso produz blur e aliasing em zooms diferentes de 100%.

---

### SOLUÇÃO — CSS `transform: scale()` no container do canvas

O zoom correto para interfaces vetoriais usa **`transform: scale()`** aplicado a um único container pai que envolve todo o `CanvasFrame`. O browser aplica a transformação em GPU, mantendo toda a renderização vetorial (texto, bordas, SVGs, elementos DOM) nítida em qualquer nível de zoom.

#### REGRA CRÍTICA

```
❌ NUNCA escalar elementos individualmente (width, height, fontSize em pixels escalados)
❌ NUNCA usar a propriedade CSS zoom
❌ NUNCA usar canvas HTML (rasterizado)
❌ NUNCA re-renderizar com dimensões multiplicadas pelo scale

✅ SEMPRE aplicar um único transform: scale(canvasScale) no container pai
✅ SEMPRE manter as dimensões dos elementos em pixels absolutos (não escalados)
✅ SEMPRE usar transformOrigin: '0 0' para que o zoom parta do canto superior esquerdo
✅ SEMPRE ajustar o offset (pan) para compensar o zoom centrado no cursor
```

---

### IMPLEMENTAÇÃO — Container de zoom correto

```tsx
// CanvasInfiniteArea.tsx

export function CanvasInfiniteArea() {
  const { canvasOffset, canvasScale, setCanvasOffset, setCanvasScale } =
    useDesignWorkspaceStore()

  const containerRef = useRef<HTMLDivElement>(null)

  // ── Wheel handler: pan (dois dedos) e zoom (Ctrl+scroll) ─────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function handleWheel(e: WheelEvent) {
      e.preventDefault()

      if (e.ctrlKey || e.metaKey) {
        // ── Zoom centrado no cursor ──────────────────────────────────────
        const rect   = el.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const delta = e.deltaMode === 0
          ? -e.deltaY * 0.005    // trackpad — sensível
          : -e.deltaY * 0.05     // mouse wheel — menos sensível

        setCanvasScale(prevScale => {
          const nextScale = Math.min(4, Math.max(0.05, prevScale + delta))

          // Ajustar offset para manter o ponto sob o cursor fixo
          // Fórmula: newOffset = mousePos - (mousePos - oldOffset) * (nextScale / prevScale)
          setCanvasOffset(prevOffset => ({
            x: mouseX - (mouseX - prevOffset.x) * (nextScale / prevScale),
            y: mouseY - (mouseY - prevOffset.y) * (nextScale / prevScale),
          }))

          return nextScale
        })

      } else {
        // ── Pan — dois dedos no trackpad ─────────────────────────────────
        const multiplier = e.deltaMode === 1 ? 20 : 1
        setCanvasOffset(prev => ({
          x: prev.x - e.deltaX * multiplier,
          y: prev.y - e.deltaY * multiplier,
        }))
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [setCanvasOffset, setCanvasScale])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ cursor: 'default' }}
      onMouseDown={handlePanStart}
      onClick={handleBackgroundClick}
    >
      {/*
        ✅ ÚNICO ponto de transformação — todo o canvas escala aqui.
        Os elementos internos mantêm suas dimensões em px absolutos.
        O browser aplica a transformação via GPU — resultado vetorial e nítido.
      */}
      <div
        style={{
          position:        'absolute',
          left:            0,
          top:             0,
          // Transformação composta: primeiro translada (pan), depois escala (zoom)
          // A ordem importa: translate ANTES de scale
          transform:       `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
          transformOrigin: '0 0',
          // Hint para o browser criar composite layer — evita repaint durante zoom/pan
          willChange:      'transform',
        }}
      >
        <CanvasFrame />
      </div>
    </div>
  )
}
```

---

### O QUE NÃO DEVE SER ESCALADO

Os elementos dentro do `CanvasFrame` devem ter dimensões **absolutas em pixels**, sem nenhuma multiplicação por `canvasScale`. O `transform: scale()` do container cuida de tudo:

```tsx
// CanvasElementView.tsx — dimensões absolutas, nunca multiplicadas por scale
<div
  className="absolute pointer-events-none"
  style={{
    left:   element.x,       // ✅ px absolutos — NÃO multiplicar por canvasScale
    top:    element.y,        // ✅ px absolutos
    width:  element.width,    // ✅ px absolutos
    height: element.height,   // ✅ px absolutos
    zIndex,
  }}
>
  <ElementContent element={element} />
</div>

// ✅ O CanvasFrame em si tem dimensões absolutas
<div
  className="relative bg-white shadow-xl select-none"
  style={{
    width:  600,   // ✅ sempre 600px — nunca 600 * canvasScale
    height: 600,   // ✅ sempre 600px
    overflow: 'visible',
  }}
>
```

---

### CORREÇÃO DAS COORDENADAS DO MOUSE — Hit test e InteractionOverlay

Com o zoom via `transform: scale()`, as coordenadas do mouse retornadas pelo browser (`e.clientX`, `e.clientY`) estão no espaço da tela — mas os elementos estão no espaço do canvas (não escalado). É necessário converter:

```tsx
// utils/canvasCoordinates.ts

/**
 * Converte coordenadas do mouse (espaço da tela) para
 * coordenadas do canvas (espaço dos elementos — não escalado)
 */
export function screenToCanvas(
  screenX:     number,
  screenY:     number,
  canvasOffset: { x: number; y: number },
  canvasScale:  number,
  frameRect:   DOMRect   // getBoundingClientRect() do containerRef
): { x: number; y: number } {
  // 1. Subtrair a posição do container na tela
  const relX = screenX - frameRect.left
  const relY = screenY - frameRect.top

  // 2. Remover a translação (pan)
  const pannedX = relX - canvasOffset.x
  const pannedY = relY - canvasOffset.y

  // 3. Remover o scale
  return {
    x: pannedX / canvasScale,
    y: pannedY / canvasScale,
  }
}
```

```tsx
// InteractionOverlay.tsx — usar screenToCanvas em todos os hit tests

function handleMouseDown(e: React.MouseEvent) {
  const { canvasOffset, canvasScale } = useDesignWorkspaceStore.getState()
  const rect    = frameRef.current!.getBoundingClientRect()

  // ✅ Coordenadas convertidas para o espaço do canvas
  const { x: mouseX, y: mouseY } = screenToCanvas(
    e.clientX, e.clientY,
    canvasOffset, canvasScale,
    rect
  )

  // Hit test usa mouseX e mouseY no espaço do canvas — correto em qualquer zoom
  const hitElement = [...canvasElements]
    .reverse()
    .find(el =>
      mouseX >= el.x && mouseX <= el.x + el.width &&
      mouseY >= el.y && mouseY <= el.y + el.height
    )

  // ...resto do handleMouseDown...
}
```

```tsx
// Drag — também converter coordenadas durante o mousemove
function onMouseMove(ev: MouseEvent) {
  const { canvasOffset, canvasScale } = useDesignWorkspaceStore.getState()
  const rect = frameRef.current!.getBoundingClientRect()

  const current = screenToCanvas(ev.clientX, ev.clientY, canvasOffset, canvasScale, rect)
  const start   = screenToCanvas(startMouseClientX, startMouseClientY, canvasOffset, canvasScale, rect)

  const dx = current.x - start.x  // delta no espaço do canvas — correto em qualquer zoom
  const dy = current.y - start.y
}
```

---

### `ZoomToolbar` — exibir o zoom atual corretamente

O valor exibido na toolbar deve ser `canvasScale * 100` formatado como porcentagem:

```tsx
// ZoomToolbar.tsx
<span className="text-xs text-gray-500 w-10 text-center font-mono tabular-nums">
  {Math.round(canvasScale * 100)}%
</span>

// Slider — min 5%, max 400%
<Slider
  min={5}
  max={400}
  step={5}
  value={[Math.round(canvasScale * 100)]}
  onValueChange={([v]) => {
    const newScale = v / 100
    // Zoom centrado no centro da área visível
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const cx = rect.width  / 2
      const cy = rect.height / 2
      setCanvasOffset(prev => ({
        x: cx - (cx - prev.x) * (newScale / canvasScale),
        y: cy - (cy - prev.y) * (newScale / canvasScale),
      }))
    }
    setCanvasScale(newScale)
  }}
/>

// Botões +/- — incremento de 10%
<button onClick={() => zoomBy(0.1)}>  <Plus  size={12} /> </button>
<button onClick={() => zoomBy(-0.1)}> <Minus size={12} /> </button>

function zoomBy(delta: number) {
  const rect = containerRef.current?.getBoundingClientRect()
  const cx = rect ? rect.width  / 2 : 300
  const cy = rect ? rect.height / 2 : 300
  setCanvasScale(prev => {
    const next = Math.min(4, Math.max(0.05, prev + delta))
    setCanvasOffset(o => ({
      x: cx - (cx - o.x) * (next / prev),
      y: cy - (cy - o.y) * (next / prev),
    }))
    return next
  })
}
```

---

### ATALHOS DE ZOOM — Teclado

```tsx
// hooks/useCanvasKeyboardShortcuts.ts

// Cmd/Ctrl + = ou Cmd/Ctrl + + → Zoom in
if (isMod && (e.key === '=' || e.key === '+')) {
  e.preventDefault()
  zoomBy(0.1)
  return
}

// Cmd/Ctrl + - → Zoom out
if (isMod && e.key === '-') {
  e.preventDefault()
  zoomBy(-0.1)
  return
}

// Cmd/Ctrl + 0 → Reset zoom (100%)
if (isMod && e.key === '0') {
  e.preventDefault()
  setCanvasScale(1)
  setCanvasOffset({ x: 100, y: 100 }) // recentrar
  return
}

// Cmd/Ctrl + Shift + H → Fit to screen
if (isMod && e.shiftKey && e.key === 'h') {
  e.preventDefault()
  fitCanvasToScreen()
  return
}
```

---

### FUNÇÃO — `fitCanvasToScreen`

Calcula o scale e offset para encaixar o canvas inteiro na área visível:

```tsx
// utils/fitCanvasToScreen.ts
export function fitCanvasToScreen(
  containerWidth:  number,
  containerHeight: number,
  canvasWidth:     number,   // 600
  canvasHeight:    number,   // 600
  padding:         number = 40
) {
  const scaleX = (containerWidth  - padding * 2) / canvasWidth
  const scaleY = (containerHeight - padding * 2) / canvasHeight
  const scale  = Math.min(scaleX, scaleY, 1)   // nunca maior que 100%

  const offsetX = (containerWidth  - canvasWidth  * scale) / 2
  const offsetY = (containerHeight - canvasHeight * scale) / 2

  return { scale, offsetX, offsetY }
}
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Zoom in → texto, bordas e SVGs permanecem nítidos (sem blur)
- [ ] Zoom out → elementos reduzem sem pixelização
- [ ] Zoom em qualquer nível (5% a 400%) → qualidade vetorial mantida
- [ ] Scroll com Ctrl/Cmd → zoom centrado na posição do cursor
- [ ] Dois dedos trackpad → pan suave sem afetar zoom
- [ ] Slider da ZoomToolbar → zoom centrado no centro da área visível
- [ ] Botões +/- → incremento/decremento de 10%
- [ ] `Cmd+0` → reset para 100%
- [ ] `Cmd+=` e `Cmd+-` → zoom in/out via teclado
- [ ] Click, drag e hit test funcionam corretamente em qualquer nível de zoom
- [ ] Guides, handles de resize e bounding boxes permanecem no lugar correto após zoom
- [ ] `canvasScale` no store nunca muda as dimensões dos elementos (`element.x`, `element.width`, etc.)

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Propriedade de zoom | `transform: scale(canvasScale)` no container pai |
| `transformOrigin` | `'0 0'` |
| `willChange` | `'transform'` |
| Zoom mínimo | `0.05` (5%) |
| Zoom máximo | `4.0` (400%) |
| Incremento teclado | `0.1` (10%) |
| Incremento slider | `5` (5%) |
| Dimensões dos elementos | **sempre px absolutos** — nunca multiplicados por scale |
| Coordenadas do mouse | convertidas via `screenToCanvas()` antes de qualquer hit test |
| `CSS zoom` property | **proibido** — usar somente `transform: scale()` |
| Re-render com dimensões escaladas | **proibido** — a transformação é visual, não estrutural |