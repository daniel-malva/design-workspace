Perfeito! Consegui visualizar o frame completo. Agora tenho tudo que preciso. Aqui está o prompt completo para o **Figma Make**:

---

## 🧱 PROMPT — Design Workspace (Canvas Editor)

---

### STACK & BOAS PRÁTICAS

```
Stack: React + TypeScript + Tailwind CSS + shadcn/ui components
Boas práticas:
- Todos os componentes devem ser reutilizáveis, nomeados semanticamente conforme sua função na UI
- Separar em arquivos individuais por componente (ex: LeftRail.tsx, CanvasArea.tsx, RightPanel.tsx, Timeline.tsx)
- Usar TypeScript com interfaces e tipos explícitos para props
- Tailwind para estilização, sem CSS inline ou arquivos .css separados
- shadcn/ui para elementos de UI base (Button, Select, Separator, Toggle, Tooltip, etc.)
- Estado global via Context ou Zustand para controlar painéis abertos, item selecionado no canvas, modo preview, etc.
```

---

### VISÃO GERAL DA INTERFACE

Construa uma aplicação chamada **Design Workspace** — um Canvas Editor de templates que gera assets dinâmicos a partir de feeds de dados. A UI é dividida em 4 regiões principais:

1. **LeftRail** — navegação lateral esquerda (sempre visível, colapsada por padrão)
2. **LeftPane** — painel lateral expandido à esquerda (exibido ao clicar em um item do LeftRail)
3. **CanvasArea** — área central de edição do template
4. **RightPanel** — painel lateral direito com propriedades contextuais do elemento selecionado
5. **Timeline** — barra inferior para edição de vídeo/animação

---

### COMPONENTE: `LeftRail`

Rail fixo vertical à esquerda com ~64px de largura. Fundo escuro/neutro. Contém:

**Topo:**
- Botão `ExitWorkspaceButton` com ícone de seta para a esquerda (←) e label "Exit Design Workspace". Ao clicar, retorna o usuário à tela anterior.

**Menu de navegação** (ícone + label abaixo, empilhados verticalmente):

| Item | Ícone | Label |
|---|---|---|
| Insert | `+` (círculo) | Insert |
| Layers | ícone de camadas | Layers |
| Templates | ícone de template | Templates |
| Brand Kit | ícone de marca | Brand Kit |
| AI Tools | ícone de IA | AI Tools |
| Configure | ícone de engrenagem | Configure |
| Export | ícone de exportar | Export |
| Share | ícone de compartilhar | Share |

**Rodapé:**
- Botão `TimelineToggleButton` com ícone de timeline e label "Timeline" — exibe/oculta o painel de Timeline

**Comportamento:**
- Ao clicar em qualquer item do menu, o `LeftPane` é exibido com o conteúdo correspondente
- O item ativo deve ter estado visual destacado (fundo levemente iluminado ou cor de acento)
- Crie o tipo `LeftRailItem = 'insert' | 'layers' | 'templates' | 'brandKit' | 'aiTools' | 'configure' | 'export' | 'share'`

---

### COMPONENTE: `LeftPane`

Painel lateral que aparece à direita do `LeftRail` quando um item é selecionado. Largura ~260px. Animação de slide-in da esquerda. Pode ser fechado.

**Quando `activePanel === 'insert'` → exibir `InsertPanel`:**

Lista de elementos inseríveis no template, cada um com ícone + label + shortcut à direita:

| Elemento | Shortcut |
|---|---|
| Text | T |
| Dynamic Placeholder | M |
| Images / Video | U |
| Component | C |
| Annotation | A |
| Shapes | H |
| Icons | I |
| Audio | ⇧ A |
| AI Voice | ⌘ V |

Cada item é clicável e ao ser clicado adiciona o elemento correspondente ao canvas. Crie o tipo `InsertableElement` com todos esses valores.

**Quando `activePanel === 'layers'` → exibir `LayersPanel`:**
- Lista hierárquica de todas as layers/objetos presentes no canvas
- Cada layer com ícone do tipo de elemento, nome editável, ícone de visibilidade (olho) e ícone de lock
- Suporte a drag-and-drop para reordenar layers

**Quando `activePanel === 'brandKit'` → exibir `BrandKitPanel`:**
- Select dropdown para escolher uma Brand (ex: "Select a brand")
- Lista de marcas disponíveis conectáveis ao template

**Quando `activePanel === 'aiTools'` → exibir `AIToolsPanel`:**
- Ferramentas de inteligência artificial aplicáveis ao template

**Quando `activePanel === 'configure'` → exibir `ConfigurePanel`:**
- Interface para conectar o template a um feed de dados externo (CSV, API, etc.)
- Campo para URL/fonte do feed
- Mapeamento de colunas do feed para placeholders do template

**Quando `activePanel === 'export'` → exibir `ExportPanel`:**
- Opções de formato de exportação
- Destino: local ou dentro da plataforma

---

### COMPONENTE: `TopBar`

Barra superior horizontal sobre o canvas. Contém:

**Esquerda:**
- `BreadcrumbNav`: exibe "Design Workspace › [Nome do Template]" — ex: "Design Workspace › APR Square Banner 600 x 600px"

**Direita:**
- `PreviewModeToggle`: Toggle switch com label "Preview Mode". Ao ativar, entra em modo de preview (desabilita edição, oculta handles de seleção)
- `SaveSplitButton`: Split button com:
  - Botão principal: "Save" (salva versão atual)
  - Dropdown com opções:
    - "Save new version" — salva uma nova versão do template
    - "Push changes" — envia alterações para todos os assets gerados a partir desse template (ícone de sincronização/nuvem)

