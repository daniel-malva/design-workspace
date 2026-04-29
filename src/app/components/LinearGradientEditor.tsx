import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import type { LinearGradient, GradientStop } from '../types/gradient';
import { buildGradientCSS, interpolateGradientColor } from '../utils/gradientUtils';
import { hexToHsl, hslToHex } from '../utils/colorUtils';

// ── Gradient presets ────────────────────────────────────────────────
const GRADIENT_PRESETS: LinearGradient[] = [
  { angle: 90,  stops: [{ id:'1', position:0,   color:'#5B4EFF', opacity:100 }, { id:'2', position:100, color:'#FF6B6B', opacity:100 }] },
  { angle: 135, stops: [{ id:'1', position:0,   color:'#FF6B6B', opacity:100 }, { id:'2', position:100, color:'#FFD93D', opacity:100 }] },
  { angle: 90,  stops: [{ id:'1', position:0,   color:'#00C0D6', opacity:100 }, { id:'2', position:100, color:'#5B4EFF', opacity:100 }] },
  { angle: 180, stops: [{ id:'1', position:0,   color:'#1f1d25', opacity:100 }, { id:'2', position:100, color:'#473bab', opacity:100 }] },
  { angle: 90,  stops: [{ id:'1', position:0,   color:'#66BB6A', opacity:100 }, { id:'2', position:100, color:'#00C0D6', opacity:100 }] },
  { angle: 45,  stops: [{ id:'1', position:0,   color:'#9C27B0', opacity:100 }, { id:'2', position:50,  color:'#5B4EFF', opacity:100 }, { id:'3', position:100, color:'#00C0D6', opacity:100 }] },
  { angle: 90,  stops: [{ id:'1', position:0,   color:'#FF9800', opacity:100 }, { id:'2', position:100, color:'#FF6B6B', opacity:100 }] },
  { angle: 90,  stops: [{ id:'1', position:0,   color:'#ffffff', opacity:0   }, { id:'2', position:100, color:'#5B4EFF', opacity:100 }] },
];

const ANGLE_PRESETS = [0, 45, 90, 135, 180, 225, 270, 315];

// ── Shared label style ──────────────────────────────────────────────
const labelStyle: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

// ── MiniColorArea — compact saturation + hue picker ─────────────────

