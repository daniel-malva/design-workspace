Prompt direto e focado nessa funcionalidade:

---

## 🧱 PROMPT V41 — Design Workspace — Background Placeholder: tamanho automático do canvas + layer mais abaixo

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

O Dynamic Placeholder de **Background** tem comportamento especial ao ser inserido:

| Propriedade | Comportamento |
|---|---|
| Posição X | `0` — alinhado à borda esquerda do canvas |
| Posição Y | `0` — alinhado ao topo do canvas |
| Largura | `CANVAS_WIDTH` (600px) — ocupa todo o canvas |
| Altura | `CANVAS_HEIGHT` (600px) — ocupa todo o canvas |
| Ordem no array | **inserido no índice 0** — layer mais abaixo de todas |
| Nome padrão | `"Background"` |

---

### IMPLEMENTAÇÃO — `insertElement` com lógica especial para Background

```tsx
// store/useDesignWorkspaceStore.ts

const CANVAS_WIDTH  = 600
const CANVAS_HEIGHT = 600

insertElement: (element) => {
  const newId = crypto.randomUUID()
  const name  = element.name ?? defaultLayerName(element.type)

  const isBackground = element.placeholderVariant === 'background'

  // Background placeholder: sobrescreve posição e tamanho
  const finalElement: CanvasElement = isBackground
    ? {
        ...element,
        id:     newId,
        name,
        x:      0,
        y:      0,
        width:  CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      }
    : { ...element, id: newId, name }

  set(state => ({
    canvasElements: isBackground
      // Background vai para o índice 0 — renderizado primeiro = mais abaixo
      ? [finalElement, ...state.canvasElements]
      // Demais elementos vão para o final — renderizados por cima
      : [...state.canvasElements, finalElement],

    selectedElementIds:  [newId],
    selectedElementType: element.type,
  }))
},
```

---

### REGRA DE RENDERIZAÇÃO — z-index reflete posição no array

O `CanvasFrame` já renderiza os elementos na ordem do array — o índice 0 é renderizado primeiro (mais abaixo). Com o Background no índice 0, ele automaticamente fica atrás de todos os outros elementos:

```tsx
// CanvasFrame.tsx — ordenação para renderização
// Grupos antes dos filhos, mas Background sempre no fundo
const orderedElements = useMemo(() => {
  const groups    = canvasElements.filter(el => el.type === 'group')
  const children  = canvasElements.filter(el => el.type !== 'group' && !el.groupId)
  return [...groups, ...children]
  // O Background já está no índice 0 do array original,
  // então aparece primeiro aqui também — z-index mais baixo ✓
}, [canvasElements])
```

---

### REGRA DO LAYERS PANEL — Background sempre na base da lista

No `LayersPanel`, a lista é exibida em **ordem inversa** do array (topo do canvas = topo da lista). Como o Background está no índice 0 do array, ele aparece na **base da lista** — exatamente como esperado:

```
canvasElements = [background(idx 0), text(idx 1), shape(idx 2)]

LayersPanel (ordem inversa para display):
  ┌─────────────────────────────────────┐
  │  T  Shape          ← idx 2 (topo)   │
  │  T  Text           ← idx 1          │
  │  ◑  Background     ← idx 0 (base)   │  ← sempre aqui
  └─────────────────────────────────────┘
```

---

### INSERÇÃO A PARTIR DO `InsertDynamicPlaceholderPanel`

```tsx
// InsertDynamicPlaceholderPanel.tsx
const { insertElement } = useDesignWorkspaceStore()

// Background — posição e tamanho definidos automaticamente no store
<PlaceholderCard
  variant="background"
  onClick={() => insertElement({
    type: 'placeholder-background',
    placeholderVariant: 'background',
    // x, y, width, height são ignorados — o store sobrescreve para 0,0,600,600
    x: 0, y: 0, width: 600, height: 600,
  })}
/>

// Demais placeholders — posição central padrão
<PlaceholderCard
  variant="logo"
  onClick={() => insertElement({
    type: 'placeholder-logo',
    placeholderVariant: 'logo',
    x: 225, y: 225, width: 150, height: 150,
  })}
/>
```

---

### COMPORTAMENTO DO BACKGROUND NO CANVAS

O `PlaceholderElement` com `variant="background"` deve preencher completamente a área do `CanvasFrame` sem borda arredondada — já que ocupa 600×600 e o canvas tem `overflow: hidden`:

```tsx
// PlaceholderElement.tsx — variante background
if (variant === 'background') {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        // Borda tracejada verde por dentro, sem border-radius
        border: '2px dashed #22C55E',
        backgroundColor: '#22C55E10',
      }}
    >
      <span
        className="text-xs font-semibold text-white px-2 py-0.5 rounded-full"
        style={{ backgroundColor: '#22C55E' }}
      >
        Background
      </span>
    </div>
  )
}
```

---

### REGRA ADICIONAL — Apenas um Background por canvas

Não deve ser possível inserir mais de um Background. Se já existe um, o botão no `InsertDynamicPlaceholderPanel` deve ficar desabilitado com um tooltip explicativo:

```tsx
// InsertDynamicPlaceholderPanel.tsx
const { canvasElements } = useDesignWorkspaceStore()
const hasBackground = canvasElements.some(
  el => el.placeholderVariant === 'background'
)

<PlaceholderCard
  variant="background"
  disabled={hasBackground}
  disabledTooltip="Only one Background per template"
  onClick={() => !hasBackground && insertElement({ ... })}
/>
```

```tsx
// PlaceholderCard.tsx — estado desabilitado
<div
  className={`
    relative flex items-center justify-center rounded-xl h-[110px] cursor-pointer
    ${disabled
      ? 'opacity-40 cursor-not-allowed'
      : 'hover:opacity-80'
    }
  `}
  style={{ border: `2px dashed ${config.borderColor}` }}
  title={disabled ? disabledTooltip : undefined}
  onClick={disabled ? undefined : onClick}
>
  ...
</div>
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Inserir Background → ocupa 600×600, posicionado em (0,0)
- [ ] Background aparece atrás de todos os outros elementos no canvas
- [ ] No LayersPanel, Background aparece na base da lista
- [ ] Inserir texto/shape após o Background → aparecem por cima
- [ ] Inserir segundo Background → botão desabilitado, tooltip explicativo
- [ ] Selecionar Background → RightPanel exibe `BackgroundPropertiesPanel`
- [ ] Background pode ser renomeado normalmente no LayersPanel

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Background x | `0` |
| Background y | `0` |
| Background width | `CANVAS_WIDTH` = `600px` |
| Background height | `CANVAS_HEIGHT` = `600px` |
| Background índice no array | `0` — sempre primeiro |
| Background border-radius no canvas | nenhum (ocupa o frame inteiro) |
| Background border color | `#22C55E` (verde) |
| Background fill | `#22C55E10` (10% opacidade) |
| Layer position | base da lista (último no display) |
| Limite por canvas | **1** Background máximo |