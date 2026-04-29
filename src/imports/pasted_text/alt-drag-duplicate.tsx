Prompt direto e focado nessa funcionalidade:

---

## 🧱 PROMPT V50 — Design Workspace — Alt+drag duplica elemento + Alt+Shift+drag duplica alinhado

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

| Modificador | Comportamento |
|---|---|
| Drag simples | Move o elemento |
| `Alt` + drag | Duplica o elemento ao iniciar o drag. O original fica no lugar. O duplicado move com o cursor |
| `Alt + Shift` + drag | Duplica o elemento. O duplicado move com o cursor mas fica travado no eixo com maior deslocamento (horizontal ou vertical) |

---

### IMPLEMENTAÇÃO — `InteractionOverlay` com Alt+drag

O momento crítico é o **primeiro `mousemove` com distância > 3px**. É aí que a duplicação acontece — não no `mousedown`. Isso evita duplicação acidental em clicks rápidos.

```tsx
// InteractionOverlay.tsx — startElementDrag com suporte a Alt

function startElementDrag(
  e: React.MouseEvent,
  element: CanvasElement,
  rect: DOMRect
) {
  const startMouseX = e.clientX - rect.left
  const startMouseY = e.clientY - rect.top
  const startElX    = element.x
  const startElY    = element.y

  // Capturar modificadores no momento do mousedown
  const altHeld   = e.altKey
  const shiftHeld = e.shiftKey

  let dragging        = false
  let duplicated      = false
  let activeDragId    = element.id  // ID do elemento sendo arrastado
  //                                   pode mudar para o ID da duplicata

  function onMouseMove(ev: MouseEvent) {
    const dx = ev.clientX - rect.left - startMouseX
    const dy = ev.clientY - rect.top  - startMouseY

    if (!dragging && Math.hypot(dx, dy) > 3) {
      dragging = true

      // ── Alt+drag: duplicar ao iniciar o movimento ─────────────────────
      if (altHeld && !duplicated) {
        duplicated = true

        // 1. O original permanece na posição inicial — não move
        // 2. Criar duplicata e passá-la a ser o elemento arrastado
        const duplicate = {
          ...element,
          // Sem ID — insertElement gera um novo
          x: startElX,
          y: startElY,
          // Preservar groupId se dentro de um grupo
          groupId: element.groupId,
        }

        // insertElement adiciona ao store, seleciona a duplicata e gera snapshot
        useDesignWorkspaceStore.getState().insertElementSilent(duplicate)

        // insertElementSilent retorna o ID da duplicata
        activeDragId = useDesignWorkspaceStore.getState().selectedElementIds[0]
      }
    }

    if (!dragging) return

    // ── Calcular deslocamento com restrição de eixo (Alt+Shift) ──────────
    let finalDx = dx
    let finalDy = dy

    if (altHeld && shiftHeld) {
      // Travar no eixo com maior deslocamento
      if (Math.abs(dx) >= Math.abs(dy)) {
        finalDy = 0  // trava no eixo horizontal
      } else {
        finalDx = 0  // trava no eixo vertical
      }
    }

    const rawX = startElX + finalDx
    const rawY = startElY + finalDy

    // ── Guides e snap de alinhamento ─────────────────────────────────────
    const activeEl = useDesignWorkspaceStore.getState().canvasElements
      .find(el => el.id === activeDragId)

    if (activeEl) {
      const { guides, snappedX, snappedY } = computeGuides(
        activeDragId,
        rawX, rawY,
        activeEl.width, activeEl.height
      )
      onAlignmentGuidesChange(guides)
      updateElement(activeDragId, { x: snappedX, y: snappedY })
    }
  }

  function onMouseUp() {
    if (dragging && duplicated) {
      // Snapshot: registra a duplicação + posição final como uma ação única
      useDesignWorkspaceStore.getState().commitHistory()
    } else if (dragging && !duplicated) {
      // Snapshot: registra o movimento
      useDesignWorkspaceStore.getState().commitHistory()
    }

    onAlignmentGuidesChange([])
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
```

