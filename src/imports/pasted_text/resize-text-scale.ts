Prompt direto e focado nessa correção:

---

## 🧱 PROMPT V54 — Design Workspace — Resize de texto: font-size escala proporcionalmente ao bounding box

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

### PROBLEMA

Elementos de texto (`type: 'text-header'`, `text-subheader'`, `text-body'`, `text-template'`) têm um bounding box redimensionável — mas o `font-size` no `style` não é atualizado durante o resize. O resultado é:

- Aumentar o bounding box → texto continua pequeno, muito espaço em branco
- Diminuir o bounding box → texto é cortado (`overflow: hidden` do container)

---

### REGRA PRINCIPAL

Para elementos de texto, o `font-size` deve escalar **proporcionalmente** à dimensão do bounding box durante o resize. A referência de escala é a **menor dimensão** entre largura e altura — pois o texto flui verticalmente e deve caber no container.

| Ação | Comportamento |
|---|---|
| Resize de elemento de texto | `font-size` atualizado proporcionalmente em tempo real |
| Aumentar bounding box | `font-size` aumenta proporcionalmente |
| Diminuir bounding box | `font-size` diminui proporcionalmente |
| Shift + resize (proporcional) | `font-size` escala uniformemente |
| Elemento não-texto | comportamento de resize inalterado |

---

### MODELO DE DADOS — Adicionar `baseFontSize` e dimensões base

Para calcular a proporção corretamente, precisamos saber o `font-size` e as dimensões **no momento em que o resize começou** — não o atual. Isso vai direto no `ResizeState`:

```tsx
// hooks/useResizeHandler.ts

interface ResizeState {
  startMouseX:   number
  startMouseY:   number
  startX:        number
  startY:        number
  startW:        number
  startH:        number
  handle:        ResizeHandle
  aspectRatio:   number
  // ← novo: para elementos de texto
  startFontSize: number | null  // font-size no início do resize, null se não for texto
}
```

---

### HOOK — `useResizeHandler` atualizado

```tsx
// hooks/useResizeHandler.ts

const TEXT_TYPES: ElementType[] = [
  'text-header', 'text-subheader', 'text-body', 'text-template'
]

const MIN_FONT_SIZE = 6    // px — fonte mínima permitida
const MAX_FONT_SIZE = 400  // px — fonte máxima permitida

export function useResizeHandler(
  elementId: string,
  onGuidesChange?: (guides: ResizeGuide[]) => void
) {
  const { updateElement, canvasElements } = useDesignWorkspaceStore()
  const { computeResizeGuides } = useResizeGuides()

  function startResize(e: React.MouseEvent, handle: ResizeHandle) {
    e.preventDefault()
    e.stopPropagation()

    const el = canvasElements.find(el => el.id === elementId)!
    const isTextElement = TEXT_TYPES.includes(el.type)

    const state: ResizeState = {
      startMouseX:   e.clientX,
      startMouseY:   e.clientY,
      startX:        el.x,
      startY:        el.y,
      startW:        el.width,
      startH:        el.height,
      handle,
      aspectRatio:   el.width / el.height,
      // Capturar font-size inicial apenas para elementos de texto
      startFontSize: isTextElement ? (el.style?.fontSize ?? 16) : null,
    }

    function onMouseMove(ev: MouseEvent) {
      const dx = ev.clientX - state.startMouseX
      const dy = ev.clientY - state.startMouseY

      // Calcular novo tamanho via computeResize existente
      let { x, y, width, height } = computeResize({
        dx, dy, handle,
        keepRatio:  ev.shiftKey,
        fromCenter: ev.altKey,
        state,
      })

      width  = Math.max(8, width)
      height = Math.max(8, height)

      // ── Escalar font-size para elementos de texto ─────────────────────
      const updates: Partial<CanvasElement> = { x, y, width, height }

      if (isTextElement && state.startFontSize !== null) {
        const newFontSize = computeScaledFontSize({
          startW:        state.startW,
          startH:        state.startH,
          startFontSize: state.startFontSize,
          newW:          width,
          newH:          height,
          handle,
          keepRatio:     ev.shiftKey,
        })

        updates.style = {
          ...el.style,
          fontSize: newFontSize,
        }
      }

      // Guides e snap de dimensão
      const { guides, snappedW, snappedH } = computeResizeGuides(
        elementId, width, height, x, y, handle
      )
      if (snappedW !== width || snappedH !== height) {
        updates.width  = snappedW
        updates.height = snappedH
        if (isTextElement && state.startFontSize !== null) {
          updates.style = {
            ...el.style,
            fontSize: computeScaledFontSize({
              startW: state.startW, startH: state.startH,
              startFontSize: state.startFontSize,
              newW: snappedW, newH: snappedH,
              handle, keepRatio: ev.shiftKey,
            }),
          }
        }
        if (isLeftHandle(handle)) updates.x = x + (width - snappedW)
        if (isTopHandle(handle))  updates.y = y + (height - snappedH)
      }

      onGuidesChange?.(guides)
      updateElement(elementId, updates)
    }

    function onMouseUp() {
      onGuidesChange?.([])
      useDesignWorkspaceStore.getState().commitHistory()
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
  }

  return { startResize }
}
```

---

### FUNÇÃO — `computeScaledFontSize`

