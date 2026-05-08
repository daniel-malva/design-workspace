import { useState, useCallback, useEffect, useRef } from 'react';
import {
  X, Info, RotateCcw, RotateCw, SlidersHorizontal,
  ChevronDown, ChevronUp, ArrowLeft, Shuffle, Check,
} from 'lucide-react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import type { CanvasElement } from '../store/useDesignWorkspaceStore';

// ─── Variable detection ───────────────────────────────────────────────────────
const PREVIEW_VAR_RE = /\{([^{}]+)\}/g;

function detectVars(elements: CanvasElement[]): string[] {
  const vars = new Set<string>();
  for (const el of elements) {
    if (!el.content) continue;
    for (const m of el.content.matchAll(PREVIEW_VAR_RE)) {
      if (!m[1].startsWith('http') && !m[1].includes('/')) vars.add(m[1]);
    }
  }
  return [...vars];
}

function detectMediaElements(elements: CanvasElement[]): CanvasElement[] {
  return elements.filter(el =>
    el.type === 'placeholder-background' ||
    el.type === 'placeholder-jellybean' ||
    el.type === 'placeholder-media' ||
    el.type === 'placeholder-logo',
  );
}

// ─── Mock data pools ──────────────────────────────────────────────────────────
const MOCK_POOLS: Record<string, string[]> = {
  year:       ['2022', '2023', '2024', '2025'],
  make:       ['BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Toyota', 'Honda'],
  model:      ['X5M', 'X3', '3 Series', 'M4', 'C-Class', 'A4', 'ES 350'],
  trim:       ['Competition', 'Base', 'Sport', 'M Sport', 'xDrive40i', 'Luxury'],
  header:     [
    '0% APR Financing for 63 mos. on approved credit.',
    'Lease from $499/mo for 36 months.',
    'Special financing for qualified buyers.',
    '$5,000 dealer discount on select models.',
    '24-month 0% APR on select new vehicles.',
  ],
  cta:        ['View Offer', 'Shop Now', 'Get Quote', 'Learn More', 'Schedule Test Drive'],
  dealerName: ['BMW of Manhattan', 'BMW of Beverly Hills', 'BMW of Chicago', 'BMW North America'],
  vin:        ['WBA3A9C59EF123456', '3MW39CM08P8D01423', 'WBS83CH09NCK73920', '5UXCR4C07M9F12345'],
  price:      ['$42,995', '$38,500', '$51,200', '$29,995', '$65,400'],
  apr:        ['0.9%', '1.9%', '2.9%', '3.9%', '0%'],
  payment:    ['$499/mo', '$389/mo', '$599/mo', '$449/mo'],
  discount:   ['$3,500', '$5,000', '$2,200', '$4,750'],
  miles:      ['10,000', '12,000', '15,000'],
  term:       ['24', '36', '48', '60'],
  months:     ['24', '36', '48', '60', '72'],
};

const MEDIA_LABELS: Record<string, string> = {
  'placeholder-background': 'Background',
  'placeholder-jellybean':  'Jellybean',
  'placeholder-media':      'Media',
  'placeholder-logo':       'Logo',
};

