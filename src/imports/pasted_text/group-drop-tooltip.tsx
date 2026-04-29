Prompt direto e focado nessa melhoria:

---

## 🧱 PROMPT V61 — Design Workspace — Tooltip de drop no grupo de destino durante drag entre grupos

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

Quando o feedback de pulso aparece no grupo de destino (implementado no V59), um **tooltip pequeno** deve aparecer logo acima do grupo, indicando que o elemento pode ser solto ali. O tooltip aparece e desaparece junto com o pulso — mesmo estado, `dragTargetGroupId`.

---

### COMPONENTE: `GroupDropTooltip`

Renderizado dentro do `CanvasFrame`, posicionado acima do bounding box do grupo de destino:

```tsx
// GroupDropTooltip.tsx
export function GroupDropTooltip() {
  const { dragTargetGroupId, canvasElements } = useDesignWorkspaceStore()

  if (!dragTargetGroupId) return null

  const group = canvasElements.find(el => el.id === dragTargetGroupId)
  if (!group) return null

  return (
    <div
      className="absolute pointer-events-none z-[47]"
      style={{
        // Centralizado horizontalmente no bounding box do grupo
        left: group.x + group.width / 2,
        // Posicionado acima do grupo com um pequeno gap
        top:  group.y - 8,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div
        className="
          flex items-center gap-1.5
          bg-[#1f1d25] text-white
          text-[11px] font-medium
          px-2.5 py-1.5
          rounded-[6px]
          shadow-md
          whitespace-nowrap
          animate-tooltip-appear
        "
        style={{ fontFamily: "'Roboto', sans-serif", letterSpacing: '0.15px' }}
      >
        {/* Ícone de drop */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="shrink-0 opacity-80"
        >
          <path
            d="M6 1v7M6 8L3.5 5.5M6 8L8.5 5.5M1.5 10.5h9"
            stroke="white"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Drop to add to <span className="font-semibold ml-0.5">{group.name}</span>
      </div>

      {/* Seta apontando para baixo */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-[5px]"
        style={{
          width:  0,
          height: 0,
          borderLeft:  '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop:   '5px solid #1f1d25',
        }}
      />
    </div>
  )
}
```

---

### ANIMAÇÃO DE ENTRADA — `animate-tooltip-appear`

O tooltip deve aparecer com uma pequena animação de fade + slide para cima, para não ser abrupto:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        'tooltip-appear': {
          '0%': {
            opacity: '0',
            transform: 'translateY(4px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        // Animação de pulso do grupo (V59) — mantida
        'group-drop': {
          '0%, 100%': {
            boxShadow:       '0 0 0 2px #5B4EFF, inset 0 0 0 2px #5B4EFF',
            backgroundColor: 'rgba(91, 78, 255, 0.06)',
          },
          '50%': {
            boxShadow:       '0 0 0 3px #5B4EFF, 0 0 12px rgba(91,78,255,0.35), inset 0 0 0 2px #5B4EFF',
            backgroundColor: 'rgba(91, 78, 255, 0.12)',
          },
        },
      },
      animation: {
        'tooltip-appear': 'tooltip-appear 150ms ease-out forwards',
        'group-drop':     'group-drop 700ms ease-in-out infinite',
      },
    },
  },
}
```

---

### INTEGRAÇÃO — `CanvasFrame` renderiza o tooltip ao lado do pulso

```tsx
// CanvasFrame.tsx

<div ref={frameRef} ... style={{ width: 600, height: 600, overflow: 'visible' }}>

  {/* Camada 1: Elementos */}
  ...

  {/* Camada 2: Selection overlays */}
  ...

  {/* Camada 3: Group drop feedback — pulso + tooltip */}
  <GroupDropTargetOverlay />   {/* z-index: 46 — pulso animado */}
  <GroupDropTooltip />         {/* z-index: 47 — tooltip acima do pulso */}

  {/* Camadas 4-8: Guides, out-of-bounds, marquee, InteractionOverlay */}
  ...

</div>
```

---

### POSICIONAMENTO ADAPTATIVO — Tooltip não sai do canvas

Se o grupo de destino estiver muito próximo do topo do canvas (menos de 40px), o tooltip deve aparecer **abaixo** do grupo em vez de acima, para não ficar cortado:

```tsx
// GroupDropTooltip.tsx — posicionamento adaptativo

