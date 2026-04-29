Deixa eu inspecionar o frame do ColorPicker no Figma antes de gerar o prompt.Tenho todos os detalhes visuais e estruturais. Aqui está o prompt completo:

---

## 🧱 PROMPT V67 — Design Workspace — ColorPicker: swatch abre picker + aplica cor ao elemento selecionado

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

Sempre que houver um **swatch de cor** no `RightPanel` (Fill, Stroke, cor de texto, cor de shape, etc.), clicar nele deve:

1. Abrir o `ColorPicker` como popover flutuante ancorado ao swatch
2. A cor selecionada no picker é **aplicada em tempo real** ao elemento correspondente via `updateElement`
3. Fechar o picker ao clicar fora — a última cor selecionada é mantida

---

### COMPONENTE: `ColorPicker`

Fiel ao design do Figma — duas abas (**Solid** e **Linear**), área de saturação, sliders de hue e alpha, campos Hex/R/G/B/A, e paleta de swatches rápidos:

```tsx
// ColorPicker.tsx
interface ColorPickerProps {
  value:    string        // cor atual em hex, ex: "#1890FF"
  opacity:  number        // 0–100
  onChange: (hex: string, opacity: number) => void
  onClose:  () => void
}

export function ColorPicker({ value, opacity, onChange, onClose }: ColorPickerProps) {
  const [activeTab,  setActiveTab]  = useState<'solid' | 'linear'>('solid')
  const [hex,        setHex]        = useState(value.replace('#', ''))
  const [alpha,      setAlpha]      = useState(opacity)
  const [hue,        setHue]        = useState(0)
  const [saturation, setSaturation] = useState(50)
  const [lightness,  setLightness]  = useState(50)

  // Sincronizar estado interno quando o valor externo muda
  useEffect(() => {
    setHex(value.replace('#', ''))
    setAlpha(opacity)
    const { h, s, l } = hexToHsl(value)
    setHue(h); setSaturation(s); setLightness(l)
  }, [value, opacity])

  // Área de saturação — gradiente 2D
  const saturationBg = `
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))
  `

  // Hue slider — gradiente do espectro
  const hueBg = `linear-gradient(to right,
    #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000
  )`

  function handleSaturationClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const s    = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const l    = Math.round(100 - ((e.clientY - rect.top) / rect.height) * 100)
    setSaturation(s); setLightness(l)
    const newHex = hslToHex(hue, s, l)
    setHex(newHex.replace('#', ''))
    onChange(`#${newHex}`, alpha)
  }

  function handleHueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const h = Number(e.target.value)
    setHue(h)
    const newHex = hslToHex(h, saturation, lightness)
    setHex(newHex.replace('#', ''))
    onChange(`#${newHex}`, alpha)
  }

  function handleAlphaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const a = Number(e.target.value)
    setAlpha(a)
    onChange(`#${hex}`, a)
  }

  function handleHexInput(val: string) {
    setHex(val)
    if (val.length === 6) {
      const { h, s, l } = hexToHsl(`#${val}`)
      setHue(h); setSaturation(s); setLightness(l)
      onChange(`#${val}`, alpha)
    }
  }

  function handleSwatchClick(color: string) {
    const clean = color.replace('#', '')
    setHex(clean)
    const { h, s, l } = hexToHsl(color)
    setHue(h); setSaturation(s); setLightness(l)
    onChange(color, alpha)
  }

  return (
    <div
      className="
        flex flex-col w-[240px]
        bg-white border border-[rgba(0,0,0,0.12)] rounded-[4px]
        shadow-[0_2px_8px_rgba(0,0,0,0.15)]
        overflow-hidden
      "
      onClick={e => e.stopPropagation()}
    >
      {/* ── Abas Solid | Linear ──────────────────────────────────────── */}
      <div className="flex border-b border-[rgba(0,0,0,0.12)] shrink-0">
        {(['solid', 'linear'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              relative flex-1 py-[9px]
              text-[14px] font-medium tracking-[0.4px] capitalize
              transition-colors
              ${activeTab === tab
                ? 'text-[#2196f3]'
                : 'text-[rgba(0,0,0,0.6)] hover:text-[rgba(0,0,0,0.87)]'
              }
            `}
            style={{ fontFamily: "'Roboto', sans-serif" }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {/* Underline da tab ativa */}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2196f3]" />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1 p-2">

        {/* ── Área de saturação / cor ──────────────────────────────── */}
        <div
          className="relative w-full rounded-[4px] cursor-crosshair"
          style={{
            height:     '140px',
            background: saturationBg,
          }}
          onClick={handleSaturationClick}
          onMouseMove={e => e.buttons === 1 && handleSaturationClick(e)}
        >
          {/* Pointer — posição atual */}
          <div
            className="absolute w-[10px] h-[10px] rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${saturation}%`,
              top:  `${100 - lightness}%`,
              backgroundColor: `#${hex}`,
            }}
          />
        </div>

        {/* ── Sliders + swatch atual + eyedropper ─────────────────── */}
        <div className="flex items-center gap-1 w-full">

          {/* Sliders — hue e alpha empilhados */}
          <div className="flex-1 flex flex-col gap-1 min-w-0">

            {/* Hue slider */}
            <input
              type="range"
              min={0}
              max={360}
              value={hue}
              onChange={handleHueChange}
              className="w-full h-[10px] rounded-[1px] appearance-none cursor-pointer"
              style={{
                background: hueBg,
                // Thumb via CSS custom
              }}
            />

            {/* Alpha slider */}
            <div className="relative w-full h-[10px] rounded-[1px]">
              {/* Checkered background para indicar transparência */}
              <div
                className="absolute inset-0 rounded-[1px]"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, transparent, #${hex}),
                    repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px
                  `,
                }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={alpha}
                onChange={handleAlphaChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

          </div>

          {/* Swatch — cor atual */}
          <div
            className="w-6 h-6 rounded-[4px] shrink-0 border border-[rgba(0,0,0,0.12)]"
            style={{ backgroundColor: `#${hex}` }}
          />

          {/* Eyedropper */}
          <button className="w-6 h-6 flex items-center justify-center shrink-0 text-[rgba(0,0,0,0.54)] hover:text-[rgba(0,0,0,0.87)]">
            <Pipette size={14} />
          </button>

        </div>

        {/* ── Campos Hex + R G B A ─────────────────────────────────── */}
        <div className="flex gap-1 w-full">
          {/* Hex */}
          <input
            value={`#${hex}`}
            onChange={e => handleHexInput(e.target.value.replace('#', ''))}
            className="
              w-[72px] shrink-0 h-[22px] px-2 py-0.5
              border border-[rgba(0,0,0,0.12)] rounded-[4px]
              text-[11px] text-[rgba(0,0,0,0.87)]
              font-['Inter',sans-serif]
              bg-white outline-none
              focus:border-[#2196f3]
            "
          />
          {/* R G B A */}
          {[
            { label: 'R', value: parseInt(hex.slice(0,2), 16) || 0, max: 255 },
            { label: 'G', value: parseInt(hex.slice(2,4), 16) || 0, max: 255 },
            { label: 'B', value: parseInt(hex.slice(4,6), 16) || 0, max: 255 },
            { label: 'A', value: alpha,                              max: 100 },
          ].map(({ label, value, max }) => (
            <input
              key={label}
              type="number"
              min={0}
              max={max}
              value={value}
              onChange={e => {
                const v = Math.min(max, Math.max(0, Number(e.target.value)))
                if (label === 'A') {
                  setAlpha(v)
                  onChange(`#${hex}`, v)
                } else {
                  const r = label === 'R' ? v : parseInt(hex.slice(0,2), 16)
                  const g = label === 'G' ? v : parseInt(hex.slice(2,4), 16)
                  const b = label === 'B' ? v : parseInt(hex.slice(4,6), 16)
                  const newHex = rgbToHex(r, g, b)
                  setHex(newHex)
                  onChange(`#${newHex}`, alpha)
                }
              }}
              className="
                flex-1 min-w-0 h-[22px] px-1 py-0.5 text-center
                border border-[rgba(0,0,0,0.12)] rounded-[4px]
                text-[11px] text-[rgba(0,0,0,0.87)]
                font-['Inter',sans-serif]
                bg-white outline-none
                focus:border-[#2196f3]
              "
            />
          ))}
        </div>

        {/* Labels Hex R G B A */}
        <div className="flex gap-1 w-full">
          {['Hex', 'R', 'G', 'B', 'A'].map((label, i) => (
            <div
              key={label}
              className={`
                h-4 flex items-center justify-center
                text-[11px] text-[rgba(0,0,0,0.87)] font-['Inter',sans-serif]
                ${i === 0 ? 'w-[72px] shrink-0' : 'flex-1 min-w-0'}
              `}
            >
              {label}
            </div>
          ))}
        </div>

      </div>

      {/* ── Divisor + Paleta de swatches rápidos ─────────────────────── */}
      <div className="border-t border-[rgba(0,0,0,0.12)] p-2">
        <div className="flex flex-col gap-[10px]">
          {PALETTE_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex items-center justify-between">
              {row.map(color => (
                <button
                  key={color}
                  onClick={() => handleSwatchClick(color)}
                  className="w-4 h-4 rounded-[4px] hover:scale-110 transition-transform border border-[rgba(0,0,0,0.08)]"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
```

---

### PALETA DE SWATCHES — extraída do Figma

```tsx
const PALETTE_ROWS = [
  ['#2196f3', '#9c27b0', '#ef5350', '#01579b', '#ba68c8', '#66bb6a', '#558b2f'],
  ['#0057b2', '#ff9800', '#ffecb3', '#a5d6a7', '#00c0d6', '#7b1fa2', '#ea80fc'],
]
```

---

### COMPONENTE: `ColorSwatchButton`

Reutilizável — usado em qualquer swatch clicável no `RightPanel`:

```tsx
// ColorSwatchButton.tsx
interface ColorSwatchButtonProps {
  color:       string      // hex atual
  opacity?:    number      // 0–100, default 100
  property:    'fill' | 'stroke' | 'color'   // qual propriedade está editando
  elementId:   string
  size?:       number      // tamanho do swatch em px, default 16
}

export function ColorSwatchButton({
  color,
  opacity = 100,
  property,
  elementId,
  size = 16,
}: ColorSwatchButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { updateElement, canvasElements } = useDesignWorkspaceStore()
  const anchorRef = useRef<HTMLButtonElement>(null)

  function handleChange(newColor: string, newOpacity: number) {
    const el = canvasElements.find(e => e.id === elementId)
    if (!el) return

    if (property === 'fill' || property === 'stroke') {
      updateElement(elementId, {
        style: {
          ...el.style,
          [property === 'fill' ? 'backgroundColor' : 'borderColor']: newColor,
          [property === 'fill' ? 'fillOpacity'     : 'strokeOpacity']: newOpacity,
        }
      })
    } else if (property === 'color') {
      updateElement(elementId, {
        style: { ...el.style, color: newColor, opacity: newOpacity / 100 }
      })
    }
  }

  return (
    <>
      <button
        ref={anchorRef}
        onClick={() => setIsOpen(prev => !prev)}
        className="rounded-[3px] border border-[rgba(0,0,0,0.15)] hover:scale-105 transition-transform shrink-0"
        style={{
          width:           size,
          height:          size,
          backgroundColor: color,
          opacity:         opacity / 100,
        }}
        title="Click to change color"
      />

      {/* Popover do ColorPicker via portal */}
      {isOpen && createPortal(
        <ColorPickerPopover
          anchorRef={anchorRef}
          value={color}
          opacity={opacity}
          onChange={handleChange}
          onClose={() => setIsOpen(false)}
        />,
        document.body
      )}
    </>
  )
}
```

---

### COMPONENTE: `ColorPickerPopover`

Posiciona o picker em relação ao swatch âncora com `createPortal`:

```tsx
// ColorPickerPopover.tsx
export function ColorPickerPopover({
  anchorRef, value, opacity, onChange, onClose
}: ColorPickerPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Posicionar ao lado do swatch
  const anchor = anchorRef.current?.getBoundingClientRect()
  const top    = anchor ? anchor.bottom + 6 : 0
  const left   = anchor ? anchor.left : 0

  return (
    <div
      ref={popoverRef}
      className="fixed z-[9999]"
      style={{ top, left }}
    >
      <ColorPicker
        value={value}
        opacity={opacity}
        onChange={onChange}
        onClose={onClose}
      />
    </div>
  )
}
```

---

### INTEGRAÇÃO — `TextPropertiesPanel` (seção Style/Fill)

```tsx
// TextPropertiesPanel.tsx — seção Style
<div className="flex items-center gap-2 w-full">

  {/* ✅ ColorSwatchButton substitui o div estático de cor */}
  <ColorSwatchButton
    color={element.style?.color ?? '#000000'}
    opacity={Math.round((element.style?.opacity ?? 1) * 100)}
    property="color"
    elementId={elementId}
    size={16}
  />

  {/* Hex input — também editável */}
  <Input
    className="flex-1 min-w-0 h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px] font-mono"
    value={(element.style?.color ?? '#000000').replace('#', '')}
    onChange={e => updateElement(elementId, {
      style: { ...element.style, color: `#${e.target.value}` }
    })}
  />

  {/* Opacidade */}
  <Input
    className="w-14 shrink-0 h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px] text-right"
    value={`${Math.round((element.style?.opacity ?? 1) * 100)}%`}
    onChange={e => {
      const val = parseInt(e.target.value) / 100
      updateElement(elementId, { style: { ...element.style, opacity: val } })
    }}
  />

</div>
```

---

### INTEGRAÇÃO — `ShapePropertiesPanel` e `IconPropertiesPanel`

A mesma lógica aplica para qualquer painel que tenha swatch de Fill ou Stroke:

```tsx
// Seção Fill — qualquer PropertiesPanel
<div className="flex items-center gap-2 w-full">
  <ColorSwatchButton
    color={element.style?.backgroundColor ?? '#6B7280'}
    opacity={100}
    property="fill"
    elementId={elementId}
    size={16}
  />
  <Input className="flex-1 min-w-0 ..." value={...} onChange={...} />
  <Input className="w-14 shrink-0 ..." value="100%" onChange={...} />
  <button><Eye size={14} /></button>
</div>

// Seção Stroke
<div className="flex items-center gap-2 w-full">
  <ColorSwatchButton
    color={element.style?.borderColor ?? '#000000'}
    opacity={100}
    property="stroke"
    elementId={elementId}
    size={16}
  />
  <Input className="flex-1 min-w-0 ..." />
  <Input className="w-14 shrink-0 ..." />
</div>
```

---

### UTILITÁRIOS DE COR

```tsx
// utils/colorUtils.ts

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1,3), 16) / 255
  const g = parseInt(hex.slice(3,5), 16) / 255
  const b = parseInt(hex.slice(5,7), 16) / 255

  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `${f(0)}${f(8)}${f(4)}`
}

export function rgbToHex(r: number, g: number, b: number): string {
  return [r, g, b]
    .map(v => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0'))
    .join('')
}
```

---

### APLICAÇÃO DA COR AO ELEMENTO — Mapeamento por tipo

```tsx
// A cor é aplicada em tempo real via updateElement — sem necessidade de confirmar
// O updateElement já é reativo: o canvas atualiza imediatamente ao mover o picker

// Texto:        style.color          → CSS color do texto
// Shape Fill:   style.backgroundColor → CSS background do shape
// Shape Stroke: style.borderColor    → CSS border do shape
// Icon:         style.color          → CSS color do SVG (currentColor)
// Placeholder:  style.borderColor    → cor da borda dashed
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Clicar em swatch de Fill → ColorPicker abre ancorado ao swatch
- [ ] Clicar em swatch de Stroke → ColorPicker abre para stroke
- [ ] Clicar em swatch de cor de texto → ColorPicker abre para cor do texto
- [ ] Mover o pointer na área de saturação → cor aplica em tempo real no canvas
- [ ] Mover slider de hue → cor atualiza em tempo real
- [ ] Mover slider de alpha → opacidade atualiza em tempo real
- [ ] Digitar hex válido → cor aplicada
- [ ] Editar R/G/B/A individualmente → cor/opacidade atualizadas
- [ ] Clicar em swatch rápido da paleta → cor aplicada imediatamente
- [ ] Clicar fora do picker → picker fecha, cor mantida
- [ ] Elemento de texto selecionado → cor do texto muda no canvas ✓
- [ ] Shape selecionado → fill/stroke muda no canvas ✓
- [ ] Ícone selecionado → cor do SVG muda no canvas ✓
- [ ] `Cmd+Z` após mudar cor → desfaz (picker não gera snapshot contínuo)

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Picker width | `240px` |
| Picker background | `#FFFFFF` |
| Picker border | `1px solid rgba(0,0,0,0.12)` |
| Picker border-radius | `4px` |
| Picker shadow | `0 2px 8px rgba(0,0,0,0.15)` |
| Área de saturação height | `140px` |
| Pointer de saturação | `10px` círculo branco com shadow |
| Slider height | `10px` |
| Swatch rápido size | `16px × 16px` |
| Tab ativa color | `#2196f3` |
| Tab underline | `2px solid #2196f3` |
| Campo Hex width | `72px` |
| Campos R/G/B/A | `flex-1` |
| Campo height | `22px` |
| Campo font | Inter Regular 11px |
| z-index do portal | `9999` |
| Aplicação da cor | em tempo real via `updateElement` |
| `createPortal` target | `document.body` |