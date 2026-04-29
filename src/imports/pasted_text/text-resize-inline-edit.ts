Prompt direto e focado nessas duas funcionalidades:

---

## 🧱 PROMPT V55 — Design Workspace — Resize de texto reflete no Properties Panel + Edição inline de texto com duplo clique

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

### PARTE 1 — Font-size refletido no Properties Panel durante e após resize

#### PROBLEMA

O `TextPropertiesPanel` lê `element.style?.fontSize` do store. O `useResizeHandler` (V54) já atualiza `element.style.fontSize` via `updateElement` durante o resize. Se o painel não está refletindo o novo valor, há dois pontos a verificar:

**Ponto A — O `TextPropertiesPanel` precisa buscar o elemento atualizado diretamente do store, não de uma prop congelada:**

```tsx
// TextPropertiesPanel.tsx — CORRETO: ler do store em tempo real
export function TextPropertiesPanel({ elementId }: { elementId: string }) {
  // ✅ Selector reativo — re-renderiza sempre que o elemento muda no store
  const element = useDesignWorkspaceStore(
    state => state.canvasElements.find(el => el.id === elementId)
  )

  if (!element) return null

  const fontSize     = element.style?.fontSize     ?? 16
  const fontWeight   = element.style?.fontWeight   ?? '400'
  const fontFamily   = element.style?.fontFamily   ?? 'Roboto'
  const color        = element.style?.color        ?? '#111111'

  // ...resto do painel...
}
```

```tsx
// ❌ ERRADO — prop congelada no momento do render, não reage ao resize
export function TextPropertiesPanel({ element }: { element: CanvasElement }) {
  const fontSize = element.style?.fontSize  // nunca atualiza
}
```

**Ponto B — O campo de font-size no painel deve exibir o valor arredondado:**

```tsx
// Seção Text no TextPropertiesPanel
<div className="flex items-center gap-2 w-full">
  {/* Font size input — reflete o resize em tempo real */}
  <div className="flex flex-1 items-center gap-0 min-w-0">
    <div className="w-8 shrink-0 flex items-center justify-center">
      <span className="text-[11px] text-[#686576]">T↕</span>
    </div>
    <Input
      className="flex-1 min-w-0 h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px] text-[#1f1d25]"
      value={Math.round(fontSize)}   // ← arredondado, sem decimais
      onChange={e => {
        const val = Number(e.target.value)
        if (!isNaN(val) && val > 0) {
          updateElement(elementId, {
            style: { ...element.style, fontSize: val }
          })
        }
      }}
    />
  </div>
</div>
```

---

### PARTE 2 — Edição inline de texto com duplo clique

#### REGRA PRINCIPAL

Duplo clique em um elemento de texto no canvas entra em **modo de edição inline**. O texto se torna editável diretamente no canvas, na posição exata onde está, com o mesmo estilo visual. Clicar fora ou pressionar `Escape` confirma e sai do modo de edição.

---

### STORE — Estado de edição de texto

```tsx
// store/useDesignWorkspaceStore.ts

interface DesignWorkspaceState {
  // ...existentes...
  editingTextId: string | null   // ID do elemento de texto sendo editado inline
}

interface DesignWorkspaceActions {
  startTextEdit:  (id: string) => void
  commitTextEdit: (id: string, newContent: string) => void
  cancelTextEdit: () => void
}

startTextEdit: (id) => set(() => ({
  editingTextId: id,
})),

commitTextEdit: (id, newContent) => set(state => ({
  ...pushHistory(state),
  canvasElements: state.canvasElements.map(el =>
    el.id === id
      ? { ...el, content: newContent.trim() || el.content }
      : el
  ),
  editingTextId: null,
})),

cancelTextEdit: () => set(() => ({
  editingTextId: null,
})),
```

---

### `InteractionOverlay` — duplo clique abre edição inline de texto

```tsx
// InteractionOverlay.tsx — handleDoubleClick atualizado

const TEXT_TYPES: ElementType[] = [
  'text-header', 'text-subheader', 'text-body', 'text-template'
]

function handleDoubleClick(element: CanvasElement | null) {
  if (!element) return

  // ── Texto → edição inline ───────────────────────────────────────────
  if (TEXT_TYPES.includes(element.type)) {
    selectElement(element.id)
    startTextEdit(element.id)
    return
  }

  // ── Grupo → entrar no grupo ─────────────────────────────────────────
  if (element.type === 'group') {
    const children = canvasElements
      .filter(el => el.groupId === element.id)
      .reverse()
    const hitChild = children.find(c =>
      lastClick.current.x >= c.x && lastClick.current.x <= c.x + c.width &&
      lastClick.current.y >= c.y && lastClick.current.y <= c.y + c.height
    )
    if (hitChild) {
      // Se o filho é texto → entrar no grupo E iniciar edição de texto
      if (TEXT_TYPES.includes(hitChild.type)) {
        enterGroupAndSelectChild(element.id, hitChild.id)
        startTextEdit(hitChild.id)
        return
      }
      enterGroupAndSelectChild(element.id, hitChild.id)
    } else {
      enterGroup(element.id)
    }
    return
  }

  // ── Filho de grupo que é texto ───────────────────────────────────────
  if (element.groupId && TEXT_TYPES.includes(element.type)) {
    enterGroupAndSelectChild(element.groupId, element.id)
    startTextEdit(element.id)
    return
  }

  // ── Filho de grupo não-texto ─────────────────────────────────────────
  if (element.groupId) {
    enterGroupAndSelectChild(element.groupId, element.id)
  }
}
```

