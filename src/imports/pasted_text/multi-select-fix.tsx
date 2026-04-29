Não consigo reproduzir vídeos `.mov` diretamente, mas com base na descrição do problema e em tudo que foi construído até agora, consigo identificar com precisão o que está impedindo a seleção múltipla. O problema central é que o `onMouseDown` em cada `CanvasElementRenderer` chama `e.stopPropagation()` — o que é correto para evitar o pan — mas isso também impede que o marquee do `CanvasFrame` seja iniciado quando o usuário tenta arrastar pela área entre os elementos. Além disso, clicar em um elemento sem Shift sempre chama `selectElement` (seleção única), sobrescrevendo qualquer seleção anterior.

Aqui está o prompt de correção:

---

## 🧱 PROMPT V37 — Design Workspace — Seleção múltipla: correção definitiva do fluxo

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

### DIAGNÓSTICO — Três causas da falha

**Causa 1:** `CanvasElementRenderer` chama `selectElement(id)` no `mousedown` — isso deseleciona qualquer seleção existente antes do drag terminar, tornando impossível manter múltiplos selecionados.

**Causa 2:** O `handleFrameMouseDown` do `CanvasFrame` verifica `e.target === e.currentTarget` para iniciar o marquee — mas como os elementos chamam `stopPropagation`, o frame nunca recebe o evento quando o usuário arrasta começando sobre um elemento.

**Causa 3:** Não há uma forma visual clara de o usuário saber que pode usar Shift+click para adicionar à seleção.

---

### SOLUÇÃO — Modelo de seleção simplificado e robusto

#### REGRA DEFINITIVA por tipo de interação:

| Interação | Resultado |
|---|---|
| Click simples num elemento | Seleciona só esse, deseleciona os outros |
| Shift + click num elemento | Adiciona/remove da seleção existente |
| Arrastar na área vazia do CanvasFrame | Marquee — seleciona todos que a caixa tocar |
| Click na área vazia do CanvasFrame | Deseleciona tudo |
| Click na área cinza (fora do frame) | Deseleciona tudo + fecha painéis |

---

### IMPLEMENTAÇÃO CORRIGIDA

#### `CanvasElementRenderer` — separar click de drag

O segredo é **não deselecionar ao iniciar o mousedown**. A seleção só muda no `mouseup` (se não houve drag) ou permanece intacta durante o drag:

```tsx
// CanvasElementRenderer.tsx
export function CanvasElementRenderer({ element, zIndex, isSelected, isMultiSelected }: Props) {
  const { selectElement, toggleElementSelection, selectedElementIds, updateElement } =
    useDesignWorkspaceStore()

  const dragStarted = useRef(false)
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null)

  function handleMouseDown(e: React.MouseEvent) {
    e.stopPropagation() // ← ainda necessário para não disparar pan

    if (e.button !== 0) return

    dragStarted.current = false
    mouseDownPos.current = { x: e.clientX, y: e.clientY }

    // Shift+click — toggle imediato, sem aguardar mouseup
    if (e.shiftKey) {
      toggleElementSelection(element.id)
      return
    }

    // Se este elemento JÁ está na seleção múltipla:
    // não deseleciona agora — aguarda o mouseup para decidir
    // (pode ser início de drag do grupo)
    if (isMultiSelected) {
      // Não faz nada no mousedown — aguarda mouseup ou drag
    } else {
      // Seleção única imediata apenas se não estava em multi-seleção
      selectElement(element.id)
    }

    // Iniciar tracking de drag
    const startX = e.clientX
    const startY = e.clientY
    const startElX = element.x
    const startElY = element.y

    function onMouseMove(ev: MouseEvent) {
      const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY)

      // Só inicia drag após mover 3px (evita drag acidental)
      if (dist < 3) return
      dragStarted.current = true

      // Se estava em multi-seleção, seleciona apenas este ao iniciar drag
      if (isMultiSelected && !dragStarted.current) {
        selectElement(element.id)
      }

      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      updateElement(element.id, {
        x: startElX + dx,
        y: startElY + dy,
      })
    }

    function onMouseUp() {
      // Se não houve drag E estava em multi-seleção → seleciona só este
      if (!dragStarted.current && isMultiSelected) {
        selectElement(element.id)
      }

      dragStarted.current = false
      mouseDownPos.current = null
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div
      className="absolute"
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        zIndex,
        cursor: 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      <ElementContent element={element} />

      {/* Bounding box individual — apenas seleção única */}
      {isSelected && !isMultiSelected && (
        <SelectionOverlay elementId={element.id} />
      )}
    </div>
  )
}
```

---

#### `CanvasFrame` — marquee robusto sem depender de target

O marquee é iniciado quando o usuário aperta o mouse na área vazia — detectado por um `ref` no frame e verificação de coordenadas, não por `e.target`:

```tsx
// CanvasFrame.tsx
export function CanvasFrame() {
  const {
    canvasElements,
    selectedElementIds,
    clearSelection,
    setSelection,
  } = useDesignWorkspaceStore()

  const frameRef = useRef<HTMLDivElement>(null)
  const [marquee, setMarquee] = useState<{
    x: number; y: number; w: number; h: number
  } | null>(null)

  // O CanvasFrame recebe onMouseDown MAS apenas inicia o marquee
  // se o click NÃO veio de um elemento filho.
  // Como os elementos chamam stopPropagation, este handler
  // SÓ é chamado quando o click foi na área vazia — exatamente o que queremos.
  function handleFrameMouseDown(e: React.MouseEvent) {
    // Chega aqui APENAS se nenhum filho fez stopPropagation
    // = clique na área branca vazia = iniciar marquee
    e.stopPropagation() // não propaga pan para CanvasInfiniteArea

    if (e.button !== 0) return

    clearSelection()

    const rect = frameRef.current!.getBoundingClientRect()
    const startX = e.clientX - rect.left
    const startY = e.clientY - rect.top

    let curX = startX
    let curY = startY
    let marqueActive = false

    function onMouseMove(ev: MouseEvent) {
      curX = ev.clientX - rect.left
      curY = ev.clientY - rect.top
      const w = Math.abs(curX - startX)
      const h = Math.abs(curY - startY)

      if (w > 3 || h > 3) {
        marqueActive = true
        setMarquee({
          x: Math.min(startX, curX),
          y: Math.min(startY, curY),
          w, h,
        })
      }
    }

    function onMouseUp() {
      if (marqueActive) {
        const selX = Math.min(startX, curX)
        const selY = Math.min(startY, curY)
        const selW = Math.abs(curX - startX)
        const selH = Math.abs(curY - startY)

        const hit = canvasElements.filter(el =>
          el.x              < selX + selW &&
          el.x + el.width   > selX &&
          el.y              < selY + selH &&
          el.y + el.height  > selY
        )

        if (hit.length > 0) setSelection(hit.map(el => el.id))
      }

      setMarquee(null)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div
      ref={frameRef}
      className="relative bg-white shadow-xl overflow-hidden select-none"
      style={{ width: 600, height: 600, cursor: 'default' }}
      onMouseDown={handleFrameMouseDown}
    >
      {canvasElements.map((element, index) => (
        <CanvasElementRenderer
          key={element.id}
          element={element}
          zIndex={index}
          isSelected={selectedElementIds.includes(element.id)}
          isMultiSelected={
            selectedElementIds.length > 1 &&
            selectedElementIds.includes(element.id)
          }
        />
      ))}

      {/* Bounding box unificado — só com 2+ selecionados */}
      {selectedElementIds.length > 1 && (
        <MultiSelectionBoundingBox selectedIds={selectedElementIds} />
      )}

      {/* Marquee visual */}
      {marquee && marquee.w > 3 && marquee.h > 3 && (
        <div
          className="absolute pointer-events-none border border-[#5B4EFF] bg-[#5B4EFF1A] z-50"
          style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
        />
      )}
    </div>
  )
}
```

---

### POR QUE FUNCIONA AGORA

```
Usuário arrasta na área vazia do CanvasFrame:
  → Nenhum elemento filho recebe o mousedown
  → stopPropagation dos filhos NÃO é chamado
  → handleFrameMouseDown recebe o evento
  → Marquee inicia ✓

Usuário Shift+clica num elemento:
  → CanvasElementRenderer recebe o mousedown
  → e.stopPropagation() — frame e pan não recebem
  → toggleElementSelection(id) chamado imediatamente ✓

Usuário clica num elemento (sem Shift):
  → Se não estava em multi-seleção → selectElement(id) imediato ✓
  → Se estava em multi-seleção → aguarda mouseup para decidir
    → Se não houve drag → selectElement(id) no mouseup ✓
    → Se houve drag → todos os selecionados se movem (futuro) ✓
```

---

### DICA VISUAL — Hint de Shift+click

Exibir uma dica flutuante no canvas quando há pelo menos um elemento selecionado, informando o usuário sobre o Shift+click:

```tsx
// Dentro do CanvasFrame, abaixo dos elementos
{selectedElementIds.length === 1 && (
  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none z-50">
    <span className="text-[10px] text-[#9c99a9] bg-white/80 px-2 py-1 rounded-full whitespace-nowrap">
      Shift + click to select more
    </span>
  </div>
)}
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Arrastar na área branca vazia → marquee aparece, elementos são selecionados ao soltar
- [ ] Shift+click em elemento A → selecionado
- [ ] Shift+click em elemento B → ambos selecionados, bounding box unificado aparece
- [ ] Shift+click em elemento A novamente → A removido da seleção
- [ ] Click simples em elemento → deseleciona os outros, seleciona só esse
- [ ] Click na área branca vazia → deseleciona tudo
- [ ] Canvas branco NÃO arrasta ao interagir com elementos
- [ ] Canvas cinza ainda arrasta normalmente (pan)

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Marquee border | `1px solid #5B4EFF` |
| Marquee fill | `#5B4EFF1A` |
| Marquee threshold | `3px` antes de ativar |
| Drag threshold | `3px` antes de iniciar drag |
| Shift+click | `toggleElementSelection` imediato |
| Click área vazia | `clearSelection()` |
| `stopPropagation` em | todos os `CanvasElementRenderer` e handles |