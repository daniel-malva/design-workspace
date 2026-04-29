Prompt direto e focado apenas nessa correção:

---

## 🧱 PROMPT V13 — Design Workspace — RightPanel visível apenas sob demanda

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

### CORREÇÃO — `RightPanel` visível apenas sob demanda

#### REGRA PRINCIPAL

O `RightPanel` é **oculto por padrão**. Ele só deve ser exibido em dois casos:

| Condição | Descrição |
|---|---|
| `selectedElementId !== null` | Um elemento foi selecionado no canvas — exibe suas propriedades |
| `rightPanelForcedOpen === true` | Um item do `LeftRail` exige que o painel direito seja exibido (uso futuro) |

Quando nenhuma dessas condições for verdadeira, o `RightPanel` simplesmente não existe na interface — o canvas ocupa todo o espaço disponível à direita.

---

### ESTADO GLOBAL

```tsx
// store/useDesignWorkspaceStore.ts
interface DesignWorkspaceState {
  selectedElementId: string | null          // null = nenhum elemento selecionado
  selectedElementType: ElementType | null   // tipo do elemento selecionado
  rightPanelForcedOpen: boolean             // para uso futuro pelo LeftRail

  // Derived — não precisa ser armazenado, calculado inline
  // isRightPanelVisible = selectedElementId !== null || rightPanelForcedOpen
}
```

---

### IMPLEMENTAÇÃO

```tsx
// RightPanel.tsx
export function RightPanel() {
  const { selectedElementId, selectedElementType, rightPanelForcedOpen } =
    useDesignWorkspaceStore()

  const isVisible = selectedElementId !== null || rightPanelForcedOpen

  // Se não visível, não renderiza nada — sem placeholder, sem espaço reservado
  if (!isVisible) return null

  return (
    <div className="absolute right-1 top-1 bottom-1 w-[268px] bg-white rounded-2xl shadow-lg z-20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <span className="text-sm font-semibold text-gray-800">
          {selectedElementType ? elementTypeLabel[selectedElementType] : 'Properties'}
        </span>
      </div>

      {/* Conteúdo scrollável — apenas vertical */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
        <PropertiesContent
          elementId={selectedElementId}
          elementType={selectedElementType}
        />
      </div>
    </div>
  )
}
```

---

### COMPORTAMENTO DOS ELEMENTOS DEPENDENTES

Com o `RightPanel` oculto, os elementos que dependem da sua presença para se posicionarem devem reagir:

**`ZoomToolbar`** — posição horizontal fixa, não reage. ✓ (já corrigido no V12)

**Botões de ação (Preview + Save)** — o `right` dos botões deve reagir:

```tsx
// Quando RightPanel visível: botões ficam à esquerda dele
// Quando RightPanel oculto: botões ficam na borda direita da tela com PANEL_OFFSET

const isRightPanelVisible = selectedElementId !== null || rightPanelForcedOpen

const buttonsRight = isRightPanelVisible
  ? RIGHT_PANEL_WIDTH + PANEL_OFFSET + PANEL_INNER_GAP   // à esquerda do painel
  : PANEL_INNER_GAP                                       // rente à borda direita

<div
  className="absolute top-1 z-30 flex items-center gap-2 h-8 transition-all duration-200 ease-in-out"
  style={{ right: `${buttonsRight}px` }}
>
  <PreviewModeToggle />
  <SaveSplitButton />
  <PushChangesButton />
</div>
```

---

### INTERAÇÃO — Seleção e deseleção no canvas

```tsx
// CanvasInfiniteArea.tsx

// Clicar em um elemento → seleciona e abre o RightPanel
function handleElementClick(elementId: string, elementType: ElementType) {
  setSelectedElementId(elementId)
  setSelectedElementType(elementType)
}

// Clicar no fundo do canvas (área vazia) → deseleciona e fecha o RightPanel
function handleCanvasBackgroundClick() {
  setSelectedElementId(null)
  setSelectedElementType(null)
}
```

---

### DIAGRAMA DOS ESTADOS

**Sem elemento selecionado — RightPanel oculto:**
```
┌──────┬────┬──────────────┬──────────────────────────────────────────────────────────┐
│      │    │              │  [Breadcrumb]                     [Preview] [Save ▾] [↑] │
│ Rail │ 4px│  Left Pane   │                                                          │
│      │    │  (se aberto) │              Canvas #E8E8E8 — full width                 │
│      │    │              │              sem RightPanel                              │
└──────┴────┴──────────────┴──────────────────────────────────────────────────────────┘
```

**Com elemento selecionado — RightPanel visível:**
```
┌──────┬────┬──────────────┬───────────────────────────────────┬────┬──────────────┬────┐
│      │    │              │  [Breadcrumb]    [Preview][Save ▾]│    │              │    │
│ Rail │ 4px│  Left Pane   │                                   │    │ Right Panel  │ 4px│
│      │    │  (se aberto) │       Canvas #E8E8E8              │    │  (visível)   │    │
│      │    │              │                                   │    │              │    │
└──────┴────┴──────────────┴───────────────────────────────────┴────┴──────────────┴────┘
```

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| `isRightPanelVisible` | `selectedElementId !== null \|\| rightPanelForcedOpen` |
| RightPanel — visibilidade padrão | `oculto` |
| RightPanel — aparece quando | elemento selecionado no canvas |
| RightPanel — aparece quando (futuro) | `rightPanelForcedOpen === true` |
| `RIGHT_PANEL_WIDTH` | `268px` |
| `PANEL_OFFSET` | `4px` |
| `PANEL_INNER_GAP` | `12px` |
| Transição dos botões de ação | `transition-all duration-200 ease-in-out` |
| Accent color | `#5B4EFF` |
| Text primary | `#111111` |
| Text secondary | `#6B6B6B` |