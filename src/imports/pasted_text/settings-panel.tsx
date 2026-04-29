Deixa eu inspecionar o frame do Settings antes de gerar o prompt.Tenho todos os detalhes. Aqui está o prompt:

---

## 🧱 PROMPT V26 — Design Workspace — SettingsPanel no RightPanel ao clicar em Settings

---

### STACK & BOAS PRÁTICAS

```
Stack: React + TypeScript + Tailwind CSS + shadcn/ui components
Boas práticas:
- Componentes reutilizáveis nomeados semanticamente por função
- TypeScript com interfaces e tipos explícitos para todas as props
- Tailwind para estilização, sem CSS inline ou arquivos .css separados
- shadcn/ui para Tabs, Input, Select, RadioGroup, Button, Separator
- Estado global via Zustand (useDesignWorkspaceStore)
```

---

### REGRA PRINCIPAL — Settings abre o RightPanel

Clicar em **Settings** no `LeftRail` deve:
1. Definir `activePanel = 'settings'` no store
2. Forçar a abertura do `RightPanel` via `rightPanelForcedOpen = true`
3. Exibir o `SettingsPanel` como conteúdo do `RightPanel`

Ao clicar no fundo cinza do canvas (comportamento já implementado no V20), ambos fecham normalmente.

---

### STORE — Ajuste na lógica do RightPanel

```tsx
// store/useDesignWorkspaceStore.ts

// RightPanel abre quando:
// 1. há elemento selecionado no canvas, OU
// 2. activePanel === 'settings' (Settings força a abertura)
const isRightPanelVisible =
  selectedElementId !== null ||
  activePanel === 'settings'

// Não é mais necessário o campo rightPanelForcedOpen separado —
// a condição activePanel === 'settings' já cobre o caso
```

---

### COMPONENTE: `SettingsPanel`

Exibido no `RightPanel` quando `activePanel === 'settings'`. Estrutura fiel ao Figma: duas abas no topo (**Template** e **Components**), com o conteúdo da aba Template ativo por padrão.

```tsx
// SettingsPanel.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

export function SettingsPanel() {
  return (
    <div className="flex flex-col gap-3 w-full h-full overflow-hidden">

      {/* Abas — Template | Components */}
      <Tabs defaultValue="template" className="w-full flex flex-col flex-1 overflow-hidden">

        <TabsList className="w-full justify-start rounded-none bg-transparent px-0 h-auto border-b border-[rgba(0,0,0,0.12)] shrink-0">
          <TabsTrigger
            value="template"
            className="
              px-4 py-[9px] rounded-none capitalize
              text-[14px] font-medium tracking-[0.4px] leading-6
              data-[state=active]:text-[#473bab]
              data-[state=active]:border-b-2
              data-[state=active]:border-[#473bab]
              data-[state=inactive]:text-[#686576]
              bg-transparent shadow-none
            "
          >
            Template
          </TabsTrigger>
          <TabsTrigger
            value="components"
            className="
              px-4 py-[9px] rounded-none capitalize
              text-[14px] font-medium tracking-[0.4px] leading-6
              data-[state=active]:text-[#473bab]
              data-[state=active]:border-b-2
              data-[state=active]:border-[#473bab]
              data-[state=inactive]:text-[#686576]
              bg-transparent shadow-none
            "
          >
            Components
          </TabsTrigger>
        </TabsList>

        {/* Aba: Template */}
        <TabsContent value="template" className="flex-1 overflow-y-auto overflow-x-hidden mt-0">
          <SettingsTemplateTab />
        </TabsContent>

        {/* Aba: Components — reservada para uso futuro */}
        <TabsContent value="components" className="flex-1 overflow-y-auto overflow-x-hidden mt-0">
          <SettingsComponentsTab />
        </TabsContent>

      </Tabs>
    </div>
  )
}
```

---

### COMPONENTE: `SettingsTemplateTab`

Conteúdo completo da aba **Template**, fiel ao Figma — campos empilhados verticalmente com `gap-3`:

