Deixa eu inspecionar o header do painel esquerdo no Figma para pegar o tamanho exato da fonte do título.Agora vou verificar o header do `InsertSubPanel` para pegar o tamanho correto do título:Tenho tudo que preciso. O painel esquerdo usa `text-[14px]` para os títulos dos sub-painéis (Roboto Medium 14px, tracking 0.1px — extraído do Figma). Aqui está o prompt:

---

## 🧱 PROMPT V32 — Design Workspace — RightPanel: header padronizado com fonte `text-sm` + Separator em todos os painéis

---

### STACK & BOAS PRÁTICAS

```
Stack: React + TypeScript + Tailwind CSS + shadcn/ui components
Boas práticas:
- Componentes reutilizáveis nomeados semanticamente por função
- TypeScript com interfaces e tipos explícitos para todas as props
- Tailwind para estilização, sem CSS inline ou arquivos .css separados
- shadcn/ui Separator para o divider
```

---

### REGRA PRINCIPAL — O que muda

Dois ajustes **exclusivamente no header** de cada painel de propriedades do `RightPanel`:

1. **Tamanho da fonte do título:** padronizar para `text-sm` (`14px`) — Roboto Medium — exatamente igual ao que os painéis do `LeftPane` usam para seus títulos de seção
2. **Separator:** adicionar um `<Separator />` imediatamente abaixo do header, sem gap, separando o título do conteúdo do painel

Os ícones do canto superior direito de cada painel **permanecem exatamente como estão** — sem nenhuma alteração.

---

### COMPONENTE PADRÃO — `RightPanelHeader`

Extrair o header em um componente reutilizável único, aplicado a **todos** os painéis do `RightPanel`:

```tsx
// RightPanelHeader.tsx
interface RightPanelHeaderProps {
  title: string
  actions?: ReactNode   // ícones específicos de cada painel — não mudam
}

export function RightPanelHeader({ title, actions }: RightPanelHeaderProps) {
  return (
    <>
      {/* Header row: título + ícones */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span
          className="text-sm font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]"
          style={{ fontFamily: "'Roboto', sans-serif" }}
        >
          {title}
        </span>

        {/* Slot de ícones — cada painel passa os seus próprios */}
        {actions && (
          <div className="flex items-center gap-1 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Separator — colado abaixo do header, zero margin */}
      <Separator className="w-full m-0 shrink-0" />
    </>
  )
}
```

> **`text-sm` = `14px`** — Roboto Medium, tracking `0.1px`, line-height `1.57` — exatamente o mesmo token tipográfico dos títulos de seção dos painéis do `LeftPane` extraído do Figma.

---

### APLICAÇÃO EM CADA PAINEL

#### `JellybeanPropertiesPanel`
```tsx
export function JellybeanPropertiesPanel({ elementId }: { elementId: string }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <RightPanelHeader
        title="Jellybean"
        actions={<PlaceholderPanelIcons />}  // MoreHorizontal + Users + Link — inalterados
      />
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
        <JellybeanPropertiesContent elementId={elementId} />
      </div>
    </div>
  )
}
```

#### `LogoPropertiesPanel`
```tsx
<RightPanelHeader title="Logo" actions={<PlaceholderPanelIcons />} />
```

#### `BackgroundPropertiesPanel`
```tsx
<RightPanelHeader title="Background" actions={<PlaceholderPanelIcons />} />
```

#### `MediaPropertiesPanel`
```tsx
<RightPanelHeader title="Media" actions={<PlaceholderPanelIcons />} />
```

#### `TextPropertiesPanel`
```tsx
<RightPanelHeader title="Body text" actions={<TextPanelIcons />} />
// TextPanelIcons — ícones específicos do painel de texto, inalterados
```

#### `ShapePropertiesPanel`
```tsx
<RightPanelHeader title="Shape" actions={<ShapePanelIcons />} />
```

#### `IconPropertiesPanel`
```tsx
<RightPanelHeader title="Icon" actions={<IconPanelIcons />} />
```

#### `SettingsPanel`
```tsx
// SettingsPanel não usa RightPanelHeader — já tem sua própria estrutura
// com título + botão X + tabs. Manter como está (V27).
```

#### `ActivityPanel`
```tsx
// ActivityPanel não usa RightPanelHeader — as abas são o header.
// Manter como está (V29/V30).
```

---

### `PlaceholderLayerTitleSection` — REMOVER o título interno

Com o `RightPanelHeader` padronizado assumindo o papel de título do painel, o bloco de título que estava **dentro** do `PlaceholderLayerTitleSection` (o `<p>` com o nome "Jellybean", "Logo", etc. + ícones) deve ser **removido** para evitar título duplicado.

O `PlaceholderLayerTitleSection` passa a conter **apenas o switch "Show carcut"** (para o Jellybean) ou nada (para as demais variantes que não tinham switch):

```tsx
// PlaceholderLayerTitleSection.tsx — após a remoção do título interno
export function PlaceholderLayerTitleSection({
  showCarcut,
  onShowCarcutChange,
}: {
  showCarcut?: boolean
  onShowCarcutChange?: (v: boolean) => void
}) {
  // Se não há switch, não renderiza nada
  if (showCarcut === undefined) return null

  return (
    <div className="flex items-center gap-2 w-full">
      <Switch
        checked={showCarcut}
        onCheckedChange={onShowCarcutChange}
        className="shrink-0"
      />
      <label
        className="text-[14px] text-[#1f1d25] tracking-[0.15px] leading-[1.5] cursor-pointer"
        style={{ fontFamily: "'Roboto', sans-serif" }}
      >
        Show carcut
      </label>
    </div>
  )
}
```

---

### ESTRUTURA VISUAL FINAL — RightPanel em modo Jellybean

```
┌─────────────────────────────────────────────┐  ← top: 4px
│  Jellybean                   [⊡] [👥] [🔗] │  ← RightPanelHeader — text-sm font-medium
│─────────────────────────────────────────────│  ← Separator m-0 — colado
│                                             │
│  ◉ Show carcut                              │  ← switch (Jellybean only)
│                                             │
│  Position                                   │
│  [alignment buttons]                        │
│  X [600]    Y [600]                         │
│  W [24]     H [24]                          │
│  ⌒ [border radius]                          │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Properties              [Reset]     │    │
│  │ Brand [select]                      │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Motion                              │    │
│  │ start [0:00]    end [1:30]          │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘  ← bottom: 4px
```

---

### TOKENS DE DESIGN — O QUE MUDA vs. ANTES

| Elemento | Antes | Depois |
|---|---|---|
| Fonte do título | `text-[16px] font-medium` | **`text-sm font-medium`** (`14px`) |
| Tracking do título | `tracking-[0.15px]` | **`tracking-[0.1px]`** |
| Separator abaixo do header | ausente | **`<Separator className="w-full m-0" />`** |
| Ícones do header | inalterados | inalterados ✓ |
| Padding do header | `px-4 py-3` | `px-4 py-3` — inalterado ✓ |
| Conteúdo do painel | inalterado | inalterado ✓ |