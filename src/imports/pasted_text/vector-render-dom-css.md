Prompt direto e focado nessa correção fundamental de renderização:

---

## 🧱 PROMPT V63 — Design Workspace — Renderização vetorial pura: DOM + CSS em vez de Canvas rasterizado

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

### DIAGNÓSTICO — Por que está rasterizando

O problema ocorre quando qualquer um destes padrões está presente na implementação:

```
❌ Uso de <canvas> HTML para desenhar elementos
❌ Uso de CSS filter: blur() ou drop-shadow() no container do canvas
❌ Uso de will-change: transform em elementos individuais (não apenas no container pai)
❌ Uso de transform: translateZ(0) ou backface-visibility: hidden em elementos individuais
❌ Uso de opacity < 1 no container pai (força composite layer rasterizado)
❌ Renderização de elementos como <img> geradas de screenshots/blobs
❌ Uso de html2canvas ou bibliotecas similares para renderizar o canvas
❌ backdrop-filter no container do canvas
```

Qualquer um desses padrões força o browser a **rasterizar** o layer antes de aplicar o zoom, resultando em perda de qualidade.

---

### REGRA ABSOLUTA — Tudo é DOM puro

Cada tipo de elemento do canvas deve ser renderizado exclusivamente com **HTML + CSS**. O zoom é aplicado via `transform: scale()` no container pai — o browser re-renderiza o DOM vetorialmente em cada nível de zoom.

```
✅ Texto → <div> ou <span> com CSS font-size, font-weight, color
✅ Shapes → <div> com border-radius, background, ou <svg> inline
✅ Ícones → <svg> inline ou componentes SVG (lucide-react)
✅ Placeholders → <div> com border: dashed + badge <span>
✅ Linhas → <div> com height: 1px ou <svg> <line>
✅ Grupos → <div> container transparente
✅ Seleção/handles → <div> com border CSS
✅ Guides → <div> com background-color
```

---

### COMPONENTE: `ElementContent` — renderização DOM pura por tipo

```tsx
// ElementContent.tsx
export function ElementContent({ element }: { element: CanvasElement }) {

  switch (element.type) {

    // ── Texto ─────────────────────────────────────────────────────────────
    case 'text-header':
    case 'text-subheader':
    case 'text-body':
    case 'text-template':
      return (
        <div
          className="w-full h-full"
          style={{
            fontSize:   element.style?.fontSize   ?? 16,
            fontWeight: element.style?.fontWeight ?? '400',
            fontFamily: element.style?.fontFamily ?? "'Roboto', sans-serif",
            color:      element.style?.color      ?? '#111111',
            lineHeight: 1.2,
            wordBreak:  'break-word',
            whiteSpace: 'pre-wrap',
            // ✅ Sem overflow: hidden — texto nunca é cortado
            // ✅ Sem transform individual — apenas o container pai transforma
            // ✅ Sem will-change no elemento — apenas no container pai do canvas
          }}
        >
          {element.content || ''}
        </div>
      )

    // ── Dynamic Placeholders ───────────────────────────────────────────────
    case 'placeholder-logo':
    case 'placeholder-background':
    case 'placeholder-jellybean':
    case 'placeholder-media':
    case 'placeholder-audio': {
      const config = PLACEHOLDER_CONFIG[element.type]
      return (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            // ✅ Borda CSS — vetorial em qualquer zoom
            border:          `2px dashed ${config.borderColor}`,
            backgroundColor: `${config.borderColor}14`,
            boxSizing:       'border-box',
          }}
        >
          <span
            className="text-white font-semibold rounded-full text-center leading-tight"
            style={{
              // ✅ font-size em px absolutos — escala com o zoom via transform pai
              fontSize:        Math.max(8, Math.min(14, element.width * 0.08)),
              padding:         '2px 8px',
              backgroundColor: config.badgeColor,
              // ✅ Sem transform — sem rasterização
            }}
          >
            {element.name}
          </span>
        </div>
      )
    }

    // ── Shapes ────────────────────────────────────────────────────────────
    case 'shape':
      return <ShapeElement variant={element.shapeVariant!} style={element.style} />

    // ── Ícones ────────────────────────────────────────────────────────────
    case 'icon':
      return (
        // ✅ SVG inline — vetorial nativo, nítido em qualquer zoom
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ color: element.style?.color ?? '#374151' }}
          dangerouslySetInnerHTML={{ __html: element.iconSvg ?? '' }}
        />
        // Alternativa: componente lucide-react com width/height = 100%
      )

    // ── Linhas ────────────────────────────────────────────────────────────
    case 'line':
      return <LineElement variant={element.lineVariant!} />

    // ── Grupo ─────────────────────────────────────────────────────────────
    case 'group':
      return (
        // ✅ Container transparente — sem background, sem border visível
        // O bounding box do grupo é desenhado pelo SelectionOverlay separadamente
        <div className="w-full h-full" />
      )

    default:
      return null
  }
}
```