function MiniColorArea({
  color,
  onChange,
}: {
  color:    string;
  onChange: (hex: string) => void;
}) {
  const initHsl    = hexToHsl(color.startsWith('#') ? color : `#${color}`);
  const [hue, setHue]               = useState(initHsl.h);
  const [saturation, setSaturation] = useState(initHsl.s);
  const [lightness,  setLightness]  = useState(initHsl.l);

  const areaRef = useRef<HTMLDivElement>(null);
  const hueRef  = useRef(hue); hueRef.current = hue;

  const satBg = [
    'linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0))',
    `linear-gradient(to right, rgba(255,255,255,1), hsl(${hue}, 100%, 50%))`,
  ].join(', ');

  const hueBg     = 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)';
  const currentHex = hslToHex(hue, saturation, lightness);

  function updateFromPointer(clientX: number, clientY: number) {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
    const l = Math.max(0, Math.min(100, Math.round(100 - ((clientY - rect.top) / rect.height) * 100)));
    setSaturation(s);
    setLightness(l);
    const newHex = hslToHex(hueRef.current, s, l);
    onChange(`#${newHex}`);
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    updateFromPointer(e.clientX, e.clientY);
    const onMove = (ev: MouseEvent) => updateFromPointer(ev.clientX, ev.clientY);
    const onUp   = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }

  function handleHue(v: number) {
    setHue(v);
    const newHex = hslToHex(v, saturation, lightness);
    onChange(`#${newHex}`);
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Saturation / lightness area */}
      <div
        ref={areaRef}
        className="relative w-full rounded-[3px] cursor-crosshair"
        style={{ height: 56, background: satBg }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="absolute rounded-full border-2 border-white pointer-events-none"
          style={{
            width: 8, height: 8,
            left: `${saturation}%`,
            top:  `${100 - lightness}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: `#${currentHex}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}
        />
      </div>

      {/* Hue slider */}
      <div className="relative h-[8px] rounded-[1px]">
        <div className="absolute inset-0 rounded-[1px]" style={{ background: hueBg }} />
        <div
          className="absolute top-1/2 bg-white rounded-[1px] pointer-events-none"
          style={{
            width: 3, height: 8,
            left: `${(hue / 360) * 100}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.2)',
          }}
        />
        <input
          type="range" min={0} max={360} value={hue}
          onChange={e => handleHue(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ margin: 0 }}
        />
      </div>
    </div>
  );
}

// ── StopColorEditor ─────────────────────────────────────────────────

function StopColorEditor({
  stop,
  onChange,
}: {
  stop:     GradientStop;
  onChange: (color: string, opacity: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Swatch + Hex + Opacity */}
      <div className="flex items-center gap-1.5">
        <div
          className="w-6 h-6 rounded-[4px] shrink-0 border border-[rgba(0,0,0,0.12)]"
          style={{ backgroundColor: stop.color, opacity: stop.opacity / 100 }}
        />
        <input
          value={stop.color.replace('#', '')}
          onChange={e => {
            const val = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
            if (val.length === 6) onChange(`#${val}`, stop.opacity);
          }}
          className="w-[68px] h-[22px] px-2 shrink-0 border border-[rgba(0,0,0,0.12)] rounded-[4px] text-[11px] bg-white outline-none focus:border-[#5B4EFF] uppercase"
          style={labelStyle}
          maxLength={6}
        />
        <input
          type="number" min={0} max={100} value={stop.opacity}
          onChange={e => onChange(stop.color, Math.max(0, Math.min(100, Number(e.target.value))))}
          className="w-10 h-[22px] px-1 text-center border border-[rgba(0,0,0,0.12)] rounded-[4px] text-[11px] bg-white outline-none focus:border-[#5B4EFF]"
          style={labelStyle}
        />
        <span className="text-[10px] text-[rgba(0,0,0,0.4)]" style={labelStyle}>%</span>
      </div>

      {/* Mini colour area */}
      <MiniColorArea
        color={stop.color}
        onChange={color => onChange(color, stop.opacity)}
      />
    </div>
  );
}

// ── GradientBar ─────────────────────────────────────────────────────

interface GradientBarProps {
  gradient:       LinearGradient;
  selectedStopId: string;
  onSelectStop:   (id: string) => void;
  onMoveStop:     (id: string, position: number) => void;
  onAddStop:      (position: number) => void;
  onRemoveStop:   (id: string) => void;
}

function GradientBar({
  gradient, selectedStopId,
  onSelectStop, onMoveStop, onAddStop, onRemoveStop,
}: GradientBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  // Always render horizontal in the preview bar (ignore gradient angle)
  const gradientCSS = buildGradientCSS({ ...gradient, angle: 90 });

  function handleBarClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).dataset.stopId) return;
    const rect = barRef.current!.getBoundingClientRect();
    const pos  = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    onAddStop(Math.min(99, Math.max(1, pos)));
  }

  function handleStopMouseDown(e: React.MouseEvent, stopId: string) {
    e.stopPropagation();
    onSelectStop(stopId);
    const rect = barRef.current!.getBoundingClientRect();

    function onMouseMove(ev: MouseEvent) {
      const pos = Math.round(((ev.clientX - rect.left) / rect.width) * 100);
      onMoveStop(stopId, Math.min(100, Math.max(0, pos)));
    }
    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Gradient preview bar */}
      <div
        ref={barRef}
        className="relative w-full h-6 rounded-[4px] cursor-crosshair"
        style={{
          backgroundImage: `${gradientCSS}, repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)`,
          backgroundSize:  'auto, 8px 8px',
        }}
        onClick={handleBarClick}
      >
        {gradient.stops.map(stop => (
          <div
            key={stop.id}
            data-stop-id={stop.id}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white cursor-grab active:cursor-grabbing"
            style={{
              left:            `${stop.position}%`,
              backgroundColor: stop.color,
              opacity:         stop.opacity / 100,
              boxShadow:       stop.id === selectedStopId
                ? '0 0 0 2px #5B4EFF, 0 1px 4px rgba(0,0,0,0.3)'
                : '0 1px 4px rgba(0,0,0,0.3)',
              zIndex: stop.id === selectedStopId ? 10 : 0,
            }}
            onMouseDown={e => handleStopMouseDown(e, stop.id)}
            onDoubleClick={e => { e.stopPropagation(); onRemoveStop(stop.id); }}
            title={`${stop.color} ${stop.position}% — double-click to remove`}
          />
        ))}
      </div>
      <p className="text-[9px] text-[rgba(0,0,0,0.4)] text-center" style={labelStyle}>
        Click to add stop · Double-click stop to remove
      </p>
    </div>
  );
}

