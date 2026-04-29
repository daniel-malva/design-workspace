Prompt direto e focado apenas nessa correção do `RightPanel`:

---

## 🧱 PROMPT V11 — Design Workspace — RightPanel sem scroll horizontal, campos full width

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

### CORREÇÃO — `RightPanel` sem scroll horizontal e campos full width

#### REGRA PRINCIPAL

O `RightPanel` deve ter **somente scroll vertical**. Nenhum conteúdo interno pode ultrapassar a largura do painel. Todos os campos, inputs, selects, botões e grupos de controles devem ser configurados para ocupar **100% da largura disponível** dentro do painel, respeitando o padding interno.

---

### CONFIGURAÇÃO DO CONTAINER

```tsx
// RightPanel.tsx
<div
  className="absolute right-1 top-1 bottom-1 w-[268px] bg-white rounded-2xl shadow-lg z-20 flex flex-col"
  style={{ overflow: 'hidden' }} // nunca overflow horizontal
>
  {/* Header fixo do painel — não scrolla */}
  <div className="px-4 py-3 border-b border-gray-100 shrink-0">
    <span className="text-sm font-semibold text-gray-800">{selectedElementLabel}</span>
  </div>

  {/* Área scrollável — apenas vertical */}
  <div
    className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 flex flex-col gap-4"
  >
    <PropertiesContent />
  </div>
</div>
```

> **`overflow-x-hidden` é obrigatório** no container scrollável. Mesmo que nenhum filho ultrapasse a largura, ele previne qualquer vazamento causado por margens negativas, elementos absolutos ou transições de componentes shadcn/ui.

---

### REGRAS DE WIDTH PARA TODOS OS FILHOS

Cada elemento dentro do `RightPanel` deve seguir estas regras:

#### Inputs e Selects simples
```tsx
// SEMPRE w-full — nunca width fixo em px
<Input className="w-full" />
<Select>
  <SelectTrigger className="w-full">...</SelectTrigger>
</Select>
```

#### Grupos de dois campos lado a lado (ex: X e Y, W e H)
```tsx
// Dividir em duas colunas iguais com gap — cada campo ocupa metade
<div className="grid grid-cols-2 gap-2 w-full">
  <div className="flex flex-col gap-1">
    <label className="text-xs text-gray-400">X</label>
    <Input className="w-full" defaultValue="600" />
  </div>
  <div className="flex flex-col gap-1">
    <label className="text-xs text-gray-400">Y</label>
    <Input className="w-full" defaultValue="600" />
  </div>
</div>
```

#### Grupos de botões de alinhamento (ícones)
```tsx
// Distribuídos uniformemente pela largura total disponível
<div className="flex items-center justify-between w-full">
  <button className="flex-1 flex items-center justify-center h-8 rounded hover:bg-gray-100">
    <AlignLeft size={14} />
  </button>
  <button className="flex-1 flex items-center justify-center h-8 rounded hover:bg-gray-100">
    <AlignCenter size={14} />
  </button>
  {/* ... demais botões */}
</div>
```

#### Rows com label + controle à direita (ex: opacidade, blend mode)
```tsx
// label à esquerda, controle à direita — juntos ocupam 100% da largura
<div className="flex items-center gap-2 w-full">
  <Select>
    <SelectTrigger className="flex-1 min-w-0">
      <SelectValue />
    </SelectTrigger>
  </Select>
  <Input className="w-16 shrink-0 text-right" defaultValue="100%" />
</div>
```

> **`min-w-0` em elementos flex é crítico.** Sem ele, elementos como `Select` e `Input` não encolhem corretamente dentro de containers flex, causando overflow horizontal. Sempre aplicar `min-w-0` em filhos flex que devem encolher.

#### Color swatch + hex input + opacidade (seção Style/Fill)
```tsx
<div className="flex items-center gap-2 w-full">
  <div className="w-6 h-6 rounded shrink-0 border border-gray-200 bg-black" /> {/* swatch */}
  <Input className="flex-1 min-w-0 font-mono text-xs" defaultValue="000000" />
  <Input className="w-14 shrink-0 text-xs text-right" defaultValue="100%" />
  <button className="shrink-0"><Eye size={14} /></button>
</div>
```

#### Font family select + botão de config
```tsx
<div className="flex items-center gap-2 w-full">
  <Select>
    <SelectTrigger className="flex-1 min-w-0">
      <SelectValue placeholder="Roboto" />
    </SelectTrigger>
  </Select>
  <button className="shrink-0 w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100">
    <Settings size={14} />
  </button>
</div>
```

#### Font weight + font size (linha dupla)
```tsx
<div className="grid grid-cols-2 gap-2 w-full">
  <Select>
    <SelectTrigger className="w-full min-w-0">
      <SelectValue placeholder="Bold" />
    </SelectTrigger>
  </Select>
  <div className="flex items-center gap-1 w-full">
    <span className="text-xs text-gray-400 shrink-0">T↕</span>
    <Input className="flex-1 min-w-0" defaultValue="34" />
  </div>
</div>
```

---

### SEÇÃO `PropertiesContent` — Estrutura Geral

Todo o conteúdo do painel é organizado em seções com `Separator` entre elas. Cada seção usa `w-full` como base:

```tsx
// PropertiesContent.tsx
export function PropertiesContent() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <PositionSection />     {/* X, Y, W, H — grid 2 colunas */}
      <Separator />
      <LayerSection />        {/* blend mode + opacidade */}
      <Separator />
      <BrandSection />        {/* select de brand — w-full */}
      <Separator />
      <TextSection />         {/* todas as propriedades de texto */}
      <Separator />
      <StyleSection />        {/* fill, stroke, shadow */}
    </div>
  )
}
```

---

### CHECKLIST DE VALIDAÇÃO

Antes de considerar o `RightPanel` correto, verificar:

- [ ] Container raiz tem `overflow-x-hidden`
- [ ] Nenhum filho tem `width` fixo em `px` que possa ultrapassar `268px - padding`
- [ ] Todos os `Input` e `Select` usam `w-full` ou `flex-1 min-w-0`
- [ ] Grupos de botões usam `flex-1` ou `grid` proporcional
- [ ] Nenhuma linha em `flex-row` deixa de ter `min-w-0` nos filhos que devem encolher
- [ ] Scroll vertical funciona normalmente (`overflow-y-auto`)
- [ ] Nenhuma scrollbar horizontal aparece em nenhuma largura de conteúdo

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| `RIGHT_PANEL_WIDTH` | `268px` |
| RightPanel padding horizontal | `px-4` = `16px` cada lado |
| Largura útil interna | `268 - 32 = 236px` |
| Side panel border-radius | `rounded-2xl` |
| `PANEL_OFFSET` | `4px` |
| Overflow horizontal | `hidden` — **nunca `auto` ou `scroll`** |
| Overflow vertical | `auto` |
| Accent color | `#5B4EFF` |
| Text primary | `#111111` |
| Text secondary | `#6B6B6B` |
| Border interno | `#E2E2E2` |