Deixa eu inspecionar o painel de propriedades de texto no Figma para extrair os valores exatos de padding e espaçamento.Tenho todos os valores exatos do Figma. Aqui está o prompt:

---

## 🧱 PROMPT V31 — Design Workspace — PlaceholderPropertiesPanel: padding e espaçamentos corrigidos conforme Figma

---

### STACK & BOAS PRÁTICAS

```
Stack: React + TypeScript + Tailwind CSS + shadcn/ui components
Boas práticas:
- Componentes reutilizáveis nomeados semanticamente por função
- TypeScript com interfaces e tipos explícitos para todas as props
- Tailwind para estilização, sem CSS inline ou arquivos .css separados
- shadcn/ui para Input, Select, Switch, Separator, Button
- Estado global via Zustand (useDesignWorkspaceStore)
```

---

### VALORES EXATOS EXTRAÍDOS DO FIGMA

Estes são os tokens de espaçamento e tipografia que regem **todos os painéis de propriedades**, extraídos diretamente do código do Figma:

| Propriedade | Valor Figma | Tailwind |
|---|---|---|
| Padding topo do painel | `pt-[8px]` | `pt-2` |
| Gap entre seções principais | `gap-[12px]` | `gap-3` |
| Gap interno das seções | `gap-[8px]` | `gap-2` |
| Padding interno das seções com borda | `p-[8px]` | `p-2` |
| Gap entre campos de uma seção com borda | `gap-[12px]` | `gap-3` |
| Gap entre label e input | `gap-[4px]` | `gap-1` |
| Input height | `h-[36px]` + `py-[6px]` | `h-9 py-1.5` |
| Input padding horizontal | `px-[8px]` | `px-2` |
| Input border | `#dddce0` (outlined) / `#cac9cf` (standard) | |
| Input bg | `#f9fafa` | |
| Input border-radius | `4px` | `rounded-[4px]` |
| AxisField label width | `w-[40px]` | `w-10` |
| AxisField label font | Roboto Regular 14px tracking 0.17px | `text-[14px] tracking-[0.17px]` |
| AxisField input font | Roboto Regular 12px tracking 0.17px | `text-xs tracking-[0.17px]` |
| Section title font | Roboto Medium 14px tracking 0.1px | `text-[14px] font-medium tracking-[0.1px]` |
| Pane title font | Roboto Medium 16px tracking 0.15px | `text-[16px] font-medium tracking-[0.15px]` |
| Section border | `1px solid rgba(0,0,0,0.12)` | `border border-[rgba(0,0,0,0.12)]` |
| Section border-radius | `8px` | `rounded-[8px]` |
| Motion gap label→input | `gap-[12px]` | `gap-3` |
| Motion label font | Roboto Regular 12px tracking 0.17px | `text-xs tracking-[0.17px]` |
| Reset button font | Roboto Medium 13px tracking 0.46px | `text-[13px] font-medium tracking-[0.46px]` |
| Reset button color | `#473bab` | `text-[#473bab]` |
| Icons gap | `gap-[4px]` | `gap-1` |

---

### ESTRUTURA CORRIGIDA — `PlaceholderPropertiesPanel` (base para todas as variantes)

O container raiz do painel começa com `pt-[8px]` e usa `gap-[12px]` entre todas as seções de primeiro nível — exatamente como extraído do Figma:

```tsx
// PlaceholderPropertiesPanel.tsx — container raiz
<div className="flex flex-col gap-3 items-start pt-2 w-full overflow-x-hidden">
  {/* Seção 1: Layer Title + Switch */}
  <PlaceholderLayerTitleSection elementId={elementId} showCarcut={showCarcut} />

  {/* Seção 2: Position */}
  <PlaceholderPositionSection elementId={elementId} />

  {/* Seção 3: Properties — com borda */}
  <PlaceholderPropertiesSection />

  {/* Seção 4: Motion — com borda */}
  <PlaceholderMotionSection elementId={elementId} />
</div>
```

---

### COMPONENTE: `PlaceholderLayerTitleSection`