// ── GradientAngleControl ────────────────────────────────────────────

function GradientAngleControl({
  angle,
  onChange,
}: {
  angle:    number;
  onChange: (angle: number) => void;
}) {
  const wheelRef = useRef<HTMLDivElement>(null);

  function handleWheelClick(e: React.MouseEvent) {
    const rect = wheelRef.current!.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const rad  = Math.atan2(e.clientY - cy, e.clientX - cx);
    // atan2 gives angle from +x axis. Adding 90° converts to CSS gradient convention (from top, CW).
    const deg  = Math.round(((rad * 180 / Math.PI) + 90 + 360) % 360);
    onChange(deg);
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Row 1: wheel + numeric input */}
      <div className="flex items-center gap-2">
        {/* Angle wheel */}
        <div
          ref={wheelRef}
          className="w-8 h-8 rounded-full border-2 border-[rgba(0,0,0,0.15)] relative cursor-pointer shrink-0 hover:border-[#5B4EFF] transition-colors"
          onClick={handleWheelClick}
          title="Click to set angle"
        >
          {/* Indicator line — pivots around its bottom (the wheel centre) */}
          <div
            className="absolute rounded-[1px] bg-[#5B4EFF]"
            style={{
              width:           2,
              height:          12,
              top:             '50%',
              left:            '50%',
              marginLeft:      -1,
              marginTop:       -12,
              transformOrigin: 'center bottom',
              transform:       `rotate(${angle}deg)`,
            }}
          />
          {/* Centre dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#5B4EFF]" />
        </div>

        {/* Numeric input */}
        <div className="flex items-center gap-1">
          <input
            type="number" min={0} max={359} value={angle}
            onChange={e => onChange((Number(e.target.value) + 360) % 360)}
            className="w-14 h-[22px] px-2 text-center border border-[rgba(0,0,0,0.12)] rounded-[4px] text-[11px] text-[rgba(0,0,0,0.87)] bg-white outline-none focus:border-[#5B4EFF]"
            style={labelStyle}
          />
          <span className="text-[11px] text-[rgba(0,0,0,0.5)]" style={labelStyle}>°</span>
        </div>
      </div>

      {/* Row 2: angle presets */}
      <div className="flex items-center gap-0.5 flex-wrap">
        {ANGLE_PRESETS.map(preset => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={`h-5 px-1 min-w-[22px] rounded-[3px] text-[8px] transition-colors ${
              angle === preset
                ? 'bg-[#5B4EFF] text-white'
                : 'bg-[rgba(0,0,0,0.06)] text-[rgba(0,0,0,0.6)] hover:bg-[rgba(0,0,0,0.1)]'
            }`}
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
            title={`${preset}°`}
          >
            {preset}°
          </button>
        ))}
      </div>
    </div>
  );
}

// ── GradientStopList ────────────────────────────────────────────────

