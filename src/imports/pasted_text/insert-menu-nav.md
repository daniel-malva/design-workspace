Deixa eu inspecionar esse frame no Figma antes de gerar o prompt.Ótimo, consigo ver o conteúdo geral. Deixa eu inspecionar cada seção com mais detalhe para capturar os elementos exatos.Perfeito — tenho todos os node IDs de cada painel. Vou capturar o screenshot de cada um individualmente.Tenho todos os screenshots de todos os painéis. Agora gero o prompt completo:

---

## 🧱 PROMPT V15 — Design Workspace — Insert Menu: Segundo Nível de Navegação do LeftPane

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

### ESTRUTURA DE NAVEGAÇÃO DO `LeftPane` — Insert

O `LeftPane` tem **dois níveis de navegação** quando o item ativo do `LeftRail` é `insert`:

**Nível 1 — `InsertMenuPanel`:** lista com todos os elementos inseríveis (Text, Dynamic Placeholder, Images/Video, Component, Annotation, Shapes, Icons, Audio, AI Voice)

**Nível 2 — `InsertSubPanel`:** conteúdo específico do item selecionado, exibido dentro do mesmo `LeftPane`

#### Navegação entre níveis

```tsx
type InsertMenuItem =
  | 'text'
  | 'dynamicPlaceholder'
  | 'imagesVideo'
  | 'component'
  | 'annotation'
  | 'shapes'
  | 'icons'
  | 'audio'
  | 'aiVoice'

interface LeftPaneState {
  activeInsertItem: InsertMenuItem | null  // null = Nível 1 visível
}
```

- Clicar em qualquer item do Nível 1 → `activeInsertItem` recebe o valor correspondente → Nível 2 é exibido
- Clicar no botão **X** no canto superior direito do Nível 2 → `activeInsertItem = null` → volta para o Nível 1

#### Header do Nível 2

```tsx
// InsertSubPanelHeader.tsx
<div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
  <span className="text-sm font-semibold text-gray-800">{itemLabel}</span>
  <button
    onClick={() => setActiveInsertItem(null)}
    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
  >
    <X size={14} />
  </button>
</div>
```

O título do header é **exatamente o mesmo label** do item clicado no Nível 1 (ex: clicar em "Text" → header exibe "Text").

---

### COMPONENTE: `InsertTextPanel`

Exibido quando `activeInsertItem === 'text'`.

Conteúdo: grade de **thumbnails de templates de texto** pré-definidos que o usuário pode inserir no canvas. Os thumbnails são dispostos em **grid de 2 colunas**, cada card com preview visual do estilo tipográfico.

```tsx
// InsertTextPanel.tsx
<div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
  <div className="grid grid-cols-2 gap-2 w-full">
    {textTemplates.map(template => (
      <TextTemplateCard
        key={template.id}
        template={template}
        onClick={() => insertElementOnCanvas(template)}
      />
    ))}
  </div>
</div>
```

**`TextTemplateCard`:** card com fundo branco, `rounded-lg`, `border border-gray-200`, altura fixa `h-[120px]`, com preview tipográfico interno. Ao hover, aplica `border-[#5B4EFF]` e `shadow-sm`. Ao clicar, insere o elemento no canvas.

Exemplos de templates visíveis no Figma:
- Header grande + body pequeno
- Título com `{model}` (dynamic)
- Títulos manuscritos / display
- Layouts multi-coluna (título + corpo)
- Templates promocionais ("SALE", "END OF SEASON")
- Convites ("YOU'RE INVITED")
- Propostas ("Marketing Proposal")

---

### COMPONENTE: `InsertDynamicPlaceholderPanel`

Exibido quando `activeInsertItem === 'dynamicPlaceholder'`.

Conteúdo: grade de **6 cards de placeholder** em 2 colunas, cada um representando um tipo de placeholder dinâmico inserível. Cada card tem fundo cinza claro, borda tracejada colorida e um label centralizado com badge colorido — exatamente como aparecem no canvas.