```tsx
// SettingsTemplateTab.tsx
export function SettingsTemplateTab() {
  const [format, setFormat] = useState<'static' | 'video'>('static')

  return (
    <div className="flex flex-col gap-3 w-full px-0 py-2 overflow-x-hidden">

      {/* Campo: Template Name — obrigatório (*) */}
      <SettingsField label="Template Name" required>
        <Input
          className="w-full h-9 text-xs bg-[#f9fafa] border-[#dddce0] text-[#1f1d25]"
          defaultValue="{default template name}"
        />
      </SettingsField>

      {/* Campo: Template Type — obrigatório (*), select com valor "Non-HTML" */}
      <SettingsField label="Template Type" required>
        <Select defaultValue="non-html">
          <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border-[#cac9cf]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="non-html">Non-HTML</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
          </SelectContent>
        </Select>
      </SettingsField>

      {/* Campo: Asset Type — obrigatório (*), select vazio */}
      <SettingsField label="Asset Type" required>
        <Select>
          <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border-[#cac9cf]">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>
            {/* opções futuras */}
          </SelectContent>
        </Select>
      </SettingsField>

      {/* Campo: Brand — select vazio */}
      <SettingsField label="Brand">
        <Select>
          <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border-[#cac9cf]">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>
            {/* opções futuras */}
          </SelectContent>
        </Select>
      </SettingsField>

      {/* Campo: Accounts — select vazio */}
      <SettingsField label="Accounts">
        <Select>
          <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border-[#cac9cf]">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>
            {/* opções futuras */}
          </SelectContent>
        </Select>
      </SettingsField>

      {/* Campo: Format — radio group Static | Video */}
      <div className="flex flex-col gap-1 w-full">
        <label className="text-[14px] text-[#1f1d25] tracking-[0.15px]">Format</label>
        <RadioGroup
          value={format}
          onValueChange={(v) => setFormat(v as 'static' | 'video')}
          className="flex flex-row items-center gap-0"
        >
          <div className="flex items-center">
            <RadioGroupItem value="static" id="format-static" className="text-[#473bab]" />
            <Label htmlFor="format-static" className="ml-2 text-[14px] text-[#1f1d25] tracking-[0.15px] cursor-pointer">
              Static
            </Label>
          </div>
          <div className="flex items-center">
            <RadioGroupItem value="video" id="format-video" className="text-[#473bab]" />
            <Label htmlFor="format-video" className="ml-2 text-[14px] text-[#1f1d25] tracking-[0.15px] cursor-pointer">
              Video
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Seção: Dimensions */}
      <SettingsDimensionsSection />

      {/* Seção: Metadata — com borda arredondada */}
      <SettingsMetadataSection />

    </div>
  )
}
```

---

### COMPONENTE: `SettingsDimensionsSection`

```tsx
// SettingsDimensionsSection.tsx
export function SettingsDimensionsSection() {
  return (
    <div className="flex flex-col gap-3 w-full">

      {/* Select de Dimensions — mostra ícone + "Custom" */}
      <SettingsField label="Dimensions">
        <Select defaultValue="custom">
          <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border-[#cac9cf]">
            <div className="flex items-center gap-2">
              <Maximize2 size={14} className="text-[#1f1d25] shrink-0" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Custom</SelectItem>
            <SelectItem value="600x600">600 × 600 (Square)</SelectItem>
            <SelectItem value="1920x1080">1920 × 1080 (Landscape)</SelectItem>
            <SelectItem value="1080x1920">1080 × 1920 (Portrait)</SelectItem>
          </SelectContent>
        </Select>
      </SettingsField>

      {/* W / H — dois campos lado a lado */}
      <div className="flex items-center gap-3 w-full">

        <div className="flex flex-1 items-center gap-0 min-w-0">
          <div className="w-10 shrink-0 flex items-center justify-center">
            <span className="text-[12px] text-[#1f1d25] tracking-[0.15px]">W</span>
          </div>
          <Input
            className="flex-1 min-w-0 h-9 text-xs bg-[#f9fafa] border-[#cac9cf]"
            placeholder=""
          />
        </div>

        <div className="flex flex-1 items-center gap-0 min-w-0">
          <div className="w-10 shrink-0 flex items-center justify-center">
            <span className="text-[12px] text-[#1f1d25] tracking-[0.15px]">H</span>
          </div>
          <Input
            className="flex-1 min-w-0 h-9 text-xs bg-[#f9fafa] border-[#cac9cf]"
            placeholder=""
          />
        </div>

      </div>
    </div>
  )
}
```

---

### COMPONENTE: `SettingsMetadataSection`

Seção com borda arredondada, título **Metadata** + campos Tags, Offer Types e botão Add Field:

