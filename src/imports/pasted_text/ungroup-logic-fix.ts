Prompt direto e focado nessa correção de comportamento:

---

## 🧱 PROMPT V60 — Design Workspace — Grupos preservados com um único filho até ungroup explícito

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

Um grupo **nunca se desfaz automaticamente** por ter apenas um filho restante. O grupo só é removido em dois casos explícitos:

| Situação | Comportamento |
|---|---|
| Grupo perde todos os filhos (0 filhos) | Grupo removido automaticamente |
| Usuário executa `Cmd/Ctrl + Shift + G` (ungroup) | Grupo removido, filhos ficam soltos |
| Filho removido, grupo fica com 1 filho | **Grupo permanece intacto** ← correção |
| Filho reparentado para outro grupo, 1 filho restante | **Grupo permanece intacto** ← correção |

---

### STORE — Remover a lógica de desagrupamento automático com 1 filho

Nos prompts anteriores (V39, V47, V53), a função `deleteElement` e `reparentElement` tinham lógica que desagrupava automaticamente quando restariam apenas 1 filho. **Essa lógica deve ser removida**:

```tsx
// store/useDesignWorkspaceStore.ts

deleteElement: (id: string) => set(state => {
  const element = state.canvasElements.find(el => el.id === id)
  if (!element) return state

  const groupId = element.type === 'group'
    ? element.id          // deletando o grupo → remover o grupo + todos os filhos
    : element.groupId     // deletando um filho → remover só o filho

  let idsToRemove: string[]

  if (element.type === 'group') {
    // Deletar grupo → remove o grupo E todos os filhos
    const childIds = state.canvasElements
      .filter(el => el.groupId === element.id)
      .map(el => el.id)
    idsToRemove = [element.id, ...childIds]
  } else {
    // Deletar filho → remove apenas ele
    idsToRemove = [element.id]

    // ✅ CORRETO: NÃO desagrupar o grupo de origem, não importa quantos filhos restam
    // O grupo de origem permanece intacto mesmo com 1 ou 0 filhos... espera:
    // Exceção: se o grupo ficar com 0 filhos → remover o grupo (grupo vazio não faz sentido)
    if (groupId) {
      const remainingChildren = state.canvasElements.filter(
        el => el.groupId === groupId && el.id !== id
      )
      if (remainingChildren.length === 0) {
        // Grupo ficou vazio → remover o container do grupo também
        idsToRemove.push(groupId)
      }
      // ✅ 1 filho restante → grupo PERMANECE — não adicionamos groupId ao idsToRemove
    }
  }

  // Recalcular bounds do grupo se ele sobreviveu
  let updatedElements = state.canvasElements.filter(
    el => !idsToRemove.includes(el.id)
  )

  if (groupId && !idsToRemove.includes(groupId)) {
    // Grupo sobreviveu → recalcular seus bounds
    const survivors = updatedElements.filter(el => el.groupId === groupId)
    if (survivors.length > 0) {
      const minX = Math.min(...survivors.map(c => c.x))
      const minY = Math.min(...survivors.map(c => c.y))
      const maxX = Math.max(...survivors.map(c => c.x + c.width))
      const maxY = Math.max(...survivors.map(c => c.y + c.height))
      updatedElements = updatedElements.map(el =>
        el.id === groupId
          ? { ...el, x: minX, y: minY, width: maxX - minX, height: maxY - minY }
          : el
      )
    }
  }

  return {
    ...pushHistory(state),
    canvasElements:      updatedElements,
    selectedElementIds:  state.selectedElementIds.filter(sid => !idsToRemove.includes(sid)),
    selectedElementType: null,
    editingGroupId:      idsToRemove.includes(state.editingGroupId ?? '')
      ? null
      : state.editingGroupId,
  }
}),
```

---

```tsx
// reparentElement — mesma correção

reparentElement: (elementId: string, newGroupId: string | null) => set(state => {
  const element = state.canvasElements.find(el => el.id === elementId)
  if (!element) return state

  const oldGroupId = element.groupId ?? null

  // Aplicar reparentamento
  let updatedElements = state.canvasElements.map(el =>
    el.id === elementId
      ? { ...el, groupId: newGroupId ?? undefined }
      : el
  )

  // Recalcular bounds do grupo de ORIGEM
  if (oldGroupId) {
    const oldChildren = updatedElements.filter(el => el.groupId === oldGroupId)

    if (oldChildren.length === 0) {
      // Grupo de origem ficou VAZIO → remover o grupo
      updatedElements = updatedElements.filter(el => el.id !== oldGroupId)

    } else {
      // ✅ 1 ou mais filhos restantes → grupo PERMANECE, apenas recalcula bounds
      // Não desagrupar independente do número de filhos
      const minX = Math.min(...oldChildren.map(c => c.x))
      const minY = Math.min(...oldChildren.map(c => c.y))
      const maxX = Math.max(...oldChildren.map(c => c.x + c.width))
      const maxY = Math.max(...oldChildren.map(c => c.y + c.height))
      updatedElements = updatedElements.map(el =>
        el.id === oldGroupId
          ? { ...el, x: minX, y: minY, width: maxX - minX, height: maxY - minY }
          : el
      )
    }
  }

  // Recalcular bounds do grupo de DESTINO
  if (newGroupId) {
    const newChildren = updatedElements.filter(el => el.groupId === newGroupId)
    if (newChildren.length > 0) {
      const minX = Math.min(...newChildren.map(c => c.x))
      const minY = Math.min(...newChildren.map(c => c.y))
      const maxX = Math.max(...newChildren.map(c => c.x + c.width))
      const maxY = Math.max(...newChildren.map(c => c.y + c.height))
      updatedElements = updatedElements.map(el =>
        el.id === newGroupId
          ? { ...el, x: minX, y: minY, width: maxX - minX, height: maxY - minY }
          : el
      )
    }
  }

  return {
    ...pushHistory(state),
    canvasElements: updatedElements,
  }
}),
```