```tsx
// InsertDynamicPlaceholderPanel.tsx

type PlaceholderType = 'logo' | 'background' | 'jellybean' | 'media' | 'audio'

const placeholders: PlaceholderItem[] = [
  { id: 'logo',       label: 'Logo',       borderColor: '#7B2FFF', badgeColor: '#7B2FFF' },
  { id: 'background', label: 'Background', borderColor: '#22C55E', badgeColor: '#22C55E' },
  { id: 'jellybean',  label: 'Jellybean',  borderColor: '#3B82F6', badgeColor: '#3B82F6' },
  { id: 'media',      label: 'Media',      borderColor: '#3B82F6', badgeColor: '#3B82F6' },
  { id: 'audio',      label: 'Audio',      borderColor: '#F97316', badgeColor: '#F97316' },
]

// PlaceholderCard — card com borda tracejada colorida + badge label centralizado
<div
  className="relative flex items-center justify-center rounded-xl bg-gray-100 h-[110px] cursor-pointer hover:opacity-80"
  style={{ border: `2px dashed ${placeholder.borderColor}` }}
>
  <span
    className="text-xs font-semibold text-white px-2 py-0.5 rounded-full"
    style={{ backgroundColor: placeholder.badgeColor }}
  >
    {placeholder.label}
  </span>
</div>
```

---

### COMPONENTE: `InsertAnnotationPanel`

Exibido quando `activeInsertItem === 'annotation'`.

Conteúdo: três elementos empilhados verticalmente:

```tsx
// InsertAnnotationPanel.tsx
<div className="flex flex-col gap-3 px-4 py-4 overflow-y-auto overflow-x-hidden">

  {/* 1. Botão de Upload */}
  <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 font-medium">
    <Upload size={16} />
    Upload
  </button>

  {/* 2. Botão "Add new annotation" — outline, full width, texto vermelho/coral */}
  <button className="w-full border border-red-400 text-red-500 text-sm rounded-lg py-2 hover:bg-red-50 transition-colors">
    Add new annotation
  </button>

  {/* 3. Linha divisória horizontal com seta apontando para a direita — representa uma annotation de linha */}
  <div className="flex items-center w-full py-2">
    <div className="flex-1 h-px bg-red-400" />
    <ChevronRight size={14} className="text-red-400 shrink-0" />
  </div>

  {/* 4. Preview de texto de annotation */}
  <div className="flex flex-col gap-1 mt-2">
    <span className="text-2xl font-bold text-gray-800">Create header</span>
    <span className="text-base font-semibold text-gray-700">Create sub header</span>
    <span className="text-sm text-gray-500">Create body text</span>
  </div>

</div>
```

---

### COMPONENTE: `InsertShapesPanel`

Exibido quando `activeInsertItem === 'shapes'`.

Conteúdo: barra de busca no topo + duas seções: **Lines** e **Shapes**.

