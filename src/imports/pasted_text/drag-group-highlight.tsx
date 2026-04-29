Prompt direto e focado nessa melhoria de feedback visual:

---

## 🧱 PROMPT V59 — Design Workspace — Drag entre grupos: feedback visual pulsante no grupo de destino

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

Quando um elemento filho de um grupo está sendo arrastado pelo canvas e entra na área de bounding box de outro grupo, esse **grupo de destino deve piscar** — comunicando visualmente que ele é uma zona válida de drop. O feedback para assim que o elemento sai da área ou é solto.

| Estado | Visual do grupo de destino |
|---|---|
| Elemento arrastado fora de qualquer grupo | Nenhum highlight |
| Elemento arrastado entra no bounding box de um grupo | Grupo **pulsa** com borda animada + fundo levemente colorido |
| Elemento solto dentro do grupo | Animação para, reparentamento acontece |
| Elemento sai da área sem soltar | Animação para |

---

### STORE — Estado de drag target

```tsx
// store/useDesignWorkspaceStore.ts

interface DesignWorkspaceState {
  // ...existentes...
  dragTargetGroupId: string | null   // ID do grupo que está destacado como destino de drop
}

interface DesignWorkspaceActions {
  setDragTargetGroupId: (id: string | null) => void
}

setDragTargetGroupId: (id) => set(() => ({ dragTargetGroupId: id })),
```

---

### `InteractionOverlay` — detectar grupo de destino durante drag

Durante o `mousemove` do drag, calcular se o elemento está sobre um grupo válido de destino e atualizar `dragTargetGroupId`:

```tsx
// InteractionOverlay.tsx — onMouseMove do startElementDrag

function onMouseMove(ev: MouseEvent) {
  const dx = ev.clientX - rect.left - startMouseX
  const dy = ev.clientY - rect.top  - startMouseY

  if (!dragging && Math.hypot(dx, dy) > 3) dragging = true
  if (!dragging) return

  const rawX = startElX + dx
  const rawY = startElY + dy

  // Centro do elemento sendo arrastado
  const elCenterX = rawX + element.width  / 2
  const elCenterY = rawY + element.height / 2

  // Detectar grupo de destino válido:
  // - Deve ser do tipo 'group'
  // - Deve ser diferente do grupo de origem do elemento
  // - O centro do elemento deve estar dentro do bounding box do grupo
  const { canvasElements, setDragTargetGroupId } = useDesignWorkspaceStore.getState()

  const targetGroup = [...canvasElements]
    .reverse()  // grupos do topo primeiro
    .find(el =>
      el.type === 'group' &&
      el.id !== element.groupId &&          // não o grupo de origem
      el.id !== element.id &&               // não o próprio elemento
      elCenterX >= el.x &&
      elCenterX <= el.x + el.width &&
      elCenterY >= el.y &&
      elCenterY <= el.y + el.height
    )

  // Atualizar o grupo de destino — null se não há grupo alvo
  setDragTargetGroupId(targetGroup?.id ?? null)

  // ...resto do drag (guides, updateElement, etc.)...
}

function onMouseUp(ev: MouseEvent) {
  // Limpar o highlight SEMPRE ao soltar
  useDesignWorkspaceStore.getState().setDragTargetGroupId(null)

  // ...resto do onMouseUp (reparentamento, commitHistory, etc.)...
}
```

---

### COMPONENTE: `GroupDropTargetOverlay`

Renderizado dentro do `CanvasFrame`, exibe o feedback visual pulsante sobre o grupo de destino:

```tsx
// GroupDropTargetOverlay.tsx
export function GroupDropTargetOverlay() {
  const { dragTargetGroupId, canvasElements } = useDesignWorkspaceStore()

  if (!dragTargetGroupId) return null

  const group = canvasElements.find(el => el.id === dragTargetGroupId)
  if (!group) return null

  return (
    <div
      className="absolute pointer-events-none rounded-[4px] z-[46]"
      style={{
        left:   group.x   - 3,
        top:    group.y   - 3,
        width:  group.width  + 6,
        height: group.height + 6,
      }}
    >
      {/* Borda pulsante — animação CSS keyframe */}
      <div className="absolute inset-0 rounded-[4px] group-drop-pulse" />
    </div>
  )
}
```

---

### CSS — Animação de pulso

A animação alterna entre uma borda sólida roxa e um estado com fundo levemente colorido, criando o efeito de "piscar" que indica zona de drop válida:

```tsx
// Adicionar ao arquivo global de CSS ou como <style> injetado no componente raiz

const groupDropPulseCSS = `
  @keyframes group-drop-pulse {
    0%, 100% {
      box-shadow:
        0 0 0 2px #5B4EFF,
        inset 0 0 0 2px #5B4EFF;
      background-color: rgba(91, 78, 255, 0.06);
    }
    50% {
      box-shadow:
        0 0 0 3px #5B4EFF,
        0 0 12px rgba(91, 78, 255, 0.35),
        inset 0 0 0 2px #5B4EFF;
      background-color: rgba(91, 78, 255, 0.12);
    }
  }

  .group-drop-pulse {
    animation: group-drop-pulse 700ms ease-in-out infinite;
    border-radius: 4px;
  }
`

// Injetar no head ou usar styled-jsx / CSS module
// Alternativa com Tailwind: usar animação customizada no tailwind.config.js
```