---

### `CanvasElementView` — renderizar `textarea` quando em edição

```tsx
// CanvasElementView.tsx

const TEXT_TYPES: ElementType[] = [
  'text-header', 'text-subheader', 'text-body', 'text-template'
]

export function CanvasElementView({ element, zIndex, isSelected, isMultiSelected }: Props) {
  const {
    editingTextId,
    commitTextEdit,
    cancelTextEdit,
  } = useDesignWorkspaceStore()

  const isEditingText = editingTextId === element.id
  const isText        = TEXT_TYPES.includes(element.type)

  const [localText, setLocalText] = useState(element.content ?? '')

  // Sincronizar localText quando o conteúdo do elemento muda externamente
  useEffect(() => {
    if (!isEditingText) setLocalText(element.content ?? '')
  }, [element.content, isEditingText])

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focar e selecionar todo o texto ao entrar no modo de edição
  useEffect(() => {
    if (isEditingText && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditingText])

  function handleTextKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    e.stopPropagation() // não disparar atalhos do canvas

    if (e.key === 'Escape') {
      e.preventDefault()
      cancelTextEdit()
      return
    }
    // Enter sem Shift → confirmar edição (Shift+Enter = nova linha)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      commitTextEdit(element.id, localText)
      return
    }
  }

  function handleTextBlur() {
    // Confirmar ao perder o foco
    commitTextEdit(element.id, localText)
  }

  const textStyle: React.CSSProperties = {
    fontSize:   element.style?.fontSize   ?? 16,
    fontWeight: element.style?.fontWeight ?? '400',
    color:      element.style?.color      ?? '#111111',
    fontFamily: element.style?.fontFamily ?? "'Roboto', sans-serif",
    lineHeight: 1.2,
    wordBreak:  'break-word',
    whiteSpace: 'pre-wrap',
  }

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: element.x, top: element.y, width: element.width, height: element.height, zIndex }}
    >
      {isText && isEditingText ? (
        // ── Modo de edição inline ─────────────────────────────────────────
        <textarea
          ref={textareaRef}
          value={localText}
          onChange={e => setLocalText(e.target.value)}
          onKeyDown={handleTextKeyDown}
          onBlur={handleTextBlur}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          className="
            w-full h-full resize-none outline-none border-none
            bg-transparent cursor-text pointer-events-auto
            selection:bg-[#5B4EFF40]
          "
          style={{
            ...textStyle,
            // Borda de edição — sutil underline ou ring
            boxShadow: '0 0 0 2px #5B4EFF',
            borderRadius: 2,
            padding: 0,
            margin:  0,
          }}
          // Não fazer stopPropagation do wheel — permite scroll no canvas
          spellCheck={false}
        />
      ) : (
        // ── Modo de visualização ──────────────────────────────────────────
        <div
          className="w-full h-full"
          style={textStyle}
        >
          {isText ? (element.content || 'Click to edit') : null}
          {!isText && <ElementContent element={element} />}
        </div>
      )}

      {/* Bounding box de seleção — oculto durante edição de texto */}
      {isSelected && !isMultiSelected && !isEditingText && (
        <SelectionOverlay elementId={element.id} />
      )}

      {/* Indicador visual de modo de edição de texto — cursor piscante no canto */}
      {isEditingText && (
        <div
          className="absolute -top-5 left-0 pointer-events-none"
          style={{ zIndex: zIndex + 1 }}
        >
          <span className="text-[9px] text-white bg-[#5B4EFF] px-1.5 py-0.5 rounded-full whitespace-nowrap">
            Editing — Esc or click outside to exit
          </span>
        </div>
      )}
    </div>
  )
}
```

---

### Fechar edição ao clicar fora

O `InteractionOverlay` já gerencia cliques no canvas. Quando `editingTextId !== null` e o usuário clica fora do elemento de texto, a edição deve ser confirmada:

```tsx
// InteractionOverlay.tsx — handleMouseDown atualizado

function handleMouseDown(e: React.MouseEvent) {
  const { editingTextId, commitTextEdit, canvasElements } =
    useDesignWorkspaceStore.getState()

  // Se há texto em edição, confirmar antes de qualquer outra ação
  if (editingTextId) {
    const el = canvasElements.find(el => el.id === editingTextId)
    // O blur do textarea já chama commitTextEdit — mas como garantia:
    // verificar se o clique foi FORA do elemento de texto
    const rect      = frameRef.current!.getBoundingClientRect()
    const mouseX    = e.clientX - rect.left
    const mouseY    = e.clientY - rect.top
    const textEl    = canvasElements.find(el => el.id === editingTextId)

    if (textEl) {
      const clickedInsideText =
        mouseX >= textEl.x && mouseX <= textEl.x + textEl.width &&
        mouseY >= textEl.y && mouseY <= textEl.y + textEl.height

      if (!clickedInsideText) {
        // O blur do textarea é suficiente — mas forçar aqui como fallback
        // O textarea.onBlur → commitTextEdit já foi chamado pelo browser
        return  // deixar o blur natural do textarea fechar a edição
      }
    }
  }

  // ...resto do handleMouseDown existente...
}
```

---

### ATALHOS — `Escape` cancela, `Enter` confirma

```tsx
// hooks/useCanvasKeyboardShortcuts.ts — atualizado

function handleKeyDown(e: KeyboardEvent) {
  const { editingTextId, cancelTextEdit } = useDesignWorkspaceStore.getState()

  // Se há texto em edição, Escape cancela (sem alterar o conteúdo)
  // Enter e outros atalhos são tratados pelo textarea diretamente
  if (editingTextId) {
    if (e.key === 'Escape') {
      e.preventDefault()
      cancelTextEdit()
    }
    // Todos os outros atalhos (Delete, Cmd+Z, etc) são ignorados
    // para não interferir com a edição de texto
    return
  }

  // ...restante dos atalhos existentes — só executam se não há texto em edição...
}
```

---

### DIAGRAMA — Fluxo de edição inline de texto

```
Usuário dá duplo clique em TextA no canvas
        ↓
InteractionOverlay.handleDoubleClick(TextA)
  → TEXT_TYPES.includes(TextA.type) === true
  → selectElement('textA')
  → startTextEdit('textA')
        ↓
Store: editingTextId = 'textA'
        ↓
CanvasElementView re-renderiza:
  → isEditingText = true
  → <textarea> aparece no lugar do <div> de texto
  → textarea.focus() + textarea.select() automático
  → badge "Editing — Esc or click outside" aparece
  → bounding box / handles OCULTOS durante edição
        ↓
Usuário edita o texto, pressiona Enter (ou clica fora)
        ↓
commitTextEdit('textA', 'novo conteúdo')
  → canvasElements: TextA.content = 'novo conteúdo'
  → pushHistory() — undo disponível
  → editingTextId = null
        ↓
CanvasElementView re-renderiza:
  → isEditingText = false
  → <div> de texto exibe o novo conteúdo
  → bounding box / handles voltam a aparecer ✓
        ↓
TextPropertiesPanel: sem mudança (font-size não alterou)
```

---

### CHECKLIST DE VALIDAÇÃO

**Properties Panel:**
- [ ] Redimensionar elemento de texto → font-size no Properties Panel atualiza em tempo real
- [ ] Font-size exibe valor arredondado (sem decimais)
- [ ] Editar font-size manualmente no Properties Panel → texto no canvas atualiza
- [ ] Cmd+Z após resize → font-size e dimensões desfeitos atomicamente

**Edição inline:**
- [ ] Duplo clique em texto → modo de edição inline ativo
- [ ] Texto editável diretamente no canvas na posição exata
- [ ] Enter → confirma e sai da edição
- [ ] Escape → cancela (não salva) e sai da edição
- [ ] Clicar fora → confirma e sai da edição
- [ ] Durante edição: handles de resize ocultos
- [ ] Durante edição: atalhos do canvas (Delete, Cmd+Z) não disparados
- [ ] Duplo clique em texto filho de grupo → entra no grupo E inicia edição
- [ ] Cmd+Z após editar texto → desfaz alteração de conteúdo
- [ ] Texto vazio ao confirmar → mantém conteúdo anterior

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Duplo clique em texto | ativa `editingTextId` no store |
| Textarea background | `transparent` |
| Textarea border durante edição | `box-shadow: 0 0 0 2px #5B4EFF` |
| Textarea selection color | `#5B4EFF40` |
| Handles durante edição | ocultos — `!isEditingText` |
| Confirmar edição | `Enter` (sem Shift) ou `onBlur` |
| Cancelar edição | `Escape` |
| Badge de edição | `bg-[#5B4EFF]` texto branco, acima do elemento |
| `commitTextEdit` | gera snapshot via `pushHistory` |
| `cancelTextEdit` | não gera snapshot |
| Atalhos do canvas durante edição | todos ignorados exceto `Escape` |