Prompt direto e focado nessa funcionalidade:

---

## 🧱 PROMPT V51 — Design Workspace — Two-finger scroll para pan do canvas (trackpad)

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

O gesto de **dois dedos no trackpad** (ou scroll de mouse com dois dedos) deve mover o canvas — equivalente ao hand tool — sem necessidade de ativar nenhum modo especial. Funciona em qualquer momento, independentemente do que está selecionado ou do painel ativo.

| Gesto | Comportamento |
|---|---|
| Dois dedos arrastar (trackpad) | Pan do canvas — move offset X e Y |
| Scroll vertical (mouse wheel) | Pan vertical do canvas |
| Scroll horizontal (mouse wheel com Shift) | Pan horizontal do canvas |
| `Ctrl/Cmd` + scroll | Zoom in/out (já existente) |

---

### COMO DETECTAR — `wheel` vs `touchpad`

O evento `wheel` do browser cobre ambos os casos:
- **Mouse wheel físico**: `deltaY` com valores grandes e `deltaMode === 1` (linhas)
- **Trackpad dois dedos**: `deltaX` e `deltaY` com valores pequenos e `deltaMode === 0` (pixels)

O gesto de dois dedos no trackpad gera `deltaX` **e** `deltaY` simultaneamente — o que o distingue do scroll de mouse comum (apenas `deltaY`).

```tsx
// Detectar trackpad vs mouse wheel
function isTrackpadPan(e: WheelEvent): boolean {
  // Trackpad: deltaMode === 0 (pixels) e valores fracionários ou pequenos
  // Mouse wheel: deltaMode === 1 (linhas) ou valores múltiplos de 100/120
  return e.deltaMode === 0 && !e.ctrlKey && !e.metaKey
}
```

---

### IMPLEMENTAÇÃO — `CanvasInfiniteArea` com suporte a two-finger pan

```tsx
// CanvasInfiniteArea.tsx

export function CanvasInfiniteArea() {
  const {
    canvasOffset,
    setCanvasOffset,
    canvasScale,
    setCanvasScale,
  } = useDesignWorkspaceStore()

  const containerRef = useRef<HTMLDivElement>(null)

  // ── Pan com mouse drag (já existente) ──────────────────────────────────
  function handlePanStart(e: React.MouseEvent) {
    if (e.target !== e.currentTarget) return
    if (e.button !== 0) return

    const startX = e.clientX - canvasOffset.x
    const startY = e.clientY - canvasOffset.y

    function onMouseMove(ev: MouseEvent) {
      setCanvasOffset({ x: ev.clientX - startX, y: ev.clientY - startY })
    }
    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
  }

  // ── Two-finger pan + zoom com scroll/wheel ─────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function handleWheel(e: WheelEvent) {
      // Sempre prevenir o scroll padrão da página dentro do canvas
      e.preventDefault()

      const isMod = e.ctrlKey || e.metaKey

      if (isMod) {
        // ── Ctrl/Cmd + scroll → Zoom ────────────────────────────────────
        // Zoom centrado na posição do cursor
        const rect     = el.getBoundingClientRect()
        const mouseX   = e.clientX - rect.left
        const mouseY   = e.clientY - rect.top

        // Fator de zoom — trackpad tem deltas menores, normalizar
        const zoomDelta = e.deltaMode === 0
          ? -e.deltaY * 0.005   // trackpad: sensível, pequenos deltas
          : -e.deltaY * 0.05    // mouse wheel: menos sensível

        const prevScale  = canvasScale
        const nextScale  = Math.min(4, Math.max(0.1, prevScale + zoomDelta))
        const scaleDiff  = nextScale / prevScale

        // Ajustar offset para manter o ponto sob o cursor fixo
        setCanvasOffset(prev => ({
          x: mouseX - (mouseX - prev.x) * scaleDiff,
          y: mouseY - (mouseY - prev.y) * scaleDiff,
        }))
        setCanvasScale(nextScale)

      } else {
        // ── Two-finger drag / scroll → Pan ──────────────────────────────
        // deltaX e deltaY já estão em pixels quando deltaMode === 0 (trackpad)
        // Para mouse wheel (deltaMode === 1), converter linhas em pixels
        const multiplier = e.deltaMode === 1 ? 20 : 1

        setCanvasOffset(prev => ({
          x: prev.x - e.deltaX * multiplier,
          y: prev.y - e.deltaY * multiplier,
        }))
      }
    }

    // passive: false é OBRIGATÓRIO para poder chamar preventDefault()
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)

  }, [canvasOffset, canvasScale, setCanvasOffset, setCanvasScale])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ cursor: 'grab' }}
      onMouseDown={handlePanStart}
      onClick={handleBackgroundClick}
    >
      {/* Canvas branco posicionado com transform */}
      <div
        style={{
          position:        'absolute',
          transformOrigin: '0 0',
          transform:       `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
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

### STORE — `setCanvasOffset` aceita função updater

Para o zoom centrado no cursor funcionar corretamente, o `setCanvasOffset` precisa aceitar tanto um valor direto quanto uma função updater (similar ao `useState`):

