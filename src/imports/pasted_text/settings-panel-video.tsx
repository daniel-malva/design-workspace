Deixa eu inspecionar o frame do painel de Settings com a opção Video selecionada.Tenho todos os detalhes visuais e estruturais do Figma. Aqui está o prompt:

---

## 🧱 PROMPT V56 — Design Workspace — SettingsPanel: conteúdo dinâmico por formato (Static vs Video)

---

### STACK & BOAS PRÁTICAS

```
Stack: React + TypeScript + Tailwind CSS + shadcn/ui components
Boas práticas:
- Componentes reutilizáveis nomeados semanticamente por função
- TypeScript com interfaces e tipos explícitos para todas as props
- Tailwind para estilização, sem CSS inline ou arquivos .css separados
- shadcn/ui para RadioGroup, Checkbox, Select, Input, Separator
- Estado local via useState dentro do SettingsPanel
```

---

### REGRA PRINCIPAL

O `SettingsTemplateTab` exibe conteúdo **diferente** dependendo do valor do radio group **Format**:

| Format selecionado | Seções exibidas |
|---|---|
| **Static** (default) | Template Name, Template Type, Asset Type, Brand, Accounts, Format radio, **Dimensions**, Metadata |
| **Video** | Template Name, Template Type, Asset Type, Brand, Accounts, Format radio, **Dimension** (com Aspect Ratio), **Duration**, **Frame System**, **Advanced**, Metadata |

As seções em negrito são as que **mudam** entre os dois formatos. Tudo acima do radio Format é idêntico nos dois casos.

---

### STORE — Adicionar `templateFormat` ao estado de Settings

```tsx
// store/useDesignWorkspaceStore.ts

interface DesignWorkspaceState {
  // ...existentes...
  settings: {
    templateName:   string
    templateType:   string
    assetType:      string
    brand:          string
    accounts:       string
    format:         'static' | 'video'   // ← controla qual bloco é exibido
    // Static
    dimensionPreset: string
    dimensionW:      number
    dimensionH:      number
    // Video
    aspectRatio:     string
    dimensionVideoPreset: string
    dimensionVideoW: number
    dimensionVideoH: number
    durationType:    string
    duration:        string
    frames:          string
    lockDuration:    boolean
    loopPlayback:    boolean
    snapToFrames:    boolean
    // Metadata (compartilhado)
    tags:            string
    offerTypes:      string
  }
}
```

---

### COMPONENTE: `SettingsTemplateTab` — roteador de formato

```tsx
// SettingsTemplateTab.tsx
export function SettingsTemplateTab() {
  const { settings, updateSettings } = useDesignWorkspaceStore()
  const format = settings.format

  return (
    <div className="flex flex-col gap-3 w-full px-0 py-2 overflow-x-hidden">

      {/* ── Campos comuns a ambos os formatos ────────────────────────── */}

      {/* Template Name */}
      <SettingsField label="Template Name" required>
        <Input
          className="w-full h-9 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px] text-[#1f1d25] tracking-[0.17px]"
          value={settings.templateName}
          onChange={e => updateSettings({ templateName: e.target.value })}
        />
      </SettingsField>

      {/* Template Type */}
      <SettingsField label="Template Type" required>
        <Select value={settings.templateType} onValueChange={v => updateSettings({ templateType: v })}>
          <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="non-html">Non-HTML</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
          </SelectContent>
        </Select>
      </SettingsField>

      {/* Asset Type */}
      <SettingsField label="Asset Type" required>
        <Select value={settings.assetType} onValueChange={v => updateSettings({ assetType: v })}>
          <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border border-[#cac9cf] rounded-[4px]">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>{/* futuro */}</SelectContent>
        </Select>
      </SettingsField>

      {/* Brand */}
      <SettingsField label="Brand">
        <Select value={settings.brand} onValueChange={v => updateSettings({ brand: v })}>
          <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border border-[#cac9cf] rounded-[4px]">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>{/* futuro */}</SelectContent>
        </Select>
      </SettingsField>

      {/* Accounts */}
      <SettingsField label="Accounts">
        <Select value={settings.accounts} onValueChange={v => updateSettings({ accounts: v })}>
          <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border border-[#cac9cf] rounded-[4px]">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>{/* futuro */}</SelectContent>
        </Select>
      </SettingsField>

      {/* Format — Radio Group */}
      <div className="flex flex-col gap-1 w-full">
        <label className="text-[14px] text-[#1f1d25] tracking-[0.15px] leading-[1.5]">Format</label>
        <RadioGroup
          value={format}
          onValueChange={(v) => updateSettings({ format: v as 'static' | 'video' })}
          className="flex flex-row items-center"
        >
          <div className="flex items-center">
            <RadioGroupItem value="static" id="format-static" className="text-[#473bab]" />
            <Label htmlFor="format-static" className="ml-2 text-[14px] text-[#1f1d25] tracking-[0.15px] cursor-pointer">
              Static
            </Label>
          </div>
          <div className="flex items-center ml-2">
            <RadioGroupItem value="video" id="format-video" className="text-[#473bab]" />
            <Label htmlFor="format-video" className="ml-2 text-[14px] text-[#1f1d25] tracking-[0.15px] cursor-pointer">
              Video
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* ── Conteúdo dinâmico por formato ────────────────────────────── */}
      {format === 'static' ? (
        <SettingsStaticContent />
      ) : (
        <SettingsVideoContent />
      )}

      {/* ── Metadata — compartilhado entre ambos os formatos ─────────── */}
      <SettingsMetadataSection />

    </div>
  )
}
```

