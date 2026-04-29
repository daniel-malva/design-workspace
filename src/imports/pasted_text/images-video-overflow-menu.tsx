Tenho todos os detalhes visuais e estruturais do componente. Aqui está o prompt:

---

## 🧱 PROMPT V21 — Design Workspace — Images/Video: Overflow Menu de seleção de fonte

---

### STACK & BOAS PRÁTICAS

```
Stack: React + TypeScript + Tailwind CSS + shadcn/ui components
Boas práticas:
- Componentes reutilizáveis nomeados semanticamente por função
- TypeScript com interfaces e tipos explícitos para todas as props
- Tailwind para estilização, sem CSS inline ou arquivos .css separados
- shadcn/ui para elementos de UI base
- Estado global via Zustand (useDesignWorkspaceStore)
```

---

### CONTEXTO — Quando o menu aparece

Quando o usuário está no `InsertMenuPanel` (Nível 1 do Insert) e clica em **"Images / Video"**, em vez de navegar para um sub-painel como os outros itens, deve ser exibido um **overflow menu flutuante** (dropdown) ancorado ao item "Images / Video" no `InsertMenuPanel`.

Clicar fora do menu — em qualquer área da interface — deve fechá-lo imediatamente.

Os fluxos de "Portal" e "Upload" serão implementados futuramente. Por ora, os itens do menu são apenas exibidos sem ação.

---

### COMPONENTE: `ImagesVideoOverflowMenu`

O menu é um pequeno popover flutuante com duas opções, fiel ao design do Figma:

```tsx
// ImagesVideoOverflowMenu.tsx
export function ImagesVideoOverflowMenu({
  isOpen,
  anchorRef,
  onClose,
}: {
  isOpen: boolean
  anchorRef: React.RefObject<HTMLElement>
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora do menu
  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    // Pequeno delay para não fechar imediatamente ao abrir
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, anchorRef])

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className="
        absolute z-50
        w-[220px] bg-white
        rounded-[4px] py-2
        shadow-[0px_3px_14px_2px_rgba(0,0,0,0.12),_0px_8px_10px_1px_rgba(0,0,0,0.14),_0px_5px_5px_-3px_rgba(0,0,0,0.20)]
        overflow-hidden
      "
      // Posicionado à direita do LeftPane, ancorado ao item Images/Video
      style={{
        top: anchorRef.current
          ? anchorRef.current.getBoundingClientRect().top + window.scrollY
          : 0,
        left: anchorRef.current
          ? anchorRef.current.getBoundingClientRect().right + 8
          : 0,
      }}
      onClick={(e) => e.stopPropagation()} // não propaga para o fundo do canvas
    >
      {/* Opção: Portal */}
      <ImagesVideoMenuItem
        icon={<PortalIcon />}
        label="Portal"
        onClick={() => {
          // fluxo futuro
          onClose()
        }}
      />

      {/* Opção: Upload */}
      <ImagesVideoMenuItem
        icon={<UploadIcon />}
        label="Upload"
        onClick={() => {
          // fluxo futuro
          onClose()
        }}
      />
    </div>
  )
}
```

---

### COMPONENTE: `ImagesVideoMenuItem`

Linha individual do menu, fiel ao design do Figma:

```tsx
// ImagesVideoMenuItem.tsx
interface ImagesVideoMenuItemProps {
  icon: ReactNode
  label: string
  onClick: () => void
}

export function ImagesVideoMenuItem({ icon, label, onClick }: ImagesVideoMenuItemProps) {
  return (
    <button
      className="
        w-full flex items-center gap-0
        px-4 py-[6px]
        hover:bg-gray-100
        transition-colors duration-100
        cursor-pointer
      "
      onClick={onClick}
    >
      {/* Ícone — slot esquerdo com min-width de 36px */}
      <div className="flex items-center justify-start min-w-[36px] shrink-0">
        <div className="w-6 h-6 flex items-center justify-center text-[#1f1d25]">
          {icon}
        </div>
      </div>

      {/* Label */}
      <span
        className="text-[14px] text-[#1f1d25] whitespace-nowrap"
        style={{
          fontFamily: "'Roboto', sans-serif",
          fontWeight: 400,
          lineHeight: 1.5,
          letterSpacing: '0.15px',
        }}
      >
        {label}
      </span>
    </button>
  )
}
```

---

### ÍCONES — Fiéis ao Figma

```tsx
// PortalIcon — ícone de galeria/albums (dois retângulos sobrepostos)
function PortalIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="13" height="10" rx="1" stroke="#1f1d25" strokeWidth="1.5" />
      <rect x="8" y="4" width="13" height="10" rx="1" fill="white" stroke="#1f1d25" strokeWidth="1.5" />
    </svg>
  )
}

// UploadIcon — seta para cima com bandeja
function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 4L12 15M12 4L8.5 7.5M12 4L15.5 7.5" stroke="#1f1d25" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17V19C4 19.5523 4.44772 20 5 20H19C19.5523 20 20 19.5523 20 19V17" stroke="#1f1d25" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
```

