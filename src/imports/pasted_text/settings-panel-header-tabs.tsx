Deixa eu inspecionar esse frame do Figma Make antes de gerar o prompt.O link é de um arquivo do **Figma Make**, que não suporta inspeção via API. Mas com a descrição que você deu consigo gerar o prompt com precisão. Aqui está:

---

## 🧱 PROMPT V27 — Design Workspace — SettingsPanel: Header com título + botão fechar + tabs coladas na borda inferior

---

### STACK & BOAS PRÁTICAS

```
Stack: React + TypeScript + Tailwind CSS + shadcn/ui components
Boas práticas:
- Componentes reutilizáveis nomeados semanticamente por função
- TypeScript com interfaces e tipos explícitos para todas as props
- Tailwind para estilização, sem CSS inline ou arquivos .css separados
- shadcn/ui para Tabs, Button, Separator
- Estado global via Zustand (useDesignWorkspaceStore)
```

---

### CORREÇÃO — Estrutura do `SettingsPanel` no `RightPanel`

#### REGRA PRINCIPAL

O `RightPanel` quando exibindo o `SettingsPanel` deve ter a seguinte estrutura no topo, de cima para baixo:

```
┌─────────────────────────────────┐  ← borda superior do RightPanel
│  Settings               [X]    │  ← header: título + botão fechar
│─────────────────────────────────│  ← linha divisória (Separator)
│  Template │ Components          │  ← tabs, sem padding bottom
│           ▔▔▔▔▔▔▔▔             │  ← underline da tab ativa COLADO na borda inferior do header
└─────────────────────────────────┘  ← zero gap entre underline da tab e o Separator abaixo
```

**Ponto crítico:** o underline da tab ativa (`border-bottom`) deve coincidir **exatamente** com o `Separator` horizontal abaixo das tabs — sem nenhum espaçamento ou gap entre eles. O efeito visual é de continuidade: o stroke da tab ativa e o divider do painel são a mesma linha.

---

### IMPLEMENTAÇÃO

```tsx
// SettingsPanel.tsx
export function SettingsPanel() {
  const { setActivePanel } = useDesignWorkspaceStore()

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">

      {/* ── Header: título + botão fechar ─────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-sm font-semibold text-[#1f1d25]">Settings</span>
        <button
          onClick={() => setActivePanel(null)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Tabs coladas ao Separator ──────────────────────────────────── */}
      <Tabs defaultValue="template" className="flex flex-col flex-1 overflow-hidden">

        {/*
          TabsList sem margin/padding bottom.
          O Separator é posicionado FORA do TabsList mas imediatamente após,
          sem gap entre eles — o underline da tab ativa deve tocar o Separator.
        */}
        <div className="shrink-0 relative">

          <TabsList
            className="
              w-full justify-start rounded-none bg-transparent
              px-0 h-auto pb-0
              border-b-0
            "
          >
            <TabsTrigger
              value="template"
              className="
                relative px-4 py-[9px] rounded-none capitalize
                text-[14px] font-medium tracking-[0.4px] leading-6
                bg-transparent shadow-none border-0

                data-[state=active]:text-[#473bab]
                data-[state=inactive]:text-[#686576]

                /* Underline da tab ativa — posicionado no bottom-0,
                   altura 2px, colado na borda inferior do TabsList */
                data-[state=active]:after:content-['']
                data-[state=active]:after:absolute
                data-[state=active]:after:bottom-0
                data-[state=active]:after:left-0
                data-[state=active]:after:right-0
                data-[state=active]:after:h-[2px]
                data-[state=active]:after:bg-[#473bab]
                data-[state=active]:after:z-10
              "
            >
              Template
            </TabsTrigger>

            <TabsTrigger
              value="components"
              className="
                relative px-4 py-[9px] rounded-none capitalize
                text-[14px] font-medium tracking-[0.4px] leading-6
                bg-transparent shadow-none border-0

                data-[state=active]:text-[#473bab]
                data-[state=inactive]:text-[#686576]

                data-[state=active]:after:content-['']
                data-[state=active]:after:absolute
                data-[state=active]:after:bottom-0
                data-[state=active]:after:left-0
                data-[state=active]:after:right-0
                data-[state=active]:after:h-[2px]
                data-[state=active]:after:bg-[#473bab]
                data-[state=active]:after:z-10
              "
            >
              Components
            </TabsTrigger>
          </TabsList>

          {/*
            Separator posicionado imediatamente abaixo das tabs.
            margin: 0, sem gap.
            O underline da tab ativa (after:bottom-0) toca exatamente este Separator.
          */}
          <Separator className="w-full m-0" />

        </div>

        {/* ── Conteúdo das tabs — scrollável ──────────────────────────── */}
        <TabsContent
          value="template"
          className="flex-1 overflow-y-auto overflow-x-hidden mt-0 px-4 py-3"
        >
          <SettingsTemplateTab />
        </TabsContent>

        <TabsContent
          value="components"
          className="flex-1 overflow-y-auto overflow-x-hidden mt-0 px-4 py-3"
        >
          <SettingsComponentsTab />
        </TabsContent>

      </Tabs>
    </div>
  )
}
```