const THUMB_COLORS = ['#C8D8E8', '#D4E8D4', '#E8D4C8', '#D4C8E8', '#E8E8C8'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMockForVar(varName: string, textLength?: 'short' | 'medium' | 'long'): string {
  const lv = varName.toLowerCase();
  for (const [key, vals] of Object.entries(MOCK_POOLS)) {
    if (lv === key || lv.includes(key)) return pickRandom(vals);
  }
  if (textLength === 'short')  return pickRandom(['A', 'Yes', 'Now', varName.slice(0, 4)]);
  if (textLength === 'long')   return `Sample long value for ${varName} that wraps across multiple lines in constrained layouts.`;
  if (textLength === 'medium') return `Sample value for ${varName} field`;
  return `Mock ${varName}`;
}

interface MockCfg {
  textLength?: 'short' | 'medium' | 'long';
  offerMin?: number; offerMax?: number;
  paymentMin?: number; paymentMax?: number;
}

function generateAllMock(vars: string[], cfg?: MockCfg): Record<string, string> {
  const vals: Record<string, string> = {};
  for (const v of vars) {
    const lv = v.toLowerCase();
    if (lv.includes('apr') || lv.includes('offer') || lv.includes('rate')) {
      const min = cfg?.offerMin ?? 0;
      const max = cfg?.offerMax ?? 10;
      vals[v] = `${(Math.random() * (max - min) + min).toFixed(1)}%`;
    } else if (lv.includes('payment') || lv.includes('price')) {
      const min = cfg?.paymentMin ?? 349;
      const max = cfg?.paymentMax ?? 999;
      const amt = Math.floor(Math.random() * (max - min) + min);
      vals[v] = `$${amt.toLocaleString()}/mo`;
    } else {
      vals[v] = generateMockForVar(v, cfg?.textLength);
    }
  }
  return vals;
}

// ─── Scenario presets ─────────────────────────────────────────────────────────
type Scenario = 'custom' | 'long-copy' | 'financial-max' | 'mobile-fit' | 'compliance' | 'extreme';

interface AdvancedConfig {
  scenario:          Scenario;
  textLength:        'short' | 'medium' | 'long' | 'custom';
  forceLineBreaks:   boolean;
  offerMin:          number;
  offerMax:          number;
  paymentMin:        number;
  paymentMax:        number;
  country:           string;
  numberFmt:         { decimal: string; thousand: string };
  currencyMode:      'auto' | 'custom';
  currencySymbol:    string;
  currencyPlacement: 'before' | 'after';
  distanceUnit:      string;
  fuelUnit:          string;
  dateFormat:        string;
}

const PRESET_CONFIGS: Record<Exclude<Scenario, 'custom'>, Partial<AdvancedConfig>> = {
  'long-copy':     { textLength: 'long',   forceLineBreaks: true,  offerMin: 0, offerMax: 5,  paymentMin: 349, paymentMax: 699 },
  'financial-max': { textLength: 'medium', forceLineBreaks: false, offerMin: 7, offerMax: 10, paymentMin: 799, paymentMax: 999 },
  'mobile-fit':    { textLength: 'short',  forceLineBreaks: true,  offerMin: 0, offerMax: 3,  paymentMin: 349, paymentMax: 599 },
  compliance:      { textLength: 'long',   forceLineBreaks: false, offerMin: 0, offerMax: 5,  paymentMin: 349, paymentMax: 799 },
  extreme:         { textLength: 'long',   forceLineBreaks: true,  offerMin: 8, offerMax: 10, paymentMin: 899, paymentMax: 999 },
};

const DEFAULT_CONFIG: AdvancedConfig = {
  scenario:          'long-copy',
  textLength:        'long',
  forceLineBreaks:   true,
  offerMin:          0,
  offerMax:          5,
  paymentMin:        349,
  paymentMax:        699,
  country:           'USA ($/Miles)',
  numberFmt:         { decimal: '.', thousand: ',' },
  currencyMode:      'auto',
  currencySymbol:    '$',
  currencyPlacement: 'before',
  distanceUnit:      'Miles',
  fuelUnit:          'Gallons',
  dateFormat:        'mm/dd/yyyy',
};

const SCENARIO_LABELS: Record<Scenario, string> = {
  custom:          'Custom',
  'long-copy':     'Long Copy',
  'financial-max': 'Financial Max Values',
  'mobile-fit':    'Mobile Fit',
  compliance:      'Compliance Edge Cases',
  extreme:         'Extreme Everything',
};

// ─── Primitive UI helpers ─────────────────────────────────────────────────────
function PanelButton({
  children, onClick, variant = 'ghost', size = 'sm', disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'ghost' | 'outline-accent' | 'filled-accent' | 'outline-gray';
  size?: 'sm' | 'xs';
  disabled?: boolean;
}) {
  const base = 'inline-flex items-center gap-1.5 font-medium transition-colors rounded-full select-none';
  const sz   = size === 'xs' ? 'px-2.5 py-1 text-[10px]' : 'px-3.5 py-1.5 text-[11px]';
  const cls = {
    ghost:           'text-[#686576] hover:bg-[#f0eff8] hover:text-[#5B4EFF]',
    'outline-accent':'border border-[#5B4EFF] text-[#5B4EFF] hover:bg-[rgba(91,78,255,0.06)]',
    'filled-accent': 'bg-[#5B4EFF] text-white hover:bg-[#4a3ee0] disabled:opacity-40',
    'outline-gray':  'border border-[#E2E2E2] text-[#686576] hover:bg-[#f0eff8]',
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sz} ${cls} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );
}