```tsx
// SettingsMetadataSection.tsx
export function SettingsMetadataSection() {
  return (
    <div className="flex flex-col gap-3 w-full border border-[rgba(0,0,0,0.12)] rounded-xl p-3">

      {/* Título */}
      <p className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px]">Metadata</p>

      {/* Tags — select */}
      <SettingsField label="Tags">
        <Select>
          <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border-[#cac9cf]">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>
            {/* tags futuras */}
          </SelectContent>
        </Select>
      </SettingsField>

      {/* Offer Types — select */}
      <SettingsField label="Offer Types">
        <Select>
          <SelectTrigger className="w-full h-9 text-xs bg-[#f9fafa] border-[#cac9cf]">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>
            {/* offer types futuros */}
          </SelectContent>
        </Select>
      </SettingsField>

      {/* Botão Add Field */}
      <button className="flex items-center gap-2 text-[13px] font-medium text-[#473bab] tracking-[0.46px] capitalize px-1 py-1 rounded-full hover:bg-[#473bab14] transition-colors w-fit">
        <Plus size={14} className="text-[#473bab]" />
        Add Field
      </button>

    </div>
  )
}
```

---

### COMPONENTE: `SettingsField` — wrapper reutilizável

Label + campo empilhados, com suporte a campo obrigatório (asterisco vermelho):

```tsx
// SettingsField.tsx
interface SettingsFieldProps {
  label: string
  required?: boolean
  children: ReactNode
}

export function SettingsField({ label, required, children }: SettingsFieldProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center gap-0.5 px-1">
        {required && (
          <span className="text-[12px] text-[#d2323f] leading-3">*</span>
        )}
        <label className="text-[12px] text-[#686576] tracking-[0.15px] leading-3">
          {label} {required && <span className="text-[#d2323f]">*</span>}
        </label>
      </div>
      {children}
    </div>
  )
}
```

---

### COMPONENTE: `SettingsComponentsTab`

Estado vazio — reservado para uso futuro:

```tsx
// SettingsComponentsTab.tsx
export function SettingsComponentsTab() {
  return (
    <div className="flex flex-col items-center justify-center h-32 px-6 text-center">
      <p className="text-xs text-gray-400">
        Components settings will appear here.
      </p>
    </div>
  )
}
```

---

### INTEGRAÇÃO — `RightPanel` e `PropertiesContent`

```tsx
// RightPanel.tsx
const isRightPanelVisible =
  selectedElementId !== null ||
  activePanel === 'settings'   // ← Settings força abertura

if (!isRightPanelVisible) return null

// PropertiesContent.tsx — adicionar rota para Settings
if (activePanel === 'settings') {
  return <SettingsPanel />
}
```

---

### DIAGRAMA DO FLUXO

```
Usuário clica em "Settings" no LeftRail
        ↓
activePanel = 'settings'
        ↓
LeftPane: activePanel === 'settings' → não é um painel de insert
          → LeftPane não abre (Settings só abre o RightPanel)
        ↓
RightPanel: isRightPanelVisible = true (activePanel === 'settings')
RightPanel header: "Settings"
RightPanel body: <SettingsPanel />
        ↓
Usuário clica na área cinza do canvas
        ↓
setActivePanel(null) + selectElement(null)
        ↓
RightPanel fecha — isRightPanelVisible = false
```

> **Nota:** Settings **não abre o LeftPane** — apenas o RightPanel. O LeftRail permanece com o item Settings destacado, mas nenhum painel esquerdo é exibido. O BreadcrumbNav e a Timeline ajustam suas posições normalmente como se o LeftPane estivesse fechado.

---

### TOKENS DE DESIGN — REFERÊNCIA

| Token | Valor |
|---|---|
| Tab ativa — texto | `#473bab` |
| Tab ativa — underline | `2px solid #473bab` |
| Tab inativa — texto | `#686576` |
| Tab font | Roboto Medium 14px, tracking 0.4px, leading 24px |
| Input background | `#f9fafa` |
| Input border (outlined) | `#dddce0` |
| Input border (standard) | `#cac9cf` |
| Input height | `36px` (h-9) |
| Input font | Roboto Regular 12px, tracking 0.17px |
| Label font | Roboto Regular 12px, tracking 0.15px, cor `#686576` |
| Required asterisk | `#d2323f` |
| Section border | `1px solid rgba(0,0,0,0.12)` |
| Section border-radius | `rounded-xl` = `12px` |
| Section padding | `12px` |
| Add Field button | Roboto Medium 13px, cor `#473bab`, tracking 0.46px |
| Overflow X | `hidden` |
| Overflow Y | `auto` |