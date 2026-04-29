Prompt direto e focado nessa funcionalidade:

---

## 🧱 PROMPT V47 — Design Workspace — Edição de filho dentro de grupo: seleção, manipulação e preservação do grupo

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

### REGRA PRINCIPAL — Dois níveis de interação com grupos

| Estado | `editingGroupId` | Elemento selecionado | Comportamento |
|---|---|---|---|
| Normal | `null` | grupo | Click no grupo → seleciona o grupo |
| Editando grupo | `groupId` | filho | Click num filho → seleciona o filho com todas as ações disponíveis |
| Editando grupo | `groupId` | filho | Delete, resize, reposição → afeta só o filho, grupo atualiza automaticamente |
| Sair do grupo | `null` | grupo | Escape ou click fora → volta ao grupo com as mudanças preservadas |

---

### STORE — Garantir que edições do filho atualizam o grupo

O grupo precisa ter suas coordenadas (`x`, `y`, `width`, `height`) sincronizadas automaticamente sempre que um filho é modificado. Isso garante que o bounding box do grupo reflita o estado atual dos filhos após qualquer edição:

```tsx
// store/useDesignWorkspaceStore.ts

// Função auxiliar — recalcula bounding box do grupo a partir dos filhos
function recalcGroupBounds(
  elements: CanvasElement[],
  groupId: string
): Partial<CanvasElement> {
  const children = elements.filter(el => el.groupId === groupId)
  if (children.length === 0) return {}

  const minX = Math.min(...children.map(c => c.x))
  const minY = Math.min(...children.map(c => c.y))
  const maxX = Math.max(...children.map(c => c.x + c.width))
  const maxY = Math.max(...children.map(c => c.y + c.height))

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

// updateElement — quando um filho é atualizado, recalcula o grupo pai
updateElement: (id, updates) => set(state => {
  // Aplicar update no elemento
  const updatedElements = state.canvasElements.map(el =>
    el.id === id ? { ...el, ...updates } : el
  )

  // Se o elemento é filho de um grupo, recalcular o grupo pai
  const element = state.canvasElements.find(el => el.id === id)
  if (element?.groupId) {
    const groupBounds = recalcGroupBounds(updatedElements, element.groupId)
    return {
      canvasElements: updatedElements.map(el =>
        el.id === element.groupId
          ? { ...el, ...groupBounds }  // atualiza o container do grupo
          : el
      )
    }
  }

  return { canvasElements: updatedElements }
}),

// deleteElement — quando filho é deletado, recalcular grupo ou remover grupo vazio
deleteElement: (id) => set(state => {
  const element = state.canvasElements.find(el => el.id === id)
  const groupId  = element?.groupId

  // Remover o elemento
  let updatedElements = state.canvasElements.filter(el => el.id !== id)

  if (groupId) {
    const remainingChildren = updatedElements.filter(el => el.groupId === groupId)

    if (remainingChildren.length === 0) {
      // Grupo ficou vazio → remover o grupo também
      updatedElements = updatedElements.filter(el => el.id !== groupId)
    } else if (remainingChildren.length === 1) {
      // Apenas 1 filho restante → desagrupar automaticamente
      updatedElements = updatedElements.map(el =>
        el.id === remainingChildren[0].id
          ? { ...el, groupId: undefined }  // remove o vínculo com o grupo
          : el
      ).filter(el => el.id !== groupId)    // remove o container do grupo
    } else {
      // Recalcular bounds do grupo com os filhos restantes
      const groupBounds = recalcGroupBounds(updatedElements, groupId)
      updatedElements = updatedElements.map(el =>
        el.id === groupId ? { ...el, ...groupBounds } : el
      )
    }
  }

  return {
    canvasElements: updatedElements,
    selectedElementIds: state.selectedElementIds.filter(sid => sid !== id),
    selectedElementType: null,
    editingGroupId: state.editingGroupId === groupId && !updatedElements.find(el => el.id === groupId)
      ? null
      : state.editingGroupId,
  }
}),
```

