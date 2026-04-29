Deixa eu inspecionar o frame do Configure Pane no Figma antes de gerar o prompt.Perfeito, consegui ver ambas as abas claramente. Deixa eu inspecionar os detalhes de cada variante.Tenho todos os detalhes visuais de ambas as abas. Aqui está o prompt completo:

---

## 🧱 PROMPT V57 — Design Workspace — Configure Panel no RightPanel com abas Manual e Feed

---

### STACK & BOAS PRÁTICAS

```
Stack: React + TypeScript + Tailwind CSS + shadcn/ui components
Boas práticas:
- Componentes reutilizáveis nomeados semanticamente por função
- TypeScript com interfaces e tipos explícitos para todas as props
- Tailwind para estilização, sem CSS inline ou arquivos .css separados
- shadcn/ui para Tabs, Input, Select, RadioGroup, Separator
- Estado global via Zustand (useDesignWorkspaceStore)
```

---

### MUDANÇA ESTRUTURAL — Configure sai do LeftPane e vai para o RightPanel

```tsx
// LeftRail — ao clicar em Configure:
// ❌ Antes: abre o LeftPane com conteúdo genérico
// ✅ Agora: abre o RightPanel com ConfigurePanel

// store — clicar em Configure no LeftRail
setActivePanel: (panel) => set(() => ({
  activePanel: panel,
  // Configure força a abertura do RightPanel (como Settings)
}))

// RightPanel — condição de visibilidade atualizada
const isRightPanelVisible =
  selectedElementId !== null ||
  activePanel === 'settings' ||
  activePanel === 'configure' ||   // ← novo
  (canvasElements.length > 0 && selectedElementId === null && activePanel !== 'settings' && activePanel !== 'configure')

// RightPanel — roteador de conteúdo atualizado
if (activePanel === 'configure') return <ConfigurePanel />
if (activePanel === 'settings')  return <SettingsPanel />
if (selectedElementId !== null)  return <PropertiesContent ... />
if (canvasElements.length > 0)   return <ActivityPanel />
```

> **Configure não abre o LeftPane** — apenas o RightPanel. O LeftRail destaca o item Configure, mas nenhum painel esquerdo é exibido.

---

### MODELO DE DADOS — Variáveis do template

O `ConfigurePanel` lê dinamicamente as variáveis presentes no canvas:

```tsx
// types/canvas.ts

// Variáveis de texto: extraídas de elementos de texto com {curly brackets}
interface TextVariable {
  key:   string    // ex: "year", "make", "model"
  value: string   // valor configurado manualmente
}

// Variáveis de mídia: extraídas dos Dynamic Placeholders no canvas
interface MediaVariable {
  id:       string          // ID do placeholder no canvas
  name:     string          // ex: "Carcut", "Logo Square", "Input Label"
  variant:  string          // ex: "jellybean", "logo", "background"
  preview:  string | null   // URL da imagem selecionada
  source:   'portal' | 'upload' | ''
  // thumbnail visual do placeholder (badge colorido)
  badgeColor: string
}
```

```tsx
// utils/extractTemplateVariables.ts

// Extrai variáveis de texto dos elementos de texto do canvas
// Detecta padrões {variableName} no conteúdo
export function extractTextVariables(elements: CanvasElement[]): TextVariable[] {
  const TEXT_TYPES = ['text-header', 'text-subheader', 'text-body', 'text-template']
  const varPattern = /\{([^}]+)\}/g
  const vars = new Map<string, string>()

  elements
    .filter(el => TEXT_TYPES.includes(el.type) && el.content)
    .forEach(el => {
      const matches = el.content!.matchAll(varPattern)
      for (const match of matches) {
        const key = match[1].trim()
        if (!vars.has(key)) vars.set(key, '')
      }
    })

  return Array.from(vars.entries()).map(([key, value]) => ({ key, value }))
}

// Extrai placeholders de mídia dos Dynamic Placeholders no canvas
export function extractMediaVariables(elements: CanvasElement[]): MediaVariable[] {
  const MEDIA_TYPES = [
    'placeholder-logo', 'placeholder-background',
    'placeholder-jellybean', 'placeholder-media',
  ]

  const badgeColors: Record<string, string> = {
    'placeholder-logo':       '#7B2FFF',
    'placeholder-background': '#22C55E',
    'placeholder-jellybean':  '#3B82F6',
    'placeholder-media':      '#3B82F6',
  }

  return elements
    .filter(el => MEDIA_TYPES.includes(el.type))
    .map(el => ({
      id:         el.id,
      name:       el.name,
      variant:    el.placeholderVariant ?? '',
      preview:    null,
      source:     '',
      badgeColor: badgeColors[el.type] ?? '#6B7280',
    }))
}
```

---

### COMPONENTE: `ConfigurePanel`

