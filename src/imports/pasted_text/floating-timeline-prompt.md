Deixa eu confirmar o visual da timeline no Figma antes de gerar o prompt.Perfeito — consigo ver claramente no Figma que a timeline fica posicionada entre os dois painéis, flutuando sobre o canvas cinza assim como os side panes. Aqui está o prompt:

---

## 🧱 PROMPT V7 — Design Workspace — Timeline Flutuante como Painel de Footer

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

### CORREÇÃO — `Timeline` como Painel Flutuante no Footer

#### REGRA PRINCIPAL

A `Timeline` **não é uma barra fixa no footer da interface**. Ela é um painel flutuante, com o mesmo comportamento visual dos `LeftPane` e `RightPanel` — fundo branco, `border-radius: 16px`, offset de `4px` em relação às suas bordas externas, e `box-shadow`.

A diferença é que ela é um **painel horizontal posicionado na base do canvas**, e ela **não ocupa toda a largura da tela**. Ela fica contida entre o `LeftPane` e o `RightPanel` — ou seja, horizontalmente ela começa onde o `LeftPane` termina e vai até onde o `RightPanel` começa.

---

### POSICIONAMENTO

```tsx
// constants/layout.ts
export const PANEL_OFFSET = 4           // px
export const LEFT_RAIL_WIDTH = 64       // px
export const LEFT_PANE_WIDTH = 260      // px — quando visível
export const RIGHT_PANEL_WIDTH = 268    // px
export const TIMELINE_HEIGHT = 52       // px colapsada
export const TIMELINE_HEIGHT_EXPANDED = 180 // px expandida
```

```tsx
// Timeline.tsx
import { useDesignWorkspaceStore } from '@/hooks/useDesignWorkspaceStore'
import {
  PANEL_OFFSET,
  LEFT_RAIL_WIDTH,
  LEFT_PANE_WIDTH,
  RIGHT_PANEL_WIDTH,
  TIMELINE_HEIGHT,
  TIMELINE_HEIGHT_EXPANDED,
} from '@/constants/layout'

export function Timeline() {
  const { activePanel, isTimelineVisible, isTimelineExpanded } = useDesignWorkspaceStore()
  const isLeftPaneVisible = activePanel !== null

  // Posição left: começa após o LeftRail + offset do LeftPane + largura do LeftPane + gap
  // Se o LeftPane estiver omitido, começa após o LeftRail + offset
  const leftPosition = isLeftPaneVisible
    ? LEFT_RAIL_WIDTH + PANEL_OFFSET + LEFT_PANE_WIDTH + PANEL_OFFSET
    : LEFT_RAIL_WIDTH + PANEL_OFFSET

  // Posição right: termina antes do RightPanel + seu offset
  const rightPosition = RIGHT_PANEL_WIDTH + PANEL_OFFSET

  const height = isTimelineExpanded ? TIMELINE_HEIGHT_EXPANDED : TIMELINE_HEIGHT

  if (!isTimelineVisible) return null

  return (
    <div
      className="absolute bottom-1 bg-white rounded-2xl shadow-lg overflow-hidden z-20 flex flex-col transition-all duration-200 ease-in-out"
      style={{
        left: `${leftPosition}px`,
        right: `${rightPosition}px`,
        height: `${height}px`,
      }}
    >
      <TimelineControls />
      {isTimelineExpanded && <TimelineTracks />}
    </div>
  )
}
```

> **`bottom-1`** = 4px de offset em relação à base da área do canvas — mesmo padrão dos outros painéis.

---

### COMPORTAMENTO DINÂMICO

A `Timeline` deve **reagir à visibilidade do `LeftPane`**, assim como o `BreadcrumbNav` — quando o `LeftPane` fecha, ela expande sua borda esquerda para preencher o espaço, mantendo sempre o `PANEL_OFFSET` de separação.

```tsx
// Com LeftPane visível:
// left = 64 + 4 + 260 + 4 = 332px

// Com LeftPane omitido:
// left = 64 + 4 = 68px
```

