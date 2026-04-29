Prompt direto e focado nessa correção:

---

## 🧱 PROMPT V66 — Design Workspace — Canvas centralizado e fit to screen no carregamento

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

### DIAGNÓSTICO — Por que o canvas fica no canto superior esquerdo

O problema tem uma causa raiz clara: o `canvasOffset` inicial está sendo definido como `{ x: 0, y: 0 }` — que posiciona o canvas exatamente na origem do container, ficando atrás do `LeftRail` e no topo da tela. O cálculo correto do offset centralizado não está sendo executado antes da primeira renderização.

As causas mais comuns:

```
1. canvasOffset inicializado como { x: 0, y: 0 } no store em vez de null
2. useEffect de centralização dependendo de estado que ainda não está pronto
3. getBoundingClientRect() retornando { width: 0, height: 0 } porque o
   container ainda não foi pintado quando o useEffect executa
4. Condição de guarda (canvasOffset === null) ausente, causando render
   imediato com offset zero antes do cálculo
5. LeftPane ou RightPanel afetando as dimensões do container após o cálculo
```

---

### SOLUÇÃO DEFINITIVA — Três camadas de proteção

#### Camada 1: Store com offset `null` por padrão

```tsx
// store/useDesignWorkspaceStore.ts

const initialState = {
  canvasOffset: null as { x: number; y: number } | null,
  canvasScale:  1,
  // NUNCA inicializar com { x: 0, y: 0 } — isso causa o bug
}
```

---

#### Camada 2: `CanvasInfiniteArea` calcula o offset com `ResizeObserver`

