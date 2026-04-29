Prompt direto e focado nessa funcionalidade:

---

## 🧱 PROMPT V64 — Design Workspace — Canvas centralizado ao carregar

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

Ao inicializar a aplicação, o `CanvasFrame` (600×600px) deve estar **perfeitamente centralizado** na área cinza disponível — levando em conta a largura do `LeftRail` à esquerda e o espaço disponível restante. O canvas deve aparecer centralizado sem nenhuma interação do usuário.

---

### CÁLCULO DO OFFSET INICIAL

O offset inicial é calculado uma única vez no momento em que o `CanvasInfiniteArea` monta, usando as dimensões reais do container disponível:

```tsx
// utils/getInitialCanvasOffset.ts

const CANVAS_WIDTH   = 600   // px — largura do CanvasFrame
const CANVAS_HEIGHT  = 600   // px — altura do CanvasFrame
const LEFT_RAIL_WIDTH = 64   // px — largura do LeftRail

export function getInitialCanvasOffset(
  containerWidth:  number,   // largura total da área cinza (viewport - LeftRail)
  containerHeight: number,   // altura total da área cinza (viewport - Timeline)
  scale:           number = 1
): { x: number; y: number } {
  // Centralizar o CanvasFrame (já escalado) dentro da área disponível
  const scaledW = CANVAS_WIDTH  * scale
  const scaledH = CANVAS_HEIGHT * scale

  return {
    x: (containerWidth  - scaledW) / 2,
    y: (containerHeight - scaledH) / 2,
  }
}
```

---

### STORE — Valor inicial do `canvasOffset`

O store não pode calcular o offset inicial de forma estática porque não conhece as dimensões do container no momento da inicialização. O offset começa como `null` e é definido assim que o container monta:

```tsx
// store/useDesignWorkspaceStore.ts

interface DesignWorkspaceState {
  canvasOffset: { x: number; y: number } | null  // null = não inicializado ainda
  canvasScale:  number
}

// Valor inicial
canvasOffset: null,    // ← será definido pelo CanvasInfiniteArea no mount
canvasScale:  1,
```

---

### `CanvasInfiniteArea` — calcular e aplicar o offset no mount

```tsx
// CanvasInfiniteArea.tsx
export function CanvasInfiniteArea() {
  const {
    canvasOffset,
    canvasScale,
    setCanvasOffset,
    setCanvasScale,
  } = useDesignWorkspaceStore()

  const containerRef = useRef<HTMLDivElement>(null)

  // ── Centralizar o canvas ao montar ───────────────────────────────────
  useEffect(() => {
    // Só calcular se o offset ainda não foi definido (primeira vez)
    if (canvasOffset !== null) return

    const el = containerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()

    const offset = getInitialCanvasOffset(
      rect.width,
      rect.height,
      canvasScale
    )

    setCanvasOffset(offset)
  }, [])   // ← executa apenas uma vez no mount — array vazio intencional

  // Enquanto o offset não foi calculado, não renderizar nada
  // para evitar flash de conteúdo descentralizado
  if (canvasOffset === null) {
    return (
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden bg-[#E8E8E8]"
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-[#E8E8E8]"
      onMouseDown={handlePanStart}
      onClick={handleBackgroundClick}
    >
      <div
        style={{
          position:        'absolute',
          left:            0,
          top:             0,
          transform:       `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
          transformOrigin: '0 0',
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

### STORE — `setCanvasOffset` aceita `null` para reset

```tsx
// store/useDesignWorkspaceStore.ts

setCanvasOffset: (
  offset:
    | { x: number; y: number }
    | null
    | ((prev: { x: number; y: number } | null) => { x: number; y: number })
) => set(state => ({
  canvasOffset: typeof offset === 'function'
    ? offset(state.canvasOffset)
    : offset
})),
```

---

### `fitCanvasToScreen` — recentrar a qualquer momento

Implementar uma função que pode ser chamada para recentrar o canvas quando necessário (ex: botão "fit to screen", `Cmd+Shift+H`):