---

### DETALHE CRÍTICO — Tab underline colado no Separator

O underline da tab ativa é um pseudo-elemento `::after` posicionado em `bottom: 0` dentro do `TabsTrigger`. O `Separator` é renderizado com `margin: 0` logo abaixo do `TabsList`. O resultado é:

```
TabsTrigger (height: ~42px)
  └── ::after (height: 2px, bottom: 0, bg: #473bab)
                                           ↕ 0px de gap
Separator (height: 1px, bg: rgba(0,0,0,0.12))
```

Para garantir alinhamento perfeito, o container das tabs usa `position: relative` e **não tem padding bottom**. O `Separator` é filho direto do mesmo container, sem nenhum `gap`, `margin-top` ou `padding` entre eles.

Se o shadcn/ui `Tabs` adicionar margin automática ao `TabsContent`, sobrescrever com `mt-0`:

```tsx
// Garantir que não haja espaço entre o Separator e o conteúdo da tab
<TabsContent className="mt-0 ..." value="template">
```

---

### ESTRUTURA VISUAL COMPLETA DO `RightPanel` em modo Settings

```
┌──────────────────────────────────────────┐  top: 4px (PANEL_OFFSET)
│                                          │
│  Settings                          [X]  │  ← px-4 py-3
│──────────────────────────────────────────│  ← Separator (m-0)
│  Template    Components                 │  ← TabsList (pb-0)
│  ▔▔▔▔▔▔▔▔                              │  ← underline 2px #473bab
│──────────────────────────────────────────│  ← Separator (m-0) ← COLADO no underline
│                                          │
│  [conteúdo da tab — scrollável]          │  ← overflow-y-auto
│                                          │
└──────────────────────────────────────────┘  bottom: 4px (PANEL_OFFSET)
```

---

### COMPORTAMENTO DO BOTÃO [X]

Clicar no **X** do header do `SettingsPanel`:
- `setActivePanel(null)` — fecha o painel Settings
- `RightPanel` some (pois `activePanel !== 'settings'` e `selectedElementId === null`)
- BreadcrumbNav, Timeline e botões de ação ajustam posições normalmente

```tsx
// O X fecha Settings e consequentemente o RightPanel
<button onClick={() => setActivePanel(null)}>
  <X size={14} />
</button>
```

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Header padding | `px-4 py-3` |
| Header título | `text-sm font-semibold text-[#1f1d25]` |
| Botão fechar | `X` icon 14px — `lucide-react` |
| Tab ativa — texto | `#473bab` |
| Tab ativa — underline | `2px solid #473bab` — `::after bottom-0` |
| Tab inativa — texto | `#686576` |
| Tab font | Roboto Medium 14px, tracking 0.4px |
| Tab padding | `px-4 py-[9px]` |
| TabsList padding bottom | `pb-0` — **zero** |
| Separator margin | `m-0` — **zero** — colado abaixo das tabs |
| Gap entre underline e Separator | **0px** — alinhamento perfeito |
| TabsContent margin top | `mt-0` — sem espaço após o Separator |
| Conteúdo padding | `px-4 py-3` |
| Overflow X | `hidden` |
| Overflow Y | `auto` |