const TOOLTIP_HEIGHT    = 32   // px aproximado da altura do tooltip
const CANVAS_TOP_MARGIN = 40   // px — se o grupo estiver acima disso, inverte

const showBelow = group.y < CANVAS_TOP_MARGIN

return (
  <div
    className="absolute pointer-events-none z-[47]"
    style={{
      left: group.x + group.width / 2,
      top:  showBelow
        ? group.y + group.height + 8   // abaixo do grupo
        : group.y - 8,                 // acima do grupo (padrão)
      transform: showBelow
        ? 'translate(-50%, 0)'         // âncora no topo do tooltip
        : 'translate(-50%, -100%)',    // âncora na base do tooltip
    }}
  >
    {/* Tooltip */}
    <div className="flex items-center gap-1.5 bg-[#1f1d25] text-white text-[11px] font-medium px-2.5 py-1.5 rounded-[6px] shadow-md whitespace-nowrap animate-tooltip-appear">
      <DownloadIcon /> {/* ícone inline SVG */}
      Drop to add to <span className="font-semibold ml-0.5">{group.name}</span>
    </div>

    {/* Seta — aponta para o grupo */}
    <div
      className="absolute left-1/2 -translate-x-1/2"
      style={showBelow ? {
        // Seta acima do tooltip (aponta para cima = para o grupo abaixo)
        top:         -5,
        borderLeft:  '5px solid transparent',
        borderRight: '5px solid transparent',
        borderBottom: '5px solid #1f1d25',
        width: 0, height: 0,
      } : {
        // Seta abaixo do tooltip (aponta para baixo = para o grupo acima)
        bottom:      -5,
        borderLeft:  '5px solid transparent',
        borderRight: '5px solid transparent',
        borderTop:   '5px solid #1f1d25',
        width: 0, height: 0,
      }}
    />
  </div>
)
```

---

### DIAGRAMA — Visual completo durante drag entre grupos

```
┌──────────────────────────────────────────────┐
│                                              │
│  ┌──────────────┐                            │
│  │  Group A     │   ← grupo de origem        │
│  │  (sem pulso) │                            │
│  └──────────────┘                            │
│                                              │
│         ┌─────────────────────────┐          │
│         │  Drop to add to Group B │  ← tooltip
│         └───────────┬─────────────┘          │
│                     ↓ seta                   │
│  ┌· · · · · · · · · · · · · · · ·┐          │
│  ·  Group B  ←  pulso roxo       ·          │
│  ·  (borda piscando + fundo suave)·          │
│  └· · · · · · · · · · · · · · · ·┘          │
│                                              │
│                    [ShapeB]  ← sendo arrastado│
└──────────────────────────────────────────────┘
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Elemento arrastado entra em grupo de destino → tooltip aparece com animação suave
- [ ] Tooltip exibe "Drop to add to [nome do grupo]" com o nome correto
- [ ] Tooltip e pulso aparecem e desaparecem juntos (mesmo trigger: `dragTargetGroupId`)
- [ ] Tooltip posicionado centralizado horizontalmente no bounding box do grupo
- [ ] Tooltip aparece acima por padrão, abaixo se o grupo estiver no topo do canvas
- [ ] Seta do tooltip aponta sempre em direção ao grupo de destino
- [ ] Elemento sai da área do grupo → tooltip some imediatamente
- [ ] Elemento solto → tooltip some, reparentamento acontece
- [ ] Nome do grupo no tooltip é o nome atual da layer (reativo a renomeações)
- [ ] `pointer-events: none` — tooltip nunca interfere com o drag

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Tooltip background | `#1f1d25` (quase preto — padrão de tooltips do sistema) |
| Tooltip text color | `#FFFFFF` |
| Tooltip font | Roboto Medium 11px tracking 0.15px |
| Tooltip padding | `px-2.5 py-1.5` |
| Tooltip border-radius | `6px` |
| Tooltip shadow | `shadow-md` |
| Tooltip gap do grupo | `8px` acima (ou abaixo, se adaptativo) |
| Seta tamanho | `5px` bordas |
| Seta cor | `#1f1d25` — mesma do tooltip |
| Animação de entrada | `150ms ease-out` fade + `translateY(4px → 0)` |
| z-index tooltip | `47` — acima do pulso (`46`), abaixo do InteractionOverlay (`50`) |
| `pointer-events` | `none` |
| Nome do grupo | `group.name` — reativo via store |