---

### IMPLEMENTAÇÃO — `ungroupElements` (Cmd+Shift+G)

O único jeito de desfazer um grupo é via comando explícito. Implementar a ação e o atalho:

```tsx
// store/useDesignWorkspaceStore.ts

ungroupElements: (groupId: string) => set(state => {
  const group = state.canvasElements.find(el => el.id === groupId)
  if (!group || group.type !== 'group') return state

  // Remover o vínculo groupId de todos os filhos e remover o container do grupo
  const updatedElements = state.canvasElements
    .filter(el => el.id !== groupId)                             // remove o container
    .map(el => el.groupId === groupId
      ? { ...el, groupId: undefined }                           // filhos ficam soltos
      : el
    )

  return {
    ...pushHistory(state),
    canvasElements:      updatedElements,
    selectedElementIds:  [groupId],
    selectedElementType: null,
    editingGroupId:      state.editingGroupId === groupId ? null : state.editingGroupId,
  }
}),
```

```tsx
// hooks/useCanvasKeyboardShortcuts.ts

// ── Cmd/Ctrl + Shift + G — Ungroup ────────────────────────────────────
if (isMod && e.shiftKey && e.key === 'g') {
  e.preventDefault()

  const { selectedElementIds, canvasElements, ungroupElements } =
    useDesignWorkspaceStore.getState()

  // Ungroup de cada grupo selecionado
  selectedElementIds.forEach(id => {
    const el = canvasElements.find(el => el.id === id)
    if (el?.type === 'group') {
      ungroupElements(id)
    }
  })
  return
}
```

---

### `LayersPanel` — Grupo com 1 filho exibe normalmente

O `buildLayerTree` já constrói a árvore corretamente para grupos com qualquer número de filhos. Com a correção no store, o grupo de 1 filho continua aparecendo na árvore com seu filho indentado abaixo:

```tsx
// buildLayerTree.ts — sem mudanças necessárias
// Grupos com 1 filho continuam sendo exibidos como nó pai com 1 filho

// Visual no LayersPanel com grupo de 1 filho:
// ┌─────────────────────────────────────┐
// │  ▾  □  Group (1)               ●   │  ← grupo com 1 filho — preservado
// │      T  TextA                       │  ← único filho, indentado
// │     ◑  ShapeB                       │  ← elemento solto (nunca foi agrupado)
// └─────────────────────────────────────┘
```

---

### TABELA DE COMPORTAMENTOS — Resumo completo

| Ação | Filhos restantes | Grupo |
|---|---|---|
| Deletar filho | 2+ | Grupo permanece, bounds recalculados |
| Deletar filho | **1** | **Grupo permanece** ← corrigido |
| Deletar filho | 0 | Grupo removido automaticamente |
| Reparentar filho para outro grupo | 2+ | Grupo permanece, bounds recalculados |
| Reparentar filho para outro grupo | **1** | **Grupo permanece** ← corrigido |
| Reparentar filho para outro grupo | 0 | Grupo removido automaticamente |
| `Cmd+Shift+G` em grupo selecionado | qualquer | Grupo removido, filhos ficam soltos |
| `Cmd+G` em 2+ elementos selecionados | — | Novo grupo criado |

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Grupo com 3 filhos → deletar 2 → grupo permanece com 1 filho ✓
- [ ] Grupo com 2 filhos → reparentar 1 para outro grupo → grupo permanece com 1 filho ✓
- [ ] Grupo com 1 filho → LayersPanel exibe "Group (1)" com o filho indentado ✓
- [ ] Grupo com 1 filho → canvas exibe bounding box do grupo ao selecionar ✓
- [ ] Grupo com 1 filho → duplo clique → entra no grupo, seleciona o filho ✓
- [ ] Grupo com 0 filhos → grupo removido automaticamente ✓
- [ ] `Cmd+Shift+G` em grupo → grupo removido, filhos ficam soltos ✓
- [ ] Elemento nunca agrupado → não tem `groupId`, permanece isolado ✓
- [ ] `Cmd+Z` após deletar filho → filho e grupo restaurados corretamente ✓

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Desagrupamento automático | **somente** quando `remainingChildren.length === 0` |
| Desagrupamento manual | `Cmd/Ctrl + Shift + G` |
| Grupo com 1 filho no LayersPanel | `"Group (1)"` com filho indentado |
| Grupo com 1 filho no canvas | bounding box visível ao selecionar |
| Grupo vazio | removido imediatamente — não pode existir |
| Elemento nunca agrupado | sem `groupId` — permanece isolado sempre |