Prompt direto e focado apenas nessa regra de comportamento:

---

## 🧱 PROMPT V18 — Design Workspace — RightPanel abre automaticamente ao inserir ou selecionar qualquer elemento

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

O `RightPanel` segue uma única regra simples e consistente:

| Condição | RightPanel |
|---|---|
| Nenhum elemento selecionado | **Oculto** |
| Elemento selecionado no canvas (qualquer tipo) | **Visível** |
| Elemento recém-inserido via Insert Menu | **Visível** — inserção já seleciona automaticamente |

A inserção de um elemento **sempre o seleciona imediatamente** — portanto o `RightPanel` abre como consequência natural da seleção, sem nenhuma lógica extra.

---

### IMPLEMENTAÇÃO — `insertElement` seleciona automaticamente

A ação `insertElement` no store deve, além de adicionar o elemento ao canvas, **definir esse novo elemento como o selecionado**:

```tsx
// store/useDesignWorkspaceStore.ts
insertElement: (element) => {
  const newId = crypto.randomUUID()
  set(state => ({
    canvasElements: [
      ...state.canvasElements,
      { ...element, id: newId }
    ],
    selectedElementId: newId,          // ← seleciona imediatamente
    selectedElementType: element.type, // ← define o tipo para o RightPanel
  }))
}
```

> Com isso, qualquer chamada a `insertElement` — seja de texto, placeholder, shape ou ícone — automaticamente abre o `RightPanel` com as propriedades daquele elemento, sem nenhuma lógica adicional no componente de UI.

---

### IMPLEMENTAÇÃO — `RightPanel` reage ao `selectedElementId`

Sem mudanças na lógica de visibilidade — ela já está correta desde o V13:

```tsx
// RightPanel.tsx
export function RightPanel() {
  const { selectedElementId, selectedElementType } = useDesignWorkspaceStore()

  // Visível apenas quando há elemento selecionado
  if (!selectedElementId) return null

  return (
    <div className="absolute right-1 top-1 bottom-1 w-[268px] bg-white rounded-2xl shadow-lg z-20 flex flex-col overflow-hidden">

      {/* Header — nome do tipo do elemento selecionado */}
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <span className="text-sm font-semibold text-gray-800">
          {elementTypeLabel[selectedElementType]}
        </span>
      </div>

      {/* Conteúdo — varia conforme o tipo */}
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

### MAPEAMENTO — `elementTypeLabel`

O header do `RightPanel` exibe o nome legível do tipo do elemento selecionado:

```tsx
const elementTypeLabel: Record<ElementType, string> = {
  'text-header':            'Text',
  'text-subheader':         'Text',
  'text-body':              'Text',
  'text-template':          'Text',
  'placeholder-logo':       'Logo Placeholder',
  'placeholder-background': 'Background Placeholder',
  'placeholder-jellybean':  'Jellybean Placeholder',
  'placeholder-media':      'Media Placeholder',
  'placeholder-audio':      'Audio Placeholder',
  'shape':                  'Shape',
  'icon':                   'Icon',
  'line':                   'Line',
}
```

---

### MAPEAMENTO — `PropertiesContent`

O conteúdo do painel varia conforme o tipo — por ora cada tipo exibe um painel genérico com as propriedades básicas disponíveis. Futuramente cada um terá seu painel específico:

```tsx
// PropertiesContent.tsx
export function PropertiesContent({ elementId, elementType }: Props) {
  switch (elementType) {

    case 'text-header':
    case 'text-subheader':
    case 'text-body':
    case 'text-template':
      return <TextPropertiesPanel elementId={elementId} />

    case 'placeholder-logo':
    case 'placeholder-background':
    case 'placeholder-jellybean':
    case 'placeholder-media':
    case 'placeholder-audio':
      return <PlaceholderPropertiesPanel elementId={elementId} />

    case 'shape':
      return <ShapePropertiesPanel elementId={elementId} />

    case 'icon':
      return <IconPropertiesPanel elementId={elementId} />

    case 'line':
      return <LinePropertiesPanel elementId={elementId} />

    default:
      return <GenericPropertiesPanel elementId={elementId} />
  }
}
```

Cada painel de propriedades exibe no mínimo:
- **Position:** X, Y, W, H
- **Layer:** opacidade
- As seções específicas do tipo virão em iterações futuras

---

### FLUXO COMPLETO — Do clique no Insert ao RightPanel aberto

```
Usuário clica em "Create header" no InsertTextPanel
        ↓
insertElement({ type: 'text-header', ... }) é chamado
        ↓
Store: canvasElements recebe novo elemento
Store: selectedElementId = newId
Store: selectedElementType = 'text-header'
        ↓
CanvasFrame re-renderiza → novo TextElement aparece no canvas
        ↓
RightPanel: selectedElementId !== null → renderiza
RightPanel header: "Text"
RightPanel body: <TextPropertiesPanel />
        ↓
Usuário clica no fundo vazio do canvas
        ↓
selectElement(null) é chamado
        ↓
Store: selectedElementId = null
        ↓
RightPanel: selectedElementId === null → return null → some
```

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| RightPanel — visibilidade | `selectedElementId !== null` |
| RightPanel — abre quando | elemento inserido OU selecionado no canvas |
| RightPanel — fecha quando | `selectedElementId === null` |
| Inserção sempre seleciona | `selectedElementId = newId` imediatamente no `insertElement` |
| `RIGHT_PANEL_WIDTH` | `268px` |
| `PANEL_OFFSET` | `4px` |
| Transição de abertura | `transition-all duration-200 ease-in-out` |
| Accent color | `#5B4EFF` |
| Text primary | `#111111` |
| Text secondary | `#6B6B6B` |