---

### `InteractionOverlay` — ações completas no filho quando editando grupo

Quando `editingGroupId !== null`, o filho selecionado deve ter **todas** as capacidades de um elemento normal:

```tsx
// InteractionOverlay.tsx

function handleSingleClick(
  e: React.MouseEvent,
  element: CanvasElement,
  mouseX: number,
  mouseY: number,
  rect: DOMRect
) {
  if (e.shiftKey) {
    toggleElementSelection(element.id)
    return
  }

  const { editingGroupId } = useDesignWorkspaceStore.getState()

  if (editingGroupId) {
    if (element.groupId === editingGroupId || element.id === editingGroupId) {
      // Dentro do grupo em edição → seleciona o filho normalmente
      if (element.type !== 'group') {
        selectElement(element.id)
      }
    } else {
      // Clicou fora do grupo → sai do grupo
      exitGroup()
      if (!element.groupId) selectElement(element.id)
    }
  } else {
    const isAlreadySelected = selectedElementIds.includes(element.id)
    if (!isAlreadySelected) selectElement(element.id)
  }

  startElementDrag(e, element, rect)
}
```

---

### `SelectionOverlay` — filho dentro de grupo tem handles completos

Quando o filho de um grupo está selecionado (em modo de edição de grupo), o `SelectionOverlay` deve renderizar normalmente — com todos os 8 handles de resize e o bounding box:

```tsx
// SelectionOverlay.tsx
// Sem nenhuma mudança necessária — o SelectionOverlay já renderiza
// handles completos para qualquer elemento com selectedElementIds.length === 1.
// A lógica de editingGroupId no store garante que selectedElementIds[0]
// seja o filho quando em modo de edição de grupo.
```

---

### ATALHOS — Delete e Cmd+D funcionam no filho

Os atalhos de teclado já operam sobre `selectedElementIds`. Quando um filho está selecionado dentro de um grupo, os atalhos afetam apenas ele:

```tsx
// hooks/useCanvasKeyboardShortcuts.ts

// Delete — já implementado, agora com recalc automático do grupo via updateElement
// Quando filho é deletado → store recalcula bounds do grupo automaticamente ✓

// Cmd+D — duplicar filho dentro do mesmo grupo
if (isMod && e.key === 'd' && selectedElementIds.length === 1) {
  e.preventDefault()
  const el = canvasElements.find(el => el.id === selectedElementIds[0])
  if (el) {
    insertElement({
      ...el,
      x: el.x + 16,
      y: el.y + 16,
      // Preservar o groupId — duplicata fica no mesmo grupo
      groupId: el.groupId,
    })
    // insertElement recalcula o grupo automaticamente via updateElement ✓
  }
  return
}

// Escape — sair do modo de edição de grupo
if (e.key === 'Escape') {
  const { editingGroupId, exitGroup, selectedElementIds, clearSelection } =
    useDesignWorkspaceStore.getState()

  if (editingGroupId) {
    exitGroup()  // volta a selecionar o grupo pai
    return
  }
  if (selectedElementIds.length > 0) {
    clearSelection()
    return
  }
}
```

---

### FEEDBACK VISUAL — Indicadores durante edição de grupo