```tsx
// store/useDesignWorkspaceStore.ts

fitCanvasToScreen: () => {
  // Ler as dimensões do container via DOM — necessário para cálculo preciso
  const container = document.querySelector('[data-canvas-container]') as HTMLElement
  if (!container) return

  const rect    = container.getBoundingClientRect()
  const padding = 60   // px de respiro ao redor do canvas

  // Calcular scale para caber na área disponível
  const scaleX = (rect.width  - padding * 2) / CANVAS_WIDTH
  const scaleY = (rect.height - padding * 2) / CANVAS_HEIGHT
  const scale  = Math.min(scaleX, scaleY, 1)  // nunca ampliar além de 100%

  const offset = getInitialCanvasOffset(rect.width, rect.height, scale)

  set(() => ({
    canvasScale:  scale,
    canvasOffset: offset,
  }))
},
```

```tsx
// CanvasInfiniteArea.tsx — adicionar data attribute para o fitCanvasToScreen
<div
  ref={containerRef}
  data-canvas-container   // ← usado pelo fitCanvasToScreen para encontrar o container
  className="absolute inset-0 overflow-hidden bg-[#E8E8E8]"
  ...
>
```

---

### ATALHO — `Cmd+Shift+H` recentra o canvas

```tsx
// hooks/useCanvasKeyboardShortcuts.ts

// Cmd/Ctrl + Shift + H — Fit canvas to screen / recentrar
if (isMod && e.shiftKey && e.key === 'h') {
  e.preventDefault()
  fitCanvasToScreen()
  return
}

// Cmd/Ctrl + 0 — Reset zoom para 100% e recentrar
if (isMod && e.key === '0') {
  e.preventDefault()
  set(() => ({ canvasScale: 1 }))

  // Recentrar com scale 1
  const container = document.querySelector('[data-canvas-container]') as HTMLElement
  if (container) {
    const rect   = container.getBoundingClientRect()
    const offset = getInitialCanvasOffset(rect.width, rect.height, 1)
    setCanvasOffset(offset)
  }
  return
}
```

---

### BOTÃO "Fit to screen" na ZoomToolbar

```tsx
// ZoomToolbar.tsx — adicionar botão de recentrar

<button
  onClick={fitCanvasToScreen}
  title="Fit to screen (⌘⇧H)"
  className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
>
  <Maximize2 size={13} />
</button>
```

---

### DIAGRAMA — Cálculo do offset inicial

```
Área disponível após o mount:
┌────────────────────────────────────────────────────────────────┐
│  containerWidth  = viewport.width - LEFT_RAIL_WIDTH            │
│  containerHeight = viewport.height - TIMELINE_HEIGHT (se aberta│
│                                                                │
│   offsetX = (containerWidth  - CANVAS_WIDTH)  / 2             │
│   offsetY = (containerHeight - CANVAS_HEIGHT) / 2             │
│                                                                │
│         ┌──────────────────────────────┐                       │
│         │                              │                       │
│         │         CanvasFrame          │                       │
│         │         600 × 600 px         │                       │
│         │                              │                       │
│         └──────────────────────────────┘                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
         ↑ offsetX de cada lado igual ↑
              ↕ offsetY de cada lado igual ↕
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Ao carregar, o canvas aparece centralizado horizontalmente na área cinza
- [ ] Ao carregar, o canvas aparece centralizado verticalmente na área cinza
- [ ] Sem flash de posição incorreta antes de centralizar (guard `canvasOffset === null`)
- [ ] `LeftRail` é considerado no cálculo — canvas centralizado na área restante
- [ ] `Timeline` aberta/fechada não descentraliza o canvas no load
- [ ] `Cmd+Shift+H` → recentra e ajusta scale para encaixar na tela
- [ ] `Cmd+0` → reset scale para 100% e recentra
- [ ] Botão `Maximize2` na ZoomToolbar → `fitCanvasToScreen()`
- [ ] Pan após centralizar → canvas move normalmente
- [ ] Zoom após centralizar → zoom centrado no cursor corretamente
- [ ] Reload da página → canvas volta centralizado

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| `CANVAS_WIDTH` | `600px` |
| `CANVAS_HEIGHT` | `600px` |
| `LEFT_RAIL_WIDTH` | `64px` |
| `canvasOffset` inicial | `null` — calculado no mount |
| Cálculo do offset | `(containerSize - canvasSize * scale) / 2` |
| Padding no fit to screen | `60px` |
| Scale máximo no fit | `1.0` (100%) — nunca ampliar além de 100% |
| Flash guard | `if (canvasOffset === null) return <empty div>` |
| Atalho recentrar | `Cmd/Ctrl + Shift + H` |
| Atalho reset zoom | `Cmd/Ctrl + 0` |
| `data-canvas-container` | atributo para localizar o container via DOM |