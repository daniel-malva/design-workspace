Deixa eu revisitar o painel de texto no Figma para capturar todos os detalhes dos modelos pré-built antes de gerar o prompt.Tenho todos os detalhes que preciso. Aqui está o prompt:

---

## 🧱 PROMPT V16 — Design Workspace — InsertTextPanel com abas Static/Variable + Galeria de Templates

---

### STACK & BOAS PRÁTICAS

```
Stack: React + TypeScript + Tailwind CSS + shadcn/ui components
Boas práticas:
- Componentes reutilizáveis nomeados semanticamente por função
- TypeScript com interfaces e tipos explícitos para todas as props
- Tailwind para estilização, sem CSS inline ou arquivos .css separados
- shadcn/ui para elementos de UI base (Tabs)
- Estado global via Zustand (useDesignWorkspaceStore)
```

---

### MELHORIA — `InsertTextPanel` com abas e galeria de templates

#### ESTRUTURA GERAL

O `InsertTextPanel` passa a ter **duas abas** no topo, logo abaixo do header do `InsertSubPanel`:

| Aba | Label | Comportamento |
|---|---|---|
| Default (ativa) | **Static Text** | Exibe os botões de inserção rápida + galeria de templates pré-built |
| Secundária | **Variable Text** | Reservada para uso futuro — pode exibir estado vazio por ora |

Usar o componente `Tabs` do **shadcn/ui** para implementar as abas.

---

### IMPLEMENTAÇÃO

```tsx
// InsertTextPanel.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export function InsertTextPanel() {
  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Abas — fixas no topo, não scrollam */}
      <div className="px-3 pt-3 shrink-0">
        <Tabs defaultValue="static" className="w-full">

          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="static" className="w-full">Static Text</TabsTrigger>
            <TabsTrigger value="variable" className="w-full">Variable Text</TabsTrigger>
          </TabsList>

          {/* ABA: Static Text */}
          <TabsContent value="static" className="mt-0">
            <StaticTextContent />
          </TabsContent>

          {/* ABA: Variable Text */}
          <TabsContent value="variable" className="mt-0">
            <VariableTextContent />
          </TabsContent>

        </Tabs>
      </div>

    </div>
  )
}
```

---

### COMPONENTE: `StaticTextContent`

Conteúdo da aba **Static Text**. Dividido em duas seções:

**Seção 1 — Inserção rápida:** três botões clicáveis que inserem um elemento de texto diretamente no canvas com estilo pré-definido.

**Seção 2 — Galeria de templates:** grade de cards de preview de layouts tipográficos pré-built que o usuário pode arrastar ou clicar para inserir no canvas.

```tsx
// StaticTextContent.tsx
export function StaticTextContent() {
  return (
    <div className="flex flex-col overflow-hidden">

      {/* Seção 1 — Inserção rápida */}
      <div className="flex flex-col gap-1 px-1 py-3 shrink-0">

        {/* Create header */}
        <button
          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => insertTextElement('header')}
        >
          <span className="text-2xl font-bold text-gray-800 leading-tight">
            Create header
          </span>
        </button>

        {/* Create sub header */}
        <button
          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => insertTextElement('subheader')}
        >
          <span className="text-base font-semibold text-gray-700">
            Create sub header
          </span>
        </button>

        {/* Create body text */}
        <button
          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => insertTextElement('body')}
        >
          <span className="text-sm text-gray-500">
            Create body text
          </span>
        </button>

      </div>

      {/* Divisor */}
      <div className="h-px bg-gray-100 mx-3 shrink-0" />

      {/* Seção 2 — Galeria de templates */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
        <div className="grid grid-cols-2 gap-2 w-full">
          {textTemplates.map(template => (
            <TextTemplateCard
              key={template.id}
              template={template}
              onInsert={() => insertTextElement(template.id)}
            />
          ))}
        </div>
      </div>

    </div>
  )
}
```

---

### COMPONENTE: `TextTemplateCard`

Cada card da galeria representa um layout tipográfico pré-built. O usuário pode **clicar** para inserir no canvas ou futuramente **arrastar** direto para a posição desejada.

```tsx
// TextTemplateCard.tsx
interface TextTemplate {
  id: string
  preview: ReactNode   // conteúdo visual do card
  label?: string       // label acessível
}

export function TextTemplateCard({ template, onInsert }: TextTemplateCardProps) {
  return (
    <div
      className="
        relative w-full bg-white rounded-lg border border-gray-200
        cursor-pointer select-none overflow-hidden
        hover:border-[#5B4EFF] hover:shadow-sm
        active:scale-[0.98]
        transition-all duration-150
      "
      style={{ minHeight: '110px' }}
      onClick={onInsert}
      draggable
      // futuramente: onDragStart para drag-to-canvas
    >
      <div className="p-2 h-full flex flex-col justify-center">
        {template.preview}
      </div>
    </div>
  )
}
```

---

