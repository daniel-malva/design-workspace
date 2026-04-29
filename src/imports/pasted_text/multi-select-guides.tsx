Prompt direto e focado nos dois problemas:

---

## 🧱 PROMPT V48 — Design Workspace — Guides em multi-seleção + Edição direta de filho em grupo no canvas

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

### PARTE 1 — Guides durante drag de múltiplos elementos não agrupados

#### PROBLEMA

Quando múltiplos elementos estão selecionados mas ainda não foram agrupados, o `InteractionOverlay` não calcula guides porque a lógica de drag chama `updateElement` individualmente por elemento, mas `computeGuides` só recebe as coordenadas de um único elemento como referência.

#### SOLUÇÃO — Bounding box virtual da multi-seleção como referência das guides

```tsx
// InteractionOverlay.tsx — drag de múltiplos elementos

function startMultiDrag(
  e: React.MouseEvent,
  selectedIds: string[],
  rect: DOMRect
) {
  const startMouseX = e.clientX - rect.left
  const startMouseY = e.clientY - rect.top

  // Snapshot das posições iniciais de todos os elementos selecionados
  const snapshots = selectedIds.map(id => {
    const el = canvasElements.find(el => el.id === id)!
    return { id, startX: el.x, startY: el.y }
  })

  // Bounding box virtual da seleção múltipla — referência para guides
  const allSelected = canvasElements.filter(el => selectedIds.includes(el.id))
  const groupMinX = Math.min(...allSelected.map(el => el.x))
  const groupMinY = Math.min(...allSelected.map(el => el.y))
  const groupMaxX = Math.max(...allSelected.map(el => el.x + el.width))
  const groupMaxY = Math.max(...allSelected.map(el => el.y + el.height))
  const groupW    = groupMaxX - groupMinX
  const groupH    = groupMaxY - groupMinY

  let dragging = false

  function onMouseMove(ev: MouseEvent) {
    const dx = ev.clientX - rect.left - startMouseX
    const dy = ev.clientY - rect.top  - startMouseY

    if (!dragging && Math.hypot(dx, dy) > 3) dragging = true
    if (!dragging) return

    const rawGroupX = groupMinX + dx
    const rawGroupY = groupMinY + dy

    // ── Guides calculadas com base no bounding box virtual do grupo ───────
    const { guides, snappedX, snappedY } = computeGuides(
      '__multi__',   // ID virtual — não corresponde a nenhum elemento real
      rawGroupX,
      rawGroupY,
      groupW,
      groupH,
    )

    onAlignmentGuidesChange(guides)

    // Deslocamento final (com snap aplicado)
    const finalDx = snappedX - groupMinX
    const finalDy = snappedY - groupMinY

    // Mover cada elemento pelo mesmo delta
    snapshots.forEach(({ id, startX, startY }) => {
      updateElement(id, {
        x: startX + finalDx,
        y: startY + finalDy,
      })
    })
  }

  function onMouseUp() {
    onAlignmentGuidesChange([])
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
```

#### `computeGuides` — aceitar ID virtual para multi-seleção

```tsx
// hooks/useAlignmentGuides.ts

function computeGuides(
  draggingId: string,       // pode ser '__multi__' para multi-seleção
  dragX: number,
  dragY: number,
  dragW: number,
  dragH: number,
): { guides: AlignmentGuide[]; snappedX: number; snappedY: number } {

  // Excluir do snap: o próprio elemento OU todos os elementos selecionados
  const { selectedElementIds } = useDesignWorkspaceStore.getState()
  const isMulti = draggingId === '__multi__'

  const excludedIds = new Set<string>(
    isMulti ? selectedElementIds : [draggingId]
  )

  // Se algum excluído for filho de grupo, excluir o grupo pai também
  canvasElements
    .filter(el => excludedIds.has(el.id) && el.groupId)
    .forEach(el => excludedIds.add(el.groupId!))

  const sources = [
    { left: 0, centerX: 300, right: 600, top: 0, centerY: 300, bottom: 600 },
    ...canvasElements
      .filter(el => !excludedIds.has(el.id) && el.type !== 'group')
      .map(el => ({
        left:    el.x,
        centerX: el.x + el.width / 2,
        right:   el.x + el.width,
        top:     el.y,
        centerY: el.y + el.height / 2,
        bottom:  el.y + el.height,
      })),
  ]

  // ...resto da lógica de computeGuides igual ao V46...
}
```

#### `InteractionOverlay` — rotear para `startMultiDrag` quando há múltipla seleção

