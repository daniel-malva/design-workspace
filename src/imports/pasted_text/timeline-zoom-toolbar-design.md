Deixa eu confirmar o visual da toolbar de zoom e o espaçamento da timeline no Figma.Perfeito — consigo ver claramente no Figma:
1. A **Timeline** fica suspensa com espaçamento uniforme em relação aos dois painéis laterais e à borda inferior
2. A **toolbar de zoom** (slider + controles) está posicionada verticalmente **entre o canvas e a timeline**, centralizada horizontalmente dentro da área disponível

Aqui está o prompt:

---

## 🧱 PROMPT V9 — Design Workspace — Timeline com espaçamento uniforme + Zoom Toolbar centralizada

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

### CORREÇÃO 1 — `Timeline` com espaçamento uniforme e simétrico

#### REGRA PRINCIPAL

A `Timeline` deve manter **exatamente o mesmo espaçamento** em relação ao `LeftPane`, ao `RightPanel` e à borda inferior da tela. Esse espaçamento é o `PANEL_GAP` — uma constante única reutilizada em todos os lados — garantindo uniformidade visual perfeita.

```tsx
// constants/layout.ts
export const PANEL_OFFSET = 4           // px — offset das bordas externas (topo, base, esq, dir)
export const PANEL_GAP = 8              // px — espaço entre painéis adjacentes (Timeline ↔ LeftPane, Timeline ↔ RightPanel, Timeline ↔ borda inferior)
export const LEFT_RAIL_WIDTH = 64       // px
export const LEFT_PANE_WIDTH = 260      // px
export const RIGHT_PANEL_WIDTH = 268    // px
export const TIMELINE_HEIGHT = 52       // px — colapsada
export const TIMELINE_HEIGHT_EXPANDED = 180 // px — expandida
```

```tsx
// Timeline.tsx
export function Timeline() {
  const { activePanel, isTimelineVisible, isTimelineExpanded } = useDesignWorkspaceStore()
  const isLeftPaneVisible = activePanel !== null

  // left: após o LeftRail + offset do LeftPane + largura do LeftPane + gap uniforme
  // Se LeftPane omitido: após o LeftRail + offset + gap
  const leftPosition = isLeftPaneVisible
    ? LEFT_RAIL_WIDTH + PANEL_OFFSET + LEFT_PANE_WIDTH + PANEL_GAP
    : LEFT_RAIL_WIDTH + PANEL_OFFSET + PANEL_GAP

  // right: largura do RightPanel + offset + gap uniforme
  const rightPosition = RIGHT_PANEL_WIDTH + PANEL_OFFSET + PANEL_GAP

  // bottom: mesmo PANEL_GAP aplicado embaixo — distância da borda inferior = distância lateral
  const bottomPosition = PANEL_GAP

  const height = isTimelineExpanded ? TIMELINE_HEIGHT_EXPANDED : TIMELINE_HEIGHT

  if (!isTimelineVisible) return null

  return (
    <div
      className="absolute bg-white rounded-2xl shadow-lg overflow-hidden z-20 flex flex-col transition-all duration-200 ease-in-out"
      style={{
        left: `${leftPosition}px`,
        right: `${rightPosition}px`,
        bottom: `${bottomPosition}px`,
        height: `${height}px`,
      }}
    >
      <TimelineControls />
      {isTimelineExpanded && <TimelineTracks />}
    </div>
  )
}
```

> **A chave da uniformidade:** `PANEL_GAP` é **idêntico** nos três lados da Timeline — esquerda (em relação ao `LeftPane`), direita (em relação ao `RightPanel`) e baixo (em relação à borda da tela). Um único valor controla a simetria de todas as direções.

---

### CORREÇÃO 2 — `ZoomToolbar` posicionada entre o canvas e a Timeline

#### REGRA PRINCIPAL

A `ZoomToolbar` é um pequeno controle flutuante (slider de zoom + percentual + botões de fit/reset) que deve ser posicionado **verticalmente entre o canvas infinito e o topo da Timeline**, e **centralizado horizontalmente** dentro do espaço disponível entre os painéis.