---

### COMPONENTE: `SettingsStaticContent`

Exibido quando `format === 'static'`. Contém apenas a seção de Dimensions (igual ao que já existe):

```tsx
// SettingsStaticContent.tsx
export function SettingsStaticContent() {
  return <SettingsDimensionsSection />
}
```

---

### COMPONENTE: `SettingsVideoContent`

Exibido quando `format === 'video'`. Contém 4 seções em sequência, todas com borda arredondada `rounded-xl`, `border border-[rgba(0,0,0,0.12)]`, `p-3`, `gap-3`:

```tsx
// SettingsVideoContent.tsx
export function SettingsVideoContent() {
  return (
    <div className="flex flex-col gap-3 w-full">
      <SettingsDimensionVideoSection />
      <SettingsDurationSection />
      <SettingsFrameSystemSection />
      <SettingsAdvancedSection />
    </div>
  )
}
```

---

### COMPONENTE: `SettingsDimensionVideoSection`

Seção **Dimension** para vídeo — com Aspect Ratio + Dimension select + W/H:

```tsx
// SettingsDimensionVideoSection.tsx
export function SettingsDimensionVideoSection() {
  const { settings, updateSettings } = useDesignWorkspaceStore()

  return (
    <div className="flex flex-col gap-3 w-full border border-[rgba(0,0,0,0.12)] rounded-xl p-3">

      {/* Título */}
      <p className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]">
        Dimension
      </p>

      {/* Aspect Ratio */}
      <SettingsField label="Aspect Ratio">
        <Select value={settings.aspectRatio} onValueChange={v => updateSettings({ aspectRatio: v })}>
          <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="16:9">16:9</SelectItem>
            <SelectItem value="9:16">9:16</SelectItem>
            <SelectItem value="1:1">1:1</SelectItem>
            <SelectItem value="4:3">4:3</SelectItem>
          </SelectContent>
        </Select>
      </SettingsField>

      {/* Dimension preset */}
      <SettingsField label="Dimension">
        <Select value={settings.dimensionVideoPreset} onValueChange={v => updateSettings({ dimensionVideoPreset: v })}>
          <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border border-[#cac9cf] rounded-[4px]">
            <div className="flex items-center gap-2">
              <Maximize2 size={14} className="text-[#1f1d25] shrink-0" />
              <SelectValue placeholder="Custom" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Custom</SelectItem>
            <SelectItem value="1920x1080">1920 × 1080 (Full HD)</SelectItem>
            <SelectItem value="1280x720">1280 × 720 (HD)</SelectItem>
            <SelectItem value="3840x2160">3840 × 2160 (4K)</SelectItem>
          </SelectContent>
        </Select>
      </SettingsField>

      {/* W / H */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex flex-1 items-center gap-0 min-w-0">
          <div className="w-10 shrink-0 flex items-center justify-center h-9">
            <span className="text-xs text-[#1f1d25] tracking-[0.15px] text-center">W</span>
          </div>
          <Input
            className="flex-1 min-w-0 h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px]"
            value={settings.dimensionVideoW}
            onChange={e => updateSettings({ dimensionVideoW: Number(e.target.value) })}
          />
        </div>
        <div className="flex flex-1 items-center gap-0 min-w-0">
          <div className="w-10 shrink-0 flex items-center justify-center h-9">
            <span className="text-xs text-[#1f1d25] tracking-[0.15px] text-center">H</span>
          </div>
          <Input
            className="flex-1 min-w-0 h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px]"
            value={settings.dimensionVideoH}
            onChange={e => updateSettings({ dimensionVideoH: Number(e.target.value) })}
          />
        </div>
      </div>

    </div>
  )
}
```

