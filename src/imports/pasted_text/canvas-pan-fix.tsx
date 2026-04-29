Prompt direto e focado apenas nessa correção:

---

## 🧱 PROMPT V35 — Design Workspace — Separação de responsabilidade: pan no canvas cinza, interação no canvas branco

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

O `onMouseDown` do pan (arrastar o canvas cinza) está sendo capturado também quando o usuário clica dentro do `CanvasFrame` (área branca). Isso faz o canvas branco arrastar junto ao tentar selecionar ou marcar elementos com marquee.

---

### REGRA DEFINITIVA — Responsabilidade de cada camada

| Área | Responsabilidade | Comportamento no mouse |
|---|---|---|
| **Canvas cinza** (`CanvasInfiniteArea`) | Pan — mover a visão | `onMouseDown` → inicia pan |
| **Canvas branco** (`CanvasFrame`) | Seleção, marquee, interação com elementos | `onMouseDown` → **NÃO pan** |

O `CanvasFrame` deve **sempre parar a propagação** do `mousedown` para o `CanvasInfiniteArea`, impedindo que qualquer interação dentro da área branca acione o pan.

---

### IMPLEMENTAÇÃO

#### `CanvasInfiniteArea` — pan apenas na área cinza

```tsx
// CanvasInfiniteArea.tsx
export function CanvasInfiniteArea() {
  const { canvasOffset, setCanvasOffset, canvasScale } = useDesignWorkspaceStore()
  const { handleBackgroundClick } = useCanvasBackground()

  function handlePanStart(e: React.MouseEvent) {
    // ── Pan só acontece se o mousedown foi diretamente neste container ──────
    // Se o evento veio de um filho (CanvasFrame ou qualquer elemento interno),
    // e.target !== e.currentTarget e o pan NÃO deve iniciar
    if (e.target !== e.currentTarget) return

    // Apenas botão esquerdo do mouse
    if (e.button !== 0) return

    const startX = e.clientX - canvasOffset.x
    const startY = e.clientY - canvasOffset.y

    function onMouseMove(ev: MouseEvent) {
      setCanvasOffset({
        x: ev.clientX - startX,
        y: ev.clientY - startY,
      })
    }

    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ cursor: 'grab' }}
      onMouseDown={handlePanStart}   // ← pan SOMENTE se target === currentTarget
      onClick={handleBackgroundClick} // ← fecha painéis ao clicar no cinza
    >
      {/* Canvas branco — posicionado com transform */}
      <div
        style={{
          position: 'absolute',
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
          transformOrigin: '0 0',
        }}
      >
        <CanvasFrame />
      </div>
    </div>
  )
}
```

---

#### `CanvasFrame` — bloqueia propagação do mousedown para o pan

```tsx
// CanvasFrame.tsx
export function CanvasFrame() {
  const { canvasElements, selectedElementIds, clearSelection } = useDesignWorkspaceStore()

  function handleFrameMouseDown(e: React.MouseEvent) {
    // ✅ CRÍTICO — impede que o mousedown chegue ao CanvasInfiniteArea
    // Sem isso, qualquer clique dentro do frame branco inicia o pan
    e.stopPropagation()
  }

  function handleFrameClick(e: React.MouseEvent) {
    // Clique na área branca vazia → deseleciona tudo
    if (e.target === e.currentTarget) {
      clearSelection()
    }
  }

  return (
    <div
      className="relative bg-white shadow-xl overflow-hidden select-none"
      style={{ width: 600, height: 600, cursor: 'default' }}
      onMouseDown={handleFrameMouseDown}  // ✅ stopPropagation — bloqueia pan
      onClick={handleFrameClick}          // deseleciona ao clicar na área vazia
    >
      {canvasElements.map((element, index) => (
        <CanvasElementRenderer
          key={element.id}
          element={element}
          zIndex={index}
          isSelected={selectedElementIds.includes(element.id)}
          isMultiSelected={selectedElementIds.length > 1 && selectedElementIds.includes(element.id)}
        />
      ))}

      <MarqueeSelection />
    </div>
  )
}
```

---

#### `CanvasElementRenderer` — também para propagação

Os elementos individuais já chamam `e.stopPropagation()` no `onMouseDown`, mas é importante confirmar que isso está presente para que o clique em um elemento não acione nem o marquee do `CanvasFrame` nem o pan do `CanvasInfiniteArea`:

```tsx
// CanvasElementRenderer.tsx
function handleMouseDown(e: React.MouseEvent) {
  e.stopPropagation() // ✅ não propaga para CanvasFrame nem CanvasInfiniteArea

  if (e.shiftKey) {
    toggleElementSelection(element.id)
  } else {
    selectElement(element.id)
    startDrag(e)
  }
}
```

---

### CADEIA DE PROPAGAÇÃO — Antes e depois

**❌ Antes (problemático):**
```
Usuário clica dentro do CanvasFrame
  → mousedown no CanvasFrame
  → propaga para CanvasInfiniteArea
  → pan inicia → canvas branco arrasta junto
```

**✅ Depois (correto):**
```
Usuário clica dentro do CanvasFrame
  → mousedown no CanvasFrame → e.stopPropagation()
  → CanvasInfiniteArea NÃO recebe o evento
  → pan NÃO inicia → canvas branco fica estático

Usuário clica na área cinza (fora do CanvasFrame)
  → mousedown no CanvasInfiniteArea
  → e.target === e.currentTarget → pan inicia normalmente
  → canvas branco se move junto (correto — é o comportamento esperado)
```

---

### CURSOR — Feedback visual correto por área

```tsx
// CanvasInfiniteArea — cursor indica que pode arrastar
style={{ cursor: isDragging ? 'grabbing' : 'grab' }}

// CanvasFrame — cursor default (seta), indica área de trabalho
style={{ cursor: 'default' }}

// CanvasElementRenderer — cursor indica drag do elemento
style={{ cursor: isDragging ? 'grabbing' : 'grab' }}

// Handles de resize — cursor direcional
style={{ cursor: HANDLE_CURSORS[handle] }}
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Arrastar na **área cinza** → canvas branco se move (pan funciona)
- [ ] Arrastar **dentro do canvas branco** (área vazia) → marquee aparece, canvas NÃO se move
- [ ] Arrastar **um elemento** no canvas branco → elemento se move, canvas NÃO se move
- [ ] Arrastar **handle de resize** → elemento redimensiona, canvas NÃO se move
- [ ] Clicar na **área cinza** → painéis fecham (já implementado no V20)
- [ ] Clicar na **área branca vazia** → deseleciona elementos, painéis NÃO fecham
- [ ] Cursor `grab` na área cinza, `default` na área branca

---

### TOKENS DE DESIGN — REFERÊNCIA

| Área | Cursor | `onMouseDown` |
|---|---|---|
| `CanvasInfiniteArea` (cinza) | `grab` / `grabbing` | inicia pan **se** `target === currentTarget` |
| `CanvasFrame` (branco) | `default` | `stopPropagation()` — nunca pan |
| Elemento no canvas | `grab` / `grabbing` | `stopPropagation()` + drag do elemento |
| Handle de resize | cursor direcional | `stopPropagation()` + resize |
| Marquee (selection box) | — | iniciado pelo `CanvasFrame` na área vazia |