### MOCK DATA — `textTemplates`

Os templates refletem exatamente os modelos visíveis no Figma, dispostos em grade de 2 colunas:

```tsx
const textTemplates: TextTemplate[] = [
  {
    id: 'job-listing',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="text-gray-400">Looking for</p>
        <p className="text-lg font-bold text-gray-800 leading-tight">Operations Manager</p>
        <p className="text-gray-400 mt-1">Praesent blandit odio aaa apendas ratrum...</p>
      </div>
    ),
  },
  {
    id: 'dynamic-model',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="text-gray-400">Summer Sale</p>
        <p className="text-xl font-bold text-gray-800 font-mono">{'{'}<span>model</span>{'}'}</p>
      </div>
    ),
  },
  {
    id: 'congratulations',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="text-lg font-bold italic text-gray-800">Congratulations</p>
        <p className="text-gray-500">you're a big brother</p>
      </div>
    ),
  },
  {
    id: 'marketing-proposal',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="text-gray-400">MMK and CO</p>
        <p className="text-base font-bold text-gray-800 leading-tight">Marketing Proposal</p>
        <p className="text-gray-400">Praesent blandit odio aaa...</p>
      </div>
    ),
  },
  {
    id: 'minimalism',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="text-gray-400 uppercase text-[8px]">The future of</p>
        <p className="text-xl font-black text-gray-800 uppercase leading-none">Minimalism</p>
      </div>
    ),
  },
  {
    id: 'end-of-season-sale',
    preview: (
      <div className="text-[9px] leading-tight text-right">
        <p className="text-gray-400 uppercase text-[8px]">End of</p>
        <p className="text-gray-400 uppercase text-[8px]">Season</p>
        <p className="text-2xl font-black text-gray-800 uppercase">SALE</p>
      </div>
    ),
  },
  {
    id: 'youre-invited',
    preview: (
      <div className="flex gap-1 text-[9px] leading-tight">
        <p className="text-xl font-black text-gray-800 uppercase leading-none">YOU'RE INVITED</p>
        <p className="text-gray-400">Praesent blandit odio non apendas ratrum...</p>
      </div>
    ),
  },
  {
    id: 'job-listing-2',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="text-gray-400">Looking for</p>
        <p className="text-base font-bold text-gray-800">Operations Manager</p>
        <p className="text-gray-400">Praesent blandit...</p>
      </div>
    ),
  },
  {
    id: 'price-list',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="font-semibold text-gray-700">PRICE LIST: MARKETING PACKAGE</p>
        <p className="text-gray-500">$42</p>
        <p className="font-semibold text-gray-700">ADVERTISING PACKAGE</p>
        <p className="text-gray-500">$16</p>
        <p className="font-semibold text-gray-700">CONTENT PACKAGE</p>
        <p className="text-gray-500">$36</p>
      </div>
    ),
  },
  {
    id: 'adventure',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="text-gray-400">Life is an</p>
        <p className="text-lg italic font-bold text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
          Adventure
        </p>
      </div>
    ),
  },
  {
    id: 'marketing-proposal-2',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="text-gray-400">MMK and CO</p>
        <p className="text-base font-bold text-gray-800">Marketing Proposal</p>
        <p className="text-gray-400">Praesent blandit...</p>
      </div>
    ),
  },
  {
    id: 'end-of-season-sale-2',
    preview: (
      <div className="text-right text-[9px]">
        <p className="text-gray-400 uppercase text-[8px]">End of Season</p>
        <p className="text-2xl font-black text-gray-800 uppercase">SALE</p>
      </div>
    ),
  },
  {
    id: 'youre-invited-2',
    preview: (
      <div className="flex gap-1 text-[9px]">
        <p className="text-xl font-black text-gray-800 uppercase">YOU'RE INVITED</p>
        <p className="text-gray-400">Praesent blandit odio non apendas nibb...</p>
      </div>
    ),
  },
]
```

---

### COMPONENTE: `VariableTextContent`

Estado vazio por ora — reservado para uso futuro:

```tsx
// VariableTextContent.tsx
export function VariableTextContent() {
  return (
    <div className="flex flex-col items-center justify-center h-48 px-6 text-center">
      <p className="text-sm text-gray-400">
        Variable text templates will appear here.
      </p>
    </div>
  )
}
```

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Tab ativa — fundo | `#5B4EFF` ou padrão shadcn/ui |
| Tab inativa — texto | `#6B6B6B` |
| "Create header" — tamanho | `text-2xl font-bold` |
| "Create sub header" — tamanho | `text-base font-semibold` |
| "Create body text" — tamanho | `text-sm` |
| Card min-height | `110px` |
| Card border padrão | `#E2E2E2` |
| Card border hover | `#5B4EFF` |
| Card border-radius | `rounded-lg` = `8px` |
| Grid de templates | `grid-cols-2 gap-2` |
| Overflow horizontal | `hidden` |
| Overflow vertical | `auto` |