---

### COMPONENTE: `SettingsDurationSection`

Seção **Duration** — Duration Type + Duration input com helper text:

```tsx
// SettingsDurationSection.tsx
export function SettingsDurationSection() {
  const { settings, updateSettings } = useDesignWorkspaceStore()

  return (
    <div className="flex flex-col gap-3 w-full border border-[rgba(0,0,0,0.12)] rounded-xl p-3">

      <p className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]">
        Duration
      </p>

      {/* Duration Type + Duration — dois campos lado a lado */}
      <div className="flex items-start gap-3 w-full">

        {/* Duration Type */}
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <label className="text-[12px] text-[#686576] tracking-[0.15px] px-1">Duration Type</label>
          <Select value={settings.durationType} onValueChange={v => updateSettings({ durationType: v })}>
            <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border border-[#cac9cf] rounded-[4px]">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time">Time</SelectItem>
              <SelectItem value="frames">Frames</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Duration input */}
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <label className="text-[12px] text-[#686576] tracking-[0.15px] px-1">Duration</label>
          <Input
            className="w-full h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px] text-[#1f1d25]"
            value={settings.duration}
            onChange={e => updateSettings({ duration: e.target.value })}
            placeholder="00:10.999"
          />
          {/* Helper text */}
          <p className="text-[12px] text-[#686576] tracking-[0.4px] leading-[1.66] px-1">
            Format: mm:ss.SSS
          </p>
        </div>

      </div>
    </div>
  )
}
```

---

### COMPONENTE: `SettingsFrameSystemSection`

Seção **Frame System** — Frames select com helper text calculado:

```tsx
// SettingsFrameSystemSection.tsx
export function SettingsFrameSystemSection() {
  const { settings, updateSettings } = useDesignWorkspaceStore()

  // Calcular frames a partir da duração — helper text dinâmico
  const framesHelperText = settings.frames && settings.duration
    ? `${settings.duration} (mm:ss.SSS) = ${
        Math.round(parseFloat(settings.frames) * parseFloat(settings.duration.replace(':', '.')))
      } frames @ ${settings.frames}fps`
    : '00:10:999 (mm:ss.SSS) = 240 frames @ 24fps'

  return (
    <div className="flex flex-col gap-3 w-full border border-[rgba(0,0,0,0.12)] rounded-xl p-3">

      <p className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]">
        Frame System
      </p>

      <div className="flex flex-col gap-1 w-full">
        <label className="text-[12px] text-[#686576] tracking-[0.15px] px-1">Frames</label>
        <Select value={settings.frames} onValueChange={v => updateSettings({ frames: v })}>
          <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border border-[#cac9cf] rounded-[4px]">
            <SelectValue placeholder="24" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24">24</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="30">30</SelectItem>
            <SelectItem value="60">60</SelectItem>
          </SelectContent>
        </Select>
        {/* Helper text */}
        <p className="text-[12px] text-[#686576] tracking-[0.4px] leading-[1.66] px-1">
          {framesHelperText}
        </p>
      </div>

    </div>
  )
}
```

---

### COMPONENTE: `SettingsAdvancedSection`

Seção **Advanced** — 3 checkboxes: Lock duration to template, Loop playback, Snap to frames:

