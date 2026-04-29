import { useState, useEffect, type ReactNode } from 'react';
import { FilePlus, Settings2, X, ChevronDown, LayoutTemplate } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Separator } from './ui/separator';
import { RightPanelHeader } from './RightPanelHeader';
import { BrandKitSelector } from './BrandKitSelector';
import { useConfigureVariables } from '../hooks/useConfigureVariables';
import type { TextVariable, MediaVariable } from '../hooks/useConfigureVariables';

// ══════════════════════════════════════════════════════════════════
// LOCAL TYPES
// ══════════════════════════════════════════════════════════════════

interface MediaValue {
  source:  string;
  preview: string | null;
}

// ══════════════════════════════════════════════════════════════════
// SHARED PRIMITIVES
// ══════════════════════════════════════════════════════════════════

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 w-full border border-[rgba(0,0,0,0.12)] rounded-xl p-3">
      <p className="text-[14px] text-[#1f1d25] tracking-[0.1px] leading-[1.57]" style={{ fontWeight: 500 }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[12px] text-[#686576] tracking-[0.15px] px-1 leading-3">
      {children}
    </span>
  );
}

// ── Native Select (consistent with SettingsPanel) ─────────────────
function ConfigSelect({
  value, onChange, children, outlined = false,
}: {
  value?: string;
  onChange?: (v: string) => void;
  children?: ReactNode;
  outlined?: boolean;
}) {
  return (
    <div className={`relative w-full h-9 bg-[#f9fafa] border ${outlined ? 'border-[#dddce0]' : 'border-[#cac9cf]'} rounded-[4px] flex items-center px-2`}>
      <select
        value={value ?? ''}
        onChange={e => onChange?.(e.target.value)}
        className="w-full h-full bg-transparent text-[12px] text-[#1f1d25] tracking-[0.17px] outline-none appearance-none pr-5"
      >
        {children}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
        <ChevronDown size={13} className="text-gray-400" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TEXT BLOCK — Manual (free-text inputs per variable)
// ══════════════════════════════════════════════════════════════════

function ConfigureTextBlock({
  variables, values, onChange,
}: {
  variables: TextVariable[];
  values:    Record<string, string>;
  onChange:  (key: string, val: string) => void;
}) {
  return (
    <SectionCard title="Text">
      <div className="flex flex-col gap-3 w-full">
        {variables.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1 w-full">
            <FieldLabel>{label}</FieldLabel>
            <input
              value={values[key] ?? ''}
              onChange={e => onChange(key, e.target.value)}
              className="w-full h-9 py-1.5 px-2 text-[12px] bg-[#f9fafa] border border-[#dddce0] rounded-[4px] text-[#1f1d25] tracking-[0.17px] outline-none focus:border-[#473bab] transition-colors"
              placeholder=""
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════
// TEXT BLOCK — Feed (column-mapping selects per variable)
// ══════════════════════════════════════════════════════════════════

function ConfigureFeedTextBlock({
  variables, values, onChange,
}: {
  variables: TextVariable[];
  values:    Record<string, string>;
  onChange:  (key: string, val: string) => void;
}) {
  return (
    <SectionCard title="Text">
      <div className="flex flex-col gap-3 w-full">
        {variables.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1 w-full">
            <FieldLabel>{label}</FieldLabel>
            <ConfigSelect
              value={values[key] ?? ''}
              onChange={v => onChange(key, v)}
            >
              {/* feed column options populated in future */}
            </ConfigSelect>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════
// MEDIA ITEM
// ══════════════════════════════════════════════════════════════════

function ConfigureMediaItem({
  variable, value, onChange,
}: {
  variable: MediaVariable;
  value:    MediaValue | undefined;
  onChange: (val: MediaValue) => void;
}) {
  const source   = value?.source  ?? '';
  const preview  = value?.preview ?? null;
  const hasValue = !!source;

  const sourceLabel =
    source === 'portal' ? 'Import from Portal' :
    source === 'upload' ? 'Upload' :
    'Import from Portal';

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Row: thumbnail + name + source select */}
      <div className="flex items-start gap-3 w-full">

        {/* Placeholder thumbnail */}
        <div
          className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center border-2 border-dashed"
          style={{
            borderColor:     variable.badgeColor,
            backgroundColor: `${variable.badgeColor}1a`,
          }}
        >
          <span
            className="text-white px-1 py-0.5 rounded-full text-center leading-tight"
            style={{ backgroundColor: variable.badgeColor, fontSize: '7px', fontWeight: 700 }}
          >
            {variable.name.slice(0, 3).toUpperCase()}
          </span>
        </div>

        {/* Name + source select */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <span className="text-[12px] text-[#686576] tracking-[0.15px] truncate">
            {variable.name}
          </span>
          <div className="flex items-center gap-1 bg-[#f9fafa] border border-[#cac9cf] rounded-[4px] px-2 h-9 w-full">
            <span className="flex-1 text-[12px] text-[#1f1d25] truncate tracking-[0.17px]">
              {sourceLabel}
            </span>
            {hasValue && (
              <button
                onClick={() => onChange({ source: '', preview: null })}
                className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={12} />
              </button>
            )}
            <ChevronDown size={12} className="text-gray-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* Preview / upload area */}
      <button
        className="w-full h-9 flex items-center justify-center bg-[#f9fafa] border border-[#dddce0] rounded-[4px] text-[12px] text-[#9c99a9] hover:bg-gray-50 transition-colors"
        onClick={() => { /* future: open image selector */ }}
      >
        {preview ? (
          <img src={preview} alt={variable.name} className="h-full object-contain" />
        ) : (
          'click to select image'
        )}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MEDIA BLOCK
// ══════════════════════════════════════════════════════════════════

function ConfigureMediaBlock({
  variables, values, onChange,
}: {
  variables: MediaVariable[];
  values:    Record<string, MediaValue>;
  onChange:  (id: string, val: MediaValue) => void;
}) {
  return (
    <SectionCard title="Media">
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
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════════════════════════════

function ConfigureEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-2">
      <LayoutTemplate size={32} className="text-gray-200" />
      <p className="text-[13px] text-[#686576]" style={{ fontWeight: 500 }}>
        No variables yet
      </p>
      <p className="text-[12px] text-[#9c99a9] leading-[1.5]">
        Add text with{' '}
        <span className="font-mono bg-gray-100 px-1 rounded text-[11px]">{'{variable}'}</span>
        {' '}or Dynamic Placeholders to the template to configure them here.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MANUAL TAB — fully reactive
// ══════════════════════════════════════════════════════════════════

function ConfigureManualTab() {
  const { textVariables, mediaVariables, hasAnyVariable } = useConfigureVariables();

  const [brandKit,    setBrandKit]    = useState('');
  const [textValues,  setTextValues]  = useState<Record<string, string>>({});
  const [mediaValues, setMediaValues] = useState<Record<string, MediaValue>>({});

  // ── Discard values for text variables that were removed from the canvas ──
  useEffect(() => {
    setTextValues(prev => {
      const cleaned: Record<string, string> = {};
      textVariables.forEach(({ key }) => {
        cleaned[key] = prev[key] ?? '';
      });
      return cleaned;
    });
  }, [textVariables]);

  // ── Discard values for media variables that were removed from the canvas ──
  useEffect(() => {
    setMediaValues(prev => {
      const cleaned: Record<string, MediaValue> = {};
      mediaVariables.forEach(({ id }) => {
        cleaned[id] = prev[id] ?? { source: '', preview: null };
      });
      return cleaned;
    });
  }, [mediaVariables]);

  return (
    <div className="flex flex-col gap-3 px-4 py-3 w-full overflow-x-hidden">

      {/* Brand Kit — always visible */}
      <BrandKitSelector value={brandKit} onChange={setBrandKit} />

      {/* Text section — appears only when there are {variable} in canvas text */}
      {textVariables.length > 0 && (
        <ConfigureTextBlock
          variables={textVariables}
          values={textValues}
          onChange={(key, val) => setTextValues(prev => ({ ...prev, [key]: val }))}
        />
      )}

      {/* Media section — appears only when there are Dynamic Placeholders in canvas */}
      {mediaVariables.length > 0 && (
        <ConfigureMediaBlock
          variables={mediaVariables}
          values={mediaValues}
          onChange={(id, val) => setMediaValues(prev => ({ ...prev, [id]: val }))}
        />
      )}

      {/* Empty state — no variables anywhere on the canvas */}
      {!hasAnyVariable && <ConfigureEmptyState />}

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// FEED TAB — fully reactive
// ══════════════════════════════════════════════════════════════════

function ConfigureFeedTab() {
  const { textVariables, mediaVariables, hasAnyVariable } = useConfigureVariables();

  const [selectedFeed,   setSelectedFeed]   = useState('');
  const [createMode,     setCreateMode]     = useState<'assets' | 'review'>('assets');
  const [brandKit,       setBrandKit]       = useState('');
  const [columnMapping,  setColumnMapping]  = useState<Record<string, string>>({});
  const [mediaValues,    setMediaValues]    = useState<Record<string, MediaValue>>({});

  // ── Discard column mappings for text variables removed from the canvas ──
  useEffect(() => {
    setColumnMapping(prev => {
      const cleaned: Record<string, string> = {};
      textVariables.forEach(({ key }) => {
        cleaned[key] = prev[key] ?? '';
      });
      return cleaned;
    });
  }, [textVariables]);

  // ── Discard media values for placeholders removed from the canvas ──
  useEffect(() => {
    setMediaValues(prev => {
      const cleaned: Record<string, MediaValue> = {};
      mediaVariables.forEach(({ id }) => {
        cleaned[id] = prev[id] ?? { source: '', preview: null };
      });
      return cleaned;
    });
  }, [mediaVariables]);

  return (
    <div className="flex flex-col gap-3 px-4 py-3 w-full overflow-x-hidden">

      {/* Select feed */}
      <div className="flex flex-col gap-1 w-full">
        <FieldLabel>Select feed</FieldLabel>
        <ConfigSelect value={selectedFeed} onChange={setSelectedFeed}>
          {/* future feed options */}
        </ConfigSelect>
      </div>

      {/* Create — radio group */}
      <div className="flex flex-col gap-1 w-full">
        <label className="text-[14px] text-[#1f1d25] tracking-[0.15px] leading-[1.5]">
          Create
        </label>
        <div className="flex items-center gap-5">
          {([
            { val: 'assets', label: 'Assets'          },
            { val: 'review', label: 'Review Document'  },
          ] as const).map(({ val, label }) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer select-none">
              <div
                className="relative flex items-center justify-center w-[20px] h-[20px] rounded-full border-2 shrink-0 transition-colors"
                style={{
                  borderColor:     createMode === val ? '#473bab' : '#9e9aad',
                  backgroundColor: createMode === val ? '#473bab' : 'transparent',
                }}
                onClick={() => setCreateMode(val)}
              >
                {createMode === val && (
                  <div className="w-[8px] h-[8px] rounded-full bg-white" />
                )}
              </div>
              <span
                className="text-[14px] text-[#1f1d25] tracking-[0.15px]"
                onClick={() => setCreateMode(val)}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Brand Kit */}
      <BrandKitSelector value={brandKit} onChange={setBrandKit} />

      {/* Text section — column-mapping selects for each text variable */}
      {textVariables.length > 0 && (
        <ConfigureFeedTextBlock
          variables={textVariables}
          values={columnMapping}
          onChange={(key, val) => setColumnMapping(prev => ({ ...prev, [key]: val }))}
        />
      )}

      {/* Media section — same as Manual tab */}
      {mediaVariables.length > 0 && (
        <ConfigureMediaBlock
          variables={mediaVariables}
          values={mediaValues}
          onChange={(id, val) => setMediaValues(prev => ({ ...prev, [id]: val }))}
        />
      )}

      {/* Empty state */}
      {!hasAnyVariable && <ConfigureEmptyState />}

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// CONFIGURE PANEL — root component (rendered in RightPanel)
// ══════════════════════════════════════════════════════════════════

export function ConfigurePanel() {
  const headerActions = (
    <>
      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-[#1f1d25] transition-colors">
        <FilePlus size={16} />
      </button>
      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-[#1f1d25] transition-colors">
        <Settings2 size={16} />
      </button>
    </>
  );

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">

      {/* ── Header — matches all other RightPanel headers ───────── */}
      <RightPanelHeader title="Configure" actions={headerActions} />

      {/* ── Tabs: Manual | Feed ─────────────────────────────────── */}
      <Tabs defaultValue="manual" className="flex flex-col flex-1 overflow-hidden">

        <div className="shrink-0 relative">
          <TabsList className="w-full justify-start rounded-none bg-transparent px-0 h-auto pb-0 border-b-0">
            {(['manual', 'feed'] as const).map(tab => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="
                  relative px-4 py-[9px] rounded-none capitalize
                  text-[14px] tracking-[0.4px] leading-6
                  bg-transparent shadow-none border-0
                  data-[state=active]:text-[#473bab]
                  data-[state=inactive]:text-[#686576]
                  hover:text-[#473bab] transition-colors
                  data-[state=active]:after:content-['']
                  data-[state=active]:after:absolute
                  data-[state=active]:after:bottom-0
                  data-[state=active]:after:left-0
                  data-[state=active]:after:right-0
                  data-[state=active]:after:h-[2px]
                  data-[state=active]:after:bg-[#473bab]
                  data-[state=active]:after:z-10
                "
                style={{ fontWeight: 500 }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          <Separator className="m-0" />
        </div>

        <TabsContent value="manual" className="flex-1 overflow-y-auto overflow-x-hidden mt-0">
          <ConfigureManualTab />
        </TabsContent>

        <TabsContent value="feed" className="flex-1 overflow-y-auto overflow-x-hidden mt-0">
          <ConfigureFeedTab />
        </TabsContent>

      </Tabs>
    </div>
  );
}