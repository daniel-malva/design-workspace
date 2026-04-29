Prompt direto e focado apenas nessa correção de posicionamento da ZoomToolbar:

---

## 🧱 PROMPT V10 — Design Workspace — ZoomToolbar com posicionamento fixo e equidistante

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

### CORREÇÃO — `ZoomToolbar` com posicionamento fixo e equidistante

#### REGRA PRINCIPAL

A `ZoomToolbar` tem posicionamento **fixo em relação à interface** — ela não se move quando o canvas é arrastado (pan) ou quando o zoom é alterado. Ela é um elemento de UI da **shell** da aplicação, não um elemento do canvas infinito.

Ela deve estar posicionada:
- **Horizontalmente:** centralizada dentro da área cinza disponível entre o `LeftPane` (ou `LeftRail` quando omitido) e o `RightPanel`
- **Verticalmente:** equidistante entre o fim da área de canvas visível e o topo da `Timeline` — ou seja, exatamente no meio do gap entre esses dois elementos

---

### IMPLEMENTAÇÃO

A `ZoomToolbar` vive **fora** do layer do canvas infinito. Ela é um filho direto do `CanvasArea`, posicionada com `absolute` assim como os outros elementos flutuantes da shell.

```tsx
// ZoomToolbar.tsx
export function ZoomToolbar() {
  const { activePanel, isTimelineVisible, isTimelineExpanded, canvasScale, setCanvasScale } =
    useDesignWorkspaceStore()

  const isLeftPaneVisible = activePanel !== null

  // ─── Posição horizontal ─────────────────────────────────────────────────────
  // Centralizado no gap disponível entre os painéis
  // left e right definem a área; o toolbar em si usa margin: auto dentro dela

  const areaLeft = isLeftPaneVisible
    ? LEFT_RAIL_WIDTH + PANEL_OFFSET + LEFT_PANE_WIDTH + PANEL_GAP
    : LEFT_RAIL_WIDTH + PANEL_OFFSET + PANEL_GAP

  const areaRight = RIGHT_PANEL_WIDTH + PANEL_OFFSET + PANEL_GAP

  // ─── Posição vertical ────────────────────────────────────────────────────────
  // Equidistante entre o fim do canvas e o topo da Timeline.
  // O gap entre o canvas e a toolbar é o mesmo que o gap entre a toolbar e a timeline.
  //
  // Altura da timeline + seu bottom offset:
  const timelineHeight = isTimelineExpanded ? TIMELINE_HEIGHT_EXPANDED : TIMELINE_HEIGHT
  const timelineTotalBottom = isTimelineVisible ? PANEL_GAP + timelineHeight : PANEL_GAP

  // A toolbar tem 32px de altura. O ponto de ancoragem é o `bottom`.
  // Posicionamos ela acima da timeline com metade do gap disponível:
  // bottom = timelineTotalBottom + PANEL_GAP
  // Isso cria um espaço de PANEL_GAP acima da timeline e abaixo da toolbar,
  // e o mesmo espaço se repete naturalmente até o canvas acima.
  const toolbarBottom = timelineTotalBottom + PANEL_GAP

  return (
    <div
      className="absolute z-30 flex items-center justify-center pointer-events-none transition-all duration-200 ease-in-out"
      style={{
        left: `${areaLeft}px`,
        right: `${areaRight}px`,
        bottom: `${toolbarBottom}px`,
        height: '32px',
      }}
    >
      {/* O toolbar centraliza-se com mx-auto dentro da área disponível */}
      <div className="pointer-events-auto flex items-center gap-2 bg-white rounded-xl shadow-md px-3 h-8 mx-auto">
        <button
          className="text-gray-400 hover:text-gray-700 transition-colors"
          onClick={() => setCanvasScale(s => Math.max(0.1, s - 0.1))}
        >
          <Minus size={12} />
        </button>

        <Slider
          className="w-24"
          min={10}
          max={400}
          step={5}
          value={[Math.round(canvasScale * 100)]}
          onValueChange={([v]) => setCanvasScale(v / 100)}
        />

        <button
          className="text-gray-400 hover:text-gray-700 transition-colors"
          onClick={() => setCanvasScale(s => Math.min(4, s + 0.1))}
        >
          <Plus size={12} />
        </button>

        <Separator orientation="vertical" className="h-4 mx-1" />

        <span className="text-xs text-gray-500 w-10 text-center font-mono tabular-nums">
          {Math.round(canvasScale * 100)}%
        </span>

        <Separator orientation="vertical" className="h-4 mx-1" />

        <button
          className="text-gray-400 hover:text-gray-700 transition-colors"
          onClick={() => setCanvasScale(1)}
          title="Reset zoom (100%)"
        >
          <Maximize2 size={12} />
        </button>
      </div>
    </div>
  )
}
```

