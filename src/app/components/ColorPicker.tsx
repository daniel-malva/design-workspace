import { useState, useRef } from 'react';
import { Pipette } from 'lucide-react';
import { hexToHsl, hslToHex, rgbToHex } from '../utils/colorUtils';
import { LinearGradientEditor } from './LinearGradientEditor';
import type { LinearGradient } from '../types/gradient';
import { DEFAULT_GRADIENT } from '../types/gradient';

// ── Palette — extracted from Figma ────────────────────────────────
const PALETTE_ROWS = [
  ['#2196f3', '#9c27b0', '#ef5350', '#01579b', '#ba68c8', '#66bb6a', '#558b2f'],
  ['#0057b2', '#ff9800', '#ffecb3', '#a5d6a7', '#00c0d6', '#7b1fa2', '#ea80fc'],
];

// ── Types ──────────────────────────────────────────────────────────
export interface ColorPickerProps {
  /** Current color — hex string with or without leading #. */
  value:    string;
  /** Alpha/opacity 0–100. */
  opacity:  number;
  onChange: (hex: string, opacity: number) => void;
  onClose:  () => void;
  /** Called on every gradient change when the Linear tab is active. */
  onGradientChange?: (gradient: LinearGradient) => void;
  /** Pre-existing gradient to seed the Linear tab (from element.style.gradientData). */
  initialGradient?: LinearGradient;
}