```tsx
// ZoomToolbar.tsx
export function ZoomToolbar() {
  const { activePanel, isTimelineVisible, canvasScale, setCanvasScale } = useDesignWorkspaceStore()
  const isLeftPaneVisible = activePanel !== null

  // Centralizado horizontalmente no mesmo espaço que a Timeline ocupa
  const leftPosition = isLeftPaneVisible
    ? LEFT_RAIL_WIDTH + PANEL_OFFSET + LEFT_PANE_WIDTH + PANEL_GAP
    : LEFT_RAIL_WIDTH + PANEL_OFFSET + PANEL_GAP

  const rightPosition = RIGHT_PANEL_WIDTH + PANEL_OFFSET + PANEL_GAP

  // Posicionado imediatamente acima da Timeline com um pequeno gap
  const bottomPosition = isTimelineVisible
    ? PANEL_GAP + TIMELINE_HEIGHT + PANEL_GAP   // acima da timeline: gap + altura + gap
    : PANEL_GAP                                  // sem timeline: apenas o offset da borda

  return (
    <div
      className="absolute z-30 flex items-center justify-center transition-all duration-200 ease-in-out"
      style={{
        left: `${leftPosition}px`,
        right: `${rightPosition}px`,
        bottom: `${bottomPosition}px`,
        height: '32px',
      }}
    >
      {/* O toolbar em si é centralizado dentro da área disponível */}
      <div className="flex items-center gap-2 bg-white rounded-xl shadow-md px-3 h-8">
        <button onClick={() => setCanvasScale(s => Math.max(0.1, s - 0.1))}>
          <Minus size={12} />
        </button>
        <Slider
          className="w-24"
          min={10}
          max={400}
          value={[Math.round(canvasScale * 100)]}
          onValueChange={([v]) => setCanvasScale(v / 100)}
        />
        <button onClick={() => setCanvasScale(s => Math.min(4, s + 0.1))}>
          <Plus size={12} />
        </button>
        <span className="text-xs text-gray-500 w-10 text-center font-mono">
          {Math.round(canvasScale * 100)}%
        </span>
        <Separator orientation="vertical" className="h-4" />
        <button onClick={() => setCanvasScale(1)} title="Reset zoom">
          <Maximize2 size={12} />
        </button>
      </div>
    </div>
  )
}
```

---

### DIAGRAMA DE LAYOUT COMPLETO ATUALIZADO

```
┌──────┬────┬──────────────┬─────────────────────────────────────┬────┬──────────────┬────┐
│      │ 4px│              │                                     │ 4px│              │ 4px│
│      │    │  Left Pane   │          Canvas #E8E8E8             │    │ Right Panel  │    │
│ Rail │    │  bg-white    │                                     │    │  bg-white    │    │
│      │    │  rounded-2xl │                                     │    │  rounded-2xl │    │
│      │    │              │           [─── Zoom ───]            │    │              │    │
│      │    │              │  ← 8px →                  ← 8px →  │    │              │    │
│      │    │              │  ┌───────────────────────────────┐  │    │              │    │
│      │    │              │  │         Timeline              │  │    │              │    │
│      │    │              │  │         bg-white rounded-2xl  │  │    │              │    │
│      │    │              │  └───────────────────────────────┘  │    │              │    │
│      │    │              │              ↑ 8px                  │    │              │    │
└──────┴────┴──────────────┴─────────────────────────────────────┴────┴──────────────┴────┘
                                         borda da tela
```

**Os 8px (`PANEL_GAP`) aparecem em:**
- Espaço entre `LeftPane` e `Timeline` (lado esquerdo da timeline)
- Espaço entre `RightPanel` e `Timeline` (lado direito da timeline)
- Espaço entre borda inferior da tela e `Timeline` (base)
- Espaço entre `Timeline` e `ZoomToolbar` (acima da timeline)

---

### TOKENS DE DESIGN — REFERÊNCIA COMPLETA ATUALIZADA

| Token | Valor |
|---|---|
| Canvas + Left Rail background | `#E8E8E8` |
| Side panel background | `#FFFFFF` |
| Side panel border-radius | `16px` → `rounded-2xl` |
| `PANEL_OFFSET` | `4px` — offset das bordas externas dos painéis |
| `PANEL_GAP` | `8px` — espaço uniforme entre painéis adjacentes |
| `PANEL_INNER_GAP` | `12px` — espaço entre painel e elementos flutuantes (breadcrumb/botões) |
| `LEFT_RAIL_WIDTH` | `64px` |
| `LEFT_PANE_WIDTH` | `260px` |
| `RIGHT_PANEL_WIDTH` | `268px` |
| `TIMELINE_HEIGHT` | `52px` colapsada |
| `TIMELINE_HEIGHT_EXPANDED` | `180px` expandida |
| Transição dos painéis | `transition-all duration-200 ease-in-out` |
| Accent color | `#5B4EFF` |
| Text primary | `#111111` |
| Text secondary | `#6B6B6B` |