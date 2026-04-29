Prompt direto e focado nessa funcionalidade:

---

## 🧱 PROMPT V65 — Design Workspace — Mover elementos selecionados com teclas de seta

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

Qualquer elemento selecionado — seja via canvas ou via LayersPanel — pode ser movido com as teclas de seta do teclado. O comportamento é:

| Tecla | Deslocamento |
|---|---|
| `←` | Move 1px para a esquerda |
| `→` | Move 1px para a direita |
| `↑` | Move 1px para cima |
| `↓` | Move 1px para baixo |
| `Shift + ←` | Move 10px para a esquerda |
| `Shift + →` | Move 10px para a direita |
| `Shift + ↑` | Move 10px para cima |
| `Shift + ↓` | Move 10px para baixo |

---

### IMPLEMENTAÇÃO — `useCanvasKeyboardShortcuts`

```tsx
// hooks/useCanvasKeyboardShortcuts.ts

const ARROW_STEP       = 1    // px — movimento com seta simples
const ARROW_STEP_LARGE = 10   // px — movimento com Shift + seta

function handleKeyDown(e: KeyboardEvent) {
  // ── Ignorar se foco estiver em input/textarea ─────────────────────────
  const tag      = (e.target as HTMLElement)?.tagName?.toLowerCase()
  const editable = (e.target as HTMLElement)?.isContentEditable
  if (tag === 'input' || tag === 'textarea' || editable) return

  const {
    selectedElementIds,
    editingTextId,
    canvasElements,
    updateElement,
    commitHistory,
  } = useDesignWorkspaceStore.getState()

  // ── Ignorar setas se estiver editando texto inline ────────────────────
  if (editingTextId) return

  // ── Teclas de seta ────────────────────────────────────────────────────
  const arrowKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
  if (!arrowKeys.includes(e.key)) return
  if (selectedElementIds.length === 0) return

  e.preventDefault() // impede scroll da página

  const step = e.shiftKey ? ARROW_STEP_LARGE : ARROW_STEP

  const delta = {
    x: e.key === 'ArrowLeft'  ? -step
      : e.key === 'ArrowRight' ?  step
      : 0,
    y: e.key === 'ArrowUp'   ? -step
      : e.key === 'ArrowDown' ?  step
      : 0,
  }

  // Mover todos os elementos selecionados pelo mesmo delta
  selectedElementIds.forEach(id => {
    const el = canvasElements.find(el => el.id === id)
    if (!el) return

    // Não mover containers de grupo diretamente via seta —
    // os filhos se movem, o grupo recalcula automaticamente
    if (el.type === 'group') {
      // Mover todos os filhos do grupo
      canvasElements
        .filter(child => child.groupId === id)
        .forEach(child => {
          updateElement(child.id, {
            x: child.x + delta.x,
            y: child.y + delta.y,
          })
        })
      return
    }

    updateElement(id, {
      x: el.x + delta.x,
      y: el.y + delta.y,
    })
  })

  // ── Debounce do commitHistory ─────────────────────────────────────────
  // Múltiplas setas pressionadas em sequência devem gerar
  // UM único snapshot ao parar de pressionar — não um por tecla
  scheduleArrowCommit()
}
```

---

### DEBOUNCE DO `commitHistory` — Uma única ação de undo

Pressionar a seta várias vezes em sequência deve resultar em **uma única entrada no histórico de undo** — não uma entrada por tecla. Usar um debounce de ~500ms:

```tsx
// hooks/useCanvasKeyboardShortcuts.ts

// Ref para o timer de debounce do arrow commit
const arrowCommitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

function scheduleArrowCommit() {
  // Cancelar timer anterior se houver
  if (arrowCommitTimer.current) {
    clearTimeout(arrowCommitTimer.current)
  }

  // Agendar novo commit após 500ms sem nova tecla de seta
  arrowCommitTimer.current = setTimeout(() => {
    useDesignWorkspaceStore.getState().commitHistory()
    arrowCommitTimer.current = null
  }, 500)
}

// Limpar o timer ao desmontar
useEffect(() => {
  return () => {
    if (arrowCommitTimer.current) {
      clearTimeout(arrowCommitTimer.current)
    }
  }
}, [])
```

---

### COMPORTAMENTO COM GRUPOS

Quando o elemento selecionado é um **grupo** (`type === 'group'`), as teclas de seta movem todos os filhos juntos:

```tsx
// Seleção do grupo via LayersPanel ou canvas:
// selectedElementIds = ['group-g1']

// Pressionar →:
//   → encontrar todos os filhos com groupId === 'group-g1'
//   → updateElement(filho.id, { x: filho.x + 1 })  para cada filho
//   → updateElement do grupo recalcula bounds automaticamente (V47)
```

