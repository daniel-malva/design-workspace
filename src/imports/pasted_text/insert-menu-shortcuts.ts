Prompt direto e focado apenas nessa funcionalidade:

---

## 🧱 PROMPT V23 — Design Workspace — Atalhos de teclado do Insert Menu

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

### REGRA PRINCIPAL

Os atalhos de teclado do Insert Menu devem funcionar **globalmente** na aplicação — ou seja, quando o foco não estiver em nenhum campo de texto (`input`, `textarea`, `contenteditable`). Ao pressionar a tecla correspondente, dois comportamentos acontecem simultaneamente:

1. O `LeftPane` abre com o painel Insert ativo (`activePanel = 'insert'`)
2. O sub-painel correspondente é exibido diretamente (`activeInsertItem = 'text'`, por exemplo)

---

### MAPEAMENTO COMPLETO — Tecla → Item

Extraído diretamente do Figma:

| Tecla | Item | `activeInsertItem` |
|---|---|---|
| `T` | Text | `'text'` |
| `M` | Dynamic Placeholder | `'dynamicPlaceholder'` |
| `U` | Images / Video | `'imagesVideo'` |
| `C` | Component | `'component'` |
| `A` | Annotation | `'annotation'` |
| `H` | Shapes | `'shapes'` |
| `I` | Icons | `'icons'` |
| `Shift + A` | Audio | `'audio'` |
| `Cmd/Ctrl + V` | AI Voice | `'aiVoice'` |

> **Atenção:** `Cmd/Ctrl + V` é normalmente o atalho de colar — **não interceptar** esse atalho para AI Voice se houver elementos no clipboard. Apenas disparar AI Voice se o `ctrlKey`/`metaKey` + `V` for pressionado **e** o canvas estiver em foco (nenhum input ativo). Como regra de segurança, pode-se optar por não implementar esse atalho específico por ora para evitar conflito com o paste nativo.

---

### IMPLEMENTAÇÃO — Hook `useInsertMenuShortcuts`

Centralizar toda a lógica de atalhos em um único hook, montado uma vez no componente raiz da aplicação:

```tsx
// hooks/useInsertMenuShortcuts.ts
import { useEffect } from 'react'
import { useDesignWorkspaceStore } from '@/store/useDesignWorkspaceStore'
import type { InsertMenuItem } from '@/types'

// Mapeamento de tecla simples → item
const KEY_MAP: Record<string, InsertMenuItem> = {
  t: 'text',
  m: 'dynamicPlaceholder',
  u: 'imagesVideo',
  c: 'component',
  a: 'annotation',
  h: 'shapes',
  i: 'icons',
}

// Tecla com Shift → item
const SHIFT_KEY_MAP: Record<string, InsertMenuItem> = {
  a: 'audio',  // Shift + A
}

export function useInsertMenuShortcuts() {
  const { setActivePanel, setActiveInsertItem, activePanel } = useDesignWorkspaceStore()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // ── Ignorar se o foco está em um campo de texto ──────────────────────
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      const isEditable = (e.target as HTMLElement)?.isContentEditable
      if (tag === 'input' || tag === 'textarea' || isEditable) return

      // ── Ignorar se modificadores indesejados estão ativos ────────────────
      // (exceto Shift, que é usado para Audio)
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const key = e.key.toLowerCase()

      // ── Shift + tecla ────────────────────────────────────────────────────
      if (e.shiftKey) {
        const item = SHIFT_KEY_MAP[key]
        if (item) {
          e.preventDefault()
          setActivePanel('insert')
          setActiveInsertItem(item)
        }
        return
      }

      // ── Tecla simples ────────────────────────────────────────────────────
      const item = KEY_MAP[key]
      if (item) {
        e.preventDefault()

        // Se "Images / Video", abre o Insert Menu mas não vai para sub-painel
        // (exibe o overflow menu — comportamento especial tratado no InsertMenuPanel)
        if (item === 'imagesVideo') {
          setActivePanel('insert')
          setActiveInsertItem(null)          // volta para o nível 1
          // O InsertMenuPanel vai disparar o overflow menu ao detectar
          // que o atalho 'U' foi pressionado — via triggerImagesVideoMenu flag
          useDesignWorkspaceStore.getState().triggerImagesVideoMenu()
          return
        }

        setActivePanel('insert')
        setActiveInsertItem(item)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setActivePanel, setActiveInsertItem])
}
```

---

### STORE — Adições necessárias