```tsx
// InteractionOverlay.tsx

function handleSingleClick(
  e: React.MouseEvent,
  element: CanvasElement,
  mouseX: number,
  mouseY: number,
  rect: DOMRect
) {
  // ...lógica de seleção existente...

  // Iniciar drag correto conforme contexto
  const { selectedElementIds } = useDesignWorkspaceStore.getState()

  if (selectedElementIds.length > 1 && selectedElementIds.includes(element.id)) {
    // Multi-seleção — arrastar todos juntos com guides
    startMultiDrag(e, selectedElementIds, rect)
  } else {
    // Seleção simples — drag normal com guides
    startElementDrag(e, element, rect)
  }
}
```

---

### PARTE 2 — Duplo clique para editar filho de grupo diretamente no canvas

#### PROBLEMA RAIZ

O `InteractionOverlay` cobre todo o canvas com `z-index: 50` e `pointer-events: auto`. O duplo clique é detectado via `lastClick.current` — mas como o `InteractionOverlay` é um `div` opaco, ele intercepta todos os eventos antes de qualquer elemento. O problema é que o `hitTest` (detectar qual elemento está sob o cursor) funciona por **coordenadas**, não por eventos DOM — então o overlay nunca "erra" o hit test. O bug real é que `enterGroup` está sendo chamado mas `selectElement` do filho não está sendo chamado atomicamente na mesma operação.

#### CORREÇÃO — `enterGroup` e `selectElement` numa única operação atômica

```tsx
// store/useDesignWorkspaceStore.ts

// Nova ação: entra no grupo E seleciona o filho em um único set()
enterGroupAndSelectChild: (groupId: string, childId: string) => {
  set(() => ({
    editingGroupId:      groupId,
    selectedElementIds:  [childId],
    selectedElementType: canvasElements.find(el => el.id === childId)?.type ?? null,
  }))
},
```

```tsx
// InteractionOverlay.tsx — handleDoubleClick corrigido

function handleDoubleClick(element: CanvasElement | null) {
  if (!element) return

  const { editingGroupId } = useDesignWorkspaceStore.getState()

  // ── Duplo clique em elemento filho de grupo ─────────────────────────────
  if (element.groupId) {
    // Entrar no grupo e selecionar o filho atomicamente
    enterGroupAndSelectChild(element.groupId, element.id)
    return
  }

  // ── Duplo clique no container do grupo ──────────────────────────────────
  if (element.type === 'group') {
    // Encontrar o filho mais próximo do cursor dentro do grupo
    const rect   = frameRef.current!.getBoundingClientRect()
    const mouseX = lastClick.current.x
    const mouseY = lastClick.current.y

    const children = canvasElements
      .filter(el => el.groupId === element.id)
      .reverse() // topo primeiro

    const hitChild = children.find(c =>
      mouseX >= c.x && mouseX <= c.x + c.width &&
      mouseY >= c.y && mouseY <= c.y + c.height
    )

    if (hitChild) {
      // Selecionar o filho específico sob o cursor
      enterGroupAndSelectChild(element.id, hitChild.id)
    } else {
      // Duplo clique no container mas não sobre um filho — apenas entra no grupo
      enterGroup(element.id)
    }
    return
  }

  // ── Duplo clique em elemento simples ─────────────────────────────────────
  // Sem ação especial por ora (futuro: edição inline de texto)
}
```

---

#### Garantir que o filho selecionado recebe `SelectionOverlay` com todos os handles

```tsx
// CanvasFrame.tsx — SelectionOverlay para filho em modo de edição de grupo

const { selectedElementIds, editingGroupId } = useDesignWorkspaceStore()

// Mostrar SelectionOverlay quando:
// 1. Seleção simples normal (sem grupo em edição)
// 2. Filho selecionado dentro de grupo em edição
const showSelectionOverlay =
  selectedElementIds.length === 1 &&
  (
    !editingGroupId ||  // seleção normal
    canvasElements.find(el => el.id === selectedElementIds[0])?.groupId === editingGroupId
    // filho do grupo em edição
  )

{showSelectionOverlay && (
  <SelectionOverlay
    elementId={selectedElementIds[0]}
    onResizeGuidesChange={setResizeGuides}
  />
)}
```

---

#### Garantir que drag do filho dentro do grupo funciona com guides

