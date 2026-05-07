import { useState, useEffect, type ReactNode } from 'react';
import { FilePlus, Settings2, X, ChevronDown, LayoutTemplate, ExternalLink, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Separator } from './ui/separator';
import { RightPanelHeader } from './RightPanelHeader';
import { BrandKitSelector } from './BrandKitSelector';
import { useConfigureVariables } from '../hooks/useConfigureVariables';
import type { TextVariable, MediaVariable } from '../hooks/useConfigureVariables';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';

// ══════════════════════════════════════════════════════════════════
// FEED REGISTRY
// ══════════════════════════════════════════════════════════════════

type FeedType = 'google-sheets' | 'csv' | 'json' | 'api';

interface FeedOption {
  id:           string;
  label:        string;
  type:         FeedType;
  url:          string;
  csvExportUrl: string;
}

const PRESET_FEEDS: FeedOption[] = [
  {
    id:           'gsheet-apr-1844900552',
    label:        'APR Vehicle Feed',
    type:         'google-sheets',
    url:          'https://docs.google.com/spreadsheets/d/1krXFKvgnN3YBh3d7aY-ZCdbR3Ql63Qomzs3MJYB5v6s/edit?gid=1844900552#gid=1844900552',
    csvExportUrl: 'https://docs.google.com/spreadsheets/d/1krXFKvgnN3YBh3d7aY-ZCdbR3Ql63Qomzs3MJYB5v6s/export?format=csv&gid=1844900552',
  },
];

// ── CSV helpers ────────────────────────────────────────────────────

function parseCSV(csv: string): { headers: string[]; rows: Record<string, string>[]; rowCount: number } {
  const lines = csv.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [], rowCount: 0 };

  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers   = parseLine(lines[0]).filter(Boolean);
  const dataLines = lines.slice(1);

  const rows: Record<string, string>[] = dataLines.map(line => {
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });

  return { headers, rows, rowCount: lines.length - 1 };
}

// Normalize a string for fuzzy matching: lowercase, strip non-alphanumeric
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Find the best column match for a variable key/name. Returns '' if none found.
function autoMatchColumn(hint: string, columns: string[]): string {
  const h = norm(hint);
  return columns.find(c => norm(c) === h) ?? '';
}

// Extra column hints per placeholder variant — tried after the primary match fails.
// Keeps domain-specific knowledge out of the generic fuzzy matcher.
const MEDIA_COLUMN_ALIASES: Record<string, string[]> = {
  'product':          ['jellybean', 'jelly bean', 'jelly_bean', 'jellybeans'],
  'background-image': ['background', 'bg', 'background image', 'background_image', 'bg image'],
  'background-video': ['background', 'bg', 'background video', 'background_video', 'bg video'],
  'background':       ['background', 'bg', 'background image', 'background_image'],
};

// Try variant, then layer name, then domain aliases.
function autoMatchMedia(variant: string, name: string, columns: string[]): string {
  return (
    autoMatchColumn(variant, columns) ||
    autoMatchColumn(name, columns) ||
    (MEDIA_COLUMN_ALIASES[variant] ?? []).reduce<string>(
      (found, alias) => found || autoMatchColumn(alias, columns),
      '',
    )
  );
}

// ── Google Sheets icon (inline SVG — no external dependency) ──────
function GoogleSheetsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect width="24" height="24" rx="3" fill="#0F9D58" />
      <rect x="5" y="6"  width="14" height="1.8" rx=".5" fill="white" fillOpacity=".9" />
      <rect x="5" y="10" width="14" height="1.8" rx=".5" fill="white" fillOpacity=".9" />
      <rect x="5" y="14" width="14" height="1.8" rx=".5" fill="white" fillOpacity=".9" />
      <rect x="5" y="6"  width="1.8" height="9.8" rx=".5" fill="white" fillOpacity=".9" />
      <rect x="11" y="6" width="1.8" height="9.8" rx=".5" fill="white" fillOpacity=".9" />
    </svg>
  );
}

const FEED_TYPE_LABELS: Record<FeedType, string> = {
  'google-sheets': 'Google Sheets',
  'csv':           'CSV',
  'json':          'JSON',
  'api':           'API',
};

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

function AutoBadge() {
  return (
    <span className="text-[9px] text-[#0b7a43] bg-[#e0f5ea] px-1.5 py-0.5 rounded-full leading-none font-medium shrink-0">
      auto
    </span>
  );
}