```tsx
// utils/computeScaledFontSize.ts

interface ComputeScaledFontSizeParams {
  startW:        number
  startH:        number
  startFontSize: number
  newW:          number
  newH:          number
  handle:        ResizeHandle
  keepRatio:     boolean
}

export function computeScaledFontSize({
  startW,
  startH,
  startFontSize,
  newW,
  newH,
  handle,
  keepRatio,
}: ComputeScaledFontSizeParams): number {

  // Determinar qual eixo é relevante para escalar a fonte:
  // - Handles laterais (middle-left, middle-right) → escalar pela largura
  // - Handles verticais (top-center, bottom-center) → escalar pela altura
  // - Handles de canto → escalar pela menor proporção (font cabe em ambas as dimensões)
  // - keepRatio → escalar uniformemente, usar a maior proporção

  const scaleX = newW / startW
  const scaleY = newH / startH

  let scale: number

  const isCornerHandle = ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(handle)
  const isHorizontalOnly = ['middle-left', 'middle-right'].includes(handle)
  const isVerticalOnly   = ['top-center', 'bottom-center'].includes(handle)

  if (keepRatio || isCornerHandle) {
    // Proporcional: usar a menor escala para garantir que o texto cabe
    scale = Math.min(scaleX, scaleY)
  } else if (isHorizontalOnly) {
    scale = scaleX
  } else if (isVerticalOnly) {
    scale = scaleY
  } else {
    scale = Math.min(scaleX, scaleY)
  }

  const newFontSize = startFontSize * scale

  // Clampar entre mínimo e máximo
  return Math.round(
    Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, newFontSize))
  )
}
```

---

### `CanvasElementView` — texto sem overflow hidden

O container do elemento de texto **não deve cortar o texto** — o `overflow: hidden` que estava causando o crop deve ser removido. O font-size escalado garante que o texto se encaixe no bounding box:

```tsx
// CanvasElementView.tsx — para elementos de texto

{element.type.startsWith('text') ? (
  <div
    className="w-full h-full flex items-start"
    style={{
      // ✅ SEM overflow: hidden — font-size escalado garante que o texto cabe
      fontSize:   element.style?.fontSize ?? 16,
      fontWeight: element.style?.fontWeight ?? '400',
      color:      element.style?.color ?? '#111111',
      fontFamily: element.style?.fontFamily ?? "'Roboto', sans-serif",
      lineHeight: 1.2,
      // Wrap normal — texto quebra linha se necessário
      wordBreak:  'break-word',
      whiteSpace: 'pre-wrap',
    }}
  >
    {element.content}
  </div>
) : (
  // Outros elementos mantêm overflow: hidden
  <ElementContent element={element} />
)}
```

---

### COMPONENTE — `TextPropertiesPanel` reflete o font-size atualizado em tempo real

O painel de propriedades de texto já lê `element.style?.fontSize` do store — como o store é atualizado em tempo real durante o resize, o campo de font-size no painel atualiza junto, sem nenhuma mudança adicional:

```tsx
// TextPropertiesPanel.tsx — font-size field
<Input
  className="flex-1 min-w-0 h-9 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px]"
  value={Math.round(element.style?.fontSize ?? 16)}  // ← lê do store — atualiza em tempo real
  onChange={e => updateElement(elementId, {
    style: { ...element.style, fontSize: Number(e.target.value) }
  })}
/>
```

---

### DIAGRAMA — Escalonamento do font-size durante resize

```
Elemento de texto inicial:
  width: 200px, height: 48px, fontSize: 32px

Usuário arrasta corner bottom-right para width: 300px, height: 72px:
  scaleX = 300/200 = 1.5
  scaleY = 72/48   = 1.5
  scale  = min(1.5, 1.5) = 1.5
  newFontSize = 32 * 1.5 = 48px ✓

Usuário arrasta corner para width: 100px, height: 24px:
  scaleX = 100/200 = 0.5
  scaleY = 24/48   = 0.5
  scale  = min(0.5, 0.5) = 0.5
  newFontSize = 32 * 0.5 = 16px ✓ (texto reduz junto)

Usuário arrasta middle-right para width: 400px (height inalterado: 48px):
  isHorizontalOnly = true
  scaleX = 400/200 = 2.0
  newFontSize = 32 * 2.0 = 64px ✓

Usuário arrasta corner para width: 50px, height: 300px:
  scaleX = 50/200  = 0.25
  scaleY = 300/48  = 6.25
  scale  = min(0.25, 6.25) = 0.25
  newFontSize = 32 * 0.25 = 8px
  → clamped para MIN_FONT_SIZE (6px) ✓
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Resize corner de texto → font-size aumenta/diminui proporcionalmente
- [ ] Resize middle-right/left → font-size escala pela largura
- [ ] Resize top/bottom-center → font-size escala pela altura
- [ ] Shift + resize → escala proporcional, font-size acompanha
- [ ] Texto nunca é cortado (sem overflow hidden no container de texto)
- [ ] Font-size mínimo: `6px` — nunca abaixo
- [ ] Font-size máximo: `400px` — nunca acima
- [ ] Painel de propriedades mostra font-size atualizado em tempo real
- [ ] Cmd+Z após resize → desfaz posição, tamanho E font-size juntos
- [ ] Elementos não-texto (shapes, placeholders, icons) → sem escalonamento de fonte

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| `MIN_FONT_SIZE` | `6px` |
| `MAX_FONT_SIZE` | `400px` |
| Escala em corner handles | `Math.min(scaleX, scaleY)` |
| Escala em handle lateral | `scaleX` |
| Escala em handle vertical | `scaleY` |
| `startFontSize` | capturado no `mousedown` do resize |
| Container de texto overflow | `visible` — **nunca `hidden`** |
| Arredondamento do font-size | `Math.round()` — sem decimais |
| Undo do resize de texto | desfaz posição + tamanho + font-size atomicamente |