Usar `ResizeObserver` em vez de `useEffect` simples — garante que o cálculo ocorre **após o container ter dimensões reais** pintadas no DOM:

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
  const initializedRef = useRef(false)  // garante que só centraliza uma vez

  // ── Centralizar assim que o container tiver dimensões reais ─────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function initializeOffset(width: number, height: number) {
      // Só executar uma vez — na primeira vez que o container tem dimensões
      if (initializedRef.current) return
      if (width === 0 || height === 0) return

      initializedRef.current = true

      const CANVAS_W = 600
      const CANVAS_H = 600
      const PADDING  = 60   // px de respiro ao redor do canvas

      // Calcular scale para caber na área com padding
      const scaleX = (width  - PADDING * 2) / CANVAS_W
      const scaleY = (height - PADDING * 2) / CANVAS_H
      const scale  = Math.min(scaleX, scaleY, 1)  // nunca ampliar além de 100%

      // Centralizar com o scale calculado
      const offsetX = (width  - CANVAS_W * scale) / 2
      const offsetY = (height - CANVAS_H * scale) / 2

      // Definir scale e offset atomicamente — evita flash intermediário
      useDesignWorkspaceStore.setState({
        canvasScale:  scale,
        canvasOffset: { x: offsetX, y: offsetY },
      })
    }

    // Tentar com getBoundingClientRect imediatamente
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      initializeOffset(rect.width, rect.height)
      return  // já inicializado — não precisa do ResizeObserver
    }

    // Fallback: usar ResizeObserver para quando o container ainda não tem dimensões
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          initializeOffset(width, height)
          observer.disconnect()  // parar de observar após inicializar
          break
        }
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])  // ← executa apenas no mount

  // ── Wheel: pan e zoom ────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function handleWheel(e: WheelEvent) {
      e.preventDefault()

      if (e.ctrlKey || e.metaKey) {
        // Zoom centrado no cursor
        const rect   = el.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const delta = e.deltaMode === 0 ? -e.deltaY * 0.005 : -e.deltaY * 0.05

        useDesignWorkspaceStore.setState(state => {
          const prevScale = state.canvasScale
          const nextScale = Math.min(4, Math.max(0.05, prevScale + delta))
          const ratio     = nextScale / prevScale

          return {
            canvasScale:  nextScale,
            canvasOffset: state.canvasOffset
              ? {
                  x: mouseX - (mouseX - state.canvasOffset.x) * ratio,
                  y: mouseY - (mouseY - state.canvasOffset.y) * ratio,
                }
              : state.canvasOffset,
          }
        })
      } else {
        // Pan
        const mult = e.deltaMode === 1 ? 20 : 1
        useDesignWorkspaceStore.setState(state => ({
          canvasOffset: state.canvasOffset
            ? {
                x: state.canvasOffset.x - e.deltaX * mult,
                y: state.canvasOffset.y - e.deltaY * mult,
              }
            : state.canvasOffset,
        }))
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  // ── Sem offset ainda: renderizar container vazio ─────────────────────
  if (canvasOffset === null) {
    return (
      <div
        ref={containerRef}
        className="absolute inset-0 bg-[#E8E8E8]"
        style={{ overflow: 'hidden' }}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      data-canvas-container
      className="absolute inset-0 bg-[#E8E8E8]"
      style={{ overflow: 'hidden' }}
      onMouseDown={handlePanStart}
      onClick={handleBackgroundClick}
    >
      {/* Container de zoom/pan — única transformação */}
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

#### Camada 3: `fitCanvasToScreen` — recentrar a qualquer momento

```tsx
// store/useDesignWorkspaceStore.ts

fitCanvasToScreen: () => {
  const container = document.querySelector('[data-canvas-container]') as HTMLElement
  if (!container) return

  const rect     = container.getBoundingClientRect()
  const CANVAS_W = 600
  const CANVAS_H = 600
  const PADDING  = 60

  const scaleX = (rect.width  - PADDING * 2) / CANVAS_W
  const scaleY = (rect.height - PADDING * 2) / CANVAS_H
  const scale  = Math.min(scaleX, scaleY, 1)

  const offsetX = (rect.width  - CANVAS_W * scale) / 2
  const offsetY = (rect.height - CANVAS_H * scale) / 2

  set(() => ({
    canvasScale:  scale,
    canvasOffset: { x: offsetX, y: offsetY },
  }))
},
```

---

### LAYOUT — Garantir que `CanvasInfiniteArea` ocupa o espaço correto

O container cinza deve **excluir o `LeftRail`** no seu posicionamento — usar `left: LEFT_RAIL_WIDTH` e não `left: 0`:

```tsx
// DesignWorkspace.tsx — layout raiz
export function DesignWorkspace() {
  useInsertMenuShortcuts()
  useCanvasKeyboardShortcuts()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#E8E8E8]">

      {/* LeftRail — fixo à esquerda */}
      <div className="shrink-0" style={{ width: LEFT_RAIL_WIDTH }}>
        <LeftRail />
      </div>

      {/* Área principal — ocupa o restante */}
      <div className="flex-1 relative overflow-hidden flex flex-col">

        {/* CanvasInfiniteArea — ocupa toda a área restante */}
        {/* O ref captura as dimensões CORRETAS: sem o LeftRail */}
        <div className="flex-1 relative overflow-hidden">
          <CanvasInfiniteArea />
          <LeftPane />
          <RightPanel />
          <BreadcrumbNav />
          <ActionButtons />
          <ZoomToolbar />
          <Timeline />
        </div>

      </div>
    </div>
  )
}
```

> **Crítico:** o `containerRef` do `CanvasInfiniteArea` deve ter `getBoundingClientRect()` retornando dimensões que **excluem o LeftRail**. Se o container for `position: absolute; inset: 0` dentro de um flex container que começa após o LeftRail, as dimensões serão corretas automaticamente.

---

### ATALHOS — Recentrar o canvas

```tsx
// hooks/useCanvasKeyboardShortcuts.ts

// Cmd/Ctrl + Shift + H — Fit to screen
if (isMod && e.shiftKey && e.key === 'h') {
  e.preventDefault()
  fitCanvasToScreen()
  return
}

// Cmd/Ctrl + 0 — Reset zoom 100% e recentrar
if (isMod && e.key === '0') {
  e.preventDefault()
  const container = document.querySelector('[data-canvas-container]') as HTMLElement
  if (container) {
    const rect    = container.getBoundingClientRect()
    const offsetX = (rect.width  - 600) / 2
    const offsetY = (rect.height - 600) / 2
    useDesignWorkspaceStore.setState({
      canvasScale:  1,
      canvasOffset: { x: offsetX, y: offsetY },
    })
  }
  return
}
```

---

### BOTÃO "Fit to screen" na `ZoomToolbar`

```tsx
// ZoomToolbar.tsx
const { fitCanvasToScreen } = useDesignWorkspaceStore()

<button
  onClick={fitCanvasToScreen}
  title="Fit to screen (⌘⇧H)"
  className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
>
  <Maximize2 size={13} />
</button>
```

---

### DIAGRAMA — Sequência de inicialização correta

```
1. App monta
   canvasOffset = null
   canvasScale  = 1

2. CanvasInfiniteArea monta
   → renderiza <div> vazio (guard: canvasOffset === null)
   → containerRef.current existe mas getBoundingClientRect pode ser 0

3. ResizeObserver detecta que o container tem dimensões reais
   (após o browser pintar o layout)
   → width = containerWidth (viewport - LeftRail)
   → height = containerHeight (viewport - se Timeline aberta)

4. initializeOffset(width, height) executa:
   → scaleX = (width  - 120) / 600
   → scaleY = (height - 120) / 600
   → scale  = min(scaleX, scaleY, 1)
   → offsetX = (width  - 600 * scale) / 2
   → offsetY = (height - 600 * scale) / 2
   → setState({ canvasScale: scale, canvasOffset: { x: offsetX, y: offsetY } })

5. canvasOffset !== null → CanvasInfiniteArea renderiza o canvas
   → canvas aparece centralizado e fit to screen ✓

6. ResizeObserver desconecta (initializedRef.current = true)
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Ao carregar: canvas centralizado horizontalmente na área cinza
- [ ] Ao carregar: canvas centralizado verticalmente na área cinza
- [ ] Ao carregar: canvas completamente visível (fit to screen com padding de 60px)
- [ ] Canvas não aparece atrás do LeftRail
- [ ] Canvas não aparece no canto superior esquerdo
- [ ] Sem flash de posição incorreta antes de centralizar
- [ ] `LeftRail` não afeta o cálculo de centralização
- [ ] `Cmd+Shift+H` → recentra e ajusta scale
- [ ] `Cmd+0` → reset 100% e recentra
- [ ] Botão `Maximize2` na ZoomToolbar → fit to screen
- [ ] Pan após centralizar → funciona normalmente
- [ ] Zoom após centralizar → zoom centrado no cursor
- [ ] `canvasOffset` nunca inicializado como `{ x: 0, y: 0 }`

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| `canvasOffset` inicial | `null` — **nunca** `{ x: 0, y: 0 }` |
| Inicialização | `ResizeObserver` → executa quando container tem dimensões reais |
| Guard de render | `if (canvasOffset === null) return <empty div>` |
| Padding do fit | `60px` ao redor do canvas |
| Scale máximo no fit | `1.0` — nunca ampliar além de 100% |
| Scale mínimo geral | `0.05` (5%) |
| Scale máximo geral | `4.0` (400%) |
| `initializedRef` | Garante que centraliza apenas uma vez |
| `data-canvas-container` | Atributo para localizar o container via DOM no `fitCanvasToScreen` |
| Atalho fit | `Cmd/Ctrl + Shift + H` |
| Atalho reset | `Cmd/Ctrl + 0` |