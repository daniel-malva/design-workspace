Prompt direto e focado apenas nessa correção:

---

## 🧱 PROMPT V12 — Design Workspace — ZoomToolbar com posição horizontal fixa

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

### CORREÇÃO — `ZoomToolbar` com posição horizontal sempre fixa

#### REGRA PRINCIPAL

A `ZoomToolbar` **não reage à abertura ou fechamento dos painéis laterais**. Ela tem uma posição horizontal **fixa e imutável** — centralizada em relação à largura total da área cinza entre o `LeftRail` e a borda direita da tela — independentemente de o `LeftPane` ou o `RightPanel` estarem visíveis ou não.

Ela é um controle de UI da shell, não do conteúdo. Seu eixo X nunca muda.

---

### IMPLEMENTAÇÃO

```tsx
// ZoomToolbar.tsx

// A posição horizontal é calculada UMA única vez com base em valores fixos de layout.
// Ela nunca depende de activePanel, isLeftPaneVisible ou qualquer estado dinâmico.

const TOOLBAR_CENTER_LEFT = LEFT_RAIL_WIDTH  // âncora fixa: borda direita do LeftRail
const TOOLBAR_CENTER_RIGHT = 0               // âncora fixa: borda direita da tela

export function ZoomToolbar() {
  const { isTimelineVisible, isTimelineExpanded, canvasScale, setCanvasScale } =
    useDesignWorkspaceStore()
  // ⚠️ activePanel deliberadamente NÃO desestruturado aqui — não é usado

  // ─── Posição vertical — única variável dinâmica permitida ─────────────────
  const timelineHeight = isTimelineExpanded ? TIMELINE_HEIGHT_EXPANDED : TIMELINE_HEIGHT
  const toolbarBottom = isTimelineVisible
    ? PANEL_GAP + timelineHeight + PANEL_GAP
    : PANEL_GAP

  return (
    <div
      className="absolute z-30 flex items-center justify-center pointer-events-none"
      style={{
        // Horizontal: fixo, do fim do LeftRail até a borda direita da tela
        left: `${LEFT_RAIL_WIDTH}px`,
        right: '0px',

        // Vertical: único eixo que reage ao estado da timeline
        bottom: `${toolbarBottom}px`,
        height: '32px',

        // SEM transition no eixo horizontal — apenas vertical pode animar
        transition: 'bottom 200ms ease-in-out',
      }}
    >
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

### O QUE MUDA VS. VERSÃO ANTERIOR

| | V10 / V11 | V12 (atual) |
|---|---|---|
| `left` do container | Calculado dinamicamente conforme `activePanel` | **Fixo:** `LEFT_RAIL_WIDTH` sempre |
| `right` do container | Calculado dinamicamente conforme `RIGHT_PANEL_WIDTH` | **Fixo:** `0px` sempre |
| `bottom` | Dinâmico conforme timeline | Dinâmico conforme timeline ✓ |
| `transition` | `transition-all` (movia horizontalmente) | `transition: bottom` apenas |
| Depende de `activePanel` | Sim | **Não** |

---

### DIAGRAMA

```
├── LeftRail ──┤←────────────── área total fixa ──────────────────────────────────────→│
   (64px fixo)  left: 64px fixo                                          right: 0px fixo

                           [─────── ZoomToolbar ───────]
                                  sempre centralizada
                             independente dos side panes

         ┌──────────────┐                              ┌──────────────┐
         │  Left Pane   │     Canvas #E8E8E8           │ Right Panel  │
         │  (aparece /  │                              │  (aparece /  │
         │  desaparece) │                              │  desaparece) │
         └──────────────┘                              └──────────────┘
```

A `ZoomToolbar` flutua acima de tudo, centrada na área total entre o `LeftRail` e a borda direita — os painéis que abrem e fecham por baixo dela não interferem na sua posição.

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| ZoomToolbar `left` | `LEFT_RAIL_WIDTH` = `64px` — **nunca muda** |
| ZoomToolbar `right` | `0px` — **nunca muda** |
| ZoomToolbar `bottom` | Dinâmico: depende apenas da `Timeline` |
| ZoomToolbar `transition` | `transition: bottom 200ms ease-in-out` — **só vertical** |
| ZoomToolbar height | `32px` |
| ZoomToolbar border-radius | `rounded-xl` = `12px` |
| `PANEL_GAP` | `8px` |
| `TIMELINE_HEIGHT` | `52px` |
| `TIMELINE_HEIGHT_EXPANDED` | `180px` |