Prompt direto e focado nessa correção:

---

## 🧱 PROMPT V58 — Design Workspace — Configure Panel: conteúdo reativo ao que foi adicionado ao template

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

O `ConfigurePanel` é **completamente reativo** ao estado atual do canvas. Ele não tem dados estáticos ou mock — todo o seu conteúdo é derivado em tempo real dos elementos presentes em `canvasElements`:

| O que foi adicionado ao canvas | O que aparece no Configure |
|---|---|
| Elemento de texto com `{variableName}` | Campo `Input` na seção **Text**, com label `variableName` |
| Dynamic Placeholder (Logo, Jellybean, Media, etc.) | Item na seção **Media**, com thumbnail e select de fonte |
| Nenhum elemento com variáveis | Estado vazio com instrução |

Cada vez que o usuário adiciona ou remove um elemento do canvas, o Configure Panel atualiza automaticamente — sem necessidade de ação manual.

---

### EXTRAÇÃO REATIVA — `useConfigureVariables`

Hook que observa `canvasElements` e deriva as variáveis em tempo real:

```tsx
// hooks/useConfigureVariables.ts

const TEXT_TYPES: ElementType[] = [
  'text-header', 'text-subheader', 'text-body', 'text-template'
]

const MEDIA_TYPES: ElementType[] = [
  'placeholder-logo',
  'placeholder-background',
  'placeholder-jellybean',
  'placeholder-media',
]

const PLACEHOLDER_BADGE_COLORS: Record<string, string> = {
  'placeholder-logo':       '#7B2FFF',
  'placeholder-background': '#22C55E',
  'placeholder-jellybean':  '#3B82F6',
  'placeholder-media':      '#3B82F6',
}

export function useConfigureVariables() {
  const canvasElements = useDesignWorkspaceStore(s => s.canvasElements)

  // ── Variáveis de texto — extraídas de {curly brackets} ────────────────
  const textVariables = useMemo(() => {
    const varPattern = /\{([^{}]+)\}/g
    const seen = new Map<string, string>()  // key → label

    canvasElements
      .filter(el => TEXT_TYPES.includes(el.type) && el.content?.includes('{'))
      .forEach(el => {
        const matches = [...(el.content ?? '').matchAll(varPattern)]
        matches.forEach(match => {
          const key = match[1].trim()
          if (key && !seen.has(key)) {
            seen.set(key, key)  // label = key por padrão
          }
        })
      })

    return Array.from(seen.entries()).map(([key, label]) => ({ key, label }))
  }, [canvasElements])

  // ── Variáveis de mídia — extraídas dos Dynamic Placeholders ───────────
  const mediaVariables = useMemo(() => {
    return canvasElements
      .filter(el => MEDIA_TYPES.includes(el.type))
      .map(el => ({
        id:         el.id,
        name:       el.name,                          // nome editável da layer
        type:       el.type,
        variant:    el.placeholderVariant ?? '',
        badgeColor: PLACEHOLDER_BADGE_COLORS[el.type] ?? '#6B7280',
      }))
  }, [canvasElements])

  const hasAnyVariable = textVariables.length > 0 || mediaVariables.length > 0

  return { textVariables, mediaVariables, hasAnyVariable }
}
```

---

### REGRAS DE EXTRAÇÃO DE VARIÁVEIS DE TEXTO

```tsx
// Exemplos de conteúdo de elementos de texto e as variáveis extraídas:

"Summer Sale"              → nenhuma variável (sem curly brackets)
"{year} {make} {model}"   → 3 variáveis: year, make, model
"From {price} only"        → 1 variável: price
"{header}"                 → 1 variável: header
"Hello {name}, {offer}!"   → 2 variáveis: name, offer
"{year} {year} {make}"     → 2 variáveis únicas: year, make (deduplicado)
```

```tsx
// Regex para detectar variáveis:
const varPattern = /\{([^{}]+)\}/g

// Regras:
// 1. Case-sensitive: {Year} e {year} são variáveis diferentes
// 2. Deduplicação: mesma variável em múltiplos elementos → um único campo
// 3. Espaços internos ignorados: { year } → key = "year"
// 4. Nested brackets ignorados: {{nested}} → não extrai
// 5. Elementos sem conteúdo ou sem { → ignorados
```

---

### REGRAS DE EXTRAÇÃO DE VARIÁVEIS DE MÍDIA

```tsx
// Todos os Dynamic Placeholders dos seguintes tipos geram uma entrada na seção Media:
// - placeholder-logo       → nome da layer (ex: "Logo Square")
// - placeholder-background → nome da layer (ex: "Background")
// - placeholder-jellybean  → nome da layer (ex: "Carcut", "Input Label")
// - placeholder-media      → nome da layer (ex: "Media")

// O nome exibido no Configure é o nome da layer (editável via LayersPanel)
// Não inclui: placeholder-audio (áudio não é mídia visual)
```

---

### COMPONENTE: `ConfigureManualTab` — reativo