function ConfigureFeedTextBlock({
  variables, values, onChange, columns,
}: {
  variables: TextVariable[];
  values:    Record<string, string>;
  onChange:  (key: string, val: string) => void;
  columns:   string[];
}) {
  return (
    <SectionCard title="Text">
      <div className="flex flex-col gap-3 w-full">
        {variables.map(({ key, label }) => {
          const isAuto = !!values[key] && columns.includes(values[key]);
          return (
            <div key={key} className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between px-1">
                <FieldLabel>{label}</FieldLabel>
                {isAuto && <AutoBadge />}
              </div>
              <ConfigSelect value={values[key] ?? ''} onChange={v => onChange(key, v)}>
                <option value="">— select column —</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </ConfigSelect>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════
// TEXT BLOCK — Variant (editable text inputs showing current row values)
// ══════════════════════════════════════════════════════════════════

function ConfigureVariantTextBlock({
  variables,
  columnMapping,
  rowData,
  onChange,
}: {
  variables:     TextVariable[];
  columnMapping: Record<string, string>;
  rowData:       Record<string, string>;
  onChange:      (columnName: string, val: string) => void;
}) {
  return (
    <SectionCard title="Text">
      <div className="flex flex-col gap-3 w-full">
        {variables.map(({ key, label }) => {
          const colName = columnMapping[key] || key;
          const value   = rowData[colName] ?? '';
          return (
            <div key={key} className="flex flex-col gap-1 w-full">
              <FieldLabel>{label}</FieldLabel>
              <input
                value={value}
                onChange={e => onChange(colName, e.target.value)}
                className="w-full h-9 py-1.5 px-2 text-[12px] bg-[#f9fafa] border border-[#dddce0] rounded-[4px] text-[#1f1d25] tracking-[0.17px] outline-none focus:border-[#473bab] transition-colors"
                placeholder={`{${key}}`}
              />
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════
// MEDIA BLOCK — Variant (URL input per placeholder, overrides feed)
// ══════════════════════════════════════════════════════════════════

function ConfigureVariantMediaBlock({
  variables,
  elements,
  onChangeSrc,
}: {
  variables:   MediaVariable[];
  elements:    Array<{ id: string; src?: string }>;
  onChangeSrc: (elementId: string, src: string) => void;
}) {
  return (
    <SectionCard title="Media">
      <div className="flex flex-col gap-4 w-full">
        {variables.map(variable => {
          const el  = elements.find(e => e.id === variable.id);
          const src = el?.src ?? '';
          return (
            <div key={variable.id} className="flex flex-col gap-2 w-full">
              {/* Header row */}
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-sm text-white shrink-0"
                  style={{ backgroundColor: variable.badgeColor, fontSize: '6px', fontWeight: 700 }}
                >
                  {variable.name.slice(0, 3).toUpperCase()}
                </span>
                <FieldLabel>{variable.name}</FieldLabel>
              </div>

              {/* Preview */}
              {src && (
                <div className="w-full h-16 rounded overflow-hidden bg-[#f0f0f0] border border-[#dddce0]">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              {/* URL input */}
              <div className="flex items-center gap-1 w-full">
                <input
                  type="url"
                  value={src}
                  onChange={e => onChangeSrc(variable.id, e.target.value)}
                  placeholder="Paste image URL…"
                  className="flex-1 h-9 py-1.5 px-2 text-[12px] bg-[#f9fafa] border border-[#dddce0] rounded-[4px] text-[#1f1d25] tracking-[0.17px] outline-none focus:border-[#473bab] transition-colors min-w-0"
                />
                {src && (
                  <button
                    onClick={() => onChangeSrc(variable.id, '')}
                    className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════
// MEDIA BLOCK — Feed (column-mapping selects per placeholder)
// ══════════════════════════════════════════════════════════════════

function ConfigureFeedMediaBlock({
  variables, values, onChange, columns,
}: {
  variables: MediaVariable[];
  values:    Record<string, string>;
  onChange:  (id: string, col: string) => void;
  columns:   string[];
}) {
  return (
    <SectionCard title="Media">
      <div className="flex flex-col gap-3 w-full">
        {variables.map(variable => {
          const isAuto = !!values[variable.id] && columns.includes(values[variable.id]);
          return (
            <div key={variable.id} className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-sm text-white shrink-0"
                    style={{ backgroundColor: variable.badgeColor, fontSize: '6px', fontWeight: 700 }}
                  >
                    {variable.name.slice(0, 3).toUpperCase()}
                  </span>
                  <FieldLabel>{variable.name}</FieldLabel>
                </div>
                {isAuto && <AutoBadge />}
              </div>
              <ConfigSelect value={values[variable.id] ?? ''} onChange={v => onChange(variable.id, v)}>
                <option value="">— select column —</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </ConfigSelect>
            </div>
          );
        })}
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
// FEED TAB — state persists in the global store across panel switches
// ══════════════════════════════════════════════════════════════════

function ConfigureFeedTab() {
  const { textVariables, mediaVariables, hasAnyVariable } = useConfigureVariables();
  const {
    feedState, updateFeedState, generateVariants, clearVariants,
    activeVariantId, variants, updateVariantField, setVariantElementSrc,
  } = useDesignWorkspace();

  const currentVariant = activeVariantId !== null
    ? variants.find(v => v.id === activeVariantId) ?? null
    : null;

  const [createMode, setCreateMode] = useState<'assets' | 'review'>('assets');
  const [brandKit,   setBrandKit]   = useState('');

  // Shorthand aliases
  const selectedFeed  = feedState.selectedFeedId;
  const feedColumns   = feedState.columns;
  const feedRowCount  = feedState.rowCount;
  const feedStatus    = feedState.status;
  const columnMapping = feedState.columnMapping;
  const mediaColMap   = feedState.mediaColMap;

  // ── Clean up stale keys when variables are removed from the canvas ──
  // IMPORTANT: feedState.columnMapping / feedState.mediaColMap must be in the
  // dep array so the cleanup reads the latest values and never overwrites
  // auto-matched columns with empty strings due to a stale closure.
  useEffect(() => {
    const next: Record<string, string> = {};
    textVariables.forEach(({ key }) => { next[key] = columnMapping[key] ?? ''; });
    if (JSON.stringify(next) !== JSON.stringify(columnMapping)) {
      updateFeedState({ columnMapping: next });
    }
  }, [textVariables, columnMapping]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const next: Record<string, string> = {};
    mediaVariables.forEach(({ id }) => { next[id] = mediaColMap[id] ?? ''; });
    if (JSON.stringify(next) !== JSON.stringify(mediaColMap)) {
      updateFeedState({ mediaColMap: next });
    }
  }, [mediaVariables, mediaColMap]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch columns when feed is selected ────────────────────────
  // Deps: only selectedFeedId — intentionally excludes feedState.status.
  // Including status caused a self-cancellation loop: calling
  // updateFeedState({ status: 'loading' }) changed a dep, React ran the
  // cleanup (aborting the in-flight fetch), then re-ran the effect which
  // exited early on the 'loading' guard — leaving status stuck forever.
  useEffect(() => {
    const selectedFeedId = feedState.selectedFeedId;
    if (!selectedFeedId) return;

    // Read status via ref to avoid stale closure without adding it to deps
    const currentStatus = feedState.status;
    if (currentStatus === 'loaded' || currentStatus === 'loading') return;

    const feed = PRESET_FEEDS.find(f => f.id === selectedFeedId);
    if (!feed) return;

    let cancelled      = false;
    let fetchCompleted = false;
    updateFeedState({ status: 'loading' });

    // In dev, route through the Vite proxy (/gsheets-proxy → docs.google.com)
    // to avoid browser CORS restrictions on the initial redirect.
    const fetchUrl = import.meta.env.DEV
      ? feed.csvExportUrl.replace('https://docs.google.com', '/gsheets-proxy')
      : feed.csvExportUrl;

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 15_000);

    fetch(fetchUrl, { signal: controller.signal })
      .then(r => {
        clearTimeout(timeout);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(csv => {
        if (cancelled) return;
        const { headers, rows, rowCount } = parseCSV(csv);

        const newMediaMap = { ...feedState.mediaColMap };
        mediaVariables.forEach(({ id, variant, name }) => {
          if (!newMediaMap[id]) {
            newMediaMap[id] = autoMatchMedia(variant, name, headers);
          }
        });

        fetchCompleted = true;
        updateFeedState({
          status:      'loaded',
          columns:     headers,
          rows,
          rowCount,
          mediaColMap: newMediaMap,
        });
        // Variant generation is handled by the separate effect below,
        // which runs with fresh textVariables (no stale closure issue).
      })
      .catch(() => {
        clearTimeout(timeout);
        if (!cancelled) updateFeedState({ status: 'error' });
      });

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
      // Only reset to idle if the fetch was aborted (panel closed mid-fetch).
      // If it completed successfully, leave status as 'loaded'.
      if (!fetchCompleted) updateFeedState({ status: 'idle' });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedState.selectedFeedId]);

  // ── Generate variants whenever feed data or template variables change ──
  // Separate from the fetch effect so textVariables is always fresh (not a stale closure).
  // Uses lastGenKey to skip re-generation when the panel remounts with unchanged state
  // (e.g. switching between Properties and Configure).
  useEffect(() => {
    if (feedState.status !== 'loaded') return;
    if (feedState.rows.length === 0 || feedState.columns.length === 0) return;

    const colMap: Record<string, string> = {};
    textVariables.forEach(({ key }) => {
      colMap[key] = feedState.columnMapping[key] || autoMatchColumn(key, feedState.columns);
    });

    const genKey = JSON.stringify({
      colMap,
      mediaColMap: feedState.mediaColMap,
      rowCount: feedState.rows.length,
      varKeys:  textVariables.map(v => v.key).sort(),
    });

    if (genKey === feedState.lastGenKey) return;

    updateFeedState({ lastGenKey: genKey });
    generateVariants(feedState.rows, colMap);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedState.status, feedState.rows, feedState.columns, feedState.columnMapping, feedState.mediaColMap, textVariables]);

  // ── Auto-match text variables when columns load or variables change ──
  useEffect(() => {
    if (feedColumns.length === 0) return;
    const next = { ...feedState.columnMapping };
    let changed = false;
    textVariables.forEach(({ key }) => {
      if (!next[key]) { next[key] = autoMatchColumn(key, feedColumns); changed = true; }
    });
    if (changed) updateFeedState({ columnMapping: next });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedColumns, textVariables]);

  useEffect(() => {
    if (feedColumns.length === 0) return;
    const next = { ...feedState.mediaColMap };
    let changed = false;
    mediaVariables.forEach(({ id, variant, name }) => {
      if (!next[id]) {
        next[id] = autoMatchMedia(variant, name, feedColumns);
        changed = true;
      }
    });
    if (changed) updateFeedState({ mediaColMap: next });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedColumns, mediaVariables]);

  const activeFeed = PRESET_FEEDS.find(f => f.id === selectedFeed) ?? null;

  function handleSelectFeed(id: string) {
    clearVariants();
    updateFeedState({
      selectedFeedId: id,
      status:         'idle',
      columns:        [],
      rows:           [],
      rowCount:       null,
      columnMapping:  {},
      mediaColMap:    {},
      lastGenKey:     '',   // ← reset so generation always runs on reconnect
    });
  }

  function handleDisconnect() {
    clearVariants();
    updateFeedState({
      selectedFeedId: '',
      status:         'idle',
      columns:        [],
      rows:           [],
      rowCount:       null,
      columnMapping:  {},
      mediaColMap:    {},
      lastGenKey:     '',   // ← reset so generation always runs on reconnect
    });
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-3 w-full overflow-x-hidden">

      {/* Select feed — hidden once connected to avoid accidental switches */}
      {feedStatus !== 'loaded' && (
        <div className="flex flex-col gap-1 w-full">
          <FieldLabel>Select feed</FieldLabel>
          <ConfigSelect value={selectedFeed} onChange={handleSelectFeed}>
            <option value="">— Select a feed —</option>
            {PRESET_FEEDS.map(f => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </ConfigSelect>
        </div>
      )}

      {/* Loading */}
      {feedStatus === 'loading' && (
        <div className="flex items-center gap-2 w-full bg-[#f5f4ff] border border-[#cac7f5] rounded-lg px-3 py-2.5">
          <Loader2 size={14} className="text-[#473bab] shrink-0 animate-spin" />
          <span className="text-[12px] text-[#473bab] tracking-[0.15px]">Connecting to feed…</span>
        </div>
      )}

      {/* Error */}
      {feedStatus === 'error' && (
        <div className="flex items-start gap-2 w-full bg-[#fff5f5] border border-[#fcc] rounded-lg px-3 py-2.5">
          <AlertCircle size={14} className="text-[#c0392b] shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5 flex-1">
            <span className="text-[12px] text-[#c0392b] font-medium tracking-[0.15px]">Could not connect</span>
            <span className="text-[11px] text-[#686576] leading-[1.4]">
              Make sure the sheet is shared publicly (View access for anyone with the link).
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            className="shrink-0 mt-0.5 text-[11px] text-[#9c99a9] hover:text-[#c0392b] underline underline-offset-2 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Connected */}
      {feedStatus === 'loaded' && activeFeed && (
        <div className="flex items-start gap-2.5 w-full bg-[#f0faf4] border border-[#b7e5cc] rounded-lg px-3 py-2.5">
          {activeFeed.type === 'google-sheets' && (
            <div className="shrink-0 mt-0.5"><GoogleSheetsIcon size={18} /></div>
          )}
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={11} className="text-[#0F9D58] shrink-0" />
              <span className="text-[11px] text-[#0b7a43] font-medium tracking-[0.2px]">Feed connected</span>
            </div>
            <span className="text-[12px] text-[#1f1d25] font-medium tracking-[0.15px] truncate">
              {activeFeed.label}
            </span>
            <span className="text-[10px] text-[#686576] tracking-[0.15px]">
              {FEED_TYPE_LABELS[activeFeed.type]}
              {feedRowCount !== null && ` · ${feedRowCount.toLocaleString()} row${feedRowCount !== 1 ? 's' : ''}`}
              {feedColumns.length > 0 && ` · ${feedColumns.length} col${feedColumns.length !== 1 ? 's' : ''}`}
            </span>
            <button
              onClick={handleDisconnect}
              className="mt-1 self-start text-[11px] text-[#9c99a9] hover:text-[#c0392b] underline underline-offset-2 transition-colors leading-none"
            >
              Disconnect
            </button>
          </div>
          <a
            href={activeFeed.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 mt-0.5 text-[#686576] hover:text-[#0F9D58] transition-colors"
            title="Open sheet"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      )}

      {/* Create — radio group */}
      <div className="flex flex-col gap-1 w-full">
        <label className="text-[14px] text-[#1f1d25] tracking-[0.15px] leading-[1.5]">Create</label>
        <div className="flex items-center gap-5">
          {([
            { val: 'assets', label: 'Assets'         },
            { val: 'review', label: 'Review Document' },
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
                {createMode === val && <div className="w-[8px] h-[8px] rounded-full bg-white" />}
              </div>
              <span className="text-[14px] text-[#1f1d25] tracking-[0.15px]" onClick={() => setCreateMode(val)}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Brand Kit */}
      <BrandKitSelector value={brandKit} onChange={setBrandKit} />

      {/* Text — column-mapping selects (Master) or editable fields (Variant) */}
      {textVariables.length > 0 && (
        activeVariantId !== null && currentVariant ? (
          <ConfigureVariantTextBlock
            variables={textVariables}
            columnMapping={columnMapping}
            rowData={currentVariant.rowData}
            onChange={(colName, val) => updateVariantField(activeVariantId, colName, val)}
          />
        ) : (
          <ConfigureFeedTextBlock
            variables={textVariables}
            values={columnMapping}
            columns={feedColumns}
            onChange={(key, val) => updateFeedState({ columnMapping: { ...columnMapping, [key]: val } })}
          />
        )
      )}

      {/* Media — column selectors on Master, URL inputs on Variant */}
      {mediaVariables.length > 0 && feedColumns.length > 0 && (
        activeVariantId !== null && currentVariant ? (
          <ConfigureVariantMediaBlock
            variables={mediaVariables}
            elements={currentVariant.elements}
            onChangeSrc={(elId, src) => setVariantElementSrc(activeVariantId, elId, src)}
          />
        ) : (
          <ConfigureFeedMediaBlock
            variables={mediaVariables}
            values={mediaColMap}
            columns={feedColumns}
            onChange={(id, col) => updateFeedState({ mediaColMap: { ...mediaColMap, [id]: col } })}
          />
        )
      )}

      {/* Media — manual picker when no feed columns available */}
      {mediaVariables.length > 0 && feedColumns.length === 0 && (
        <ConfigureMediaBlock variables={mediaVariables} values={{}} onChange={() => {}} />
      )}

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