```tsx
// store/useDesignWorkspaceStore.ts

interface DesignWorkspaceState {
  // ...existentes...
  activePanel: LeftRailItem | null
  activeInsertItem: InsertMenuItem | null

  // Flag para disparar o overflow menu de Images/Video via atalho U
  imagesVideoMenuTrigger: number  // incrementado a cada disparo — componente observa mudanças
}

interface DesignWorkspaceActions {
  // ...existentes...
  setActiveInsertItem: (item: InsertMenuItem | null) => void
  triggerImagesVideoMenu: () => void
}

// Implementação
setActiveInsertItem: (item) => set(() => ({ activeInsertItem: item })),

triggerImagesVideoMenu: () => set(state => ({
  imagesVideoMenuTrigger: state.imagesVideoMenuTrigger + 1
})),
```

---

### INTEGRAÇÃO — Montagem do hook na raiz

```tsx
// DesignWorkspace.tsx (componente raiz)
export function DesignWorkspace() {
  useInsertMenuShortcuts() // ← montado uma única vez, escuta eventos globalmente

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#E8E8E8]">
      <LeftRail />
      <CanvasArea />
    </div>
  )
}
```

---

### INTEGRAÇÃO — `InsertMenuPanel` reage ao trigger de Images/Video

```tsx
// InsertMenuPanel.tsx
export function InsertMenuPanel() {
  const { setActiveInsertItem, imagesVideoMenuTrigger } = useDesignWorkspaceStore()
  const [imagesMenuOpen, setImagesMenuOpen] = useState(false)
  const imagesItemRef = useRef<HTMLButtonElement>(null)

  // Abre o overflow menu quando o atalho U é pressionado
  useEffect(() => {
    if (imagesVideoMenuTrigger > 0) {
      setImagesMenuOpen(true)
    }
  }, [imagesVideoMenuTrigger])

  // ...resto do componente
}
```

---

### FEEDBACK VISUAL — Indicador de atalho ativo

O item do Insert Menu que foi ativado via atalho deve receber o mesmo estado visual de hover/ativo que receberia com um clique:

```tsx
// InsertMenuItem.tsx
export function InsertMenuItem({ label, shortcut, isActive, onClick, ...props }) {
  return (
    <button
      className={`
        w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
        ${isActive
          ? 'bg-[#5B4EFF14] text-[#473bab]'   // ativo via clique ou atalho
          : 'text-[#1f1d25] hover:bg-gray-100'
        }
      `}
      onClick={onClick}
      {...props}
    >
      {/* ícone */}
      <span className="flex-1 text-left">{label}</span>
      {/* shortcut badge */}
      {shortcut && (
        <span className="text-xs text-gray-400 shrink-0 font-mono">{shortcut}</span>
      )}
    </button>
  )
}
```

---

### TABELA COMPLETA DE ATALHOS — referência final

| Atalho | Item | Comportamento |
|---|---|---|
| `T` | Text | Abre Insert → sub-painel Text |
| `M` | Dynamic Placeholder | Abre Insert → sub-painel Dynamic Placeholder |
| `U` | Images / Video | Abre Insert → exibe overflow menu (Portal / Upload) |
| `C` | Component | Abre Insert → sub-painel Component |
| `A` | Annotation | Abre Insert → sub-painel Annotation |
| `H` | Shapes | Abre Insert → sub-painel Shapes |
| `I` | Icons | Abre Insert → sub-painel Icons |
| `Shift + A` | Audio | Abre Insert → sub-painel Audio |
| `Cmd/Ctrl + V` | AI Voice | ⚠️ Não implementar — conflito com paste nativo |
| `Delete` / `Backspace` | — | Deleta elemento selecionado (já implementado no V17) |
| `Esc` | — | Fecha sub-painel ativo (retorna ao nível 1 do Insert) |

---

### ATALHO ADICIONAL — `Escape` fecha o sub-painel

```tsx
// Adicionar ao KEY_MAP especial dentro do useInsertMenuShortcuts
if (e.key === 'Escape') {
  // Se há sub-painel aberto → volta ao nível 1
  if (useDesignWorkspaceStore.getState().activeInsertItem !== null) {
    e.preventDefault()
    setActiveInsertItem(null)
    return
  }
  // Se o Insert Menu está aberto mas no nível 1 → fecha o LeftPane
  if (useDesignWorkspaceStore.getState().activePanel === 'insert') {
    e.preventDefault()
    setActivePanel(null)
  }
}
```

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Atalho badge — cor | `text-gray-400` |
| Atalho badge — font | `font-mono text-xs` |
| Item ativo — fundo | `#5B4EFF14` (roxo 8% opacidade) |
| Item ativo — texto | `#473bab` |
| Item hover — fundo | `bg-gray-100` |
| Hook de escuta | `window.addEventListener('keydown', ...)` montado em `DesignWorkspace` |
| Campos ignorados | `input`, `textarea`, `contenteditable` |
| Modificadores bloqueados | `ctrlKey`, `metaKey`, `altKey` (exceto `shiftKey` para Audio) |