Quando um **filho de grupo** está selecionado (em modo de edição de grupo — `editingGroupId` ativo), apenas esse filho se move:

```tsx
// editingGroupId = 'group-g1'
// selectedElementIds = ['shapeB']  (filho selecionado via duplo clique)

// Pressionar ↑:
//   → updateElement('shapeB', { y: shapeB.y - 1 })
//   → grupo recalcula bounds automaticamente
```

---

### MULTI-SELEÇÃO — Mover todos juntos

Quando múltiplos elementos estão selecionados, todos se movem pelo mesmo delta:

```tsx
// selectedElementIds = ['textA', 'shapeB', 'group-g1']

// Pressionar Shift + ↓:
//   → textA: y += 10
//   → shapeB: y += 10
//   → group-g1: filhos y += 10, grupo recalcula
```

---

### `RightPanel` — Atualização em tempo real durante arrow move

Como o `RightPanel` lê as coordenadas diretamente do store via selector reativo, os campos X e Y atualizam automaticamente a cada tecla de seta pressionada — sem nenhuma lógica adicional:

```tsx
// TextPropertiesPanel / PlaceholderPropertiesPanel — já reativos
const element = useDesignWorkspaceStore(
  s => s.canvasElements.find(el => el.id === elementId)
)
// X, Y atualizam em tempo real conforme as setas movem o elemento ✓
```

---

### `LayersPanel` — Seleção via click dispara o foco correto

Para que as setas funcionem após selecionar via LayersPanel, o foco do browser deve estar na área do canvas — não no painel. Garantir que clicar em uma layer no LayersPanel não roube o foco de forma que impeça os eventos de teclado no `window`:

```tsx
// LayerNode.tsx — prevenir que o click roube o foco do window
<div
  onClick={() => !isEditing && handleSelectFromPanel(node.element.id)}
  onMouseDown={(e) => {
    // Prevenir que o elemento receba foco via tab
    // Eventos de teclado continuam sendo recebidos pelo window
    e.preventDefault()
  }}
  tabIndex={-1}  // ← não participar do tab order
  ...
>
```

> Como o `useCanvasKeyboardShortcuts` escuta `window.addEventListener('keydown')`, os eventos de teclado chegam independentemente de qual elemento tem o foco — desde que não seja um `input` ou `textarea`.

---

### DIAGRAMA — Fluxo completo das setas

```
Usuário clica em "TextA" no LayersPanel
        ↓
selectedElementIds = ['textA']
RightPanel exibe TextPropertiesPanel com X=100, Y=150

Usuário pressiona →
        ↓
handleKeyDown detecta 'ArrowRight', step = 1
updateElement('textA', { x: 101 })
scheduleArrowCommit() — timer de 500ms inicia

Usuário pressiona → novamente (antes de 500ms)
        ↓
updateElement('textA', { x: 102 })
scheduleArrowCommit() — timer reinicia (cancela o anterior)

Usuário para de pressionar (500ms se passam)
        ↓
commitHistory() — 1 snapshot gerado para x=100→x=102

Usuário pressiona Cmd+Z
        ↓
undo() — restaura x=100 ✓ (desfaz toda a sequência de uma vez)

Usuário pressiona Shift + ↑
        ↓
step = 10
updateElement('textA', { y: 140 })
scheduleArrowCommit()
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Seta simples → move 1px na direção correta
- [ ] Shift + seta → move 10px na direção correta
- [ ] Elemento selecionado via canvas → setas funcionam
- [ ] Elemento selecionado via LayersPanel → setas funcionam
- [ ] RightPanel campos X/Y atualizam em tempo real durante arrow move
- [ ] Grupo selecionado → todos os filhos se movem juntos
- [ ] Filho de grupo selecionado (modo edição) → apenas o filho se move
- [ ] Multi-seleção → todos os elementos selecionados se movem juntos
- [ ] Cmd+Z após sequência de setas → desfaz tudo de uma vez (1 snapshot)
- [ ] Input/textarea com foco → setas NÃO disparam (comportamento padrão do input)
- [ ] Edição inline de texto ativa → setas NÃO disparam
- [ ] Setas não fazem scroll da página (`e.preventDefault()`)
- [ ] Guides de alinhamento NÃO aparecem durante arrow move (apenas durante drag)

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| `ARROW_STEP` | `1px` — seta simples |
| `ARROW_STEP_LARGE` | `10px` — Shift + seta |
| Debounce do `commitHistory` | `500ms` após última tecla de seta |
| Teclas | `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown` |
| Ignorar quando | `editingTextId !== null`, input/textarea com foco |
| Grupos | filhos se movem, grupo recalcula bounds automaticamente |
| Undo | 1 snapshot para toda a sequência contínua de setas |
| `e.preventDefault()` | sempre — evita scroll da página |