```tsx
// SettingsAdvancedSection.tsx
export function SettingsAdvancedSection() {
  const { settings, updateSettings } = useDesignWorkspaceStore()

  return (
    <div className="flex flex-col gap-3 w-full border border-[rgba(0,0,0,0.12)] rounded-xl p-3">

      <p className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]">
        Advanced
      </p>

      <div className="flex flex-col gap-0 w-full">

        {/* Lock duration to template */}
        <div className="flex items-center gap-0">
          <Checkbox
            id="lock-duration"
            checked={settings.lockDuration}
            onCheckedChange={v => updateSettings({ lockDuration: Boolean(v) })}
            className="text-[#473bab]"
          />
          <label htmlFor="lock-duration" className="ml-2 text-[14px] text-[#1f1d25] tracking-[0.15px] leading-[1.5] cursor-pointer">
            Lock duration to template
          </label>
        </div>

        {/* Loop playback */}
        <div className="flex items-center gap-0">
          <Checkbox
            id="loop-playback"
            checked={settings.loopPlayback}
            onCheckedChange={v => updateSettings({ loopPlayback: Boolean(v) })}
            className="text-[#473bab]"
          />
          <label htmlFor="loop-playback" className="ml-2 text-[14px] text-[#1f1d25] tracking-[0.15px] leading-[1.5] cursor-pointer">
            Loop playback
          </label>
        </div>

        {/* Snap to frames */}
        <div className="flex items-center gap-0">
          <Checkbox
            id="snap-to-frames"
            checked={settings.snapToFrames}
            onCheckedChange={v => updateSettings({ snapToFrames: Boolean(v) })}
            className="text-[#473bab]"
          />
          <label htmlFor="snap-to-frames" className="ml-2 text-[14px] text-[#1f1d25] tracking-[0.15px] leading-[1.5] cursor-pointer">
            Snap to frames
          </label>
        </div>

      </div>
    </div>
  )
}
```

---

### DIAGRAMA — Estrutura condicional do `SettingsTemplateTab`

```
SettingsTemplateTab
  ├── Template Name (sempre)
  ├── Template Type (sempre)
  ├── Asset Type (sempre)
  ├── Brand (sempre)
  ├── Accounts (sempre)
  ├── Format RadioGroup: ◉ Static  ○ Video (sempre)
  │
  ├── [format === 'static']
  │     └── SettingsStaticContent
  │           └── SettingsDimensionsSection (W, H, preset)
  │
  ├── [format === 'video']
  │     └── SettingsVideoContent
  │           ├── SettingsDimensionVideoSection (Aspect Ratio + Dimension + W/H)
  │           ├── SettingsDurationSection (Duration Type + Duration + helper)
  │           ├── SettingsFrameSystemSection (Frames + helper calculado)
  │           └── SettingsAdvancedSection (3 checkboxes)
  │
  └── SettingsMetadataSection (sempre — Tags, Offer Types, + Add Field)
```

---

### VALORES DEFAULT DO STORE

```tsx
settings: {
  templateName:         '{default template name}',
  templateType:         'non-html',
  assetType:            '',
  brand:                '',
  accounts:             '',
  format:               'static',   // ← default: Static
  // Static
  dimensionPreset:      'custom',
  dimensionW:           600,
  dimensionH:           600,
  // Video
  aspectRatio:          'all',
  dimensionVideoPreset: 'custom',
  dimensionVideoW:      1920,
  dimensionVideoH:      1080,
  durationType:         'time',
  duration:             '00:10.999',
  frames:               '24',
  lockDuration:         true,
  loopPlayback:         true,
  snapToFrames:         true,
  // Metadata
  tags:                 '',
  offerTypes:           '',
}
```

---

### TOKENS DE DESIGN — REFERÊNCIA (extraídos do Figma)

| Token | Valor |
|---|---|
| Gap entre seções | `12px` → `gap-3` |
| Seção com borda padding | `12px` → `p-3` |
| Seção border-radius | `12px` → `rounded-xl` |
| Seção border | `1px solid rgba(0,0,0,0.12)` |
| Section title font | Roboto Medium 14px tracking 0.1px |
| Input height | `36px` → `h-9` |
| Input bg | `#f9fafa` |
| Input border outlined | `#dddce0` |
| Input border standard | `#cac9cf` |
| Helper text font | Roboto Regular 12px tracking 0.4px |
| Helper text color | `#686576` |
| Label font | Roboto Regular 12px tracking 0.15px |
| Checkbox/Radio color | `#473bab` |
| Format transition | imediata — sem animação de troca |
| Formato Default | `'static'` |