---

### STORE — `insertElementSilent`

Versão do `insertElement` que **não gera snapshot imediato** — o snapshot é gerado no `mouseup` pelo `commitHistory`, tratando toda a operação de Alt+drag como uma única ação de undo:

```tsx
// store/useDesignWorkspaceStore.ts

// insertElementSilent — insere sem gerar snapshot no history
// Usado pelo Alt+drag para que o undo desfaça a duplicação + o movimento juntos
insertElementSilent: (element) => {
  const newId  = crypto.randomUUID()
  const name   = element.name ?? defaultLayerName(element.type)
  const isBackground = element.placeholderVariant === 'background'

  const finalElement: CanvasElement = isBackground
    ? { ...element, id: newId, name, x: 0, y: 0, width: 600, height: 600 }
    : { ...element, id: newId, name }

  set(state => ({
    // ✅ SEM pushHistory — o snapshot virá no commitHistory do mouseup
    canvasElements: isBackground
      ? [finalElement, ...state.canvasElements]
      : [...state.canvasElements, finalElement],
    selectedElementIds:  [newId],
    selectedElementType: element.type,
    // future NÃO é limpo aqui — commitHistory fará isso
  }))

  return newId  // retorna o ID para o drag saber qual elemento mover
},
```

---

### INDICADOR VISUAL — Cursor durante Alt+drag

Alterar o cursor para indicar que o drag vai duplicar:

```tsx
// InteractionOverlay.tsx — cursor dinâmico

// No estado do overlay, rastrear se Alt está pressionado
const [altActive, setAltActive] = useState(false)

useEffect(() => {
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Alt') setAltActive(true)
  }
  function onKeyUp(e: KeyboardEvent) {
    if (e.key === 'Alt') setAltActive(false)
  }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup',   onKeyUp)
  return () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup',   onKeyUp)
  }
}, [])

// No div do overlay
<div
  className="absolute inset-0"
  style={{
    zIndex: 50,
    // Cursor especial quando Alt está pressionado sobre elemento selecionado
    cursor: altActive && selectedElementIds.length > 0
      ? 'copy'      // ← indica duplicação
      : 'default',
  }}
  onMouseDown={handleMouseDown}
/>
```

---

### MULTI-SELEÇÃO — Alt+drag com múltiplos elementos

Quando múltiplos elementos estão selecionados e o usuário inicia Alt+drag, **todos** são duplicados:

```tsx
// InteractionOverlay.tsx — startMultiDrag com Alt

function startMultiDrag(
  e: React.MouseEvent,
  selectedIds: string[],
  rect: DOMRect
) {
  const altHeld   = e.altKey
  const shiftHeld = e.shiftKey

  const startMouseX = e.clientX - rect.left
  const startMouseY = e.clientY - rect.top

  const snapshots = selectedIds.map(id => {
    const el = canvasElements.find(el => el.id === id)!
    return { id, startX: el.x, startY: el.y, el }
  })

  const groupMinX = Math.min(...snapshots.map(s => s.startX))
  const groupMinY = Math.min(...snapshots.map(s => s.startY))
  const groupMaxX = Math.max(...snapshots.map(s => s.startX + s.el.width))
  const groupMaxY = Math.max(...snapshots.map(s => s.startY + s.el.height))
  const groupW    = groupMaxX - groupMinX
  const groupH    = groupMaxY - groupMinY

  let dragging      = false
  let duplicated    = false
  let activeDragIds = [...selectedIds]  // IDs dos elementos sendo arrastados

  function onMouseMove(ev: MouseEvent) {
    const dx = ev.clientX - rect.left - startMouseX
    const dy = ev.clientY - rect.top  - startMouseY

    if (!dragging && Math.hypot(dx, dy) > 3) {
      dragging = true

      // ── Alt+drag: duplicar todos os selecionados ──────────────────────
      if (altHeld && !duplicated) {
        duplicated   = true
        activeDragIds = []

        // Originais ficam no lugar — criar duplicatas de todos
        snapshots.forEach(({ el }) => {
          const newId = useDesignWorkspaceStore.getState()
            .insertElementSilent({
              ...el,
              x: el.x,
              y: el.y,
              groupId: el.groupId,
            })
          activeDragIds.push(newId)
        })

        // Selecionar as duplicatas
        useDesignWorkspaceStore.getState().setSelection(activeDragIds)
      }
    }

    if (!dragging) return

    // ── Restrição de eixo com Alt+Shift ───────────────────────────────────
    let finalDx = dx
    let finalDy = dy

    if (altHeld && shiftHeld) {
      if (Math.abs(dx) >= Math.abs(dy)) finalDy = 0
      else                               finalDx = 0
    }

    const rawGroupX = groupMinX + finalDx
    const rawGroupY = groupMinY + finalDy

    const { guides, snappedX, snappedY } = computeGuides(
      '__multi__', rawGroupX, rawGroupY, groupW, groupH
    )

    onAlignmentGuidesChange(guides)

    const snapDx = snappedX - groupMinX
    const snapDy = snappedY - groupMinY

    // Mover todas as duplicatas (ou os originais se sem Alt)
    snapshots.forEach(({ startX, startY }, i) => {
      updateElement(activeDragIds[i], {
        x: startX + snapDx,
        y: startY + snapDy,
      })
    })
  }

  function onMouseUp() {
    if (dragging) {
      useDesignWorkspaceStore.getState().commitHistory()
    }
    onAlignmentGuidesChange([])
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
```