---

### COMPONENTE: `CanvasArea`

Grande área central de edição. Fundo cinza claro (#F0F0F0 ou similar). Contém:

**`CanvasHeader`** (acima do canvas, inline):
- Label "Canvas 1" à esquerda
- Ícone de menu (⋮) à direita com opções do canvas (renomear, duplicar, deletar página)

**`CanvasFrame`**:
- Área branca delimitada representando o template (ex: 600x600px para Square Banner)
- Label abaixo indicando o tamanho: "Square Banner: 600px x 600px"
- Suporte a múltiplas páginas (abas ou miniaturas)
- Elementos no canvas têm handles de seleção (bounding box com alças nos cantos e bordas)
- Quando um elemento está selecionado, exibe bounding box com cor de destaque (azul/verde/roxo conforme tipo)
- Elementos podem ser: texto, imagem, placeholder dinâmico, shape, ícone, componente, etc.
- Zoom in/out via scroll ou controles

**Elementos de exemplo no canvas:**
- Um label/badge roxo ("Label") — representa um texto com Dynamic Placeholder
- Um elemento "Jellybean" — representa um componente de texto posicionado
- Um elemento "Logo Primary" — representa um placeholder de imagem/logo

---

### COMPONENTE: `RightPanel`

Painel lateral direito (~260px) com propriedades do elemento selecionado no canvas. O conteúdo muda conforme o tipo do elemento selecionado.

**Quando um elemento de texto está selecionado → exibir `TextPropertiesPanel`:**

Seção **Position**:
- Alinhamento horizontal e vertical (grid de botões de alinhamento 3x2)
- Campos X, Y (posição)
- Campos W, H (largura e altura)

Seção **Layer**:
- Ícone de modo de blend + Select "Pass through"
- Input de opacidade (%) — ex: "100%"
- Botão `+` para adicionar layer effect

Seção **Brand**:
- Select "Select a brand" — vincula o elemento a uma brand específica

Seção **Text**:
- Font family select (ex: "Roboto") com botão de configurações (⚙)
- Font weight select (ex: "Bold") + Font size input (ex: 34)
- Letter spacing (A|) e Line height (Ā) inputs
- Alinhamento de texto (esquerda, centro, direita, justificado)
- Alinhamento vertical (topo, meio, baixo)
- Botões de estilo: Bold (B), Italic (I), Underline (U), Strikethrough (S)
- Toggle "Aa" para capitalização

Seção **Style**:
- **Fill**: color swatch + hex input (ex: "000000") + opacidade (%) + ícone de visibilidade
  - Botão `−` para remover fill
- **Stroke**: botão `+` para adicionar stroke
- **Shadow**: botão `+` para adicionar shadow

---

### COMPONENTE: `Timeline`

Barra inferior expansível. Visibilidade controlada pelo botão Timeline no `LeftRail`.

**Controles de playback** (esquerda):
- Botões: Play (▶), Step back (⏮), Step forward (⏭)
- Timecode atual: "00:00.000 (0 Frames)"
- Timecode total: "10:00.000 (240 Frames)"

**Track area** (centro/direita):
- Área de tracks para layers/animações
- Régua de tempo no topo
- Cada layer do canvas tem uma faixa horizontal correspondente
- Keyframes representados por diamantes na faixa

**Controles adicionais**:
- Botão para expandir/colapsar timeline (chevron ˄/˅)
- Slider de zoom da timeline
- Ícone de configurações da timeline

---

### ESTADO GLOBAL — `useDesignWorkspaceStore`

```typescript
interface DesignWorkspaceState {
  activePanel: LeftRailItem | null        // painel esquerdo aberto
  selectedElementId: string | null        // elemento selecionado no canvas
  selectedElementType: ElementType | null // tipo do elemento selecionado
  isPreviewMode: boolean                  // modo preview ativo
  isTimelineVisible: boolean              // timeline visível
  canvasPages: CanvasPage[]               // páginas do canvas
  activePageId: string                    // página ativa
  layers: Layer[]                         // layers do canvas
  templateName: string                    // nome do template
}
```

---

### LAYOUT GERAL

```
┌─────────────────────────────────────────────────────┐
│                     TopBar                          │
├──────┬──────────┬──────────────────────┬────────────┤
│      │          │                      │            │
│ Left │ Left     │    CanvasArea        │  Right     │
│ Rail │ Pane     │                      │  Panel     │
│      │(slide-in)│                      │            │
│      │          │                      │            │
├──────┴──────────┴──────────────────────┴────────────┤
│                    Timeline                         │
└─────────────────────────────────────────────────────┘
```

- `LeftPane` e `RightPanel` são overlays ou painéis que empurram o canvas (behavior a definir)
- `Timeline` é colapsável pelo rodapé do `LeftRail`
- A interface inteira deve ocupar 100vw × 100vh sem scroll externo

---

### NOTAS FINAIS

- Todos os ícones devem usar `lucide-react`
- Todos os componentes shadcn/ui usados devem ser importados corretamente (`Button`, `Select`, `Separator`, `Toggle`, `Tooltip`, `Input`, `Slider`, `DropdownMenu`, `Breadcrumb`)
- Dark mode opcional, mas a interface base usa tons neutros claros com acentos em roxo/azul (conforme o Figma)
- Garanta que cada componente seja exportado como named export e tenha sua própria interface de props tipada