```tsx
// ConfigureManualTab.tsx
export function ConfigureManualTab() {
  const { textVariables, mediaVariables, hasAnyVariable } = useConfigureVariables()

  // Estado local dos valores configurados manualmente
  const [brandKit,     setBrandKit]     = useState('')
  const [textValues,   setTextValues]   = useState<Record<string, string>>({})
  const [mediaValues,  setMediaValues]  = useState<Record<string, {
    source: string
    preview: string | null
  }>>({})

  // Limpar valores de variáveis que foram removidas do canvas
  useEffect(() => {
    setTextValues(prev => {
      const cleaned: Record<string, string> = {}
      textVariables.forEach(({ key }) => {
        cleaned[key] = prev[key] ?? ''
      })
      return cleaned
    })
  }, [textVariables])

  useEffect(() => {
    setMediaValues(prev => {
      const cleaned: Record<string, { source: string; preview: string | null }> = {}
      mediaVariables.forEach(({ id }) => {
        cleaned[id] = prev[id] ?? { source: '', preview: null }
      })
      return cleaned
    })
  }, [mediaVariables])

  return (
    <div className="flex flex-col gap-3 px-4 py-3 w-full overflow-x-hidden">

      {/* Brand Kit — sempre visível */}
      <ConfigureBrandKitField value={brandKit} onChange={setBrandKit} />

      {/* Seção Text — visível apenas se há variáveis de texto no canvas */}
      {textVariables.length > 0 && (
        <ConfigureTextBlock
          variables={textVariables}
          values={textValues}
          onChange={(key, val) => setTextValues(prev => ({ ...prev, [key]: val }))}
        />
      )}

      {/* Seção Media — visível apenas se há placeholders de mídia no canvas */}
      {mediaVariables.length > 0 && (
        <ConfigureMediaBlock
          variables={mediaVariables}
          values={mediaValues}
          onChange={(id, val) => setMediaValues(prev => ({ ...prev, [id]: val }))}
        />
      )}

      {/* Estado vazio — nenhuma variável no canvas */}
      {!hasAnyVariable && (
        <ConfigureEmptyState />
      )}

    </div>
  )
}
```

---

### COMPONENTE: `ConfigureFeedTab` — reativo

```tsx
// ConfigureFeedTab.tsx
export function ConfigureFeedTab() {
  const { textVariables, mediaVariables, hasAnyVariable } = useConfigureVariables()

  const [selectedFeed,  setSelectedFeed]  = useState('')
  const [createMode,    setCreateMode]    = useState<'assets' | 'review'>('assets')
  const [brandKit,      setBrandKit]      = useState('')
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [mediaValues,   setMediaValues]   = useState<Record<string, { source: string }>>({})

  // Limpar mapeamentos de variáveis removidas
  useEffect(() => {
    setColumnMapping(prev => {
      const cleaned: Record<string, string> = {}
      textVariables.forEach(({ key }) => { cleaned[key] = prev[key] ?? '' })
      return cleaned
    })
  }, [textVariables])

  return (
    <div className="flex flex-col gap-3 px-4 py-3 w-full overflow-x-hidden">

      {/* Select feed */}
      <div className="flex flex-col gap-1 w-full">
        <label className="text-[12px] text-[#686576] tracking-[0.15px] px-1">
          Select feed
        </label>
        <Select value={selectedFeed} onValueChange={setSelectedFeed}>
          <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border border-[#cac9cf] rounded-[4px]">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>{/* feeds futuros */}</SelectContent>
        </Select>
      </div>

      {/* Create */}
      <div className="flex flex-col gap-1 w-full">
        <label className="text-[14px] text-[#1f1d25] tracking-[0.15px] leading-[1.5]">
          Create
        </label>
        <RadioGroup
          value={createMode}
          onValueChange={v => setCreateMode(v as 'assets' | 'review')}
          className="flex flex-row items-center gap-4"
        >
          <div className="flex items-center">
            <RadioGroupItem value="assets" id="feed-assets" className="text-[#473bab]" />
            <Label htmlFor="feed-assets" className="ml-2 text-[14px] text-[#1f1d25] tracking-[0.15px] cursor-pointer">
              Assets
            </Label>
          </div>
          <div className="flex items-center">
            <RadioGroupItem value="review" id="feed-review" className="text-[#473bab]" />
            <Label htmlFor="feed-review" className="ml-2 text-[14px] text-[#1f1d25] tracking-[0.15px] cursor-pointer">
              Review Document
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Brand Kit */}
      <ConfigureBrandKitField value={brandKit} onChange={setBrandKit} />

      {/* Seção Text — Select de coluna do feed por variável */}
      {textVariables.length > 0 && (
        <div className="flex flex-col gap-3 w-full border border-[rgba(0,0,0,0.12)] rounded-xl p-3">
          <p className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]">
            Text
          </p>
          {textVariables.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1 w-full">
              <label className="text-[12px] text-[#686576] tracking-[0.15px] px-1">{label}</label>
              <Select
                value={columnMapping[key] ?? ''}
                onValueChange={v => setColumnMapping(prev => ({ ...prev, [key]: v }))}
              >
                <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border border-[#cac9cf] rounded-[4px]">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  {/* colunas do feed selecionado — futuramente */}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

      {/* Seção Media — igual ao Manual */}
      {mediaVariables.length > 0 && (
        <ConfigureMediaBlock
          variables={mediaVariables}
          values={mediaValues}
          onChange={(id, val) => setMediaValues(prev => ({ ...prev, [id]: val }))}
        />
      )}

      {/* Estado vazio */}
      {!hasAnyVariable && <ConfigureEmptyState />}

    </div>
  )
}
```