```tsx
// InsertShapesPanel.tsx
<div className="flex flex-col h-full overflow-hidden">

  {/* Search */}
  <div className="px-3 pt-3 pb-2 shrink-0">
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 h-8">
      <Search size={13} className="text-gray-400 shrink-0" />
      <input className="flex-1 text-xs outline-none bg-transparent placeholder:text-gray-400" placeholder="search lines and shapes" />
    </div>
  </div>

  <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3">

    {/* Seção Lines */}
    <p className="text-xs font-semibold text-gray-500 mb-2">Lines</p>
    <div className="flex flex-col gap-2 mb-4 w-full">
      {/* Linha sólida */}
      <div className="w-full h-px bg-gray-400 cursor-pointer hover:bg-[#5B4EFF]" />
      {/* Linha tracejada */}
      <div className="w-full border-t border-dashed border-gray-400 cursor-pointer hover:border-[#5B4EFF]" />
      {/* Linha pontilhada */}
      <div className="w-full border-t border-dotted border-gray-400 cursor-pointer hover:border-[#5B4EFF]" />
      {/* Linha com seta */}
      <div className="flex items-center w-full cursor-pointer group">
        <div className="flex-1 h-px bg-gray-400 group-hover:bg-[#5B4EFF]" />
        <ChevronRight size={12} className="text-gray-400 group-hover:text-[#5B4EFF] shrink-0" />
      </div>
      {/* demais variações de linha conforme Figma */}
    </div>

    {/* Seção Shapes */}
    <p className="text-xs font-semibold text-gray-500 mb-2">Shapes</p>
    <div className="grid grid-cols-4 gap-2 w-full">
      {shapes.map(shape => (
        <ShapeIcon
          key={shape.id}
          icon={shape.icon}
          onClick={() => insertShapeOnCanvas(shape)}
        />
      ))}
    </div>
    {/* Shapes visíveis no Figma: star (filled), star (outline), heart, home,
        cloud, arrow-up, arrow-down, arrow-left, arrow-right, arrows, triangle-up,
        triangle-down, play, warning, warning-outline, square, square-outline,
        minimize, circle, play-circle, check-circle, check-circle-outline,
        circle-filled, arrow-up-circle, plus-circle, resize, image, person,
        person-add, persons, person-remove, person-outline, emoji-add, emoji,
        settings, trophy, bulb, symbols, mug, lte, walking, letter-e, asterisk,
        wheelchair, bug, bank, infinity, plane, anchor, clock */}
  </div>
</div>
```

**`ShapeIcon`:** botão quadrado `w-10 h-10`, fundo transparente, `rounded-md`, exibe o ícone centralizado em cinza escuro. Ao hover: fundo `bg-gray-100` e ícone `text-[#5B4EFF]`.

---

### COMPONENTE: `InsertIconsPanel`

Exibido quando `activeInsertItem === 'icons'`.

Conteúdo: barra de busca + grade de ícones de **social media e marcas** em grid de 3 colunas. Os ícones são coloridos/brandados (Twitter, Instagram, Facebook, WhatsApp, Chrome, YouTube, Netflix, Houzz, etc.).

```tsx
// InsertIconsPanel.tsx
<div className="flex flex-col h-full overflow-hidden">

  {/* Search */}
  <div className="px-3 pt-3 pb-2 shrink-0">
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 h-8">
      <Search size={13} className="text-gray-400 shrink-0" />
      <input className="flex-1 text-xs outline-none bg-transparent placeholder:text-gray-400" placeholder="search icons" />
    </div>
  </div>

  {/* Grid de ícones brandados — 3 colunas */}
  <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3">
    <div className="grid grid-cols-3 gap-2 w-full">
      {icons.map(icon => (
        <BrandIconCard
          key={icon.id}
          src={icon.src}
          alt={icon.name}
          onClick={() => insertIconOnCanvas(icon)}
        />
      ))}
    </div>
  </div>
</div>
```

**`BrandIconCard`:** card quadrado `w-full aspect-square`, fundo `bg-white`, `rounded-lg`, `border border-gray-200`. Exibe a imagem do ícone centralizada com `object-contain p-2`. Ao hover: `border-[#5B4EFF]`.

---

### COMPONENTE: `InsertAudioPanel`

Exibido quando `activeInsertItem === 'audio'`.

Conteúdo: botão de upload + barra de busca + link de placeholder + lista de arquivos de áudio.