---

### COMPORTAMENTO DE UNDO

```
Usuário faz Alt+drag de TextA:
  → mousedown: nada acontece
  → primeiro mousemove > 3px: insertElementSilent(TextA_copy) — sem snapshot
  → mousemove contínuo: move TextA_copy
  → mouseup: commitHistory() — snapshot com [TextA_original, TextA_copy(posição final)]

Cmd+Z:
  → undo() restaura snapshot ANTES do Alt+drag
  → TextA_copy some, TextA_original volta à posição original ✓
  → Uma única ação desfaz tudo (duplicação + movimento) ✓
```

---

### TABELA COMPLETA DE ATALHOS DE DRAG

| Atalho | Resultado |
|---|---|
| Drag simples | Move o elemento |
| `Shift` + drag | Move travado no eixo (já implementado no V33) |
| `Alt` + drag | Duplica; original fica, cópia move |
| `Alt + Shift` + drag | Duplica; cópia move travada no eixo |
| `Alt` + drag (multi-seleção) | Duplica todos; originais ficam, cópias movem |
| `Alt + Shift` + drag (multi) | Duplica todos; cópias movem travadas no eixo |

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Alt+drag → original permanece no lugar, duplicata aparece e move com o cursor
- [ ] Alt+drag → duplicata começa exatamente sobre o original (mesma posição)
- [ ] Alt+Shift+drag → duplicata move travada no eixo com maior deslocamento
- [ ] Alt+drag com multi-seleção → todos duplicados, originais permanecem
- [ ] Cursor muda para `copy` quando Alt está pressionado sobre elemento selecionado
- [ ] Guides e snap funcionam durante Alt+drag (duplicata como referência)
- [ ] Cmd+Z após Alt+drag → desfaz duplicação e movimento em uma única ação
- [ ] Duplicata preserva `groupId` se o original era filho de um grupo
- [ ] LayersPanel exibe a duplicata como nova layer imediatamente

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Threshold do drag | `3px` antes de iniciar |
| Momento da duplicação | primeiro `mousemove` > 3px com `altKey === true` |
| Original após Alt+drag | permanece na posição inicial, sem mover |
| Duplicata | inicia na mesma posição do original |
| Cursor com Alt | `copy` |
| Restrição de eixo (Shift) | maior `abs(dx)` vs `abs(dy)` |
| `insertElementSilent` | insere sem snapshot — snapshot no `mouseup` |
| `commitHistory` | chamado no `mouseup` — uma ação no histórico |
| Undo | desfaz duplicação + movimento juntos |