---

### COMPORTAMENTO EM TEMPO REAL — Exemplos

```
CENÁRIO 1: Canvas vazio
  textVariables  = []
  mediaVariables = []
  → ConfigurePanel: estado vazio com instrução ✓

CENÁRIO 2: Usuário adiciona texto "Hello {name}, your {offer} is ready"
  textVariables  = [{ key: 'name' }, { key: 'offer' }]
  mediaVariables = []
  → Seção Text aparece com 2 campos: "name" e "offer"
  → Seção Media não aparece ✓

CENÁRIO 3: Usuário adiciona Placeholder Logo (layer: "Logo Square")
  textVariables  = [{ key: 'name' }, { key: 'offer' }]
  mediaVariables = [{ id: 'abc', name: 'Logo Square', type: 'placeholder-logo' }]
  → Seção Text: 2 campos
  → Seção Media: 1 item "Logo Square" ✓

CENÁRIO 4: Usuário renomeia a layer "Logo Square" para "Brand Logo"
  mediaVariables = [{ id: 'abc', name: 'Brand Logo', ... }]
  → Seção Media: item atualiza para "Brand Logo" automaticamente ✓

CENÁRIO 5: Usuário deleta o texto com {name} e {offer}
  textVariables = []
  → Seção Text some do ConfigurePanel
  → Valores preenchidos para name e offer são descartados ✓

CENÁRIO 6: Usuário adiciona "{year} {make} {model}" e "{year} {trim}"
  (year aparece em dois elementos)
  textVariables = [{ key: 'year' }, { key: 'make' }, { key: 'model' }, { key: 'trim' }]
  → Deduplicação: "year" aparece uma única vez ✓

CENÁRIO 7: Usuário adiciona Placeholder Audio
  → placeholder-audio NÃO gera entrada na seção Media
  → Seção Media não exibe o áudio ✓
```

---

### SINCRONIZAÇÃO — Nome da layer reflete no Configure

Como `mediaVariables` é derivado de `canvasElements` e usa `el.name` (nome editável da layer), qualquer rename feito no LayersPanel atualiza automaticamente o nome exibido no Configure:

```tsx
// Ao renomear via LayersPanel (V40):
renameElement('abc', 'Brand Logo')
  → canvasElements: el.name = 'Brand Logo'
  → useConfigureVariables() re-calcula
  → mediaVariables[0].name = 'Brand Logo'
  → ConfigurePanel re-renderiza com o novo nome ✓
```

---

### CHECKLIST DE VALIDAÇÃO

- [ ] Canvas vazio → ConfigurePanel exibe estado vazio
- [ ] Adicionar texto com `{var}` → campo aparece na seção Text imediatamente
- [ ] Editar texto para remover `{var}` → campo some da seção Text
- [ ] Adicionar Dynamic Placeholder Logo → item aparece na seção Media
- [ ] Deletar Dynamic Placeholder → item some da seção Media
- [ ] Renomear layer do placeholder → nome atualiza no Configure
- [ ] Mesmo `{var}` em múltiplos elementos → aparece apenas uma vez (deduplicado)
- [ ] Texto sem curly brackets → não gera nenhum campo na seção Text
- [ ] `placeholder-audio` → NÃO aparece na seção Media
- [ ] Abas Manual e Feed refletem as mesmas variáveis
- [ ] Valores preenchidos persistem enquanto a variável existe no canvas
- [ ] Variável removida → seu valor é descartado do estado local

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Regex de variáveis | `/\{([^{}]+)\}/g` |
| Deduplicação | por `key` — case-sensitive |
| Tipos que geram Text vars | `text-header`, `text-subheader`, `text-body`, `text-template` |
| Tipos que geram Media vars | `placeholder-logo`, `placeholder-background`, `placeholder-jellybean`, `placeholder-media` |
| Tipos excluídos da Media | `placeholder-audio` |
| Nome da Media var | `el.name` — reativo ao LayersPanel |
| Hook de derivação | `useConfigureVariables()` com `useMemo` observando `canvasElements` |
| Limpeza de valores obsoletos | `useEffect` observando mudanças nas variáveis extraídas |
| Seção Text — campo | `Input` livre (Manual) / `Select` de coluna (Feed) |
| Seção Media — campo | `Select` de fonte + área de preview |