```tsx
// InsertAudioPanel.tsx
<div className="flex flex-col h-full overflow-hidden">

  {/* Upload button — full width, fundo roxo sólido */}
  <div className="px-3 pt-3 pb-2 shrink-0">
    <button className="w-full flex items-center justify-center gap-2 bg-[#5B4EFF] text-white text-sm font-medium rounded-full py-2 hover:bg-[#4a3fd4] transition-colors">
      <Upload size={14} />
      Upload Media
    </button>
    <p className="text-xs text-gray-400 text-center mt-1">ACC, AIFF, MP3 or WAV (Max. 3MB)</p>
  </div>

  {/* Search */}
  <div className="px-3 pb-2 shrink-0">
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 h-8">
      <Search size={13} className="text-gray-400 shrink-0" />
      <input className="flex-1 text-xs outline-none bg-transparent placeholder:text-gray-400" placeholder="search audio files" />
    </div>
  </div>

  {/* Insert placeholder link */}
  <div className="px-3 pb-2 shrink-0">
    <button className="text-sm font-medium text-[#5B4EFF] hover:underline">
      Insert placeholder
    </button>
  </div>

  {/* Lista de arquivos */}
  <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3">
    {audioFiles.map(file => (
      <AudioFileRow key={file.id} file={file} />
    ))}
  </div>
</div>
```

**`AudioFileRow`:** linha `flex justify-between items-center py-2 border-b border-gray-100 w-full`. Esquerda: nome do arquivo (`text-sm text-gray-800`, truncado com `truncate`). Direita: duração (`text-xs text-gray-400 shrink-0 ml-2`). Ao hover: fundo `bg-gray-50`. Ao clicar: insere o áudio no template.

Arquivos visíveis no Figma (mock data):
```tsx
const audioFiles = [
  { id: '1', name: 'Audio File Name 1.mp4',                  duration: '1:30'  },
  { id: '2', name: 'Audio File Name 2.aiff',                 duration: '1:30'  },
  { id: '3', name: 'Audio File Name 3.wav',                  duration: '00:07' },
  { id: '4', name: 'Audio File Name 4.wav',                  duration: '00:04' },
  { id: '5', name: 'Audio File Really Very Long Name...',    duration: '00:12' },
  { id: '6', name: 'Audio File Name 5.aiff',                 duration: '01:22' },
  { id: '7', name: 'Audio File Name 6.acc',                  duration: '00:34' },
  { id: '8', name: 'Audio File Name 7.aiff',                 duration: '00:13' },
  { id: '9', name: 'Audio File Name 8.aiff',                 duration: '00:17' },
]
```

---

### COMPONENTE: `InsertAIVoicePanel`

Exibido quando `activeInsertItem === 'aiVoice'`.

Conteúdo: barra de busca + contador de resultados + botão de adicionar + lista de AI Voices.

```tsx
// InsertAIVoicePanel.tsx
<div className="flex flex-col h-full overflow-hidden">

  {/* Search + botão adicionar */}
  <div className="px-3 pt-3 pb-2 shrink-0">
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 h-8 min-w-0">
        <Search size={13} className="text-gray-400 shrink-0" />
        <input className="flex-1 min-w-0 text-xs outline-none bg-transparent placeholder:text-gray-400" placeholder="search AI Voices" />
      </div>
      {/* Botão "+" roxo circular */}
      <button className="w-8 h-8 rounded-full bg-[#5B4EFF] flex items-center justify-center shrink-0 hover:bg-[#4a3fd4] transition-colors">
        <Plus size={14} className="text-white" />
      </button>
    </div>
  </div>

  {/* Contador */}
  <div className="px-3 pb-2 shrink-0">
    <span className="text-xs text-gray-400">240 items</span>
  </div>

  {/* Lista de AI Voices */}
  <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3">
    {aiVoices.map(voice => (
      <AIVoiceRow key={voice.id} voice={voice} />
    ))}
  </div>
</div>
```

**`AIVoiceRow`:** linha `flex justify-between items-center py-3 border-b border-gray-100 w-full`. Esquerda: nome da voice (`text-sm text-gray-800`). Direita: duração (`text-xs text-gray-400 shrink-0`). Ao hover: fundo `bg-gray-50`.

AI Voices visíveis no Figma (mock data):
```tsx
const aiVoices = [
  { id: '1', name: 'AI Voice Over 1', duration: '0:20' },
  { id: '2', name: 'AI Voice Over 2', duration: '0:30' },
  { id: '3', name: 'AI Voice Over 3', duration: '0:45' },
  { id: '4', name: 'AI Voice Over 4', duration: '0:45' },
]
```

