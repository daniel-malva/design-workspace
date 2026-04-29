---

## 🧱 PROMPT V30 — Design Workspace — ActivityPanel: regra de exibição definitiva + Timeline responsiva preservada

---

### STACK & BOAS PRÁTICAS

```
Stack: React + TypeScript + Tailwind CSS + shadcn/ui components
Boas práticas:
- Componentes reutilizáveis nomeados semanticamente por função
- TypeScript com interfaces e tipos explícitos para todas as props
- Tailwind para estilização, sem CSS inline ou arquivos .css separados
- shadcn/ui para Tabs, Separator, Input, Button
- Estado global via Zustand (useDesignWorkspaceStore)
```

---

### REGRA DEFINITIVA — Visibilidade do `RightPanel`

O `RightPanel` tem **três estados possíveis**, com prioridade decrescente:

```
PRIORIDADE 1 — Settings
  activePanel === 'settings'
  → Exibe: SettingsPanel
  → RightPanel: visível

PRIORIDADE 2 — Elemento selecionado
  selectedElementId !== null
  → Exibe: PropertiesContent (Text / Placeholder / Shape / Icon)
  → RightPanel: visível

PRIORIDADE 3 — Canvas com elementos, nada selecionado
  canvasElements.length > 0 && selectedElementId === null && activePanel !== 'settings'
  → Exibe: ActivityPanel (Event Log + Comments)
  → RightPanel: visível

NENHUMA CONDIÇÃO ATENDIDA
  Canvas vazio OU nenhuma das acima
  → RightPanel: oculto (return null)
```

```tsx
// RightPanel.tsx
export function RightPanel() {
  const {
    selectedElementId,
    selectedElementType,
    activePanel,
    canvasElements,
  } = useDesignWorkspaceStore()

  // ── Determinar conteúdo e visibilidade ─────────────────────────
  const isSettings    = activePanel === 'settings'
  const hasSelection  = selectedElementId !== null
  const showActivity  = canvasElements.length > 0
                        && !hasSelection
                        && !isSettings

  const isVisible = isSettings || hasSelection || showActivity
  if (!isVisible) return null

  const renderContent = () => {
    if (isSettings)   return <SettingsPanel />
    if (hasSelection) return (
      <PropertiesContent
        elementId={selectedElementId}
        elementType={selectedElementType}
      />
    )
    if (showActivity) return <ActivityPanel />
    return null
  }

  return (
    <div
      className="absolute right-1 top-1 bottom-1 w-[268px] bg-white rounded-2xl shadow-lg z-20 flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()} // não propaga para o fundo do canvas
    >
      {renderContent()}
    </div>
  )
}
```

---

### GATILHOS DE EXIBIÇÃO DO `ActivityPanel`

O `ActivityPanel` é acionado por **qualquer ação que resulte em nenhum elemento selecionado** enquanto o canvas tiver elementos:

```tsx
// 1. Clicar no fundo cinza infinito (já implementado no V20)
function handleBackgroundClick() {
  setActivePanel(null)     // fecha LeftPane
  selectElement(null)      // selectedElementId = null → ActivityPanel aparece
}

// 2. Pressionar Escape sem elemento selecionado (já implementado no V23)
// → selectElement(null) → ActivityPanel aparece

// 3. Deletar o único elemento selecionado (já implementado no V17)
// → após deleteElement: selectedElementId = null → ActivityPanel aparece
//   (desde que canvasElements.length > 0 após a deleção)

// 4. Ao iniciar a aplicação com elementos pré-existentes
// → selectedElementId = null por padrão → ActivityPanel aparece imediatamente

// 5. Clicar em qualquer área do canvas fora de um elemento
// (stopPropagation nos elementos garante que o fundo recebe o clique)
```

---

### TIMELINE — Responsividade preservada e expandida

A `Timeline` já reage à visibilidade do `LeftPane` e do `RightPanel` (implementado no V14). Agora o `RightPanel` tem **três condições** de visibilidade em vez de duas — a lógica da Timeline deve refletir isso:

```tsx
// Timeline.tsx — lógica de posicionamento atualizada
export function Timeline() {
  const {
    activePanel,
    selectedElementId,
    canvasElements,
    isTimelineVisible,
    isTimelineExpanded,
  } = useDesignWorkspaceStore()

  const isLeftPaneVisible = activePanel !== null && activePanel !== 'settings'

  // RightPanel visível nas mesmas 3 condições do RightPanel
  const isRightPanelVisible =
    activePanel === 'settings' ||
    selectedElementId !== null ||
    (canvasElements.length > 0 && selectedElementId === null && activePanel !== 'settings')

  const leftPosition = isLeftPaneVisible
    ? LEFT_RAIL_WIDTH + PANEL_OFFSET + LEFT_PANE_WIDTH + PANEL_GAP
    : LEFT_RAIL_WIDTH + PANEL_OFFSET + PANEL_GAP

  const rightPosition = isRightPanelVisible
    ? RIGHT_PANEL_WIDTH + PANEL_OFFSET + PANEL_GAP
    : PANEL_GAP

  const height = isTimelineExpanded ? TIMELINE_HEIGHT_EXPANDED : TIMELINE_HEIGHT

  if (!isTimelineVisible) return null

  return (
    <div
      className="absolute bg-white rounded-2xl shadow-lg overflow-hidden z-20 flex flex-col"
      style={{
        left:   `${leftPosition}px`,
        right:  `${rightPosition}px`,
        bottom: `${PANEL_GAP}px`,
        height: `${height}px`,
        transition: 'left 200ms ease-in-out, right 200ms ease-in-out, height 200ms ease-in-out',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <TimelineControls />
      {isTimelineExpanded && <TimelineTracks />}
    </div>
  )
}
```

