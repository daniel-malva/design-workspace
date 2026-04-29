Prompt direto e focado apenas nessa correção:

---

## 🧱 PROMPT V20 — Design Workspace — Clicar no fundo do canvas fecha ambos os Side Panes

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

### REGRA PRINCIPAL

Clicar na **área cinza infinita** do canvas — ou seja, em qualquer região fora do `CanvasFrame` e fora dos painéis — deve disparar três ações simultâneas e atômicas:

| Ação | Resultado |
|---|---|
| `setActivePanel(null)` | `LeftPane` some |
| `setSelectedElementId(null)` | `RightPanel` some |
| `setSelectedElementType(null)` | tipo limpo |

---

### IMPLEMENTAÇÃO

A área cinza infinita é o container `CanvasInfiniteArea` — o div com `bg-[#E8E8E8]` que envolve tudo. O `onClick` deve ser colocado **nesse container**, não no `CanvasFrame`:

```tsx
// CanvasArea.tsx
export function CanvasArea() {
  const { setActivePanel, selectElement } = useDesignWorkspaceStore()

  function handleBackgroundClick() {
    setActivePanel(null)       // fecha o LeftPane
    selectElement(null)        // fecha o RightPanel + desseleciona
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-[#E8E8E8]">

      {/* Área cinza infinita — o clique aqui fecha tudo */}
      <div
        className="absolute inset-0 cursor-default"
        onClick={handleBackgroundClick}
      >

        {/* Canvas Frame — stopPropagation para NÃO fechar ao clicar nele */}
        <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <CanvasFrame />
        </div>

      </div>

      {/* Elementos flutuantes da shell — stopPropagation para não fechar ao interagir */}
      <BreadcrumbNav />
      <ActionButtons />
      <LeftPane />
      <RightPanel />
      <ZoomToolbar />
      <Timeline />

    </div>
  )
}
```

---

### ISOLAMENTO DO CLIQUE — `stopPropagation` obrigatório

Para que o clique no fundo funcione corretamente sem fechar os painéis ao interagir com eles, **todos os elementos sobrepostos** devem parar a propagação do evento:

```tsx
// CanvasFrame.tsx — clicar no frame branco NÃO fecha os painéis
<div
  className="relative bg-white shadow-xl"
  style={{ width: 600, height: 600 }}
  onClick={(e) => e.stopPropagation()} // ✅ impede propagação para o fundo
>
  {canvasElements.map(el => <CanvasElementRenderer key={el.id} ... />)}
</div>

// LeftPane.tsx — interagir com o painel NÃO fecha ele mesmo
<div
  className="absolute left-1 top-1 bottom-1 w-[260px] bg-white rounded-2xl shadow-lg z-20"
  onClick={(e) => e.stopPropagation()} // ✅
>
  ...
</div>

// RightPanel.tsx — interagir com o painel NÃO fecha ele
<div
  className="absolute right-1 top-1 bottom-1 w-[268px] bg-white rounded-2xl shadow-lg z-20"
  onClick={(e) => e.stopPropagation()} // ✅
>
  ...
</div>

// Timeline.tsx — interagir com a timeline NÃO fecha os painéis
<div
  className="absolute bg-white rounded-2xl shadow-lg z-20"
  onClick={(e) => e.stopPropagation()} // ✅
>
  ...
</div>

// BreadcrumbNav, ActionButtons, ZoomToolbar — mesma regra
onClick={(e) => e.stopPropagation()} // ✅ em todos
```

---

### STORE — Ação `selectElement` já limpa tudo

A ação `selectElement(null)` já deve limpar `selectedElementId` e `selectedElementType` atomicamente:

```tsx
// store/useDesignWorkspaceStore.ts
selectElement: (id: string | null) => {
  set(state => ({
    selectedElementId: id,
    selectedElementType: id
      ? state.canvasElements.find(el => el.id === id)?.type ?? null
      : null,  // ← null quando desseleciona
  }))
}

// setActivePanel(null) fecha o LeftPane
setActivePanel: (panel: LeftRailItem | null) => {
  set(() => ({ activePanel: panel }))
}
```

---

### DIAGRAMA DO FLUXO

```
Usuário clica na área cinza (fora do CanvasFrame e fora dos painéis)
        ↓
onClick do CanvasInfiniteArea dispara
        ↓
handleBackgroundClick() chamado:
  setActivePanel(null)   → activePanel = null   → LeftPane some
  selectElement(null)    → selectedElementId = null → RightPanel some
                         → selectedElementType = null
        ↓
BreadcrumbNav reposiciona para próximo ao LeftRail (sem LeftPane)
Timeline expande para toda a largura disponível
Botões de ação movem para borda direita da tela
```

```
Usuário clica dentro do LeftPane, RightPanel, Timeline ou CanvasFrame
        ↓
e.stopPropagation() impede propagação
        ↓
onClick do CanvasInfiniteArea NÃO dispara
        ↓
Nada fecha — comportamento preservado
```

---

### EXCEÇÃO — LeftRail nunca fecha os painéis

O `LeftRail` fica fora do `CanvasInfiniteArea` — portanto clicar nele não dispara o `handleBackgroundClick`. O comportamento do rail continua o mesmo: clicar em um item do rail abre o `LeftPane` com o conteúdo correspondente.

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Background click → `setActivePanel` | `null` |
| Background click → `selectElement` | `null` |
| `stopPropagation` obrigatório em | `CanvasFrame`, `LeftPane`, `RightPanel`, `Timeline`, `BreadcrumbNav`, `ActionButtons`, `ZoomToolbar` |
| Canvas background | `#E8E8E8` |
| `PANEL_OFFSET` | `4px` |
| `PANEL_GAP` | `8px` |