**Alternativa com Tailwind `tailwind.config.js`:**

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        'group-drop': {
          '0%, 100%': {
            boxShadow: '0 0 0 2px #5B4EFF, inset 0 0 0 2px #5B4EFF',
            backgroundColor: 'rgba(91, 78, 255, 0.06)',
          },
          '50%': {
            boxShadow: '0 0 0 3px #5B4EFF, 0 0 12px rgba(91,78,255,0.35), inset 0 0 0 2px #5B4EFF',
            backgroundColor: 'rgba(91, 78, 255, 0.12)',
          },
        },
      },
      animation: {
        'group-drop': 'group-drop 700ms ease-in-out infinite',
      },
    },
  },
}

// Uso no componente:
<div className="absolute inset-0 rounded-[4px] animate-group-drop" />
```

---

### INTEGRAÇÃO — `CanvasFrame` renderiza o overlay

```tsx
// CanvasFrame.tsx — adicionar o overlay de drop target

<div ref={frameRef} className="relative bg-white shadow-xl select-none" style={{ width: 600, height: 600, overflow: 'visible' }}>

  {/* Camada 1: Elementos */}
  <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 1 }}>
    {orderedElements.map((element, index) => (
      <CanvasElementView key={element.id} ... />
    ))}
  </div>

  {/* Camada 2: Selection overlays */}
  ...

  {/* Camada 3: Group drop target highlight — pulsa durante drag entre grupos */}
  <GroupDropTargetOverlay />  {/* z-index: 46 — acima dos elementos, abaixo do InteractionOverlay */}

  {/* Camada 4: Alignment guides */}
  <AlignmentGuidesOverlay ... />

  {/* Camada 5: Resize guides */}
  <ResizeGuidesOverlay ... />

  {/* Camada 6: Out-of-bounds overlay */}
  <CanvasOutOfBoundsOverlay ... />

  {/* Camada 7: Marquee */}
  {marquee && <MarqueeVisual ... />}

  {/* Camada 8: InteractionOverlay */}
  <InteractionOverlay ... />

</div>
```

---

### COMPORTAMENTO COMPLETO DO FEEDBACK

```
Estado inicial:
  dragTargetGroupId = null
  → Nenhum highlight no canvas

Usuário inicia drag de ShapeB (filho de Group A):
  → dragging = true
  → ShapeB se move com o cursor
  → dragTargetGroupId ainda = null → sem highlight

ShapeB cruza a borda de Group B:
  → elCenterX e elCenterY entram no bounding box de Group B
  → setDragTargetGroupId('groupB-id')
  → GroupDropTargetOverlay renderiza sobre Group B
  → Animação de pulso inicia: borda roxa + fundo levemente roxo piscando ✓

ShapeB sai da área de Group B (sem soltar):
  → elCenter sai do bounding box
  → setDragTargetGroupId(null)
  → GroupDropTargetOverlay some, animação para ✓

ShapeB retorna para Group B e usuário solta:
  → dragTargetGroupId = 'groupB-id' no momento do mouseup
  → setDragTargetGroupId(null) → highlight some
  → reparentElement('shapeB', 'groupB-id') → ShapeB entra no Group B ✓
```

---

### MESMA LÓGICA NO DRAG DO LAYERS PANEL

Para consistência, o feedback também deve aparecer no `CanvasFrame` durante o drag no `LayersPanel`:

```tsx
// LayersPanel.tsx — ao arrastar sobre um grupo (zona "inside"):

onDragOver={(id, zone) => {
  setDragState(s => s ? { ...s, overId: id, overZone: zone } : null)

  // Atualizar highlight no canvas também
  const target = canvasElements.find(el => el.id === id)
  if (zone === 'inside' && target?.type === 'group') {
    useDesignWorkspaceStore.getState().setDragTargetGroupId(id)
  } else {
    useDesignWorkspaceStore.getState().setDragTargetGroupId(null)
  }
}}

onDragEnd={() => {
  setDragState(null)
  useDesignWorkspaceStore.getState().setDragTargetGroupId(null) // limpar sempre
}}
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Arrastar filho de grupo sobre outro grupo → borda roxa pulsante aparece no grupo de destino
- [ ] Elemento sai da área do grupo → pulso para imediatamente
- [ ] Elemento solto no grupo → pulso para, reparentamento acontece
- [ ] Elemento solto fora do grupo → pulso para, elemento fica solto
- [ ] Arrastar via LayersPanel sobre grupo → mesmo pulso aparece no canvas
- [ ] `dragTargetGroupId` limpo no `mouseup` sem falha (mesmo sem drop)
- [ ] Pulso NÃO aparece sobre o grupo de origem do elemento sendo arrastado
- [ ] Pulso NÃO aparece sobre elementos que não são grupos
- [ ] Animação suave — `700ms ease-in-out infinite`

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Cor do pulso | `#5B4EFF` (roxo — mesma cor do accent) |
| Borda do pulso (repouso) | `2px solid #5B4EFF` |
| Borda do pulso (pico) | `3px solid #5B4EFF` + `box-shadow` roxo externo |
| Fundo do pulso (repouso) | `rgba(91, 78, 255, 0.06)` |
| Fundo do pulso (pico) | `rgba(91, 78, 255, 0.12)` |
| Duração do ciclo | `700ms` |
| Easing | `ease-in-out` |
| Iteração | `infinite` — enquanto o elemento estiver na área |
| Offset do overlay em relação ao grupo | `-3px` em todos os lados |
| Border-radius do overlay | `4px` |
| z-index do overlay | `46` — acima dos elementos, abaixo dos overlays de seleção |
| `pointer-events` | `none` — nunca bloqueia interação |