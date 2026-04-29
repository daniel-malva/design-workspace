Prompt direto e focado na aba Linear do ColorPicker:

---

## 🧱 PROMPT V68 — Design Workspace — ColorPicker: aba Linear com editor de gradiente completo

---

### STACK & BOAS PRÁTICAS

```
Stack: React + TypeScript + Tailwind CSS + shadcn/ui components
Boas práticas:
- Componentes reutilizáveis nomeados semanticamente por função
- TypeScript com interfaces e tipos explícitos para todas as props
- Tailwind para estilização, sem CSS inline ou arquivos .css separados
- Estado local via useState — gradiente não vai ao store até confirmar
```

---

### MODELO DE DADOS — Gradiente Linear

```tsx
// types/gradient.ts

interface GradientStop {
  id:       string    // uuid único do stop
  position: number    // 0–100 (%) ao longo do gradiente
  color:    string    // hex, ex: "#FF6B6B"
  opacity:  number    // 0–100
}

interface LinearGradient {
  angle: number          // 0–360 graus
  stops: GradientStop[]  // mínimo 2 stops
}

// Valor padrão ao abrir a aba Linear pela primeira vez
const DEFAULT_GRADIENT: LinearGradient = {
  angle: 90,
  stops: [
    { id: '1', position: 0,   color: '#5B4EFF', opacity: 100 },
    { id: '2', position: 100, color: '#FF6B6B', opacity: 100 },
  ],
}
```

---

### COMPONENTE: `LinearGradientEditor`

Conteúdo completo da aba **Linear** no `ColorPicker`:

```tsx
// LinearGradientEditor.tsx
export function LinearGradientEditor({
  value,    // LinearGradient atual
  onChange, // (gradient: LinearGradient) => void — aplica em tempo real
}: {
  value:    LinearGradient
  onChange: (gradient: LinearGradient) => void
}) {
  const [gradient,      setGradient]      = useState<LinearGradient>(value)
  const [selectedStopId, setSelectedStop] = useState<string>(value.stops[0].id)

  const selectedStop = gradient.stops.find(s => s.id === selectedStopId)
    ?? gradient.stops[0]

  function update(updated: LinearGradient) {
    setGradient(updated)
    onChange(updated)
  }

  // CSS do gradiente atual para preview
  const gradientCSS = buildGradientCSS(gradient)

  return (
    <div className="flex flex-col gap-2 p-2">

      {/* ── Preview da barra de gradiente + stops ───────────────────── */}
      <GradientBar
        gradient={gradient}
        selectedStopId={selectedStopId}
        onSelectStop={setSelectedStop}
        onMoveStop={(id, pos) => {
          update({
            ...gradient,
            stops: gradient.stops
              .map(s => s.id === id ? { ...s, position: pos } : s)
              .sort((a, b) => a.position - b.position),
          })
        }}
        onAddStop={(position) => {
          const color = interpolateGradientColor(gradient, position)
          const newStop: GradientStop = {
            id: crypto.randomUUID(),
            position,
            color,
            opacity: 100,
          }
          const stops = [...gradient.stops, newStop]
            .sort((a, b) => a.position - b.position)
          const updated = { ...gradient, stops }
          update(updated)
          setSelectedStop(newStop.id)
        }}
        onRemoveStop={(id) => {
          if (gradient.stops.length <= 2) return  // mínimo 2 stops
          const stops = gradient.stops.filter(s => s.id !== id)
          const updated = { ...gradient, stops }
          update(updated)
          setSelectedStop(stops[0].id)
        }}
      />

      {/* ── Ângulo do gradiente ──────────────────────────────────────── */}
      <GradientAngleControl
        angle={gradient.angle}
        onChange={angle => update({ ...gradient, angle })}
      />

      {/* ── Editor de cor do stop selecionado ───────────────────────── */}
      <div className="border-t border-[rgba(0,0,0,0.08)] pt-2">
        <p className="text-[10px] text-[rgba(0,0,0,0.5)] font-['Inter',sans-serif] mb-1.5 px-1">
          Selected stop
        </p>
        <StopColorEditor
          stop={selectedStop}
          onChange={(color, opacity) => {
            update({
              ...gradient,
              stops: gradient.stops.map(s =>
                s.id === selectedStopId ? { ...s, color, opacity } : s
              ),
            })
          }}
        />
      </div>

      {/* ── Lista de stops (múltiplos gradientes) ───────────────────── */}
      <GradientStopList
        stops={gradient.stops}
        selectedStopId={selectedStopId}
        onSelect={setSelectedStop}
        onRemove={(id) => {
          if (gradient.stops.length <= 2) return
          const stops = gradient.stops.filter(s => s.id !== id)
          update({ ...gradient, stops })
          setSelectedStop(stops[0].id)
        }}
      />

      {/* ── Paleta de swatches rápidos ──────────────────────────────── */}
      <div className="border-t border-[rgba(0,0,0,0.08)] pt-2">
        <GradientPresets onSelect={preset => update(preset)} />
      </div>

    </div>
  )
}
```