```tsx
// CanvasFrame.tsx — indicadores visuais do modo de edição

{editingGroupId && (
  <>
    {/* Overlay sobre elementos FORA do grupo — visualmente "recuados" */}
    {canvasElements
      .filter(el =>
        el.id !== editingGroupId &&
        el.groupId !== editingGroupId &&
        el.type !== 'group'
      )
      .map(el => (
        <div
          key={el.id}
          className="absolute pointer-events-none"
          style={{
            left: el.x, top: el.y,
            width: el.width, height: el.height,
            backgroundColor: 'rgba(255,255,255,0.5)',
            zIndex: 48,
          }}
        />
      ))
    }

    {/* Borda tracejada ao redor do grupo em edição */}
    {(() => {
      const group = canvasElements.find(el => el.id === editingGroupId)
      if (!group) return null
      return (
        <div
          className="absolute pointer-events-none"
          style={{
            left:   group.x - 4,
            top:    group.y - 4,
            width:  group.width + 8,
            height: group.height + 8,
            border: '1.5px dashed #5B4EFF',
            borderRadius: 4,
            zIndex: 47,
          }}
        />
      )
    })()}

    {/* Badge "Editing group" */}
    <div
      className="absolute pointer-events-none"
      style={{ bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 80 }}
    >
      <span className="text-[10px] font-medium text-white bg-[#5B4EFF] px-2 py-1 rounded-full shadow-md whitespace-nowrap">
        Editing group — Esc to exit
      </span>
    </div>
  </>
)}
```

---

### DIAGRAMA — Fluxo completo de edição de filho em grupo

```
Estado inicial:
  canvasElements = [bg, textA, group-g1, shapeB(groupId:g1), iconC(groupId:g1)]
  editingGroupId = null
  selectedElementIds = []

1. Usuário dá duplo clique no grupo (ou em shapeB):
   → enterGroup('group-g1')
   → editingGroupId = 'group-g1'
   → selectElement('shapeB')
   → selectedElementIds = ['shapeB']
   → Canvas: shapeB com bounding box + handles
             iconC visível mas sem overlay
             textA com overlay branco 50%
             borda tracejada ao redor do grupo

2. Usuário redimensiona shapeB arrastando handle:
   → useResizeHandler move shapeB
   → updateElement('shapeB', { width: newW, height: newH })
   → store detecta shapeB.groupId = 'group-g1'
   → recalcGroupBounds(['group-g1']) → novo bounding box
   → updateElement('group-g1', { x, y, width, height }) automático ✓
   → grupo preservado, bounds atualizados ✓

3. Usuário pressiona Delete com shapeB selecionado:
   → deleteElement('shapeB')
   → store: shapeB removido
   → 1 filho restante (iconC) → desagrupar automaticamente
   → iconC.groupId = undefined, group-g1 removido
   → editingGroupId = null ✓

4. Usuário pressiona Escape (shapeB ainda existe):
   → exitGroup()
   → editingGroupId = null
   → selectedElementIds = ['group-g1']  ← volta ao grupo
   → RightPanel: GroupPropertiesPanel com bounds atualizados ✓
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Duplo clique em grupo → entra no modo de edição (`editingGroupId` ativo)
- [ ] Duplo clique em filho visível → entra no grupo e seleciona o filho diretamente
- [ ] Filho selecionado → bounding box com 8 handles visíveis
- [ ] Redimensionar filho → grupo atualiza bounds automaticamente
- [ ] Reposicionar filho → grupo atualiza bounds automaticamente
- [ ] Delete no filho → filho removido, grupo recalculado
- [ ] Delete no filho único → filho e grupo removidos
- [ ] Cmd+D no filho → duplicata criada dentro do mesmo grupo
- [ ] Escape → sai do grupo, grupo selecionado com bounds corretos
- [ ] Click fora do grupo → sai do grupo
- [ ] LayersPanel mostra filho selecionado com indentação correta
- [ ] Guides e snap funcionam para o filho em relação a elementos fora do grupo

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Modo de edição de grupo | `editingGroupId !== null` |
| Borda do grupo em edição | `1.5px dashed #5B4EFF` com `borderRadius: 4px` |
| Overlay elementos fora do grupo | `rgba(255,255,255,0.5)` |
| Badge "Editing group" | `bg-[#5B4EFF]` texto branco, bottom do canvas |
| Escape | sai do grupo → seleciona grupo pai |
| Click fora | sai do grupo → deseleciona |
| `updateElement` no filho | recalcula automaticamente o grupo pai |
| `deleteElement` no filho | recalcula grupo; se 0 filhos → remove grupo; se 1 filho → desagrupa |
| `Cmd+D` no filho | duplicata preserva `groupId` |