```tsx
// PlaceholderLayerTitleSection.tsx
export function PlaceholderLayerTitleSection({
  title,
  showCarcut,
  onShowCarcutChange,
}: {
  title: string
  showCarcut?: boolean
  onShowCarcutChange?: (v: boolean) => void
}) {
  return (
    // gap-[8px] entre o title row e o switch row — extraído do Figma
    <div className="flex flex-col gap-2 items-start w-full">

      {/* Title row: nome + ícones de ação */}
      <div className="flex items-center justify-between p-[4px] w-full">
        <p
          className="text-[16px] font-medium text-[#1f1d25] tracking-[0.15px] leading-[1.5]"
          style={{ fontFamily: "'Roboto', sans-serif" }}
        >
          {title}
        </p>

        {/* Ícones de ação — gap-[4px] entre eles */}
        <div className="flex items-center gap-1">
          <button className="w-5 h-5 flex items-center justify-center text-[#1f1d25] hover:text-[#473bab] transition-colors">
            <MoreHorizontal size={16} />
          </button>
          <button className="w-5 h-5 flex items-center justify-center text-[#1f1d25] hover:text-[#473bab] transition-colors">
            <Users size={16} />
          </button>
          <button className="w-5 h-5 flex items-center justify-center text-[#1f1d25] hover:text-[#473bab] transition-colors">
            <Link size={16} />
          </button>
        </div>
      </div>

      {/* Switch "Show carcut" — apenas para Jellybean */}
      {showCarcut !== undefined && (
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
      )}
    </div>
  )
}
```

---

### COMPONENTE: `PlaceholderPositionSection`

```tsx
// PlaceholderPositionSection.tsx
export function PlaceholderPositionSection({ elementId }: { elementId: string }) {
  const { updateElement, canvasElements } = useDesignWorkspaceStore()
  const el = canvasElements.find(e => e.id === elementId)!

  return (
    // gap-[8px] entre título, alignment buttons, campos X/Y/W/H e border-radius
    <div className="flex flex-col gap-2 items-start w-full">

      {/* Título da seção */}
      <p
        className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]"
        style={{ fontFamily: "'Roboto', sans-serif" }}
      >
        Position
      </p>

      {/* Botões de alinhamento — full width, 7 botões distribuídos */}
      <PlaceholderAlignmentButtons />

      {/* Campos de posição e tamanho — gap-[8px] entre linhas */}
      <div className="flex flex-col gap-2 w-full">

        {/* X / Y */}
        <div className="flex items-start justify-between w-full">
          <AxisField label="X" value={el.x}      onChange={v => updateElement(elementId, { x: v })} />
          <AxisField label="Y" value={el.y}      onChange={v => updateElement(elementId, { y: v })} />
        </div>

        {/* W / H */}
        <div className="flex items-start justify-between w-full">
          <AxisField label="W" value={el.width}  onChange={v => updateElement(elementId, { width: v })} />
          <AxisField label="H" value={el.height} onChange={v => updateElement(elementId, { height: v })} />
        </div>

      </div>

      {/* Border Radius */}
      <div className="flex items-center w-full">
        <button className="w-10 h-9 flex items-center justify-center shrink-0">
          <RoundedCornerIcon size={20} className="text-[#1f1d25]" />
        </button>
        <Input
          className="flex-1 min-w-0 h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px] text-[#1f1d25] tracking-[0.17px]"
          placeholder=""
        />
      </div>

    </div>
  )
}
```

---

### COMPONENTE: `AxisField`

Exatamente conforme o Figma — `w-[40px]` fixo para o label, input flex:

```tsx
// AxisField.tsx
export function AxisField({ label, value, onChange }: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    // flex-1 para ocupar metade do espaço disponível lado a lado
    <div className="flex flex-1 items-center gap-0 min-w-0">
      {/* Label — w-[40px] fixo, texto centralizado, Roboto Regular 14px */}
      <div className="w-10 shrink-0 flex items-center justify-center h-9">
        <span
          className="text-[14px] text-[#1f1d25] tracking-[0.17px] leading-6 text-center"
          style={{ fontFamily: "'Roboto', sans-serif" }}
        >
          {label}
        </span>
      </div>
      {/* Input — Roboto Regular 12px */}
      <Input
        className="flex-1 min-w-0 h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px] text-[#1f1d25] tracking-[0.17px]"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  )
}
```

---

