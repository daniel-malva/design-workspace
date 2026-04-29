Prompt direto e focado nesses três ajustes:

---

## 🧱 PROMPT V36 — Design Workspace — Seleção múltipla funcional + Bounding box unificado + Properties panel do grupo

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

### PARTE 1 — Seleção múltipla funcional

#### O PROBLEMA

O marquee (arrastar na área vazia do CanvasFrame) não está iniciando porque o `onMouseDown` do `CanvasFrame` apenas chama `e.stopPropagation()` — e não inicia o marquee quando o clique foi na área vazia.

#### CORREÇÃO — `CanvasFrame` com marquee embutido

```tsx
// CanvasFrame.tsx
export function CanvasFrame() {
  const {
    canvasElements,
    selectedElementIds,
    clearSelection,
    setSelection,
  } = useDesignWorkspaceStore()

  const [marquee, setMarquee] = useState<{
    startX: number; startY: number
    currentX: number; currentY: number
  } | null>(null)

  const frameRef = useRef<HTMLDivElement>(null)

  function handleFrameMouseDown(e: React.MouseEvent) {
    // SEMPRE para propagação — canvas branco nunca dispara pan
    e.stopPropagation()

    // Só inicia interação se clicou diretamente no frame (não em filho)
    if (e.target !== e.currentTarget) return
    if (e.button !== 0) return

    // Clicar na área vazia → deseleciona tudo
    clearSelection()

    // Iniciar marquee
    const rect = frameRef.current!.getBoundingClientRect()
    const startX = e.clientX - rect.left
    const startY = e.clientY - rect.top
    let currentX = startX
    let currentY = startY

    setMarquee({ startX, startY, currentX: startX, currentY: startY })

    function onMouseMove(ev: MouseEvent) {
      currentX = ev.clientX - rect.left
      currentY = ev.clientY - rect.top
      setMarquee({ startX, startY, currentX, currentY })
    }

    function onMouseUp() {
      // Calcular bounding box do marquee
      const selX = Math.min(startX, currentX)
      const selY = Math.min(startY, currentY)
      const selW = Math.abs(currentX - startX)
      const selH = Math.abs(currentY - startY)

      // Só seleciona se o arrastar foi maior que 4px
      if (selW > 4 || selH > 4) {
        const hit = canvasElements.filter(el =>
          el.x < selX + selW &&
          el.x + el.width  > selX &&
          el.y < selY + selH &&
          el.y + el.height > selY
        )
        if (hit.length > 0) {
          setSelection(hit.map(el => el.id))
        }
      }

      setMarquee(null)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // Dimensões do marquee para renderização
  const marqueeStyle = marquee ? {
    left:   Math.min(marquee.startX, marquee.currentX),
    top:    Math.min(marquee.startY, marquee.currentY),
    width:  Math.abs(marquee.currentX - marquee.startX),
    height: Math.abs(marquee.currentY - marquee.startY),
  } : null

  return (
    <div
      ref={frameRef}
      className="relative bg-white shadow-xl overflow-hidden select-none"
      style={{ width: 600, height: 600, cursor: 'default' }}
      onMouseDown={handleFrameMouseDown}
    >
      {/* Elementos */}
      {canvasElements.map((element, index) => (
        <CanvasElementRenderer
          key={element.id}
          element={element}
          zIndex={index}
          isSelected={selectedElementIds.includes(element.id)}
          isMultiSelected={selectedElementIds.length > 1 && selectedElementIds.includes(element.id)}
        />
      ))}

      {/* Bounding box unificado da seleção múltipla */}
      {selectedElementIds.length > 1 && (
        <MultiSelectionBoundingBox selectedIds={selectedElementIds} />
      )}

      {/* Marquee de seleção */}
      {marqueeStyle && marqueeStyle.width > 0 && marqueeStyle.height > 0 && (
        <div
          className="absolute pointer-events-none border border-[#5B4EFF] bg-[#5B4EFF1A] z-50"
          style={marqueeStyle}
        />
      )}
    </div>
  )
}
```

---

#### `CanvasElementRenderer` — Shift+click para seleção múltipla

```tsx
// CanvasElementRenderer.tsx
function handleMouseDown(e: React.MouseEvent) {
  // SEMPRE para propagação — nunca dispara pan nem marquee do frame
  e.stopPropagation()

  if (e.button !== 0) return

  if (e.shiftKey) {
    // Shift+click → adiciona/remove da seleção sem deselecionar
    toggleElementSelection(element.id)
    // Não inicia drag em Shift+click
    return
  }

  // Click simples → seleciona somente este e inicia drag
  selectElement(element.id)
  startDrag(e)
}
```

---

### PARTE 2 — Bounding box unificado para seleção múltipla

#### REGRA