function IconBtn({
  onClick, disabled, children, title,
}: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; title?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#686576] hover:bg-[#f0eff8] hover:text-[#5B4EFF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f9fafa] border border-[#E2E2E2] rounded-xl overflow-hidden">
      {children}
    </div>
  );
}

function SectionHeader({
  label, collapsible, open, onToggle,
}: {
  label: string; collapsible?: boolean; open?: boolean; onToggle?: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2.5 ${collapsible ? 'cursor-pointer select-none' : ''}`}
      onClick={collapsible ? onToggle : undefined}
    >
      <span className="text-[12px] font-semibold text-[#1f1d25]">{label}</span>
      {collapsible && (
        <span className="text-[#9c99a9]">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      )}
    </div>
  );
}

function RangeSlider({ min, max, value, onChange }: {
  min: number; max: number; value: number; onChange: (v: number) => void;
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div className="relative w-full h-4 flex items-center">
      <div className="w-full h-1 rounded-full bg-[#E2E2E2] relative">
        <div className="absolute left-0 h-full rounded-full bg-[#5B4EFF]" style={{ width: `${pct}%` }} />
      </div>
      <input
        type="range"
        min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer h-4"
      />
      <div
        className="absolute w-3.5 h-3.5 rounded-full bg-[#5B4EFF] border-2 border-white shadow-md pointer-events-none"
        style={{ left: `calc(${pct}% - 7px)` }}
      />
    </div>
  );
}

function SelectField({ value, options, onChange, className = '' }: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-white border border-[#E2E2E2] rounded-lg pl-3 pr-8 py-1.5 text-[11px] text-[#1f1d25] cursor-pointer outline-none focus:border-[#5B4EFF] transition-colors"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#686576] pointer-events-none"
      />
    </div>
  );
}

// ─── Main Preview Panel view ──────────────────────────────────────────────────
function MainView({
  vars, mockValues, mediaElements,
  onRandomize, onUndo, onRedo, canUndo, canRedo,
  onOpenAdvanced, onClose,
}: {
  vars: string[];
  mockValues: Record<string, string>;
  mediaElements: CanvasElement[];
  onRandomize: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenAdvanced: () => void;
  onClose: () => void;
}) {
  const [brandCompliant, setBrandCompliant] = useState(true);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2 shrink-0">
        <span className="text-[13px] font-semibold text-[#1f1d25]">Preview</span>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-[#9c99a9] hover:text-[#1f1d25] hover:bg-[#f0eff8] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 flex flex-col gap-3">

        {/* Info banner */}
        <div className="flex items-start gap-2.5 bg-[#E3F2FD] rounded-xl px-3 py-2.5">
          <Info size={14} className="text-[#2196F3] mt-0.5 shrink-0" />
          <p className="text-[11px] leading-[1.5] text-[#1565C0]">
            Mock data is for preview only. Updates in position, size, groups, and constraints will be saved.
          </p>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2">
          <PanelButton variant="outline-accent" onClick={onRandomize}>
            Test With Mock Data
          </PanelButton>
          <div className="flex items-center gap-0.5 ml-auto">
            <IconBtn onClick={onUndo} disabled={!canUndo} title="Undo mock data">
              <RotateCcw size={13} />
            </IconBtn>
            <IconBtn onClick={onRedo} disabled={!canRedo} title="Redo mock data">
              <RotateCw size={13} />
            </IconBtn>
            <IconBtn onClick={onOpenAdvanced} title="Advanced Randomization">
              <SlidersHorizontal size={13} />
            </IconBtn>
          </div>
        </div>

        {/* Brand Kit */}
        <div>
          <label className="block text-[10px] font-medium text-[#686576] mb-1.5 pl-0.5">
            Brand Kit
          </label>
          <div className="flex items-center gap-2 bg-white border border-[#E2E2E2] rounded-xl px-3 py-2">
            <div className="w-5 h-5 rounded-full bg-[#C8D8E8] border border-[#E2E2E2] shrink-0 flex items-center justify-center">
              <span className="text-[7px] font-bold text-[#4a3ee0]">B</span>
            </div>
            <span className="text-[11px] text-[#1f1d25] font-medium flex-1">BMW</span>
            <button className="text-[#9c99a9] hover:text-[#686576] transition-colors">
              <X size={12} />
            </button>
            <button className="text-[#9c99a9] hover:text-[#686576] transition-colors">
              <ChevronDown size={12} />
            </button>
          </div>
        </div>

        {/* Brand compliant checkbox */}
        <button
          onClick={() => setBrandCompliant(p => !p)}
          className="flex items-center gap-2.5 w-full text-left"
        >
          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
            brandCompliant ? 'bg-[#5B4EFF] border-[#5B4EFF]' : 'border-[#C5C2D0] bg-white'
          }`}>
            {brandCompliant && <Check size={10} strokeWidth={2.5} className="text-white" />}
          </div>
          <span className="text-[11px] font-medium text-[#1f1d25]">Brand-Compliant Mock Data</span>
        </button>

        {/* Text variables */}
        {vars.length > 0 ? (
          <SectionCard>
            <SectionHeader label="Text" />
            <div className="border-t border-[#E2E2E2]">
              {vars.map((v, i) => (
                <div
                  key={v}
                  className={`px-3 py-2.5 ${i < vars.length - 1 ? 'border-b border-[#E2E2E2]' : ''}`}
                >
                  <label className="block text-[10px] text-[#9c99a9] mb-1 font-medium">{v}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-[#E2E2E2] rounded-lg px-2.5 py-1.5 min-w-0">
                      <span className="text-[11px] text-[#1f1d25] block truncate">
                        {mockValues[v] ?? `{${v}}`}
                      </span>
                    </div>
                    <button
                      onClick={onRandomize}
                      className="text-[#C5C2D0] hover:text-[#5B4EFF] transition-colors shrink-0"
                      title={`Randomize ${v}`}
                    >
                      <Shuffle size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : (
          <SectionCard>
            <SectionHeader label="Text" />
            <div className="border-t border-[#E2E2E2] px-3 py-4 text-center">
              <p className="text-[11px] text-[#9c99a9]">
                Add template variables using{' '}
                <span className="font-mono text-[#686576]">{'{varName}'}</span>{' '}
                in text elements.
              </p>
            </div>
          </SectionCard>
        )}

        {/* Media section */}
        {mediaElements.length > 0 && (
          <SectionCard>
            <SectionHeader label="Media" />
            <div className="border-t border-[#E2E2E2] p-3">
              <div className="grid grid-cols-2 gap-2">
                {mediaElements.map((el, i) => (
                  <div
                    key={el.id}
                    className="aspect-square rounded-lg overflow-hidden relative"
                    style={{ backgroundColor: THUMB_COLORS[i % THUMB_COLORS.length] }}
                  >
                    {el.src ? (
                      <img src={el.src} alt={el.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                        <span className="text-[18px] opacity-40">🖼</span>
                        <span className="text-[9px] text-[#686576] font-medium px-1 text-center leading-tight">
                          {el.name ?? MEDIA_LABELS[el.type] ?? 'Media'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

// ─── Advanced Randomization view ──────────────────────────────────────────────
function AdvancedView({
  config, onChange, onApply, onCancel,
}: {
  config: AdvancedConfig;
  onChange: (patch: Partial<AdvancedConfig>) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  const [numberOpen,   setNumberOpen]   = useState(true);
  const [regionalOpen, setRegionalOpen] = useState(true);

  // If user manually changes a setting, revert scenario to 'custom'
  const change = (patch: Partial<AdvancedConfig>) => {
    if (config.scenario !== 'custom') {
      const preset = PRESET_CONFIGS[config.scenario as Exclude<Scenario, 'custom'>];
      const merged = { ...config, ...patch };
      const diverged = Object.entries(preset).some(([k, v]) => (merged as Record<string, unknown>)[k] !== v);
      onChange(diverged ? { ...patch, scenario: 'custom' } : patch);
    } else {
      onChange(patch);
    }
  };

  const handleScenario = (s: Scenario) => {
    if (s === 'custom') { onChange({ scenario: 'custom' }); return; }
    const preset = PRESET_CONFIGS[s];
    onChange({ ...preset, textLength: (preset.textLength ?? 'long') as AdvancedConfig['textLength'], scenario: s });
  };

  const previewOfferPct = `${config.offerMin}–${config.offerMax}%`;
  const previewPayment  = `$${config.paymentMin.toLocaleString()}–$${config.paymentMax.toLocaleString()}`;
  const previewPrice    = `$${(config.paymentMin * 25 + 350).toLocaleString()}.50`;
  const previewDate     = config.dateFormat === 'dd/mm/yyyy'
    ? '27/02/2026'
    : config.dateFormat === 'yyyy-mm-dd' ? '2026-02-27' : '02/27/2026';

  const segLengths: { value: AdvancedConfig['textLength']; label: string }[] = [
    { value: 'short',  label: 'Short'  },
    { value: 'medium', label: 'Medium' },
    { value: 'long',   label: 'Long'   },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2 shrink-0 border-b border-[#E2E2E2]">
        <button
          onClick={onCancel}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-[#9c99a9] hover:text-[#1f1d25] hover:bg-[#f0eff8] transition-colors"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="text-[13px] font-semibold text-[#1f1d25]">Advanced Randomization</span>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 flex flex-col gap-3 mt-3">

        <p className="text-[11px] text-[#686576] px-0.5">
          Select a scenario to auto-apply stress settings.
        </p>

        {/* Scenario */}
        <div>
          <label className="block text-[10px] font-medium text-[#9c99a9] mb-1.5 pl-0.5 uppercase tracking-wide">
            Scenario
          </label>
          <SelectField
            value={config.scenario}
            options={Object.entries(SCENARIO_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            onChange={v => handleScenario(v as Scenario)}
          />
        </div>

        {/* Text Generation */}
        <SectionCard>
          <SectionHeader label="Text generation" />
          <div className="border-t border-[#E2E2E2] px-3 pb-3 pt-2 flex flex-col gap-3">
            <div className="flex rounded-lg overflow-hidden border border-[#E2E2E2] bg-white">
              {segLengths.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => change({ textLength: value })}
                  className={`flex-1 text-[10px] font-medium py-1.5 transition-colors ${
                    config.textLength === value
                      ? 'bg-[#5B4EFF] text-white'
                      : 'text-[#686576] hover:bg-[#f0eff8]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => change({ forceLineBreaks: !config.forceLineBreaks })}
              className="flex items-center gap-2.5 w-full text-left"
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                config.forceLineBreaks ? 'bg-[#5B4EFF] border-[#5B4EFF]' : 'border-[#C5C2D0] bg-white'
              }`}>
                {config.forceLineBreaks && <Check size={10} strokeWidth={2.5} className="text-white" />}
              </div>
              <span className="text-[11px] text-[#1f1d25]">Force line breaks</span>
            </button>
          </div>
        </SectionCard>

        {/* Number Generation */}
        <SectionCard>
          <SectionHeader
            label="Number generation"
            collapsible open={numberOpen}
            onToggle={() => setNumberOpen(p => !p)}
          />
          {numberOpen && (
            <div className="border-t border-[#E2E2E2] px-3 pb-3 pt-2 flex flex-col gap-4">
              {/* Offer range */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-[#686576]">Offer Type Range (0-10%)</label>
                  <span className="text-[10px] font-semibold text-[#5B4EFF]">{previewOfferPct}</span>
                </div>
                <RangeSlider
                  min={0} max={10} value={config.offerMin}
                  onChange={v => change({ offerMin: Math.min(v, config.offerMax) })}
                />
                <RangeSlider
                  min={0} max={10} value={config.offerMax}
                  onChange={v => change({ offerMax: Math.max(v, config.offerMin) })}
                />
              </div>
              {/* Payment range */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-[#686576]">Payment Range ($349-$999)</label>
                  <span className="text-[10px] font-semibold text-[#5B4EFF]">{previewPayment}</span>
                </div>
                <RangeSlider
                  min={349} max={999} value={config.paymentMin}
                  onChange={v => change({ paymentMin: Math.min(v, config.paymentMax) })}
                />
                <RangeSlider
                  min={349} max={999} value={config.paymentMax}
                  onChange={v => change({ paymentMax: Math.max(v, config.paymentMin) })}
                />
              </div>
            </div>
          )}
        </SectionCard>

        {/* Regional Format */}
        <SectionCard>
          <SectionHeader
            label="Regional Format"
            collapsible open={regionalOpen}
            onToggle={() => setRegionalOpen(p => !p)}
          />
          {regionalOpen && (
            <div className="border-t border-[#E2E2E2] px-3 pb-3 pt-2 flex flex-col gap-3">
              {/* Country */}
              <div>
                <label className="block text-[10px] text-[#9c99a9] mb-1 font-medium">Country</label>
                <SelectField
                  value={config.country}
                  options={[
                    { value: 'USA ($/Miles)',    label: '🇺🇸 USA ($/Miles)' },
                    { value: 'Canada (CAD/km)',  label: '🇨🇦 Canada (CAD/km)' },
                    { value: 'UK (£/Miles)',     label: '🇬🇧 UK (£/Miles)' },
                    { value: 'Germany (€/km)',   label: '🇩🇪 Germany (€/km)' },
                    { value: 'Brazil (R$/km)',   label: '🇧🇷 Brazil (R$/km)' },
                  ]}
                  onChange={v => change({ country: v })}
                />
              </div>

              {/* Number Formatting */}
              <div>
                <label className="block text-[10px] text-[#9c99a9] mb-1.5 font-medium">Number Formatting</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-[#C5C2D0] mb-1">Decimal</label>
                    <SelectField
                      value={config.numberFmt.decimal}
                      options={[{ value: '.', label: '.' }, { value: ',', label: ',' }]}
                      onChange={v => change({ numberFmt: { ...config.numberFmt, decimal: v } })}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#C5C2D0] mb-1">Thousands</label>
                    <SelectField
                      value={config.numberFmt.thousand}
                      options={[
                        { value: ',',  label: ',' },
                        { value: '.',  label: '.' },
                        { value: ' ',  label: 'Space' },
                      ]}
                      onChange={v => change({ numberFmt: { ...config.numberFmt, thousand: v } })}
                    />
                  </div>
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-[10px] text-[#9c99a9] mb-1.5 font-medium">Currency</label>
                <div className="flex items-center gap-4 mb-2">
                  {(['auto', 'custom'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => change({ currencyMode: m })}
                      className="flex items-center gap-1.5"
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        config.currencyMode === m ? 'border-[#5B4EFF]' : 'border-[#C5C2D0]'
                      }`}>
                        {config.currencyMode === m && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#5B4EFF]" />
                        )}
                      </div>
                      <span className="text-[11px] text-[#1f1d25] capitalize">{m}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-[#C5C2D0] mb-1">Symbol</label>
                    <SelectField
                      value={config.currencySymbol}
                      options={[
                        { value: '$',  label: '$'  },
                        { value: '€',  label: '€'  },
                        { value: '£',  label: '£'  },
                        { value: 'R$', label: 'R$' },
                      ]}
                      onChange={v => change({ currencySymbol: v })}
                      className={config.currencyMode === 'auto' ? 'opacity-50 pointer-events-none' : ''}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#C5C2D0] mb-1">Placement</label>
                    <SelectField
                      value={config.currencyPlacement}
                      options={[
                        { value: 'before', label: 'Before' },
                        { value: 'after',  label: 'After'  },
                      ]}
                      onChange={v => change({ currencyPlacement: v as 'before' | 'after' })}
                      className={config.currencyMode === 'auto' ? 'opacity-50 pointer-events-none' : ''}
                    />
                  </div>
                </div>
              </div>

              {/* Units */}
              <div>
                <label className="block text-[10px] text-[#9c99a9] mb-1.5 font-medium">Units</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-[#C5C2D0] mb-1">Distance</label>
                    <SelectField
                      value={config.distanceUnit}
                      options={[{ value: 'Miles', label: 'Miles' }, { value: 'km', label: 'km' }]}
                      onChange={v => change({ distanceUnit: v })}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#C5C2D0] mb-1">Fuel</label>
                    <SelectField
                      value={config.fuelUnit}
                      options={[{ value: 'Gallons', label: 'Gallons' }, { value: 'Litres', label: 'Litres' }]}
                      onChange={v => change({ fuelUnit: v })}
                    />
                  </div>
                </div>
              </div>

              {/* Date format */}
              <div>
                <label className="block text-[10px] text-[#9c99a9] mb-1 font-medium">Date format</label>
                <SelectField
                  value={config.dateFormat}
                  options={[
                    { value: 'mm/dd/yyyy', label: 'mm/dd/yyyy' },
                    { value: 'dd/mm/yyyy', label: 'dd/mm/yyyy' },
                    { value: 'yyyy-mm-dd', label: 'yyyy-mm-dd' },
                    { value: 'MMM D, YYYY', label: 'MMM D, YYYY' },
                  ]}
                  onChange={v => change({ dateFormat: v })}
                />
              </div>
            </div>
          )}
        </SectionCard>

        {/* Preview row */}
        <SectionCard>
          <SectionHeader label="Preview" />
          <div className="border-t border-[#E2E2E2] px-3 py-2.5">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="text-[12px] font-semibold text-[#1f1d25]">{previewPrice}</span>
              <span className="text-[12px] font-semibold text-[#1f1d25]">{previewOfferPct} APR</span>
              <span className="text-[11px] text-[#686576]">10,000 {config.distanceUnit.toLowerCase()}/year</span>
              <span className="text-[11px] text-[#686576]">{previewDate}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-end gap-2 px-3 py-3 border-t border-[#E2E2E2]">
        <PanelButton variant="outline-gray" onClick={onCancel}>Cancel</PanelButton>
        <PanelButton variant="filled-accent" onClick={onApply}>Apply</PanelButton>
      </div>
    </div>
  );
}

// ─── Root PreviewPanel ─────────────────────────────────────────────────────────
export function PreviewPanel() {
  const {
    isPreviewMode,
    setIsPreviewMode,
    canvasElements,
    updateElement,
  } = useDesignWorkspace();

  // ── Template variable detection (recalculated on element changes) ───────────
  // We derive vars from masterElements (original templates), NOT from substituted content.
  // Track original template content in a stable ref so we always substitute from the
  // original {varName} patterns, even after mock data has been applied to the canvas.
  const originalContentRef = useRef<Map<string, string>>(new Map());

  // When preview mode activates, snapshot original content of all text elements
  useEffect(() => {
    if (isPreviewMode) {
      // Snapshot originals if not yet cached (first activation)
      canvasElements.forEach(el => {
        if (el.content && !originalContentRef.current.has(el.id)) {
          originalContentRef.current.set(el.id, el.content);
        }
      });
    } else {
      // Restore all originals when preview mode turns off
      originalContentRef.current.forEach((content, id) => {
        updateElement(id, { content });
      });
      originalContentRef.current.clear();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreviewMode]);

  // Derive vars from ORIGINAL content (snapshot), falling back to canvasElements on first load
  const vars = detectVars(
    canvasElements.map(el => ({
      ...el,
      content: originalContentRef.current.get(el.id) ?? el.content,
    })),
  );
  const mediaElements = detectMediaElements(canvasElements);

  // ── Mock values & history ───────────────────────────────────────────────────
  const [mockValues,    setMockValues]    = useState<Record<string, string>>({});
  const [history,       setHistory]       = useState<Array<Record<string, string>>>([]);
  const historyIndexRef = useRef(-1);
  const [historyIndex,  setHistoryIndex]  = useState(-1);

  // ── Advanced config ─────────────────────────────────────────────────────────
  const [view,      setView]      = useState<'main' | 'advanced'>('main');
  const [advConfig, setAdvConfig] = useState<AdvancedConfig>(DEFAULT_CONFIG);

  // ── Auto-init on preview mode activation ───────────────────────────────────
  const initializedRef = useRef(false);
  useEffect(() => {
    if (isPreviewMode && !initializedRef.current && vars.length > 0) {
      initializedRef.current = true;
      const initial = generateAllMock(vars);
      setMockValues(initial);
      setHistory([initial]);
      historyIndexRef.current = 0;
      setHistoryIndex(0);
      doApplyToCanvas(initial);
    }
    if (!isPreviewMode) {
      initializedRef.current = false;
      setMockValues({});
      setHistory([]);
      historyIndexRef.current = -1;
      setHistoryIndex(-1);
      setView('main');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreviewMode]);

  // ── Apply mock values to canvas ─────────────────────────────────────────────
  // Always substitutes from ORIGINAL content (via originalContentRef), not from current canvas.
  const doApplyToCanvas = useCallback((vals: Record<string, string>) => {
    for (const el of canvasElements) {
      if (!el.content) continue;
      const original = originalContentRef.current.get(el.id) ?? el.content;
      const substituted = original.replace(PREVIEW_VAR_RE, (_, key: string) => vals[key] ?? `{${key}}`);
      updateElement(el.id, { content: substituted });
    }
  }, [canvasElements, updateElement]);

  // ── Randomize ───────────────────────────────────────────────────────────────
  const handleRandomize = useCallback(() => {
    const cfg: MockCfg = {
      textLength: advConfig.textLength === 'custom' ? 'medium' : advConfig.textLength as 'short' | 'medium' | 'long',
      offerMin:   advConfig.offerMin,
      offerMax:   advConfig.offerMax,
      paymentMin: advConfig.paymentMin,
      paymentMax: advConfig.paymentMax,
    };
    const newVals = generateAllMock(vars, cfg);
    const currentIdx = historyIndexRef.current;
    setMockValues(newVals);
    setHistory(prev => [...prev.slice(0, currentIdx + 1), newVals]);
    historyIndexRef.current = currentIdx + 1;
    setHistoryIndex(currentIdx + 1);
    doApplyToCanvas(newVals);
  }, [vars, advConfig, doApplyToCanvas]);

  // ── Undo ────────────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx <= 0) return;
    setHistory(prev => {
      const prev2 = prev[idx - 1];
      if (prev2) {
        setMockValues(prev2);
        historyIndexRef.current = idx - 1;
        setHistoryIndex(idx - 1);
        doApplyToCanvas(prev2);
      }
      return prev;
    });
  }, [doApplyToCanvas]);

  // ── Redo ────────────────────────────────────────────────────────────────────
  const handleRedo = useCallback(() => {
    const idx = historyIndexRef.current;
    setHistory(prev => {
      if (idx >= prev.length - 1) return prev;
      const next = prev[idx + 1];
      if (next) {
        setMockValues(next);
        historyIndexRef.current = idx + 1;
        setHistoryIndex(idx + 1);
        doApplyToCanvas(next);
      }
      return prev;
    });
  }, [doApplyToCanvas]);

  // ── Advanced apply ──────────────────────────────────────────────────────────
  const handleAdvancedApply = useCallback(() => {
    const cfg: MockCfg = {
      textLength: advConfig.textLength === 'custom' ? 'medium' : advConfig.textLength as 'short' | 'medium' | 'long',
      offerMin:   advConfig.offerMin,
      offerMax:   advConfig.offerMax,
      paymentMin: advConfig.paymentMin,
      paymentMax: advConfig.paymentMax,
    };
    const newVals = generateAllMock(vars, cfg);
    const currentIdx = historyIndexRef.current;
    setMockValues(newVals);
    setHistory(prev => [...prev.slice(0, currentIdx + 1), newVals]);
    historyIndexRef.current = currentIdx + 1;
    setHistoryIndex(currentIdx + 1);
    doApplyToCanvas(newVals);
    setView('main');
  }, [vars, advConfig, doApplyToCanvas]);

  // ── Close (restore originals + turn off preview) ────────────────────────────
  const handleClose = useCallback(() => {
    originalContentRef.current.forEach((content, id) => {
      updateElement(id, { content });
    });
    originalContentRef.current.clear();
    setIsPreviewMode(false);
  }, [updateElement, setIsPreviewMode]);

  if (!isPreviewMode) return null;

  return (
    <div
      className="absolute right-1 top-1 bottom-1 w-[268px] bg-white rounded-2xl z-20 flex flex-col overflow-hidden"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
      onClick={e => e.stopPropagation()}
    >
      {view === 'advanced' ? (
        <AdvancedView
          config={advConfig}
          onChange={patch => setAdvConfig(p => ({ ...p, ...patch }))}
          onApply={handleAdvancedApply}
          onCancel={() => setView('main')}
        />
      ) : (
        <MainView
          vars={vars}
          mockValues={mockValues}
          mediaElements={mediaElements}
          onRandomize={handleRandomize}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onOpenAdvanced={() => setView('advanced')}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