### COMPONENTE: `PlaceholderPropertiesSection`

Seção com borda — `p-[8px]`, `gap-[12px]` interno:

```tsx
// PlaceholderPropertiesSection.tsx
export function PlaceholderPropertiesSection() {
  return (
    // p-[8px] e gap-[12px] — exatamente como no Figma
    <div className="flex flex-col gap-3 items-start p-2 w-full border border-[rgba(0,0,0,0.12)] rounded-[8px]">

      {/* Header: título + botão Reset — h-[20px], gap-[16px] */}
      <div className="flex items-center justify-between gap-4 w-full h-5">
        <p
          className="flex-1 min-w-0 text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]"
          style={{ fontFamily: "'Roboto', sans-serif" }}
        >
          Properties
        </p>
        <button className="flex items-center justify-center px-[5px] py-1 rounded-full hover:bg-[#473bab14] transition-colors shrink-0">
          <span
            className="text-[13px] font-medium text-[#473bab] tracking-[0.46px] leading-[22px] capitalize whitespace-nowrap"
            style={{ fontFamily: "'Roboto', sans-serif" }}
          >
            Reset
          </span>
        </button>
      </div>

      {/* Brand select — com label acima, gap-[4px] */}
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center gap-1 pb-1 px-1">
          <span
            className="text-[12px] text-[#686576] tracking-[0.15px] leading-3"
            style={{ fontFamily: "'Roboto', sans-serif" }}
          >
            Brand
          </span>
        </div>
        <Select>
          <SelectTrigger className="w-full h-9 py-1.5 pl-2 pr-1 text-xs bg-[#f9fafa] border border-[#cac9cf] rounded-[4px]">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>
            {/* brands futuras */}
          </SelectContent>
        </Select>
      </div>

    </div>
  )
}
```

---

### COMPONENTE: `PlaceholderMotionSection`

Seção com borda — `p-[8px]`, `gap-[12px]` interno, label `gap-[12px]` do input:

```tsx
// PlaceholderMotionSection.tsx
export function PlaceholderMotionSection({ elementId }: { elementId: string }) {
  return (
    // p-[8px] e gap-[12px] — exatamente como no Figma
    <div className="flex flex-col gap-3 items-start p-2 w-full border border-[rgba(0,0,0,0.12)] rounded-[8px]">

      {/* Título */}
      <p
        className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]"
        style={{ fontFamily: "'Roboto', sans-serif" }}
      >
        Motion
      </p>

      {/* Start / End — gap-[16px] entre os dois grupos */}
      <div className="flex items-center gap-4 w-full">

        {/* Start — label gap-[12px] do input */}
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <span
            className="text-xs text-[#1f1d25] tracking-[0.17px] text-center shrink-0"
            style={{ fontFamily: "'Roboto', sans-serif" }}
          >
            start
          </span>
          <Input
            className="flex-1 min-w-0 h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px] text-[#1f1d25] tracking-[0.17px]"
            defaultValue="0:00"
          />
        </div>

        {/* End — label gap-[12px] do input */}
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <span
            className="text-xs text-[#1f1d25] tracking-[0.17px] text-center shrink-0"
            style={{ fontFamily: "'Roboto', sans-serif" }}
          >
            end
          </span>
          <Input
            className="flex-1 min-w-0 h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px] text-[#1f1d25] tracking-[0.17px]"
            defaultValue="1:30"
          />
        </div>

      </div>
    </div>
  )
}
```

---

### INTEGRAÇÃO — Variantes usando os componentes corrigidos