---

### COMPONENTE: `ShapeElement` — SVG inline por variante

Shapes devem ser SVG inline — nunca imagens rasterizadas:

```tsx
// ShapeElement.tsx
export function ShapeElement({
  variant,
  style,
}: {
  variant: string
  style?: ElementStyle
}) {
  const color = style?.color ?? '#6B7280'
  const fill  = style?.fill  ?? color

  // Cada shape é um SVG que preenche 100% do container
  const shapeMap: Record<string, ReactNode> = {
    star: (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill={fill}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    'star-outline': (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke={color} strokeWidth="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    heart: (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill={fill}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    circle: (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill={fill}>
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    rectangle: (
      <div
        className="w-full h-full"
        style={{ backgroundColor: fill }}
      />
    ),
    triangle: (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill={fill}>
        <polygon points="12,2 22,22 2,22" />
      </svg>
    ),
    arrow: (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    ),
    // ... demais shapes como SVG inline
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      {shapeMap[variant] ?? (
        <div className="w-full h-full" style={{ backgroundColor: fill }} />
      )}
    </div>
  )
}
```

---

### COMPONENTE: `LineElement` — div CSS puro

```tsx
// LineElement.tsx
export function LineElement({ variant }: { variant: string }) {
  const lineStyles: Record<string, React.CSSProperties> = {
    solid: {
      width:           '100%',
      height:          '2px',
      backgroundColor: '#6B7280',
    },
    dashed: {
      width:            '100%',
      height:           '2px',
      backgroundImage:  'repeating-linear-gradient(90deg, #6B7280 0, #6B7280 8px, transparent 8px, transparent 16px)',
    },
    dotted: {
      width:            '100%',
      height:           '2px',
      backgroundImage:  'repeating-linear-gradient(90deg, #6B7280 0, #6B7280 3px, transparent 3px, transparent 8px)',
    },
    arrow: {
      // SVG inline para linha com seta
    },
  }

  if (variant === 'arrow') {
    return (
      <svg className="w-full h-full" viewBox="0 0 100 10" preserveAspectRatio="none">
        <line x1="0" y1="5" x2="90" y2="5" stroke="#6B7280" strokeWidth="1.5" />
        <polyline points="85,1 95,5 85,9" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <div className="w-full flex items-center">
      <div style={lineStyles[variant] ?? lineStyles.solid} />
    </div>
  )
}
```

---

### CONTAINER DO CANVAS — Sem nenhuma propriedade que force rasterização

```tsx
// CanvasInfiniteArea.tsx — container de zoom limpo

<div
  ref={containerRef}
  className="absolute inset-0 overflow-hidden"
  // ✅ cursor padrão — sem filter, sem backdrop-filter
>
  <div
    style={{
      position:        'absolute',
      left:            0,
      top:             0,
      transform:       `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
      transformOrigin: '0 0',
      willChange:      'transform',
      // ✅ NÃO usar: opacity < 1, filter, backdrop-filter, isolation: isolate
      // ✅ NÃO usar: contain: strict ou contain: paint no container pai
    }}
  >
    <CanvasFrame />
  </div>