Quando múltiplos elementos estão selecionados:
- Cada elemento individual **não exibe** seu bounding box próprio
- Um **único bounding box** é calculado ao redor de todos os elementos selecionados
- Esse bounding box unificado tem handles de resize nos 8 pontos
- Redimensionar o bounding box unificado escala todos os elementos proporcionalmente

#### COMPONENTE — `MultiSelectionBoundingBox`

```tsx
// MultiSelectionBoundingBox.tsx
export function MultiSelectionBoundingBox({ selectedIds }: { selectedIds: string[] }) {
  const { canvasElements, updateElement } = useDesignWorkspaceStore()

  const selected = canvasElements.filter(el => selectedIds.includes(el.id))
  if (selected.length < 2) return null

  // Calcular bounding box que engloba todos os elementos selecionados
  const minX = Math.min(...selected.map(el => el.x))
  const minY = Math.min(...selected.map(el => el.y))
  const maxX = Math.max(...selected.map(el => el.x + el.width))
  const maxY = Math.max(...selected.map(el => el.y + el.height))
  const groupW = maxX - minX
  const groupH = maxY - minY

  // Redimensionar o grupo escala todos os elementos proporcionalmente
  function handleGroupResize(newX: number, newY: number, newW: number, newH: number) {
    const scaleX = newW / groupW
    const scaleY = newH / groupH

    selected.forEach(el => {
      updateElement(el.id, {
        x: newX + (el.x - minX) * scaleX,
        y: newY + (el.y - minY) * scaleY,
        width:  el.width  * scaleX,
        height: el.height * scaleY,
      })
    })
  }

  return (
    <div
      className="absolute pointer-events-none z-40"
      style={{ left: minX, top: minY, width: groupW, height: groupH }}
    >
      {/* Borda do bounding box unificado */}
      <div className="absolute inset-0 border-2 border-[#5B4EFF] rounded-[1px]" />

      {/* 8 handles de resize do grupo */}
      {(Object.keys(HANDLE_POSITIONS) as ResizeHandle[]).map(handle => (
        <div
          key={handle}
          className="absolute w-2 h-2 bg-white border-2 border-[#5B4EFF] rounded-[1px] pointer-events-auto"
          style={{
            ...HANDLE_POSITIONS[handle],
            cursor: HANDLE_CURSORS[handle],
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            startGroupResize(e, handle, {
              minX, minY, groupW, groupH,
              aspectRatio: groupW / groupH,
              onResize: handleGroupResize,
            })
          }}
        />
      ))}
    </div>
  )
}
```

---

#### REGRA — Bounding box individual some na multi-seleção

```tsx
// CanvasElementRenderer.tsx
{/* Bounding box individual — APENAS quando é seleção única */}
{isSelected && !isMultiSelected && (
  <SelectionOverlay elementId={element.id} />
)}
// isMultiSelected = selectedElementIds.length > 1 && selecionado
// Quando isMultiSelected === true → sem bounding box próprio
// O MultiSelectionBoundingBox renderizado no CanvasFrame cuida disso
```

---

### PARTE 3 — Properties Panel da seleção múltipla

#### REGRA — Mostrar apenas propriedades comuns

O `MultiSelectionPanel` exibe somente as propriedades que fazem sentido para um grupo heterogêneo de elementos — posição e tamanho do bounding box unificado, opacidade e nada mais:

```tsx
// MultiSelectionPanel.tsx
export function MultiSelectionPanel() {
  const { selectedElementIds, canvasElements, updateElement, groupElements } =
    useDesignWorkspaceStore()

  const selected = canvasElements.filter(el => selectedElementIds.includes(el.id))

  // Bounding box do grupo
  const minX = Math.min(...selected.map(el => el.x))
  const minY = Math.min(...selected.map(el => el.y))
  const maxX = Math.max(...selected.map(el => el.x + el.width))
  const maxY = Math.max(...selected.map(el => el.y + el.height))
  const groupW = maxX - minX
  const groupH = maxY - minY

  // Opacidade — só exibe se todos têm a mesma; caso contrário mostra "Mixed"
  const opacities = selected.map(el => el.style?.opacity ?? 1)
  const allSameOpacity = opacities.every(o => o === opacities[0])
  const opacityDisplay = allSameOpacity
    ? `${Math.round(opacities[0] * 100)}%`
    : 'Mixed'

  return (
    <div className="flex flex-col h-full overflow-hidden">

      <RightPanelHeader
        title={`${selected.length} elements`}
        actions={
          <button
            onClick={() => groupElements(selectedElementIds)}
            className="flex items-center gap-1 text-xs text-[#473bab] hover:underline font-medium"
            title="Group (⌘G)"
          >
            <Group size={13} />
            Group
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
        <div className="flex flex-col gap-3 w-full">

          {/* Seção: Position — bounding box do grupo */}
          <div className="flex flex-col gap-2 w-full">
            <p className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]">
              Position
            </p>

            {/* X / Y do grupo */}
            <div className="flex items-start justify-between w-full">
              <GroupAxisField
                label="X"
                value={Math.round(minX)}
                onChange={dx => {
                  const diff = dx - minX
                  selected.forEach(el => updateElement(el.id, { x: el.x + diff }))
                }}
              />
              <GroupAxisField
                label="Y"
                value={Math.round(minY)}
                onChange={dy => {
                  const diff = dy - minY
                  selected.forEach(el => updateElement(el.id, { y: el.y + diff }))
                }}
              />
            </div>

            {/* W / H do grupo */}
            <div className="flex items-start justify-between w-full">
              <GroupAxisField
                label="W"
                value={Math.round(groupW)}
                onChange={newW => {
                  const scaleX = newW / groupW
                  selected.forEach(el => updateElement(el.id, {
                    x:     minX + (el.x - minX) * scaleX,
                    width: el.width * scaleX,
                  }))
                }}
              />
              <GroupAxisField
                label="H"
                value={Math.round(groupH)}
                onChange={newH => {
                  const scaleY = newH / groupH
                  selected.forEach(el => updateElement(el.id, {
                    y:      minY + (el.y - minY) * scaleY,
                    height: el.height * scaleY,
                  }))
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Seção: Layer — apenas opacidade */}
          <div className="flex flex-col gap-2 w-full">
            <p className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]">
              Layer
            </p>
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-[#686576] w-16 shrink-0">Opacity</span>
              <Input
                className="flex-1 min-w-0 h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px] text-[#1f1d25]"
                value={opacityDisplay}
                onChange={e => {
                  const val = parseFloat(e.target.value) / 100
                  if (!isNaN(val)) {
                    selected.forEach(el =>
                      updateElement(el.id, { style: { ...el.style, opacity: val } })
                    )
                  }
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Tipos dos elementos — informativo, não editável */}
          <div className="flex flex-col gap-2 w-full">
            <p className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]">
              Selection
            </p>
            <div className="flex flex-wrap gap-1 w-full">
              {selected.map(el => (
                <span
                  key={el.id}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-[#686576]"
                >
                  {elementTypeLabel[el.type]}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
```

---

#### `GroupAxisField` — input de eixo para o grupo

```tsx
// GroupAxisField.tsx — igual ao AxisField mas sem ler do store diretamente
export function GroupAxisField({ label, value, onChange }: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-1 items-center gap-0 min-w-0">
      <div className="w-10 shrink-0 flex items-center justify-center h-9">
        <span className="text-[14px] text-[#1f1d25] tracking-[0.17px] text-center">
          {label}
        </span>
      </div>
      <Input
        className="flex-1 min-w-0 h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px] text-[#1f1d25]"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  )
}
```

---

### DIAGRAMA — Estados visuais da seleção

**Nenhum selecionado:**
```
┌────────────────────────────────┐
│  [TextA]   [PlaceholderB]      │  ← sem bounding box
│                  [ShapeC]      │
└────────────────────────────────┘
```

**Um elemento selecionado:**
```
┌────────────────────────────────┐
│ ┌──────────────┐               │
│ │   TextA      │ ← bounding    │
│ □──────────────□   box próprio │
│                  [ShapeC]      │  com 8 handles
└────────────────────────────────┘
```

**Múltiplos selecionados (marquee ou Shift+click):**
```
┌────────────────────────────────┐
│ □──────────────────────────□   │  ← bounding box ÚNICO
│ │  [TextA]   [PlaceholderB]│   │    engloba todos
│ │               [ShapeC]   │   │    com 8 handles
│ □──────────────────────────□   │
└────────────────────────────────┘
```

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Bounding box (único/múltiplo) | `2px solid #5B4EFF` |
| Handle size | `8px × 8px` |
| Handle bg | `#FFFFFF` border `#5B4EFF` |
| Marquee border | `1px solid #5B4EFF` |
| Marquee fill | `#5B4EFF1A` (10% opacidade) |
| Marquee threshold | `> 4px` em W ou H |
| Bounding box individual | visível apenas em seleção única |
| Bounding box unificado | visível apenas com `selectedIds.length > 1` |
| MultiSelectionPanel — campos | X, Y, W, H (do bounding box), Opacity |
| Opacidade mista | exibe `"Mixed"` se valores diferentes |
| Shift+click | `toggleElementSelection` |
| Click na área branca vazia | `clearSelection()` |
| Arrastar na área branca vazia | inicia marquee |
| `e.stopPropagation()` em | `CanvasFrame`, `CanvasElementRenderer`, handles |