---

### DIAGRAMA COMPLETO — Todos os estados do layout

**Canvas vazio — nada selecionado:**
```
│ Rail │ gap │                    Canvas #E8E8E8                    │ gap │
│      │     │  [Breadcrumb]                          [Prev][Save]  │     │
│      │     │                                                       │     │
│      │     │  ┌─────────────────────────────────────────────────┐  │     │
│      │     │  │              Timeline (full width)              │  │     │
│      │     │  └─────────────────────────────────────────────────┘  │     │
```

**Canvas com elementos, nada selecionado (clicar no fundo cinza):**
```
│ Rail │ gap │              Canvas #E8E8E8              │ gap │ ActivityPanel │ gap │
│      │     │  [Breadcrumb]            [Prev][Save]    │     │  Event Log    │     │
│      │     │                                          │     │  Comments     │     │
│      │     │  ┌──────────────────────────────────┐    │     │               │     │
│      │     │  │  Timeline (reduzida à esquerda   │    │     │               │     │
│      │     │  │  do ActivityPanel)               │    │     │               │     │
│      │     │  └──────────────────────────────────┘    │     │               │     │
```

**Elemento selecionado:**
```
│ Rail │ gap │ LeftPane │ gap │    Canvas    │ gap │ PropertiesPanel │ gap │
│      │     │          │     │              │     │  Text / Shape   │     │
│      │     │  ┌───────────────────────┐    │     │  / Placeholder  │     │
│      │     │  │  Timeline (entre os   │    │     │                 │     │
│      │     │  │  dois painéis)        │    │     │                 │     │
│      │     │  └───────────────────────┘    │     │                 │     │
```

**Settings aberto:**
```
│ Rail │ gap │              Canvas #E8E8E8              │ gap │ SettingsPanel │ gap │
│      │     │  [Breadcrumb]            [Prev][Save]    │     │  Template     │     │
│      │     │                                          │     │  Components   │     │
│      │     │  ┌──────────────────────────────────┐    │     │               │     │
│      │     │  │  Timeline (reduzida)              │    │     │               │     │
│      │     │  └──────────────────────────────────┘    │     │               │     │
```

---

### TRANSIÇÕES — Animação fluida entre estados

Quando o `ActivityPanel` aparece/desaparece, os elementos vizinhos animam:

```tsx
// Botões de ação (Preview + Save) — reagem ao RightPanel
const buttonsRight = isRightPanelVisible
  ? RIGHT_PANEL_WIDTH + PANEL_OFFSET + PANEL_INNER_GAP
  : PANEL_INNER_GAP

// Timeline — right anima ao abrir/fechar o ActivityPanel
// (já coberto pela transition: 'right 200ms ease-in-out' no V14)

// BreadcrumbNav — left anima ao abrir/fechar o LeftPane
// (já coberto pela transition: 'left 200ms ease-in-out' no V6)
```

Todas as transições usam `200ms ease-in-out` — consistente com todos os painéis anteriores.

---

### CHECKLIST DE VALIDAÇÃO

Antes de considerar o comportamento correto, verificar:

- [ ] Clicar no fundo cinza → `selectedElementId = null` → `ActivityPanel` aparece
- [ ] Clicar em elemento → `selectedElementId = id` → `PropertiesPanel` substitui `ActivityPanel`
- [ ] Clicar fora do elemento (no fundo) → volta ao `ActivityPanel`
- [ ] Deletar elemento selecionado → se ainda há elementos, `ActivityPanel` → se canvas ficou vazio, `RightPanel` fecha
- [ ] Clicar em Settings → `SettingsPanel` → `ActivityPanel` não aparece (settings tem prioridade)
- [ ] `Timeline` encolhe à direita quando `RightPanel` está visível (qualquer estado)
- [ ] `Timeline` expande quando `RightPanel` fecha (canvas vazio)
- [ ] Todos os `stopPropagation` nos painéis estão corretos
- [ ] Transições de `right` da Timeline são suaves (200ms)
- [ ] Botões de ação (Preview + Save) reposicionam ao abrir/fechar o `RightPanel`

---

### TOKENS DE DESIGN — REFERÊNCIA CONSOLIDADA

| Token | Valor |
|---|---|
| Canvas + LeftRail background | `#E8E8E8` |
| RightPanel background | `#FFFFFF` |
| RightPanel border-radius | `rounded-2xl` = `16px` |
| `PANEL_OFFSET` | `4px` |
| `PANEL_GAP` | `8px` |
| `PANEL_INNER_GAP` | `12px` |
| `LEFT_RAIL_WIDTH` | `64px` |
| `LEFT_PANE_WIDTH` | `260px` |
| `RIGHT_PANEL_WIDTH` | `268px` |
| `TIMELINE_HEIGHT` | `52px` colapsada |
| `TIMELINE_HEIGHT_EXPANDED` | `180px` expandida |
| Transição padrão | `200ms ease-in-out` |
| ActivityPanel — trigger | `canvasElements.length > 0 && selectedElementId === null && activePanel !== 'settings'` |
| SettingsPanel — trigger | `activePanel === 'settings'` |
| PropertiesPanel — trigger | `selectedElementId !== null` |
| RightPanel oculto quando | nenhuma das três condições acima |