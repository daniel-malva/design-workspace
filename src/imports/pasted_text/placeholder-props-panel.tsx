Deixa eu inspecionar esse frame detalhadamente antes de gerar o prompt.Tenho 4 variantes do painel. Vou capturar cada uma individualmente.Tenho todos os detalhes das 4 variantes. Vou agora capturar as diferenças entre os painéis de Logo, Background e Media.Tenho tudo que preciso. Aqui está o prompt completo:

---

## 🧱 PROMPT V22 — Design Workspace — PlaceholderPropertiesPanel: painel de propriedades por variante

---

### STACK & BOAS PRÁTICAS

```
Stack: React + TypeScript + Tailwind CSS + shadcn/ui components
Boas práticas:
- Componentes reutilizáveis nomeados semanticamente por função
- TypeScript com interfaces e tipos explícitos para todas as props
- Tailwind para estilização, sem CSS inline ou arquivos .css separados
- shadcn/ui para elementos de UI base (Switch, Input, Select, Button, Separator)
- Estado global via Zustand (useDesignWorkspaceStore)
```

---

### REGRA PRINCIPAL

Sempre que um `dynamic placeholder` for inserido ou selecionado no canvas, o `RightPanel` deve exibir o `PlaceholderPropertiesPanel` correspondente à variante daquele placeholder. Cada variante tem seu próprio título e conjunto de seções de propriedades, conforme o Figma.

---

### MAPEAMENTO — Variante → Título do painel

| Variante do placeholder | Título exibido no header do `RightPanel` |
|---|---|
| `jellybean` | **Jellybean** |
| `logo` | **Logo** |
| `background` | **Background** |
| `media` | **Media** |

O título é renderizado no header padrão do `RightPanel` (já existente), lido de `elementTypeLabel`:

```tsx
const elementTypeLabel: Record<ElementType, string> = {
  // ...existentes...
  'placeholder-jellybean':  'Jellybean',
  'placeholder-logo':       'Logo',
  'placeholder-background': 'Background',
  'placeholder-media':      'Media',
  'placeholder-audio':      'Audio',
}
```

---

### COMPONENTE: `PlaceholderPropertiesPanel`

Roteador principal — seleciona o painel correto conforme a variante:

```tsx
// PlaceholderPropertiesPanel.tsx
export function PlaceholderPropertiesPanel({ elementId }: { elementId: string }) {
  const element = useDesignWorkspaceStore(s =>
    s.canvasElements.find(el => el.id === elementId)
  )
  if (!element) return null

  switch (element.placeholderVariant) {
    case 'jellybean':   return <JellybeanPropertiesPanel   elementId={elementId} />
    case 'logo':        return <LogoPropertiesPanel        elementId={elementId} />
    case 'background':  return <BackgroundPropertiesPanel  elementId={elementId} />
    case 'media':       return <MediaPropertiesPanel       elementId={elementId} />
    default:            return <GenericPlaceholderPanel    elementId={elementId} />
  }
}
```

---

### SEÇÕES COMPARTILHADAS — usadas em todos os painéis

Todas as variantes compartilham as mesmas três seções estruturais. Extrair como componentes reutilizáveis:

#### `PlaceholderPositionSection`

```tsx
// PlaceholderPositionSection.tsx
export function PlaceholderPositionSection({ elementId }: { elementId: string }) {
  const { updateElement, canvasElements } = useDesignWorkspaceStore()
  const el = canvasElements.find(e => e.id === elementId)!

  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px]">Position</p>

      {/* Alignment toggle group — 6 botões: left, center, right | top, middle, bottom */}
      <PlaceholderAlignmentButtons />

      {/* X / Y */}
      <div className="flex items-center justify-between w-full gap-1">
        <AxisField label="X" value={el.x} onChange={v => updateElement(elementId, { x: v })} />
        <AxisField label="Y" value={el.y} onChange={v => updateElement(elementId, { y: v })} />
      </div>

      {/* W / H */}
      <div className="flex items-center justify-between w-full gap-1">
        <AxisField label="W" value={el.width}  onChange={v => updateElement(elementId, { width: v })} />
        <AxisField label="H" value={el.height} onChange={v => updateElement(elementId, { height: v })} />
      </div>

      {/* Border Radius */}
      <div className="flex items-center w-full gap-1">
        <button className="w-8 h-8 flex items-center justify-center shrink-0">
          <RoundedCorner size={16} className="text-[#1f1d25]" />
        </button>
        <Input
          className="flex-1 min-w-0 h-9 text-xs bg-[#f9fafa] border-[#dddce0]"
          defaultValue=""
          placeholder="0"
        />
      </div>
    </div>
  )
}
```

#### `PlaceholderPropertiesSection`

Seção com borda arredondada, título "Properties" + botão "Reset" + select de Brand:

```tsx
// PlaceholderPropertiesSection.tsx
export function PlaceholderPropertiesSection() {
  return (
    <div className="flex flex-col gap-3 w-full border border-[rgba(0,0,0,0.12)] rounded-lg p-2">

      {/* Header da seção */}
      <div className="flex items-center justify-between w-full h-5">
        <p className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px]">Properties</p>
        <button className="text-[13px] font-medium text-[#473bab] tracking-[0.46px] capitalize px-1 py-1 rounded-full hover:bg-[#473bab14] transition-colors">
          Reset
        </button>
      </div>

      {/* Brand select */}
      <div className="flex flex-col gap-1 w-full">
        <label className="text-[12px] text-[#686576] tracking-[0.15px]">Brand</label>
        <Select>
          <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border-[#cac9cf]">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>
            {/* brands carregadas futuramente */}
          </SelectContent>
        </Select>
      </div>

    </div>
  )
}
```

#### `PlaceholderMotionSection`

Seção com borda arredondada, título "Motion" + campos start/end de timecode:

```tsx
// PlaceholderMotionSection.tsx
export function PlaceholderMotionSection({ elementId }: { elementId: string }) {
  return (
    <div className="flex flex-col gap-3 w-full border border-[rgba(0,0,0,0.12)] rounded-lg p-2">

      <p className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px]">Motion</p>

      {/* Start / End */}
      <div className="flex items-center gap-4 w-full">

        <div className="flex flex-1 items-center gap-3 min-w-0">
          <span className="text-[12px] text-[#1f1d25] tracking-[0.17px] shrink-0">start</span>
          <Input
            className="flex-1 min-w-0 h-9 text-xs bg-[#f9fafa] border-[#dddce0]"
            defaultValue="0:00"
          />
        </div>

        <div className="flex flex-1 items-center gap-3 min-w-0">
          <span className="text-[12px] text-[#1f1d25] tracking-[0.17px] shrink-0">end</span>
          <Input
            className="flex-1 min-w-0 h-9 text-xs bg-[#f9fafa] border-[#dddce0]"
            defaultValue="1:30"
          />
        </div>

      </div>
    </div>
  )
}
```

#### `AxisField` — campo de label + input reutilizável

```tsx
// AxisField.tsx
export function AxisField({ label, value, onChange }: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-1 items-center gap-0 min-w-0">
      {/* Label — largura fixa de 40px, texto centralizado */}
      <div className="w-10 shrink-0 flex items-center justify-center">
        <span className="text-[14px] text-[#1f1d25] tracking-[0.17px]">{label}</span>
      </div>
      {/* Input */}
      <Input
        className="flex-1 min-w-0 h-9 text-xs bg-[#f9fafa] border-[#dddce0] text-[#1f1d25]"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  )
}
```

---

### COMPONENTE: `JellybeanPropertiesPanel`

Variante **Jellybean** — inclui switch "Show carcut" exclusivo desta variante:

```tsx
// JellybeanPropertiesPanel.tsx
export function JellybeanPropertiesPanel({ elementId }: { elementId: string }) {
  const [showCarcut, setShowCarcut] = useState(false)

  return (
    <div className="flex flex-col gap-3 w-full overflow-x-hidden">

      {/* Bloco topo — title + switch + ícones de ação */}
      <div className="flex flex-col gap-2 w-full">

        {/* Header: nome editável + ícones */}
        <div className="flex items-center justify-between w-full px-1 py-1">
          <p className="text-[16px] font-medium text-[#1f1d25] tracking-[0.15px]">Jellybean</p>
          <div className="flex items-center gap-1">
            <button className="w-5 h-5 flex items-center justify-center text-[#1f1d25] hover:text-[#473bab]">
              <MoreHorizontal size={16} /> {/* ícone de 4 pontos / expand */}
            </button>
            <button className="w-5 h-5 flex items-center justify-center text-[#1f1d25] hover:text-[#473bab]">
              <Users size={16} /> {/* GroupWork — vínculo de grupo */}
            </button>
            <button className="w-5 h-5 flex items-center justify-center text-[#1f1d25] hover:text-[#473bab]">
              <Link size={16} /> {/* link/chain */}
            </button>
          </div>
        </div>

        {/* Switch — Show carcut — exclusivo do Jellybean */}
        <div className="flex items-center gap-2 w-full">
          <Switch
            checked={showCarcut}
            onCheckedChange={setShowCarcut}
            className="shrink-0"
          />
          <label className="text-[14px] text-[#1f1d25] tracking-[0.15px]">Show carcut</label>
        </div>

      </div>

      <Separator className="w-full" />

      <PlaceholderPositionSection elementId={elementId} />

      <Separator className="w-full" />

      <PlaceholderPropertiesSection />

      <PlaceholderMotionSection elementId={elementId} />

    </div>
  )
}
```

---

### COMPONENTE: `LogoPropertiesPanel`

Variante **Logo** — sem switch "Show carcut", sem outras seções extras:

```tsx
// LogoPropertiesPanel.tsx
export function LogoPropertiesPanel({ elementId }: { elementId: string }) {
  return (
    <div className="flex flex-col gap-3 w-full overflow-x-hidden">

      <div className="flex items-center justify-between w-full px-1 py-1">
        <p className="text-[16px] font-medium text-[#1f1d25] tracking-[0.15px]">Logo</p>
        <div className="flex items-center gap-1">
          <button className="w-5 h-5 flex items-center justify-center text-[#1f1d25] hover:text-[#473bab]">
            <MoreHorizontal size={16} />
          </button>
          <button className="w-5 h-5 flex items-center justify-center text-[#1f1d25] hover:text-[#473bab]">
            <Users size={16} />
          </button>
          <button className="w-5 h-5 flex items-center justify-center text-[#1f1d25] hover:text-[#473bab]">
            <Link size={16} />
          </button>
        </div>
      </div>

      <Separator className="w-full" />

      <PlaceholderPositionSection elementId={elementId} />

      <Separator className="w-full" />

      <PlaceholderPropertiesSection />

      <PlaceholderMotionSection elementId={elementId} />

    </div>
  )
}
```

---

### COMPONENTE: `BackgroundPropertiesPanel`

Variante **Background** — estrutura idêntica ao Logo, apenas o título muda:

```tsx
// BackgroundPropertiesPanel.tsx
export function BackgroundPropertiesPanel({ elementId }: { elementId: string }) {
  return (
    <div className="flex flex-col gap-3 w-full overflow-x-hidden">

      <div className="flex items-center justify-between w-full px-1 py-1">
        <p className="text-[16px] font-medium text-[#1f1d25] tracking-[0.15px]">Background</p>
        <div className="flex items-center gap-1">
          <button className="w-5 h-5 flex items-center justify-center"><MoreHorizontal size={16} /></button>
          <button className="w-5 h-5 flex items-center justify-center"><Users size={16} /></button>
          <button className="w-5 h-5 flex items-center justify-center"><Link size={16} /></button>
        </div>
      </div>

      <Separator className="w-full" />
      <PlaceholderPositionSection elementId={elementId} />
      <Separator className="w-full" />
      <PlaceholderPropertiesSection />
      <PlaceholderMotionSection elementId={elementId} />

    </div>
  )
}
```

---

### COMPONENTE: `MediaPropertiesPanel`

Variante **Media** — estrutura idêntica ao Logo e Background, apenas o título muda:

```tsx
// MediaPropertiesPanel.tsx
export function MediaPropertiesPanel({ elementId }: { elementId: string }) {
  return (
    <div className="flex flex-col gap-3 w-full overflow-x-hidden">

      <div className="flex items-center justify-between w-full px-1 py-1">
        <p className="text-[16px] font-medium text-[#1f1d25] tracking-[0.15px]">Media</p>
        <div className="flex items-center gap-1">
          <button className="w-5 h-5 flex items-center justify-center"><MoreHorizontal size={16} /></button>
          <button className="w-5 h-5 flex items-center justify-center"><Users size={16} /></button>
          <button className="w-5 h-5 flex items-center justify-center"><Link size={16} /></button>
        </div>
      </div>

      <Separator className="w-full" />
      <PlaceholderPositionSection elementId={elementId} />
      <Separator className="w-full" />
      <PlaceholderPropertiesSection />
      <PlaceholderMotionSection elementId={elementId} />

    </div>
  )
}
```

---

### INTEGRAÇÃO — `PropertiesContent`

O roteador principal do `RightPanel` já deve direcionar todos os tipos de placeholder para o `PlaceholderPropertiesPanel`:

```tsx
// PropertiesContent.tsx
case 'placeholder-jellybean':
case 'placeholder-logo':
case 'placeholder-background':
case 'placeholder-media':
case 'placeholder-audio':
  return <PlaceholderPropertiesPanel elementId={elementId} />
```

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Título do painel | `text-[16px] font-medium` Roboto Medium |
| Seção title | `text-[14px] font-medium` tracking `0.1px` |
| Input label | `text-[12px]` Roboto Regular tracking `0.15px` cor `#686576` |
| Input value | `text-[12px]` Roboto Regular tracking `0.17px` cor `#1f1d25` |
| Input background | `#f9fafa` |
| Input border | `#dddce0` (padrão) / `#cac9cf` (brand select) |
| Input border-radius | `4px` |
| Input height | `36px` (h-9) |
| Section border | `1px solid rgba(0,0,0,0.12)` |
| Section border-radius | `8px` → `rounded-lg` |
| Section padding | `8px` |
| Reset button color | `#473bab` |
| Accent color | `#5B4EFF` / `#473bab` |
| AxisField label width | `40px` fixo |
| Switch — "Show carcut" | shadcn/ui `Switch` — exclusivo do **Jellybean** |
| Overflow X | `hidden` — nunca scroll horizontal |