```tsx
// JellybeanPropertiesPanel.tsx
export function JellybeanPropertiesPanel({ elementId }: { elementId: string }) {
  const [showCarcut, setShowCarcut] = useState(false)
  return (
    <div className="flex flex-col gap-3 items-start pt-2 w-full overflow-x-hidden">
      <PlaceholderLayerTitleSection
        title="Jellybean"
        showCarcut={showCarcut}
        onShowCarcutChange={setShowCarcut}
      />
      <PlaceholderPositionSection elementId={elementId} />
      <PlaceholderPropertiesSection />
      <PlaceholderMotionSection elementId={elementId} />
    </div>
  )
}

// LogoPropertiesPanel.tsx
export function LogoPropertiesPanel({ elementId }: { elementId: string }) {
  return (
    <div className="flex flex-col gap-3 items-start pt-2 w-full overflow-x-hidden">
      <PlaceholderLayerTitleSection title="Logo" />
      <PlaceholderPositionSection elementId={elementId} />
      <PlaceholderPropertiesSection />
      <PlaceholderMotionSection elementId={elementId} />
    </div>
  )
}

// BackgroundPropertiesPanel.tsx
export function BackgroundPropertiesPanel({ elementId }: { elementId: string }) {
  return (
    <div className="flex flex-col gap-3 items-start pt-2 w-full overflow-x-hidden">
      <PlaceholderLayerTitleSection title="Background" />
      <PlaceholderPositionSection elementId={elementId} />
      <PlaceholderPropertiesSection />
      <PlaceholderMotionSection elementId={elementId} />
    </div>
  )
}

// MediaPropertiesPanel.tsx
export function MediaPropertiesPanel({ elementId }: { elementId: string }) {
  return (
    <div className="flex flex-col gap-3 items-start pt-2 w-full overflow-x-hidden">
      <PlaceholderLayerTitleSection title="Media" />
      <PlaceholderPositionSection elementId={elementId} />
      <PlaceholderPropertiesSection />
      <PlaceholderMotionSection elementId={elementId} />
    </div>
  )
}
```

---

### CHECKLIST DE VALIDAÇÃO — Espaçamentos

Antes de considerar o painel correto, verificar contra o Figma:

- [ ] Container raiz: `pt-2` (8px) no topo, `gap-3` (12px) entre seções
- [ ] LayerTitleSection: `gap-2` (8px) entre title row e switch row
- [ ] Title row: `p-[4px]` ao redor, ícones com `gap-1` (4px)
- [ ] PositionSection: `gap-2` (8px) entre todos os elementos internos
- [ ] AxisField label: `w-10` (40px) fixo
- [ ] AxisField input: `h-9` (36px), `py-1.5` (6px), `px-2` (8px)
- [ ] PropertiesSection: `p-2` (8px) padding, `gap-3` (12px) interno
- [ ] Properties header: `h-5` (20px), `gap-4` (16px) entre título e Reset
- [ ] Brand select: `gap-1` (4px) label→input
- [ ] MotionSection: `p-2` (8px) padding, `gap-3` (12px) interno
- [ ] Motion start/end: `gap-4` (16px) entre os dois grupos, `gap-3` (12px) label→input
- [ ] Nenhum overflow horizontal — `overflow-x-hidden` em todos os containers

---

### TOKENS DE DESIGN — REFERÊNCIA CONSOLIDADA

| Token | Valor exato Figma | Tailwind |
|---|---|---|
| Painel padding topo | `8px` | `pt-2` |
| Gap entre seções | `12px` | `gap-3` |
| Gap interno seção | `8px` | `gap-2` |
| Seção com borda padding | `8px` | `p-2` |
| Seção com borda gap interno | `12px` | `gap-3` |
| Input height | `36px` | `h-9` |
| Input padding vertical | `6px` | `py-1.5` |
| Input padding horizontal | `8px` | `px-2` |
| Input border | `#dddce0` (outlined) | — |
| Input border standard | `#cac9cf` | — |
| Input background | `#f9fafa` | — |
| Input border-radius | `4px` | `rounded-[4px]` |
| AxisField label width | `40px` | `w-10` |
| AxisField label font | Roboto Regular 14px | `text-[14px]` |
| Input/value font | Roboto Regular 12px | `text-xs` |
| Section title font | Roboto Medium 14px | `text-[14px] font-medium` |
| Pane title font | Roboto Medium 16px | `text-[16px] font-medium` |
| Section border | `rgba(0,0,0,0.12)` | `border-[rgba(0,0,0,0.12)]` |
| Section border-radius | `8px` | `rounded-[8px]` |
| Motion label→input gap | `12px` | `gap-3` |
| Motion group gap | `16px` | `gap-4` |
| Icons action gap | `4px` | `gap-1` |
| Reset button color | `#473bab` | `text-[#473bab]` |
| Reset button font | Roboto Medium 13px | `text-[13px] font-medium` |