---

### POR QUE `pointer-events-none` no container + `pointer-events-auto` no toolbar

O container da `ZoomToolbar` ocupa toda a largura disponível entre os painéis (`left` e `right` definidos) mas é transparente para eventos de mouse (`pointer-events-none`). Isso evita que ele bloqueie cliques e drags no canvas por baixo. Apenas o elemento visual do toolbar em si (`pointer-events-auto`) intercepta eventos.

---

### DIAGRAMA VERTICAL — Posicionamento equidistante

```
│                                                          │
│                   Canvas #E8E8E8                         │
│                                                          │
│                  CanvasFrame (branco)                    │
│                                                          │
│                                                          │
│              ↕ gap natural do canvas                     │
│   ┌──────────────────────────────────────────────────┐   │
│   │  [─]  ───────────────  [+]  │  75%  │  ⤢  │      │ ← ZoomToolbar (h: 32px)
│   └──────────────────────────────────────────────────┘   │
│              ↕ PANEL_GAP (8px)                           │
│   ┌──────────────────────────────────────────────────┐   │
│   │  ▶  ⏮  ⏭   00:00.000   ·   10:00.000       ˄   │ ← Timeline (h: 52px)
│   └──────────────────────────────────────────────────┘   │
│              ↕ PANEL_GAP (8px)                           │
└──────────────────────────────────────────────────────────┘
                      borda da tela
```

O `PANEL_GAP` de 8px aparece **acima e abaixo da Timeline**, e a `ZoomToolbar` senta-se exatamente nesse espaço superior — equidistante do fim visual do canvas e do topo da Timeline.

---

### COMPORTAMENTO QUANDO A TIMELINE ESTÁ OCULTA

Quando `isTimelineVisible === false`, a `ZoomToolbar` desce e fica posicionada com `bottom: PANEL_GAP` — rente à borda inferior da área de canvas, com o mesmo offset padrão dos demais painéis.

```tsx
const toolbarBottom = isTimelineVisible
  ? PANEL_GAP + timelineHeight + PANEL_GAP   // acima da timeline
  : PANEL_GAP                                // rente à borda inferior
```

---

### TOKENS DE DESIGN — REFERÊNCIA COMPLETA ATUALIZADA

| Token | Valor |
|---|---|
| Canvas + Left Rail background | `#E8E8E8` |
| Side panel background | `#FFFFFF` |
| Side panel border-radius | `16px` → `rounded-2xl` |
| ZoomToolbar border-radius | `12px` → `rounded-xl` |
| ZoomToolbar height | `32px` |
| `PANEL_OFFSET` | `4px` — offset das bordas externas dos painéis |
| `PANEL_GAP` | `8px` — espaço uniforme entre painéis adjacentes |
| `PANEL_INNER_GAP` | `12px` — espaço entre painel e breadcrumb/botões |
| `LEFT_RAIL_WIDTH` | `64px` |
| `LEFT_PANE_WIDTH` | `260px` |
| `RIGHT_PANEL_WIDTH` | `268px` |
| `TIMELINE_HEIGHT` | `52px` colapsada |
| `TIMELINE_HEIGHT_EXPANDED` | `180px` expandida |
| Transição | `transition-all duration-200 ease-in-out` |
| Accent color | `#5B4EFF` |
| Text primary | `#111111` |
| Text secondary | `#6B6B6B` |