---

### COMPONENTE: `InsertComponentPanel`

Exibido quando `activeInsertItem === 'component'`.

Conteúdo: barra de busca + botão de filtro + grade de cards de componentes reutilizáveis.

```tsx
// InsertComponentPanel.tsx
<div className="flex flex-col h-full overflow-hidden">

  {/* Search + filtro */}
  <div className="px-3 pt-3 pb-2 shrink-0 flex items-center gap-2 w-full">
    <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 h-8 min-w-0">
      <Search size={13} className="text-gray-400 shrink-0" />
      <input className="flex-1 min-w-0 text-xs outline-none bg-transparent placeholder:text-gray-400" placeholder="search components" />
    </div>
    <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-100 shrink-0">
      <SlidersHorizontal size={13} className="text-gray-500" />
    </button>
  </div>

  {/* Grid de componentes — 2 colunas */}
  <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3">
    <div className="grid grid-cols-2 gap-2 w-full">
      {components.map(component => (
        <ComponentCard
          key={component.id}
          component={component}
          onClick={() => insertComponentOnCanvas(component)}
        />
      ))}
    </div>
  </div>
</div>
```

**`ComponentCard`:** card `rounded-lg border border-gray-200 bg-white overflow-hidden cursor-pointer hover:border-[#5B4EFF]`. Exibe um preview visual do componente (thumbnail) com informações como nome e campos dinâmicos (ex: `{jobName}`, `{material}`, variáveis de feed). Inclui também um badge roxo de identificação no canto superior do thumbnail.

---

### ROTEADOR DO `InsertSubPanel`

```tsx
// InsertSubPanel.tsx
export function InsertSubPanel() {
  const { activeInsertItem } = useDesignWorkspaceStore()

  const panelMap: Record<InsertMenuItem, ReactNode> = {
    text:               <InsertTextPanel />,
    dynamicPlaceholder: <InsertDynamicPlaceholderPanel />,
    imagesVideo:        <InsertImagesVideoPanel />, // placeholder — conteúdo ainda não definido
    component:          <InsertComponentPanel />,
    annotation:         <InsertAnnotationPanel />,
    shapes:             <InsertShapesPanel />,
    icons:              <InsertIconsPanel />,
    audio:              <InsertAudioPanel />,
    aiVoice:            <InsertAIVoicePanel />,
  }

  const labelMap: Record<InsertMenuItem, string> = {
    text:               'Text',
    dynamicPlaceholder: 'Dynamic Placeholder',
    imagesVideo:        'Images / Video',
    component:          'Component',
    annotation:         'Annotation',
    shapes:             'Shapes',
    icons:              'Icons',
    audio:              'Audio',
    aiVoice:            'AI Voice',
  }

  if (!activeInsertItem) return null

  return (
    <div className="flex flex-col h-full">
      <InsertSubPanelHeader
        title={labelMap[activeInsertItem]}
        onClose={() => setActiveInsertItem(null)}
      />
      <div className="flex-1 overflow-hidden">
        {panelMap[activeInsertItem]}
      </div>
    </div>
  )
}
```

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Accent / brand color | `#5B4EFF` |
| Accent hover | `#4a3fd4` |
| Card border padrão | `#E2E2E2` |
| Card border hover | `#5B4EFF` |
| Card background | `#FFFFFF` |
| Panel background | `#F5F5F5` (cinza claro interno) |
| Text primary | `#111111` |
| Text secondary | `#6B6B6B` |
| Text placeholder/muted | `#9CA3AF` |
| Placeholder Logo border | `#7B2FFF` (roxo) |
| Placeholder Background border | `#22C55E` (verde) |
| Placeholder Jellybean/Media border | `#3B82F6` (azul) |
| Placeholder Audio border | `#F97316` (laranja) |
| Search input height | `32px` |
| Card border-radius | `rounded-lg` = `8px` |
| Overflow horizontal | `hidden` — nunca `auto` ou `scroll` |
| Overflow vertical | `auto` |