```tsx
// store/useDesignWorkspaceStore.ts

interface DesignWorkspaceState {
  canvasOffset: { x: number; y: number }
  canvasScale:  number
}

interface DesignWorkspaceActions {
  setCanvasOffset: (
    offset: { x: number; y: number } |
    ((prev: { x: number; y: number }) => { x: number; y: number })
  ) => void
  setCanvasScale: (scale: number | ((prev: number) => number)) => void
}

setCanvasOffset: (offset) => set(state => ({
  canvasOffset: typeof offset === 'function'
    ? offset(state.canvasOffset)
    : offset
})),

setCanvasScale: (scale) => set(state => ({
  canvasScale: typeof scale === 'function'
    ? scale(state.canvasScale)
    : scale
})),
```

---

### SUAVIZAÇÃO — `willChange` e sem debounce

O pan por trackpad deve ser **imediato e sem delay** — qualquer debounce ou throttle causa sensação de lag. Usar `willChange: 'transform'` no elemento do canvas para que o browser pré-otimize as transformações:

```tsx
// Canvas transform container
<div
  style={{
    position:        'absolute',
    transformOrigin: '0 0',
    transform:       `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
    willChange:      'transform',  // ← hint para o browser criar composite layer
    // Sem transition — pan deve ser instantâneo (suave naturalmente pelo trackpad)
  }}
>
  <CanvasFrame />
</div>
```

> **Não usar `transition` no transform do canvas** — o trackpad já produz eventos suaves e contínuos. Adicionar CSS transition causaria "arrastar" (lag visual) durante o pan.

---

### COMPORTAMENTO EM CADA CONTEXTO

```
Usuário está com dois dedos no trackpad:

CASO 1: Gesto sobre a área CINZA do canvas
  → wheel event no CanvasInfiniteArea
  → pan normal — offset muda ✓

CASO 2: Gesto sobre o canvas BRANCO (CanvasFrame)
  → wheel event borbulha para o CanvasInfiniteArea
  (o CanvasFrame não tem handler de wheel — deixa borbulhar)
  → pan normal — offset muda ✓

CASO 3: Gesto sobre um PAINEL (LeftPane, RightPanel, Timeline)
  → wheel event capturado pelo painel
  → painel faz scroll do seu próprio conteúdo (comportamento normal do overflow-y-auto)
  → canvas NÃO se move ✓

CASO 4: Ctrl/Cmd + gesto de pinch no trackpad
  → zoom centrado na posição do cursor ✓

CASO 5: Shift + scroll vertical
  → pan horizontal (comportamento padrão do browser quando Shift está pressionado)
  → deltaX é populado automaticamente pelo browser com Shift+scroll
  → pan horizontal funciona ✓
```

---

### PREVENÇÃO — Scroll da página não deve vazar

O `preventDefault()` dentro do handler de `wheel` garante que o scroll não propague para a página. Como o `CanvasInfiniteArea` cobre toda a viewport (exceto os painéis), isso é correto:

```tsx
// O addEventListener com passive: false é OBRIGATÓRIO
// React não suporta passive: false via onWheel do JSX
// Por isso usamos useEffect + addEventListener direto

el.addEventListener('wheel', handleWheel, { passive: false })
//                                          ↑ obrigatório para preventDefault funcionar
```

> **Por que não usar `onWheel` do React JSX?** React registra todos os eventos sintéticos como `passive: true` por padrão no root, o que impede `preventDefault()`. Por isso o evento nativo via `addEventListener` com `{ passive: false }` é necessário.

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Dois dedos arrastando no trackpad → canvas move suavemente em X e Y
- [ ] Scroll vertical com mouse wheel → canvas move verticalmente
- [ ] Scroll horizontal com mouse wheel → canvas move horizontalmente
- [ ] Ctrl+scroll / pinch → zoom centrado na posição do cursor
- [ ] Gesto sobre painel lateral → painel faz scroll, canvas não move
- [ ] Gesto sobre canvas branco → canvas move (evento borbulha corretamente)
- [ ] Sem lag ou delay durante o pan por trackpad
- [ ] Pan não gera entrada no histórico de undo (`history` não muda)
- [ ] Pan não interfere com seleção ou drag de elementos

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Event listener | `wheel` nativo com `{ passive: false }` |
| Multiplicador trackpad | `deltaMode === 0` → `×1` (já em pixels) |
| Multiplicador mouse wheel | `deltaMode === 1` → `×20` (linhas → pixels) |
| Zoom min | `0.1` (10%) |
| Zoom max | `4.0` (400%) |
| Fator zoom trackpad | `deltaY × -0.005` |
| Fator zoom mouse wheel | `deltaY × -0.05` |
| Canvas transform | `translate(x, y) scale(s)` |
| `transformOrigin` | `0 0` |
| `willChange` | `transform` |
| CSS transition no canvas | `none` — pan deve ser instantâneo |
| Pan no histórico | não gera snapshot — não é ação de canvas |