```tsx
// ConfigurePanel.tsx
export function ConfigurePanel() {
  const { setActivePanel } = useDesignWorkspaceStore()
  const [activeTab, setActiveTab] = useState<'manual' | 'feed'>('manual')

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">

      {/* Header: título + ícones de ação */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-sm font-medium text-[#1f1d25] tracking-[0.1px]">
          Configure
        </span>
        <div className="flex items-center gap-1">
          {/* Ícone de adicionar asset */}
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-[#1f1d25]">
            <FilePlus size={16} />
          </button>
          {/* Ícone de configurações do configure */}
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-[#1f1d25]">
            <Settings2 size={16} />
          </button>
        </div>
      </div>

      {/* Tabs Manual | Feed — coladas ao Separator */}
      <Tabs
        value={activeTab}
        onValueChange={v => setActiveTab(v as 'manual' | 'feed')}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="shrink-0 relative">
          <TabsList className="w-full justify-start rounded-none bg-transparent px-0 h-auto pb-0 border-b-0">

            <TabsTrigger
              value="manual"
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
              "
            >
              Manual
            </TabsTrigger>

            <TabsTrigger
              value="feed"
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
              "
            >
              Feed
            </TabsTrigger>

          </TabsList>
          <Separator className="w-full m-0" />
        </div>

        <TabsContent value="manual" className="flex-1 overflow-y-auto overflow-x-hidden mt-0">
          <ConfigureManualTab />
        </TabsContent>

        <TabsContent value="feed" className="flex-1 overflow-y-auto overflow-x-hidden mt-0">
          <ConfigureFeedTab />
        </TabsContent>

      </Tabs>
    </div>
  )
}
```

---

### COMPONENTE: `ConfigureManualTab`

```tsx
// ConfigureManualTab.tsx
export function ConfigureManualTab() {
  const { canvasElements } = useDesignWorkspaceStore()

  const textVars  = useMemo(() => extractTextVariables(canvasElements),  [canvasElements])
  const mediaVars = useMemo(() => extractMediaVariables(canvasElements), [canvasElements])

  const [brandKit,    setBrandKit]    = useState('BMW')
  const [textValues,  setTextValues]  = useState<Record<string, string>>({})
  const [mediaValues, setMediaValues] = useState<Record<string, { source: string; preview: string | null }>>({})

  return (
    <div className="flex flex-col gap-3 px-4 py-3 w-full overflow-x-hidden">

      {/* Brand Kit */}
      <ConfigureBrandKitField value={brandKit} onChange={setBrandKit} />

      {/* Bloco Text */}
      {textVars.length > 0 && (
        <ConfigureTextBlock
          variables={textVars}
          values={textValues}
          onChange={(key, val) => setTextValues(prev => ({ ...prev, [key]: val }))}
        />
      )}

      {/* Bloco Media */}
      {mediaVars.length > 0 && (
        <ConfigureMediaBlock
          variables={mediaVars}
          values={mediaValues}
          onChange={(id, val) => setMediaValues(prev => ({ ...prev, [id]: val }))}
        />
      )}

      {/* Estado vazio — nenhuma variável no canvas */}
      {textVars.length === 0 && mediaVars.length === 0 && (
        <ConfigureEmptyState />
      )}

    </div>
  )
}
```

---

### COMPONENTE: `ConfigureBrandKitField`

```tsx
// ConfigureBrandKitField.tsx
export function ConfigureBrandKitField({
  value, onChange
}: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[12px] text-[#686576] tracking-[0.15px] px-1">Brand Kit</label>
      <div className="flex items-center gap-2 bg-[#f9fafa] border border-[#cac9cf] rounded-[4px] px-2 h-9 w-full">
        {/* Ícone da brand — placeholder de avatar */}
        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
          <span className="text-[8px] text-white font-bold">B</span>
        </div>
        <span className="flex-1 text-xs text-[#1f1d25] truncate">{value || 'Select brand'}</span>
        {value && (
          <button onClick={() => onChange('')} className="shrink-0 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </div>
    </div>
  )
}
```

---

### COMPONENTE: `ConfigureTextBlock`

Bloco com borda arredondada contendo os campos de texto variáveis:

```tsx
// ConfigureTextBlock.tsx
export function ConfigureTextBlock({
  variables, values, onChange
}: ConfigureTextBlockProps) {
  return (
    <div className="flex flex-col gap-3 w-full border border-[rgba(0,0,0,0.12)] rounded-xl p-3">

      <p className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]">
        Text
      </p>

      <div className="flex flex-col gap-3 w-full">
        {variables.map(variable => (
          <div key={variable.key} className="flex flex-col gap-1 w-full">
            <label className="text-[12px] text-[#686576] tracking-[0.15px] px-1">
              {variable.key}
            </label>
            <Input
              className="w-full h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px] text-[#1f1d25] tracking-[0.17px]"
              value={values[variable.key] ?? ''}
              onChange={e => onChange(variable.key, e.target.value)}
              placeholder=""
            />
          </div>
        ))}
      </div>

    </div>
  )
}
```