</div>
```

```tsx
// CanvasFrame.tsx — sem nenhuma propriedade que force composite layer rasterizado

<div
  ref={frameRef}
  className="relative bg-white select-none"
  style={{
    width:  600,
    height: 600,
    // ✅ shadow vetorial — box-shadow é vetorial, não força rasterização
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
    overflow:  'visible',
    // ✅ NÃO usar: filter: drop-shadow() — este sim rasteriza
    // ✅ NÃO usar: will-change aqui — apenas no container pai
    // ✅ NÃO usar: transform: translateZ(0) — força composite rasterizado
  }}
>
```

---

### PROPRIEDADES PROIBIDAS — Causam rasterização

```tsx
// ❌ NUNCA usar estas propriedades em elementos do canvas ou seus containers:

// Rasteriza o layer inteiro:
filter: 'blur(0px)'           // mesmo blur zero rasteriza
filter: 'drop-shadow(...)'    // usar box-shadow no lugar
backdrop-filter: 'blur(...)'  // rasteriza tudo abaixo
opacity: 0.99                 // opacity < 1 força rasterização em alguns browsers

// Força composite layer rasterizado:
transform: 'translateZ(0)'
transform: 'translate3d(0,0,0)'
backface-visibility: 'hidden'
perspective: '1000px'         // em containers de elementos individuais

// Isolamento que rasteriza:
isolation: 'isolate'          // em containers de elementos
contain: 'strict'
contain: 'paint'

// ✅ EXCEÇÃO permitida: will-change: 'transform' SOMENTE no container pai do canvas
// que recebe o transform de zoom/pan — e em nenhum outro lugar
```

---

### VERIFICAÇÃO — Como confirmar que está vetorial

```
No browser DevTools:

1. Abrir Chrome DevTools → Layers panel (More tools → Layers)
2. Verificar que apenas UM layer existe para o canvas: o container de zoom
3. Todos os elementos devem estar no mesmo layer — não em layers individuais
4. Ao fazer zoom, o layer não deve ser re-rasterizado (sem indicador de "Rasterize" no timeline)

No canvas visual:
1. Zoom in a 400% → texto deve ser tão nítido quanto em 100%
2. Borders de 1px devem permanecer precisas em qualquer zoom
3. SVGs de shapes/ícones devem ser perfeitamente nítidos
4. Placeholders com borda dashed devem ter traços precisos
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Zoom 400% → texto nítido, sem blur
- [ ] Zoom 400% → borders dos placeholders nítidas e precisas
- [ ] Zoom 400% → ícones SVG nítidos
- [ ] Zoom 400% → shapes SVG nítidos
- [ ] Zoom 400% → borda dashed dos placeholders com traços precisos
- [ ] Zoom 25% → tudo reduz sem pixelização
- [ ] DevTools Layers panel → apenas 1 composite layer para o canvas
- [ ] Nenhum elemento usa `filter`, `backdrop-filter`, ou `transform: translateZ(0)`
- [ ] `will-change: transform` apenas no container pai do zoom
- [ ] `box-shadow` nos painéis (não `filter: drop-shadow`)
- [ ] `<canvas>` HTML não é usado em nenhum lugar do canvas editor

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Zoom via | `transform: scale(canvasScale)` no container pai |
| `transformOrigin` | `'0 0'` |
| `will-change` | `'transform'` — **somente** no container pai |
| Shadow nos painéis | `box-shadow` — nunca `filter: drop-shadow()` |
| Texto | `<div>` com CSS `font-size`, `font-weight`, `color` |
| Shapes | `<svg>` inline |
| Ícones | `<svg>` inline (lucide-react) |
| Placeholders | `<div>` com `border: dashed` CSS |
| Linhas | `<div>` com `background` ou `<svg>` |
| `<canvas>` HTML | **proibido** |
| `filter` CSS em elementos | **proibido** |
| `backdrop-filter` | **proibido** |
| `opacity < 1` em containers | **proibido** |
| `translateZ(0)` | **proibido** |