---

### INTEGRAÇÃO — No `InsertMenuPanel`

O item "Images / Video" no menu principal do Insert deve gerenciar o estado de abertura do menu e expor uma ref para ancoragem:

```tsx
// InsertMenuPanel.tsx
export function InsertMenuPanel() {
  const { setActiveInsertItem } = useDesignWorkspaceStore()
  const [imagesMenuOpen, setImagesMenuOpen] = useState(false)
  const imagesItemRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="flex flex-col py-1 relative">

      {/* Text */}
      <InsertMenuItem
        icon={<Type size={16} />}
        label="Text"
        shortcut="T"
        onClick={() => setActiveInsertItem('text')}
      />

      {/* Dynamic Placeholder */}
      <InsertMenuItem
        icon={<Braces size={16} />}
        label="Dynamic Placeholder"
        shortcut="M"
        onClick={() => setActiveInsertItem('dynamicPlaceholder')}
      />

      {/* Images / Video — abre overflow menu em vez de sub-painel */}
      <InsertMenuItem
        ref={imagesItemRef}
        icon={<Image size={16} />}
        label="Images / Video"
        shortcut="U"
        onClick={() => setImagesMenuOpen(prev => !prev)}
      />

      {/* Overflow Menu — renderizado fora do fluxo normal para não ser cortado */}
      <ImagesVideoOverflowMenu
        isOpen={imagesMenuOpen}
        anchorRef={imagesItemRef}
        onClose={() => setImagesMenuOpen(false)}
      />

      {/* Component */}
      <InsertMenuItem ... onClick={() => setActiveInsertItem('component')} />

      {/* Annotation */}
      <InsertMenuItem ... onClick={() => setActiveInsertItem('annotation')} />

      {/* Shapes */}
      <InsertMenuItem ... onClick={() => setActiveInsertItem('shapes')} />

      {/* Icons */}
      <InsertMenuItem ... onClick={() => setActiveInsertItem('icons')} />

      {/* Audio */}
      <InsertMenuItem ... onClick={() => setActiveInsertItem('audio')} />

      {/* AI Voice */}
      <InsertMenuItem ... onClick={() => setActiveInsertItem('aiVoice')} />

    </div>
  )
}
```

> **Importante:** o `ImagesVideoOverflowMenu` deve ser renderizado via `createPortal` para o `document.body`, garantindo que não seja cortado pelo `overflow: hidden` do `LeftPane`:

```tsx
// ImagesVideoOverflowMenu.tsx — usando createPortal
import { createPortal } from 'react-dom'

export function ImagesVideoOverflowMenu({ isOpen, anchorRef, onClose }) {
  if (!isOpen) return null

  return createPortal(
    <div ref={menuRef} className="fixed z-[9999] w-[220px] bg-white rounded-[4px] py-2 shadow-[...]"
      style={{
        top:  anchorRef.current?.getBoundingClientRect().top ?? 0,
        left: (anchorRef.current?.getBoundingClientRect().right ?? 0) + 8,
      }}
    >
      <ImagesVideoMenuItem icon={<PortalIcon />}  label="Portal"  onClick={onClose} />
      <ImagesVideoMenuItem icon={<UploadIcon />}  label="Upload"  onClick={onClose} />
    </div>,
    document.body
  )
}
```

---

### DIAGRAMA DO FLUXO

```
Usuário clica em "Images / Video" no InsertMenuPanel
        ↓
imagesMenuOpen = true
        ↓
ImagesVideoOverflowMenu renderizado via createPortal no document.body
Posicionado à direita do item, alinhado ao topo dele
        ↓
Usuário clica fora do menu (canvas, outro painel, qualquer área)
        ↓
handleClickOutside dispara → onClose() → imagesMenuOpen = false
        ↓
Menu some da interface
```

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Menu background | `#FFFFFF` |
| Menu border-radius | `4px` — `rounded-[4px]` |
| Menu shadow | `0px 3px 14px 2px rgba(0,0,0,0.12), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 5px 5px -3px rgba(0,0,0,0.20)` |
| Menu width | `220px` |
| Menu padding vertical | `py-2` = `8px` |
| Item padding | `px-4 py-[6px]` |
| Item icon slot min-width | `36px` |
| Item font | Roboto Regular 14px, `letterSpacing: 0.15px`, `lineHeight: 1.5` |
| Item text color | `#1f1d25` |
| Item hover background | `bg-gray-100` |
| Ancoragem | `fixed` via `createPortal` → `document.body` |
| z-index | `9999` — acima de tudo |
| Offset horizontal do anchor | `+8px` à direita do item |
| Fechar ao clicar fora | `mousedown` no `document` com verificação de `contains` |