function GradientStopList({
  stops,
  selectedStopId,
  onSelect,
  onRemove,
}: {
  stops:          GradientStop[];
  selectedStopId: string;
  onSelect:       (id: string) => void;
  onRemove:       (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] text-[rgba(0,0,0,0.5)] px-1" style={labelStyle}>
        Stops ({stops.length})
      </p>
      <div className="flex flex-col gap-0.5 max-h-[80px] overflow-y-auto">
        {stops.map(stop => (
          <div
            key={stop.id}
            className={`flex items-center gap-2 px-1.5 py-1 rounded-[4px] cursor-pointer transition-colors select-none ${
              stop.id === selectedStopId
                ? 'bg-[rgba(91,78,255,0.08)]'
                : 'hover:bg-[rgba(0,0,0,0.04)]'
            }`}
            onClick={() => onSelect(stop.id)}
          >
            <div
              className="w-3.5 h-3.5 rounded-[2px] shrink-0 border border-[rgba(0,0,0,0.12)]"
              style={{ backgroundColor: stop.color }}
            />
            <span
              className="flex-1 text-[10px] text-[rgba(0,0,0,0.7)] truncate"
              style={labelStyle}
            >
              {stop.color.toUpperCase()}
            </span>
            <span
              className="text-[10px] text-[rgba(0,0,0,0.45)] shrink-0"
              style={labelStyle}
            >
              {stop.position}%
            </span>
            {stops.length > 2 && (
              <button
                onClick={e => { e.stopPropagation(); onRemove(stop.id); }}
                className="w-4 h-4 flex items-center justify-center text-[rgba(0,0,0,0.3)] hover:text-[rgba(0,0,0,0.7)] shrink-0"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── GradientPresets ─────────────────────────────────────────────────

function GradientPresets({ onSelect }: { onSelect: (g: LinearGradient) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] text-[rgba(0,0,0,0.5)] px-1" style={labelStyle}>
        Presets
      </p>
      <div className="flex flex-wrap gap-1">
        {GRADIENT_PRESETS.map((preset, i) => (
          <button
            key={i}
            onClick={() =>
              onSelect({
                ...preset,
                stops: preset.stops.map(s => ({ ...s, id: crypto.randomUUID() })),
              })
            }
            className="w-6 h-6 rounded-[4px] border border-[rgba(0,0,0,0.12)] hover:scale-110 transition-transform"
            style={{ background: buildGradientCSS({ ...preset, angle: 135 }) }}
            title={`${preset.angle}° — ${preset.stops.length} stop${preset.stops.length > 1 ? 's' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── LinearGradientEditor (main export) ──────────────────────────────

export function LinearGradientEditor({
  value,
  onChange,
}: {
  value:    LinearGradient;
  onChange: (gradient: LinearGradient) => void;
}) {
  const [gradient,       setGradient]  = useState<LinearGradient>(value);
  const [selectedStopId, setSelectedStop] = useState<string>(value.stops[0].id);

  const selectedStop =
    gradient.stops.find(s => s.id === selectedStopId) ?? gradient.stops[0];

  function update(updated: LinearGradient) {
    setGradient(updated);
    onChange(updated);
  }

  return (
    <div className="flex flex-col gap-2 p-2 overflow-y-auto">

      {/* Gradient bar */}
      <GradientBar
        gradient={gradient}
        selectedStopId={selectedStopId}
        onSelectStop={setSelectedStop}
        onMoveStop={(id, pos) =>
          update({
            ...gradient,
            stops: gradient.stops
              .map(s => s.id === id ? { ...s, position: pos } : s)
              .sort((a, b) => a.position - b.position),
          })
        }
        onAddStop={position => {
          const color   = interpolateGradientColor(gradient, position);
          const newStop: GradientStop = {
            id: crypto.randomUUID(),
            position,
            color,
            opacity: 100,
          };
          const stops   = [...gradient.stops, newStop].sort((a, b) => a.position - b.position);
          const updated = { ...gradient, stops };
          update(updated);
          setSelectedStop(newStop.id);
        }}
        onRemoveStop={id => {
          if (gradient.stops.length <= 2) return;
          const stops   = gradient.stops.filter(s => s.id !== id);
          const updated = { ...gradient, stops };
          update(updated);
          setSelectedStop(stops[0].id);
        }}
      />

      {/* Angle control */}
      <GradientAngleControl
        angle={gradient.angle}
        onChange={angle => update({ ...gradient, angle })}
      />

      {/* Selected stop editor */}
      <div className="border-t border-[rgba(0,0,0,0.08)] pt-2">
        <p className="text-[10px] text-[rgba(0,0,0,0.5)] mb-1.5 px-1" style={labelStyle}>
          Selected stop
        </p>
        <StopColorEditor
          key={selectedStopId}  // remount when selection changes — fresh HSL state
          stop={selectedStop}
          onChange={(color, opacity) =>
            update({
              ...gradient,
              stops: gradient.stops.map(s =>
                s.id === selectedStopId ? { ...s, color, opacity } : s,
              ),
            })
          }
        />
      </div>

      {/* Stop list */}
      <GradientStopList
        stops={gradient.stops}
        selectedStopId={selectedStopId}
        onSelect={setSelectedStop}
        onRemove={id => {
          if (gradient.stops.length <= 2) return;
          const stops   = gradient.stops.filter(s => s.id !== id);
          update({ ...gradient, stops });
          setSelectedStop(stops[0].id);
        }}
      />

      {/* Gradient presets */}
      <div className="border-t border-[rgba(0,0,0,0.08)] pt-2">
        <GradientPresets onSelect={preset => update(preset)} />
      </div>

    </div>
  );
}