---

### COMPONENTE: `GradientBar`

Barra interativa onde os stops são arrastados:

```tsx
// GradientBar.tsx
export function GradientBar({
  gradient, selectedStopId,
  onSelectStop, onMoveStop, onAddStop, onRemoveStop,
}: GradientBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const gradientCSS = buildGradientCSS({ ...gradient, angle: 90 }) // sempre horizontal na barra

  function handleBarClick(e: React.MouseEvent) {
    // Só adicionar stop se não clicou em um stop existente
    if ((e.target as HTMLElement).dataset.stopId) return
    const rect = barRef.current!.getBoundingClientRect()
    const position = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    onAddStop(Math.min(99, Math.max(1, position)))
  }

  function handleStopMouseDown(
    e: React.MouseEvent,
    stopId: string
  ) {
    e.stopPropagation()
    onSelectStop(stopId)

    const rect = barRef.current!.getBoundingClientRect()

    function onMouseMove(ev: MouseEvent) {
      const pos = Math.round(((ev.clientX - rect.left) / rect.width) * 100)
      onMoveStop(stopId, Math.min(100, Math.max(0, pos)))
    }
    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div className="flex flex-col gap-1">

      {/* Barra de gradiente */}
      <div
        ref={barRef}
        className="relative w-full h-6 rounded-[4px] cursor-crosshair"
        style={{
          background: gradientCSS,
          // Checkered para indicar transparência
          backgroundImage: `${gradientCSS}, repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px`,
        }}
        onClick={handleBarClick}
      >
        {/* Stops como handles arrastáveis */}
        {gradient.stops.map(stop => (
          <div
            key={stop.id}
            data-stop-id={stop.id}
            className={`
              absolute top-1/2 -translate-y-1/2 -translate-x-1/2
              w-4 h-4 rounded-full border-2 cursor-grab active:cursor-grabbing
              shadow-md transition-shadow
              ${stop.id === selectedStopId
                ? 'border-white shadow-[0_0_0_2px_#5B4EFF] z-10'
                : 'border-white z-0 hover:shadow-[0_0_0_2px_rgba(0,0,0,0.3)]'
              }
            `}
            style={{
              left:            `${stop.position}%`,
              backgroundColor: stop.color,
              opacity:         stop.opacity / 100,
            }}
            onMouseDown={e => handleStopMouseDown(e, stop.id)}
            onDoubleClick={e => {
              e.stopPropagation()
              onRemoveStop(stop.id)
            }}
            title={`${stop.color} ${stop.position}% — double-click to remove`}
          />
        ))}
      </div>

      {/* Dica de uso */}
      <p className="text-[9px] text-[rgba(0,0,0,0.4)] font-['Inter',sans-serif] text-center">
        Click to add stop · Double-click stop to remove
      </p>

    </div>
  )
}
```

---

### COMPONENTE: `GradientAngleControl`

Controle de ângulo com roda visual + input numérico:

```tsx
// GradientAngleControl.tsx
export function GradientAngleControl({
  angle,
  onChange,
}: {
  angle:    number
  onChange: (angle: number) => void
}) {
  const wheelRef = useRef<HTMLDivElement>(null)

  function handleWheelClick(e: React.MouseEvent) {
    const rect   = wheelRef.current!.getBoundingClientRect()
    const cx     = rect.left + rect.width  / 2
    const cy     = rect.top  + rect.height / 2
    const rad    = Math.atan2(e.clientY - cy, e.clientX - cx)
    const deg    = Math.round((rad * 180 / Math.PI) + 90 + 360) % 360
    onChange(deg)
  }

  // Presets de ângulo rápido
  const ANGLE_PRESETS = [0, 45, 90, 135, 180, 225, 270, 315]

  return (
    <div className="flex items-center gap-2 w-full">

      {/* Roda de ângulo — clicável */}
      <div
        ref={wheelRef}
        className="w-8 h-8 rounded-full border-2 border-[rgba(0,0,0,0.15)] relative cursor-pointer shrink-0 hover:border-[#5B4EFF] transition-colors"
        onClick={handleWheelClick}
        title="Click to set angle"
      >
        {/* Linha indicadora de ângulo */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            className="w-px h-3 bg-[#5B4EFF] origin-bottom"
            style={{ transform: `rotate(${angle}deg) translateY(-2px)` }}
          />
        </div>
        {/* Ponto central */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[#5B4EFF]" />
      </div>

      {/* Input numérico de ângulo */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <input
          type="number"
          min={0}
          max={359}
          value={angle}
          onChange={e => onChange((Number(e.target.value) + 360) % 360)}
          className="
            w-14 h-[22px] px-2 py-0.5 text-center shrink-0
            border border-[rgba(0,0,0,0.12)] rounded-[4px]
            text-[11px] text-[rgba(0,0,0,0.87)]
            font-['Inter',sans-serif] bg-white outline-none
            focus:border-[#5B4EFF]
          "
        />
        <span className="text-[11px] text-[rgba(0,0,0,0.5)] font-['Inter',sans-serif]">°</span>

        {/* Presets de ângulo rápidos */}
        <div className="flex items-center gap-0.5 ml-auto">
          {ANGLE_PRESETS.map(preset => (
            <button
              key={preset}
              onClick={() => onChange(preset)}
              className={`
                w-5 h-5 rounded-[3px] text-[8px] font-medium
                font-['Inter',sans-serif] transition-colors
                ${angle === preset
                  ? 'bg-[#5B4EFF] text-white'
                  : 'bg-[rgba(0,0,0,0.06)] text-[rgba(0,0,0,0.6)] hover:bg-[rgba(0,0,0,0.1)]'
                }
              `}
              title={`${preset}°`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
```

---

### COMPONENTE: `StopColorEditor`

Mini editor de cor para o stop selecionado (sem área de saturação — apenas hex + sliders):