A transição também deve ser animada com `transition-all duration-200 ease-in-out` para acompanhar o slide do `LeftPane`.

---

### DIAGRAMA DE LAYOUT COMPLETO

**Com `LeftPane` e `RightPanel` visíveis:**

```
┌──────┬────┬──────────────┬──────────────────────────────────┬────┬──────────────┬────┐
│      │ 4px│              │                                  │    │              │ 4px│
│ Rail │    │  Left Pane   │         Canvas #E8E8E8           │    │ Right Panel  │    │
│      │    │  rounded-2xl │                                  │    │  rounded-2xl │    │
│      │    │              │   ┌──────────────────────────┐   │    │              │    │
│      │    │              │ 4px│       Timeline          │4px│    │              │    │
│      │    │              │   │      rounded-2xl         │   │    │              │    │
│      │    │              │   └──────────────────────────┘   │    │              │    │
│      │    │              │              4px                  │    │              │    │
└──────┴────┴──────────────┴──────────────────────────────────┴────┴──────────────┴────┘
```

**Com `LeftPane` omitido:**

```
┌──────┬────┬──────────────────────────────────────────────────┬────┬──────────────┬────┐
│      │    │                                                  │    │              │ 4px│
│ Rail │ 4px│              Canvas #E8E8E8                      │    │ Right Panel  │    │
│      │    │                                                  │    │  rounded-2xl │    │
│      │    │   ┌──────────────────────────────────────────┐   │    │              │    │
│      │    │ 4px│              Timeline                   │4px│    │              │    │
│      │    │   │             rounded-2xl                  │   │    │              │    │
│      │    │   └──────────────────────────────────────────┘   │    │              │    │
│      │    │                    4px                            │    │              │    │
└──────┴────┴──────────────────────────────────────────────────┴────┴──────────────┴────┘
```

---

### ESTRUTURA INTERNA DA `Timeline`

```tsx
// TimelineControls.tsx — barra de controles sempre visível
<div className="flex items-center gap-3 px-4 h-[52px] border-b border-gray-100">
  {/* Playback */}
  <button><SkipBack size={14} /></button>
  <button><Play size={14} /></button>
  <button><SkipForward size={14} /></button>

  {/* Timecodes */}
  <span className="text-xs text-gray-500 font-mono">00:00.000 (0 Frames)</span>
  <span className="text-xs text-gray-400">·</span>
  <span className="text-xs text-gray-400 font-mono">10:00.000 (240 Frames)</span>

  {/* Spacer */}
  <div className="flex-1" />

  {/* Expand/Collapse toggle */}
  <button onClick={toggleExpanded}>
    <ChevronUp size={14} className={isExpanded ? 'rotate-180' : ''} />
  </button>

  {/* Zoom slider */}
  <Slider className="w-24" min={0} max={100} />
</div>

// TimelineTracks.tsx — área de tracks, visível apenas quando expandida
<div className="flex-1 overflow-y-auto">
  {layers.map(layer => (
    <TimelineTrack key={layer.id} layer={layer} />
  ))}
</div>
```

---

### TOKENS DE DESIGN — REFERÊNCIA COMPLETA

| Token | Valor |
|---|---|
| Canvas background | `#E8E8E8` |
| Side panel background | `#FFFFFF` |
| Side panel border-radius | `16px` → `rounded-2xl` |
| `PANEL_OFFSET` | `4px` → `bottom-1`, `left`, `right` calculados |
| `LEFT_RAIL_WIDTH` | `64px` |
| `LEFT_PANE_WIDTH` | `260px` |
| `RIGHT_PANEL_WIDTH` | `268px` |
| `TIMELINE_HEIGHT` | `52px` colapsada |
| `TIMELINE_HEIGHT_EXPANDED` | `180px` expandida |
| Transição dos painéis | `transition-all duration-200 ease-in-out` |
| Accent color | `#5B4EFF` |
| Text primary | `#111111` |
| Text secondary | `#6B6B6B` |
| Border interno | `#E2E2E2` |