// ── ColorPicker ────────────────────────────────────────────────────
export function ColorPicker({ value, opacity, onChange, onClose, onGradientChange, initialGradient }: ColorPickerProps) {
  // ── Initialise state from props ──────────────────────────────────
  const initHex = (value.startsWith('#') ? value.slice(1) : value).padEnd(6, '0').slice(0, 6);
  const initHsl = hexToHsl(`#${initHex}`);

  // Default to 'linear' tab if the element already has gradient data
  const [activeTab,  setActiveTab]  = useState<'solid' | 'linear'>(initialGradient ? 'linear' : 'solid');
  const [hex,        setHex]        = useState(initHex);
  const [alpha,      setAlpha]      = useState(opacity);
  const [hue,        setHue]        = useState(initHsl.h);
  const [saturation, setSaturation] = useState(initHsl.s);
  const [lightness,  setLightness]  = useState(initHsl.l);
  const [gradient,   setGradient]   = useState<LinearGradient>(initialGradient ?? DEFAULT_GRADIENT);

  // Live refs so window event handlers never capture stale values
  const hueRef   = useRef(hue);   hueRef.current   = hue;
  const alphaRef = useRef(alpha); alphaRef.current = alpha;

  const satAreaRef = useRef<HTMLDivElement>(null);

  // ── Derived backgrounds ──────────────────────────────────────────
  const satBg = [
    'linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0))',
    `linear-gradient(to right, rgba(255,255,255,1), hsl(${hue}, 100%, 50%))`,
  ].join(', ');

  const hueBg    = 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)';
  const alphaBg  = `linear-gradient(to right, transparent, #${hex}), repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px`;

  // ── Saturation area interaction ──────────────────────────────────
  function updateFromSatPointer(clientX: number, clientY: number) {
    const el = satAreaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width)  * 100)));
    const l = Math.max(0, Math.min(100, Math.round(100 - ((clientY - rect.top)  / rect.height) * 100)));
    setSaturation(s);
    setLightness(l);
    const newHex = hslToHex(hueRef.current, s, l);
    setHex(newHex);
    onChange(`#${newHex}`, alphaRef.current);
  }

  function handleSatAreaMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    updateFromSatPointer(e.clientX, e.clientY);
    const onMove = (ev: MouseEvent) => updateFromSatPointer(ev.clientX, ev.clientY);
    const onUp   = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }

  // ── Hue slider ───────────────────────────────────────────────────
  function handleHueChange(v: number) {
    setHue(v);
    const newHex = hslToHex(v, saturation, lightness);
    setHex(newHex);
    onChange(`#${newHex}`, alpha);
  }

  // ── Alpha slider ─────────────────────────────────────────────────
  function handleAlphaChange(v: number) {
    setAlpha(v);
    onChange(`#${hex}`, v);
  }

  // ── Hex input ────────────────────────────────────────────────────
  function handleHexInput(raw: string) {
    const clean = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    setHex(clean);
    if (clean.length === 6) {
      const { h, s, l } = hexToHsl(`#${clean}`);
      setHue(h); setSaturation(s); setLightness(l);
      onChange(`#${clean}`, alpha);
    }
  }

  // ── RGBA channel inputs ──────────────────────────────────────────
  function handleChannelInput(ch: 'R' | 'G' | 'B' | 'A', raw: number) {
    if (ch === 'A') {
      const a = Math.max(0, Math.min(100, raw));
      setAlpha(a);
      onChange(`#${hex}`, a);
      return;
    }
    const cur = (idx: number) => parseInt(hex.slice(idx * 2, idx * 2 + 2), 16) || 0;
    const r   = ch === 'R' ? raw : cur(0);
    const g   = ch === 'G' ? raw : cur(1);
    const b   = ch === 'B' ? raw : cur(2);
    const newHex = rgbToHex(r, g, b);
    setHex(newHex);
    const { h, s, l } = hexToHsl(`#${newHex}`);
    setHue(h); setSaturation(s); setLightness(l);
    onChange(`#${newHex}`, alpha);
  }

  // ── Quick-swatch click ───────────────────────────────────────────
  function handleSwatchClick(color: string) {
    const clean = color.replace('#', '');
    setHex(clean);
    const { h, s, l } = hexToHsl(color);
    setHue(h); setSaturation(s); setLightness(l);
    onChange(color, alpha);
  }

  // ── Derived RGBA for input display ───────────────────────────────
  const rVal = parseInt(hex.slice(0, 2), 16) || 0;
  const gVal = parseInt(hex.slice(2, 4), 16) || 0;
  const bVal = parseInt(hex.slice(4, 6), 16) || 0;

  // ── Shared input class ───────────────────────────────────────────
  const inputCls = `
    h-[22px] bg-white border border-[rgba(0,0,0,0.12)] rounded-[2px]
    text-[11px] text-[rgba(0,0,0,0.87)] outline-none
    focus:border-[#2196f3] transition-colors
  `;

  return (
    <div
      className="flex flex-col w-[240px] bg-white border border-[rgba(0,0,0,0.12)] rounded-[4px] shadow-[0_2px_8px_rgba(0,0,0,0.15)] overflow-hidden select-none"
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >

      {/* ── Tabs: Solid | Linear ─────────────────────────────────── */}
      <div className="flex border-b border-[#E2E2E2] shrink-0">
        {(['solid', 'linear'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative flex-1 py-[9px] text-[14px] tracking-[0.4px] capitalize transition-colors hover:text-[#473bab]"
            style={{
              fontWeight: 500,
              color: activeTab === tab ? '#473bab' : '#686576',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#473bab]" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────── */}
      {activeTab === 'linear' ? (
        <LinearGradientEditor
          value={gradient}
          onChange={g => {
            setGradient(g);
            onGradientChange?.(g);
          }}
        />
      ) : (
        <>
          <div className="flex flex-col gap-[4px] p-2">

            {/* ── Saturation / colour area ──────────────────────────── */}
            <div
              ref={satAreaRef}
              className="relative w-full rounded-[4px] cursor-crosshair"
              style={{ height: 140, background: satBg }}
              onMouseDown={handleSatAreaMouseDown}
            >
              {/* Pointer */}
              <div
                className="absolute rounded-full border-2 border-white pointer-events-none"
                style={{
                  width: 10, height: 10,
                  left: `${saturation}%`,
                  top:  `${100 - lightness}%`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: `#${hex}`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                }}
              />
            </div>

            {/* ── Sliders + swatch + eyedropper ─────────────────────── */}
            <div className="flex items-center gap-1 w-full">

              {/* Hue & Alpha sliders stacked */}
              <div className="flex-1 flex flex-col gap-1 min-w-0">

                {/* Hue */}
                <div className="relative h-[10px] rounded-[1px]">
                  <div className="absolute inset-0 rounded-[1px]" style={{ background: hueBg }} />
                  {/* Thumb */}
                  <div
                    className="absolute top-1/2 bg-white rounded-[1px] shadow-sm pointer-events-none"
                    style={{
                      width: 4, height: 10,
                      left: `${(hue / 360) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.2)',
                    }}
                  />
                  <input
                    type="range" min={0} max={360} value={hue}
                    onChange={e => handleHueChange(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ margin: 0 }}
                  />
                </div>

                {/* Alpha */}
                <div className="relative h-[10px] rounded-[1px]">
                  <div className="absolute inset-0 rounded-[1px]" style={{ backgroundImage: alphaBg }} />
                  {/* Thumb */}
                  <div
                    className="absolute top-1/2 bg-white rounded-[1px] pointer-events-none"
                    style={{
                      width: 4, height: 10,
                      left: `${alpha}%`,
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.2)',
                    }}
                  />
                  <input
                    type="range" min={0} max={100} value={alpha}
                    onChange={e => handleAlphaChange(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ margin: 0 }}
                  />
                </div>
              </div>

              {/* Current colour swatch */}
              <div
                className="w-6 h-6 rounded-[4px] shrink-0 border border-[rgba(0,0,0,0.12)]"
                style={{ backgroundColor: `#${hex}`, opacity: alpha / 100 }}
              />

              {/* Eyedropper */}
              <button
                className="w-6 h-6 flex items-center justify-center shrink-0 text-[rgba(0,0,0,0.54)] hover:text-[rgba(0,0,0,0.87)] transition-colors"
                title="Eyedropper (not available in browser)"
                onClick={e => e.preventDefault()}
              >
                <Pipette size={14} />
              </button>
            </div>

            {/* ── Hex + R G B A inputs ──────────────────────────────── */}
            <div className="flex gap-1 w-full">
              {/* Hex */}
              <input
                value={`#${hex}`}
                onChange={e => handleHexInput(e.target.value.replace(/^#/, ''))}
                className={`${inputCls} w-[64px] shrink-0 px-2`}
                style={{ fontFamily: "'Inter', sans-serif" }}
                maxLength={7}
                spellCheck={false}
              />
              {/* R G B A */}
              {(
                [
                  { ch: 'R', v: rVal,  max: 255 },
                  { ch: 'G', v: gVal,  max: 255 },
                  { ch: 'B', v: bVal,  max: 255 },
                  { ch: 'A', v: alpha, max: 100 },
                ] as const
              ).map(({ ch, v, max }) => (
                <input
                  key={ch}
                  type="number" min={0} max={max} value={v}
                  onChange={e => handleChannelInput(ch, Number(e.target.value))}
                  className={`${inputCls} flex-1 min-w-0 px-1 text-center`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              ))}
            </div>

            {/* ── Column labels ─────────────────────────────────────── */}
            <div className="flex gap-1 w-full">
              {['Hex', 'R', 'G', 'B', 'A'].map((label, i) => (
                <div
                  key={label}
                  className="flex items-center justify-center h-4 text-[11px] text-[rgba(0,0,0,0.87)]"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    ...(i === 0
                      ? { width: 64, flexShrink: 0 }
                      : { flex: 1, minWidth: 0 }),
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

          </div>

          {/* ── Divider + quick-swatch palette ────────────────────────── */}
          <div className="border-t border-[rgba(0,0,0,0.12)] p-2">
            <div className="flex flex-col gap-[10px]">
              {PALETTE_ROWS.map((row, rowIdx) => (
                <div key={rowIdx} className="flex items-center justify-between">
                  {row.map(color => (
                    <button
                      key={color}
                      onClick={() => handleSwatchClick(color)}
                      className="w-4 h-4 rounded-[4px] hover:scale-110 transition-transform border border-[rgba(0,0,0,0.08)]"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
}