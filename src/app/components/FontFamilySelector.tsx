import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, Upload, Search } from 'lucide-react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';

// ── Curated font lists ────────────────────────────────────────────────────────

export const GOOGLE_FONTS = [
  'Roboto', 'Inter', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Raleway', 'Oswald', 'Merriweather', 'Playfair Display',
  'DM Sans', 'Nunito', 'Plus Jakarta Sans', 'Work Sans', 'Outfit', 'Sora',
];

export const SYSTEM_FONTS = [
  'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New',
];

// ── Load all Google Fonts once via a single <link> injection ─────────────────

let gFontsInjected = false;
export function ensureGoogleFontsLoaded() {
  if (gFontsInjected || typeof document === 'undefined') return;
  gFontsInjected = true;
  const families = GOOGLE_FONTS
    .map(f => `${f.replace(/ /g, '+')}:ital,wght@0,100;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700`)
    .join('&family=');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
  document.head.appendChild(link);
}

// ── Helper ────────────────────────────────────────────────────────────────────

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Font dropdown (portal) ────────────────────────────────────────────────────

function FontDropdown({
  systemFonts, googleFonts, customFontNames, selected, query,
  onQueryChange, onSelect, onDelete, onUploadClick, onClose, anchorRect,
}: {
  systemFonts:     string[];
  googleFonts:     string[];
  customFontNames: string[];
  selected:        string;
  query:           string;
  onQueryChange:   (q: string) => void;
  onSelect:        (family: string) => void;
  onDelete:        (name: string) => void;
  onUploadClick:   () => void;
  onClose:         () => void;
  anchorRect:      DOMRect;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const top   = anchorRect.bottom + 4;
  const left  = anchorRect.left;
  const width = Math.max(anchorRect.width, 200);

  function FontRow({ family, isCustom }: { family: string; isCustom?: boolean }) {
    return (
      <div
        className={`flex items-center px-3 py-[7px] cursor-pointer group transition-colors ${
          selected === family
            ? 'bg-[rgba(91,78,255,0.08)]'
            : 'hover:bg-[#f5f5f5]'
        }`}
        onMouseDown={e => { e.preventDefault(); onSelect(family); }}
      >
        <span
          className="flex-1 text-[13px] text-[#1f1d25] truncate leading-snug"
          style={{ fontFamily: `'${family}', sans-serif` }}
        >
          {family}
        </span>
        {isCustom && (
          <button
            onMouseDown={e => { e.stopPropagation(); e.preventDefault(); onDelete(family); }}
            className="opacity-0 group-hover:opacity-100 ml-1 text-[#9c99a9] hover:text-red-500 transition-all shrink-0"
            title={`Remove ${family}`}
          >
            <X size={11} />
          </button>
        )}
      </div>
    );
  }

  function SectionDivider({ label }: { label: string }) {
    return (
      <div className="px-3 pt-2 pb-1">
        <span className="text-[9px] font-semibold text-[#9c99a9] uppercase tracking-wider">{label}</span>
      </div>
    );
  }

  const q = query.toLowerCase();
  const filteredSystem  = systemFonts.filter(f => !q || f.toLowerCase().includes(q));
  const filteredGoogle  = googleFonts.filter(f => !q || f.toLowerCase().includes(q));
  const filteredCustom  = customFontNames.filter(f => !q || f.toLowerCase().includes(q));
  const hasResults      = filteredSystem.length + filteredGoogle.length + filteredCustom.length > 0;

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[9999] bg-white rounded-xl flex flex-col overflow-hidden"
      style={{
        top, left, width,
        maxHeight: 340,
        boxShadow: '0px 3px 14px 2px rgba(0,0,0,0.12), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 5px 5px -3px rgba(0,0,0,0.20)',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Search */}
      <div className="p-2 shrink-0" style={{ borderBottom: '1px solid #f0f0f0' }}>
        <div className="flex items-center gap-1.5 bg-[#f5f5f5] rounded-lg px-2 py-1.5">
          <Search size={11} className="text-[#9c99a9] shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="Search fonts…"
            className="flex-1 text-[11px] text-[#1f1d25] bg-transparent outline-none placeholder:text-[#9c99a9]"
          />
          {query && (
            <button onMouseDown={e => { e.preventDefault(); onQueryChange(''); }} className="text-[#9c99a9] hover:text-[#1f1d25]">
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 py-1">
        {!hasResults && (
          <p className="text-[11px] text-[#9c99a9] px-3 py-3 text-center">No fonts found</p>
        )}

        {filteredCustom.length > 0 && (
          <>
            <SectionDivider label="Uploaded" />
            {filteredCustom.map(f => <FontRow key={f} family={f} isCustom />)}
          </>
        )}

        {filteredGoogle.length > 0 && (
          <>
            <SectionDivider label="Google Fonts" />
            {filteredGoogle.map(f => <FontRow key={f} family={f} />)}
          </>
        )}

        {filteredSystem.length > 0 && (
          <>
            <SectionDivider label="System" />
            {filteredSystem.map(f => <FontRow key={f} family={f} />)}
          </>
        )}
      </div>

      {/* Upload button */}
      <div className="shrink-0" style={{ borderTop: '1px solid #f0f0f0' }}>
        <button
          onMouseDown={e => { e.preventDefault(); onUploadClick(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] text-[#5B4EFF] hover:bg-[rgba(91,78,255,0.06)] transition-colors font-medium"
        >
          <Upload size={12} />
          Upload font…
        </button>
      </div>
    </div>,
    document.body,
  );
}

// ── Public component ──────────────────────────────────────────────────────────

interface FontFamilySelectorProps {
  value:    string;
  onChange: (family: string) => void;
}

export function FontFamilySelector({ value, onChange }: FontFamilySelectorProps) {
  const { customFonts, addCustomFont, removeCustomFont } = useDesignWorkspace();

  const [open,      setOpen]      = useState(false);
  const [query,     setQuery]     = useState('');
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  // Inject Google Fonts stylesheet on first render
  useEffect(() => { ensureGoogleFontsLoaded(); }, []);

  // Re-register custom fonts from store (e.g. after hot reload)
  useEffect(() => {
    customFonts.forEach(async ({ name, dataUrl }) => {
      if (!document.fonts.check(`12px "${name}"`)) {
        try {
          const font = new FontFace(name, `url(${dataUrl})`);
          await font.load();
          document.fonts.add(font);
        } catch { /* ignore */ }
      }
    });
  }, [customFonts]);

  function handleToggle() {
    if (!open && triggerRef.current) {
      setAnchorRect(triggerRef.current.getBoundingClientRect());
    }
    setOpen(prev => !prev);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Derive a clean font name from the filename
    const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    try {
      const dataUrl = await fileToDataUrl(file);
      const font    = new FontFace(name, `url(${dataUrl})`);
      await font.load();
      document.fonts.add(font);
      addCustomFont({ name, dataUrl });
      onChange(name);
    } catch (err) {
      console.error('Font upload failed:', err);
    }
    e.target.value = '';
  }

  return (
    <div className="relative w-full">
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={handleToggle}
        className={`flex items-center h-9 px-3 bg-[#f5f5f5] rounded-lg cursor-pointer transition-colors ${
          open ? 'border-2 border-[rgba(91,78,255,0.7)]' : 'border border-[#E2E2E2] hover:border-[#C5C2D0]'
        }`}
      >
        <span
          className="flex-1 text-[12px] text-[#1f1d25] truncate"
          style={{ fontFamily: `'${value}', sans-serif` }}
        >
          {value || 'Select font'}
        </span>
        <ChevronDown
          size={11}
          className="text-[#6B6B6B] shrink-0 ml-1 transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>

      {/* Dropdown */}
      {open && anchorRect && (
        <FontDropdown
          systemFonts={SYSTEM_FONTS}
          googleFonts={GOOGLE_FONTS}
          customFontNames={customFonts.map(f => f.name)}
          selected={value}
          query={query}
          onQueryChange={setQuery}
          onSelect={family => { onChange(family); setOpen(false); setQuery(''); }}
          onDelete={name => removeCustomFont(name)}
          onUploadClick={() => fileRef.current?.click()}
          onClose={() => { setOpen(false); setQuery(''); }}
          anchorRect={anchorRect}
        />
      )}

      {/* Hidden file input for font upload */}
      <input
        ref={fileRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}