---

### COMPONENTE: `ConfigureMediaBlock`

Bloco com borda arredondada contendo os placeholders de mídia:

```tsx
// ConfigureMediaBlock.tsx
export function ConfigureMediaBlock({
  variables, values, onChange
}: ConfigureMediaBlockProps) {
  return (
    <div className="flex flex-col gap-3 w-full border border-[rgba(0,0,0,0.12)] rounded-xl p-3">

      <p className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]">
        Media
      </p>

      <div className="flex flex-col gap-4 w-full">
        {variables.map(variable => (
          <ConfigureMediaItem
            key={variable.id}
            variable={variable}
            value={values[variable.id]}
            onChange={val => onChange(variable.id, val)}
          />
        ))}
      </div>

    </div>
  )
}
```

---

### COMPONENTE: `ConfigureMediaItem`

Cada placeholder de mídia — thumbnail + select de fonte + área de preview:

```tsx
// ConfigureMediaItem.tsx
export function ConfigureMediaItem({ variable, value, onChange }: ConfigureMediaItemProps) {
  const source  = value?.source  ?? ''
  const preview = value?.preview ?? null
  const hasValue = !!source

  return (
    <div className="flex flex-col gap-2 w-full">

      {/* Linha: thumbnail + nome + select de fonte */}
      <div className="flex items-start gap-3 w-full">

        {/* Thumbnail do placeholder */}
        <div
          className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center border-2 border-dashed"
          style={{ borderColor: variable.badgeColor, backgroundColor: `${variable.badgeColor}14` }}
        >
          <span
            className="text-[8px] font-bold text-white px-1 py-0.5 rounded-full text-center leading-tight"
            style={{ backgroundColor: variable.badgeColor, fontSize: '7px' }}
          >
            {variable.name.slice(0, 3).toUpperCase()}
          </span>
        </div>

        {/* Nome + select */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <label className="text-[12px] text-[#686576] tracking-[0.15px] truncate">
            {variable.name}
          </label>
          <div className="flex items-center gap-1 bg-[#f9fafa] border border-[#cac9cf] rounded-[4px] px-2 h-9 w-full">
            <span className="flex-1 text-xs text-[#1f1d25] truncate">
              {source || 'Import from Portal'}
            </span>
            {hasValue && (
              <button
                onClick={() => onChange({ source: '', preview: null })}
                className="shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
            <ChevronDown size={12} className="text-gray-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* Área de preview / upload */}
      <button
        className="
          w-full h-9 flex items-center justify-center
          bg-[#f9fafa] border border-[#dddce0] rounded-[4px]
          text-xs text-[#9c99a9] hover:bg-gray-100 transition-colors
        "
        onClick={() => {/* futuramente: abrir seletor de imagem */}}
      >
        {preview ? (
          <img src={preview} alt={variable.name} className="h-full object-contain" />
        ) : (
          'click to select image'
        )}
      </button>

    </div>
  )
}
```

---

### COMPONENTE: `ConfigureFeedTab`