```tsx
// InteractionOverlay.tsx — startElementDrag para filho dentro de grupo

function startElementDrag(
  e: React.MouseEvent,
  element: CanvasElement,
  rect: DOMRect
) {
  const startMouseX = e.clientX - rect.left
  const startMouseY = e.clientY - rect.top
  const startElX    = element.x
  const startElY    = element.y
  let dragging      = false

  function onMouseMove(ev: MouseEvent) {
    const dx = ev.clientX - rect.left - startMouseX
    const dy = ev.clientY - rect.top  - startMouseY

    if (!dragging && Math.hypot(dx, dy) > 3) dragging = true
    if (!dragging) return

    const rawX = startElX + dx
    const rawY = startElY + dy

    // Guides em relação a todos os outros elementos
    // (incluindo irmãos do grupo — filhos do mesmo grupo são fontes válidas de snap)
    const { guides, snappedX, snappedY } = computeGuides(
      element.id,
      rawX, rawY,
      element.width, element.height
    )

    onAlignmentGuidesChange(guides)

    // Atualizar posição do filho
    updateElement(element.id, {
      x: snappedX,
      y: snappedY,
    })
    // updateElement detecta element.groupId → recalcula grupo automaticamente (V47)
  }

  function onMouseUp() {
    onAlignmentGuidesChange([])
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
```

---

#### `exitGroup` — preservar todas as mudanças feitas no filho

```tsx
// store/useDesignWorkspaceStore.ts — exitGroup corrigido

exitGroup: () => set(state => {
  const groupEl = state.canvasElements.find(el => el.id === state.editingGroupId)

  // O grupo já tem seus bounds recalculados automaticamente via updateElement (V47)
  // Apenas sair do modo de edição e selecionar o grupo pai
  return {
    editingGroupId:      null,
    selectedElementIds:  groupEl ? [groupEl.id] : [],
    selectedElementType: groupEl ? 'group' : null,
  }
}),
```

> **As mudanças do filho já estão preservadas** — porque `updateElement` no filho recalcula o grupo em tempo real (V47). Sair do grupo (`exitGroup`) não desfaz nada — apenas muda o estado de navegação de volta para o grupo.

---

### DIAGRAMA — Multi-seleção com guides + Edição de filho em grupo

**Multi-seleção arrastando com guides:**
```
[TextA] e [ShapeB] selecionados, arrastando juntos:

Bounding box virtual = { x: min(xA,xB), y: min(yA,yB), w: ..., h: ... }
computeGuides('__multi__', bbX, bbY, bbW, bbH)
  → guides em relação a [IconC], [Background], bordas do canvas

TextA e ShapeB movem com o mesmo Δx, Δy + snap aplicado ✓
```

**Duplo clique em filho de grupo:**
```
Grupo g1 contém [ShapeB, IconC]
Usuário dá duplo clique sobre ShapeB no canvas

InteractionOverlay.handleDoubleClick(ShapeB)
  → ShapeB.groupId = 'g1' → encontrado
  → enterGroupAndSelectChild('g1', 'shapeB') — atômico
  → editingGroupId = 'g1'
  → selectedElementIds = ['shapeB']

Canvas:
  ShapeB: bounding box com 8 handles ✓
  IconC: sem overlay (irmão do grupo em edição)
  TextA: overlay branco 50% (fora do grupo)
  Borda tracejada ao redor do grupo g1

Usuário resize/move ShapeB → updateElement → grupo recalcula ✓
Usuário pressiona Escape → exitGroup → grupo selecionado com bounds atualizados ✓
Usuário clica fora → exitGroup → grupo preservado ✓
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Selecionar 2+ elementos sem agrupar + arrastar → guides aparecem em relação a elementos externos
- [ ] Multi-seleção + snap → todos os elementos se movem com o mesmo delta snappado
- [ ] Duplo clique em filho visível no canvas → filho selecionado com bounding box + handles
- [ ] Duplo clique no container do grupo → filho mais próximo do cursor selecionado
- [ ] Filho selecionado dentro do grupo → drag funciona com guides em relação a externos
- [ ] Filho selecionado dentro do grupo → resize funciona com guides de dimensão
- [ ] Escape → sai do grupo, grupo selecionado com bounds atualizados
- [ ] Click fora do grupo → sai do grupo preservando mudanças
- [ ] Guides somem ao soltar o mouse em todos os casos

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| ID virtual de multi-seleção | `'__multi__'` |
| `enterGroupAndSelectChild` | operação atômica — um único `set()` |
| Exclusão de snap em multi | todos os `selectedElementIds` |
| Exclusão de snap em grupo | elemento arrastado + filhos do mesmo grupo |
| Guides multi-seleção | baseadas no bounding box virtual da seleção |
| `exitGroup` | não desfaz mudanças — apenas muda estado de navegação |
| Filho em edição de grupo | `SelectionOverlay` com 8 handles |
| `updateElement` no filho | recalcula grupo pai automaticamente |