```tsx
// StopColorEditor.tsx
export function StopColorEditor({
  stop,
  onChange,
}: {
  stop:     GradientStop
  onChange: (color: string, opacity: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">

      {/* Swatch + Hex + Opacity inline */}
      <div className="flex items-center gap-1.5">
        {/* Mini swatch do stop */}
        <div
          className="w-6 h-6 rounded-[4px] shrink-0 border border-[rgba(0,0,0,0.12)]"
          style={{ backgroundColor: stop.color, opacity: stop.opacity / 100 }}
        />

        {/* Hex */}
        <input
          value={stop.color.replace('#', '')}
          onChange={e => {
            const val = e.target.value
            if (val.length === 6) onChange(`#${val}`, stop.opacity)
          }}
          className="
            w-[72px] h-[22px] px-2 py-0.5 shrink-0
            border border-[rgba(0,0,0,0.12)] rounded-[4px]
            text-[11px] font-['Inter',sans-serif] bg-white outline-none
            focus:border-[#5B4EFF]
          "
          maxLength={6}
        />

        {/* Opacity */}
        <input
          type="number"
          min={0}
          max={100}
          value={stop.opacity}
          onChange={e => onChange(stop.color, Number(e.target.value))}
          className="
            w-12 h-[22px] px-1 py-0.5 text-center
            border border-[rgba(0,0,0,0.12)] rounded-[4px]
            text-[11px] font-['Inter',sans-serif] bg-white outline-none
            focus:border-[#5B4EFF]
          "
        />
        <span className="text-[10px] text-[rgba(0,0,0,0.4)] font-['Inter',sans-serif]">%</span>
      </div>

      {/* Mini color picker inline para o stop */}
      <MiniColorArea
        color={stop.color}
        onChange={color => onChange(color, stop.opacity)}
      />

    </div>
  )
}
```

---

### COMPONENTE: `GradientStopList`

Lista dos stops com posição editável:

```tsx
// GradientStopList.tsx
export function GradientStopList({
  stops, selectedStopId, onSelect, onRemove
}: GradientStopListProps) {
  const { updateElement } = useDesignWorkspaceStore()

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] text-[rgba(0,0,0,0.5)] font-['Inter',sans-serif] px-1">
        Stops ({stops.length})
      </p>
      <div className="flex flex-col gap-0.5 max-h-[80px] overflow-y-auto">
        {stops.map(stop => (
          <div
            key={stop.id}
            className={`
              flex items-center gap-2 px-1.5 py-1 rounded-[4px] cursor-pointer
              transition-colors select-none
              ${stop.id === selectedStopId
                ? 'bg-[#5B4EFF14]'
                : 'hover:bg-[rgba(0,0,0,0.04)]'
              }
            `}
            onClick={() => onSelect(stop.id)}
          >
            {/* Swatch do stop */}
            <div
              className="w-3.5 h-3.5 rounded-[2px] shrink-0 border border-[rgba(0,0,0,0.12)]"
              style={{ backgroundColor: stop.color }}
            />

            {/* Posição */}
            <span className="flex-1 text-[10px] text-[rgba(0,0,0,0.7)] font-['Inter',sans-serif] truncate">
              {stop.color}
            </span>
            <span className="text-[10px] text-[rgba(0,0,0,0.5)] font-['Inter',sans-serif] shrink-0">
              {stop.position}%
            </span>

            {/* Remover — só se houver mais de 2 stops */}
            {stops.length > 2 && (
              <button
                onClick={e => { e.stopPropagation(); onRemove(stop.id) }}
                className="w-4 h-4 flex items-center justify-center text-[rgba(0,0,0,0.3)] hover:text-[rgba(0,0,0,0.7)] shrink-0"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### COMPONENTE: `GradientPresets`

Presets de gradientes rápidos:

```tsx
// GradientPresets.tsx
const GRADIENT_PRESETS: LinearGradient[] = [
  { angle: 90,  stops: [{ id:'1', position:0,   color:'#5B4EFF', opacity:100 }, { id:'2', position:100, color:'#FF6B6B', opacity:100 }] },
  { angle: 135, stops: [{ id:'1', position:0,   color:'#FF6B6B', opacity:100 }, { id:'2', position:100, color:'#FFD93D', opacity:100 }] },
  { angle: 90,  stops: [{ id:'1', position:0,   color:'#00C0D6', opacity:100 }, { id:'2', position:100, color:'#5B4EFF', opacity:100 }] },
  { angle: 180, stops: [{ id:'1', position:0,   color:'#1f1d25', opacity:100 }, { id:'2', position:100, color:'#473bab', opacity:100 }] },
  { angle: 90,  stops: [{ id:'1', position:0,   color:'#66BB6A', opacity:100 }, { id:'2', position:100, color:'#00C0D6', opacity:100 }] },
  { angle: 45,  stops: [{ id:'1', position:0,   color:'#9C27B0', opacity:100 }, { id:'2', position:50,  color:'#5B4EFF', opacity:100 }, { id:'3', position:100, color:'#00C0D6', opacity:100 }] },
  { angle: 90,  stops: [{ id:'1', position:0,   color:'#FF9800', opacity:100 }, { id:'2', position:100, color:'#FF6B6B', opacity:100 }] },
  { angle: 90,  stops: [{ id:'1', position:0,   color:'#ffffff', opacity:0   }, { id:'2', position:100, color:'#5B4EFF', opacity:100 }] },
]

export function GradientPresets({ onSelect }: { onSelect: (g: LinearGradient) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] text-[rgba(0,0,0,0.5)] font-['Inter',sans-serif] px-1">
        Presets
      </p>
      <div className="flex flex-wrap gap-1">
        {GRADIENT_PRESETS.map((preset, i) => (
          <button
            key={i}
            onClick={() => onSelect({
              ...preset,
              stops: preset.stops.map(s => ({ ...s, id: crypto.randomUUID() }))
            })}
            className="w-6 h-6 rounded-[4px] border border-[rgba(0,0,0,0.12)] hover:scale-110 transition-transform"
            style={{ background: buildGradientCSS({ ...preset, angle: 135 }) }}
            title={`${preset.angle}° — ${preset.stops.length} stops`}
          />
        ))}
      </div>
    </div>
  )
}
```

---

### UTILITÁRIO: `buildGradientCSS`

```tsx
// utils/gradientUtils.ts

export function buildGradientCSS(gradient: LinearGradient): string {
  const stops = gradient.stops
    .sort((a, b) => a.position - b.position)
    .map(stop => {
      const hex  = stop.color
      const r    = parseInt(hex.slice(1,3), 16)
      const g    = parseInt(hex.slice(3,5), 16)
      const b    = parseInt(hex.slice(5,7), 16)
      const a    = stop.opacity / 100
      return `rgba(${r},${g},${b},${a}) ${stop.position}%`
    })
    .join(', ')

  return `linear-gradient(${gradient.angle}deg, ${stops})`
}

export function interpolateGradientColor(
  gradient: LinearGradient,
  position: number
): string {
  const sorted = [...gradient.stops].sort((a, b) => a.position - b.position)
  const before = sorted.filter(s => s.position <= position).pop() ?? sorted[0]
  const after  = sorted.filter(s => s.position >= position)[0] ?? sorted[sorted.length - 1]

  if (before.id === after.id) return before.color

  const t = (position - before.position) / (after.position - before.position)
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t)

  const r1 = parseInt(before.color.slice(1,3), 16)
  const g1 = parseInt(before.color.slice(3,5), 16)
  const b1 = parseInt(before.color.slice(5,7), 16)
  const r2 = parseInt(after.color.slice(1,3),  16)
  const g2 = parseInt(after.color.slice(3,5),  16)
  const b2 = parseInt(after.color.slice(5,7),  16)

  return `#${[lerp(r1,r2), lerp(g1,g2), lerp(b1,b2)]
    .map(v => v.toString(16).padStart(2,'0')).join('')}`
}
```

---

### APLICAÇÃO AO ELEMENTO — `updateElement` com gradiente

```tsx
// ColorSwatchButton.tsx — quando property === 'fill' e gradiente está ativo

function handleGradientChange(gradient: LinearGradient) {
  const el = canvasElements.find(e => e.id === elementId)
  if (!el) return

  updateElement(elementId, {
    style: {
      ...el.style,
      backgroundImage:  buildGradientCSS(gradient),
      backgroundColor:  undefined,   // remover cor sólida quando gradiente ativo
      gradientData:     gradient,     // armazenar dados estruturados para edição futura
    }
  })
}
```

---

### DIAGRAMA — Estrutura visual da aba Linear

```
┌─────────────────────────────────────┐
│  Solid  │  Linear                   │  ← aba Linear ativa
├─────────────────────────────────────┤
│  ████████████████████████████████   │  ← barra de gradiente (GradientBar)
│        ◉          ◉                 │  ← stops arrastáveis (min 2)
│  Click to add · Double-click remove │
├─────────────────────────────────────┤
│  [roda] [90°] [0][45][90][135]...   │  ← ângulo (GradientAngleControl)
├─────────────────────────────────────┤
│  Selected stop                      │
│  [■] [FF6B6B] [100%]                │  ← cor e opacidade do stop selecionado
│  [mini color area]                  │
├─────────────────────────────────────┤
│  Stops (2)                          │
│  ■ #5B4EFF    0%  [×]               │  ← GradientStopList
│  ■ #FF6B6B  100%  [×]               │
├─────────────────────────────────────┤
│  Presets                            │
│  ■ ■ ■ ■ ■ ■ ■ ■                   │  ← GradientPresets
└─────────────────────────────────────┘
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Aba Linear exibe a barra de gradiente com os stops
- [ ] Clicar na barra em área vazia → adiciona novo stop com cor interpolada
- [ ] Arrastar stop → move ao longo da barra em tempo real
- [ ] Duplo clique no stop → remove (mínimo 2 stops)
- [ ] Stop selecionado → borda azul no handle
- [ ] Editar hex do stop → cor atualiza na barra e no canvas
- [ ] Editar opacity do stop → opacidade atualiza
- [ ] Roda de ângulo clicável → muda direção do gradiente
- [ ] Input numérico de ângulo → aceita 0–359
- [ ] Presets de ângulo rápido (0°, 45°, 90°...) → aplicam imediatamente
- [ ] Presets de gradiente → aplicam com novos IDs de stop
- [ ] Gradiente com 3+ stops → suportado
- [ ] Gradiente com transparência (opacity < 100) → checkered pattern visível
- [ ] Gradiente aplicado ao elemento selecionado em tempo real
- [ ] `buildGradientCSS` gera CSS válido para qualquer combinação

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Picker width (Linear) | `240px` — mesma do Solid |
| Barra de gradiente height | `24px` |
| Stop handle size | `16px` — `w-4 h-4` |
| Stop handle borda padrão | `2px solid white` + `shadow-md` |
| Stop handle borda selecionado | `2px solid white` + `box-shadow: 0 0 0 2px #5B4EFF` |
| Ângulo padrão | `90°` |
| Roda de ângulo size | `32px` |
| Stop mínimo | `2` — nunca permite menos |
| Presets de gradiente | 8 presets pré-definidos |
| Interpolação de cor | linear em RGB entre os stops vizinhos |
| Aplicação | em tempo real via `updateElement` + `buildGradientCSS` |
| `gradientData` no style | armazenado para edição futura sem re-parsear CSS |