```tsx
// ConfigureFeedTab.tsx
export function ConfigureFeedTab() {
  const { canvasElements } = useDesignWorkspaceStore()

  const textVars  = useMemo(() => extractTextVariables(canvasElements),  [canvasElements])
  const mediaVars = useMemo(() => extractMediaVariables(canvasElements), [canvasElements])

  const [selectedFeed, setSelectedFeed] = useState('')
  const [createMode,   setCreateMode]   = useState<'assets' | 'review'>('assets')
  const [brandKit,     setBrandKit]     = useState('BMW')
  const [feedColumns,  setFeedColumns]  = useState<Record<string, string>>({})
  const [mediaValues,  setMediaValues]  = useState<Record<string, { source: string }>>({})

  return (
    <div className="flex flex-col gap-3 px-4 py-3 w-full overflow-x-hidden">

      {/* Select feed */}
      <div className="flex flex-col gap-1 w-full">
        <label className="text-[12px] text-[#686576] tracking-[0.15px] px-1">Select feed</label>
        <Select value={selectedFeed} onValueChange={setSelectedFeed}>
          <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border border-[#cac9cf] rounded-[4px]">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>
            {/* feeds futuros */}
          </SelectContent>
        </Select>
      </div>

      {/* Create — Radio group: Assets | Review Document */}
      <div className="flex flex-col gap-1 w-full">
        <label className="text-[14px] text-[#1f1d25] tracking-[0.15px] leading-[1.5]">Create</label>
        <RadioGroup
          value={createMode}
          onValueChange={v => setCreateMode(v as 'assets' | 'review')}
          className="flex flex-row items-center gap-4"
        >
          <div className="flex items-center">
            <RadioGroupItem value="assets" id="create-assets" className="text-[#473bab]" />
            <Label htmlFor="create-assets" className="ml-2 text-[14px] text-[#1f1d25] tracking-[0.15px] cursor-pointer">
              Assets
            </Label>
          </div>
          <div className="flex items-center">
            <RadioGroupItem value="review" id="create-review" className="text-[#473bab]" />
            <Label htmlFor="create-review" className="ml-2 text-[14px] text-[#1f1d25] tracking-[0.15px] cursor-pointer">
              Review Document
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Brand Kit */}
      <ConfigureBrandKitField value={brandKit} onChange={setBrandKit} />

      {/* Bloco Text — no Feed, cada variável é um Select de coluna do feed */}
      {textVars.length > 0 && (
        <div className="flex flex-col gap-3 w-full border border-[rgba(0,0,0,0.12)] rounded-xl p-3">
          <p className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]">
            Text
          </p>
          {textVars.map(variable => (
            <div key={variable.key} className="flex flex-col gap-1 w-full">
              <label className="text-[12px] text-[#686576] tracking-[0.15px] px-1">
                {variable.key}
              </label>
              {/* No Feed: select para mapear a variável a uma coluna do feed */}
              <Select
                value={feedColumns[variable.key] ?? ''}
                onValueChange={v => setFeedColumns(prev => ({ ...prev, [variable.key]: v }))}
              >
                <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border border-[#cac9cf] rounded-[4px]">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  {/* colunas do feed futuramente */}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

      {/* Bloco Media — no Feed, mesmo comportamento do Manual */}
      {mediaVars.length > 0 && (
        <ConfigureMediaBlock
          variables={mediaVars}
          values={mediaValues}
          onChange={(id, val) => setMediaValues(prev => ({ ...prev, [id]: val }))}
        />
      )}

      {/* Estado vazio */}
      {textVars.length === 0 && mediaVars.length === 0 && (
        <ConfigureEmptyState />
      )}

    </div>
  )
}
```

---

### COMPONENTE: `ConfigureEmptyState`

```tsx
// ConfigureEmptyState.tsx
export function ConfigureEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-2">
      <LayoutTemplate size={32} className="text-gray-200" />
      <p className="text-sm font-medium text-[#686576]">No variables yet</p>
      <p className="text-xs text-[#9c99a9] leading-[1.5]">
        Add text with <span className="font-mono bg-gray-100 px-1 rounded">{'{variable}'}</span> or Dynamic Placeholders to the template to configure them here.
      </p>
    </div>
  )
}
```

---

### DIFERENÇA VISUAL ENTRE AS ABAS

| Elemento | Manual | Feed |
|---|---|---|
| Select feed | ❌ não exibe | ✅ topo do painel |
| Create (Assets / Review Document) | ❌ não exibe | ✅ abaixo do Select feed |
| Brand Kit | ✅ select com X | ✅ select com X |
| Text block — campos | `Input` de texto livre | `Select` de coluna do feed |
| Media block — campos | select fonte + preview | select fonte + preview (igual) |

---

### DIAGRAMA — Posicionamento do Configure no layout

```
Usuário clica em Configure no LeftRail:
        ↓
activePanel = 'configure'
        ↓
LeftPane: NÃO abre (Configure não usa LeftPane)
        ↓
RightPanel: isRightPanelVisible = true (activePanel === 'configure')
RightPanel content: ConfigurePanel
        ↓
BreadcrumbNav: sem LeftPane → reposiciona próximo ao LeftRail ✓
Timeline: right ajusta ao RightPanel visível ✓
Botões (Preview/Save): right ajusta ao RightPanel visível ✓
```

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Header title | `text-sm font-medium text-[#1f1d25]` |
| Tab ativa | `text-[#473bab]` + `2px solid #473bab` underline |
| Tab inativa | `text-[#686576]` |
| Separator | `m-0` colado nas tabs |
| Bloco Text/Media border | `1px solid rgba(0,0,0,0.12)` |
| Bloco border-radius | `rounded-xl` = `12px` |
| Bloco padding | `p-3` = `12px` |
| Bloco gap interno | `gap-3` = `12px` |
| Input bg | `#f9fafa` |
| Input border outlined | `#dddce0` |
| Input border standard | `#cac9cf` |
| Input height | `h-9` = `36px` |
| Label font | Roboto Regular 12px tracking 0.15px cor `#686576` |
| Section title font | Roboto Medium 14px tracking 0.1px |
| "click to select image" | `text-xs text-[#9c99a9]` |
| Media thumbnail size | `w-10 h-10` = `40px` |
| Overflow X | `hidden` |
| Overflow Y | `auto` |