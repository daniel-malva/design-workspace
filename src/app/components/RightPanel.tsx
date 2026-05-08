import { BrandKitSelector } from './BrandKitSelector';
import { useState } from 'react';
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  Bold, Italic, Underline, Strikethrough, Plus, Minus, Eye, EyeOff,
  Settings, ChevronDown, Shapes, Smile, Type, Braces,
  MoreHorizontal, Users, Link,
} from 'lucide-react';
import { PlaceholderPropertiesPanel } from './PlaceholderPropertiesPanel';
import { SettingsPanel } from './SettingsPanel';
import { ConfigurePanel } from './ConfigurePanel';
import { ActivityPanel } from './ActivityPanel';
import { RightPanelHeader } from './RightPanelHeader';
import { MultiSelectionPanel } from './MultiSelectionPanel';
import { ColorSwatchButton } from './ColorSwatchButton';
import { Separator } from './ui/separator';

import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import type { CanvasElement } from '../store/useDesignWorkspaceStore';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold text-[#111111] mb-2">{children}</p>;
}

function FieldInput({
  label, value, onChange,
}: { label: string; value: string | number; onChange?: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      <span className="text-[10px] text-[#6B6B6B] w-4 shrink-0 text-center font-medium">{label}</span>
      <div className="flex-1 bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg px-2 py-1.5">
        <input
          className="w-full text-[11px] text-[#111111] bg-transparent outline-none"
          value={value}
          onChange={e => onChange?.(e.target.value)}
          readOnly={!onChange}
        />
      </div>
    </div>
  );
}

function AlignBtn({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
        active ? 'bg-[rgba(91,78,255,0.12)] text-[#5B4EFF]' : 'hover:bg-[#f0f0f0] text-[#6B6B6B]'
      }`}
    >
      {children}
    </button>
  );
}

function AlignmentButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex items-center justify-center py-2 bg-white hover:bg-[rgba(91,78,255,0.06)] text-[#6B6B6B] hover:text-[#5B4EFF] transition-colors">
      {children}
    </button>
  );
}

function BlendModeOption({ value }: { value: string }) {
  return <option>{value}</option>;
}

function FontFamilyOption({ value }: { value: string }) {
  return <option>{value}</option>;
}

function FontWeightOption({ value }: { value: string }) {
  return <option>{value}</option>;
}

// ══════════════════════════════════════════════════════════════════
// POSITION + LAYER SECTION (shared by all panels)
// ═══════════════════════════════════════════════════════════════════

function PositionSection({ element }: { element: CanvasElement | undefined }) {
  const { updateElement } = useDesignWorkspace();
  const [blendMode, setBlendMode] = useState('Pass through');

  const update = (key: keyof CanvasElement, v: string) => {
    if (!element) return;
    const num = Number(v);
    if (!isNaN(num)) updateElement(element.id, { [key]: num } as Partial<CanvasElement>);
  };

  return (
    <>
      <SectionLabel>Position</SectionLabel>
      <div className="grid grid-cols-3 gap-px bg-[#E2E2E2] rounded-xl overflow-hidden mb-3">
        <AlignmentButton><AlignLeft size={12} /></AlignmentButton>
        <AlignmentButton><AlignCenter size={12} /></AlignmentButton>
        <AlignmentButton><AlignRight size={12} /></AlignmentButton>
        <AlignmentButton><AlignVerticalJustifyStart size={12} /></AlignmentButton>
        <AlignmentButton><AlignVerticalJustifyCenter size={12} /></AlignmentButton>
        <AlignmentButton><AlignVerticalJustifyEnd size={12} /></AlignmentButton>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-1.5 w-full">
        <FieldInput label="X" value={Math.round(element?.x ?? 0)} onChange={v => update('x', v)} />
        <FieldInput label="Y" value={Math.round(element?.y ?? 0)} onChange={v => update('y', v)} />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-1 w-full">
        <FieldInput label="W" value={Math.round(element?.width ?? 0)} onChange={v => update('width', v)} />
        <FieldInput label="H" value={Math.round(element?.height ?? 0)} onChange={v => update('height', v)} />
      </div>

      <Separator className="my-2" />

      {/* Layer */}
      <div className="flex items-center justify-between mb-2">
        <SectionLabel>Layer</SectionLabel>
        <button className="text-[#6B6B6B] hover:text-[#111111]"><Plus size={13} /></button>
      </div>
      <div className="flex items-center gap-2 mb-3 w-full">
        <div className="w-6 h-6 rounded-lg bg-[#f5f5f5] border border-[#E2E2E2] flex items-center justify-center shrink-0">
          <div className="w-3 h-3 rounded-sm bg-[#6B6B6B]" />
        </div>
        <div className="relative flex-1 min-w-0">
          <select value={blendMode} onChange={e => setBlendMode(e.target.value)}
            className="w-full appearance-none bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg px-2 py-1.5 text-[11px] text-[#111111] pr-6">
            {['Pass through', 'Normal', 'Multiply', 'Screen', 'Overlay', 'Darken', 'Lighten'].map(m => (
              <BlendModeOption key={m} value={m} />
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#6B6B6B] pointer-events-none" />
        </div>
        <div className="flex items-center gap-0.5 bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg px-2 py-1.5 shrink-0 w-16">
          <input
            type="number"
            defaultValue={100}
            min={0}
            max={100}
            className="w-8 text-[11px] text-[#111111] bg-transparent outline-none"
            onChange={e => {
              if (element) updateElement(element.id, { style: { ...element.style, opacity: Number(e.target.value) / 100 } });
            }}
          />
          <span className="text-[10px] text-[#6B6B6B]">%</span>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TEXT PROPERTIES PANEL
// ═══════════════════════════════════════════════════════════════════

function TextPropertiesPanel({ element }: { element: CanvasElement | undefined }) {
  const { textProps, setTextProp, updateElement } = useDesignWorkspace();
  const [fillVisible, setFillVisible] = useState(true);
  const [brandKit, setBrandKit] = useState('');

  // V55: read font-size directly from the element's style so it reflects
  // resize changes in real time. Fall back to textProps for other properties.
  const elementFontSize = element?.style?.fontSize ?? textProps.fontSize;

  // Resolve fill colour — prefer element style, fall back to textProps
  const fillColorHex = element?.style?.color ?? `#${textProps.fillColor}`;
  const fillOpacity  = element?.style?.opacity !== undefined
    ? Math.round(element.style.opacity * 100)
    : textProps.fillOpacity;

  return (
    <>
      <PositionSection element={element} />

      <Separator className="my-2" />

      {/* Brand */}
      <div className="mb-3 w-full">
        <BrandKitSelector value={brandKit} onChange={setBrandKit} label="Brand" />
      </div>

      <Separator className="my-2" />

      {/* Text */}
      <div className="flex items-center justify-between mb-2">
        <SectionLabel>Text</SectionLabel>
        <button className="text-[#6B6B6B] hover:text-[#111111]"><Settings size={12} /></button>
      </div>

      {/* Font family */}
      <div className="relative mb-2 w-full">
        <select value={textProps.fontFamily} onChange={e => setTextProp('fontFamily', e.target.value)}
          className="w-full appearance-none bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg px-3 py-2 text-[11px] text-[#111111] pr-6">
          {['Roboto', 'Inter', 'Helvetica', 'Arial', 'Georgia'].map(f => <FontFamilyOption key={f} value={f} />)}
        </select>
        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B6B6B] pointer-events-none" />
      </div>

      {/* Weight + size */}
      <div className="grid grid-cols-2 gap-2 mb-2 w-full">
        <div className="relative min-w-0">
          <select value={textProps.fontWeight} onChange={e => setTextProp('fontWeight', e.target.value)}
            className="w-full appearance-none bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg px-2 py-2 text-[11px] text-[#111111] pr-5">
            {['Thin', 'Light', 'Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Black'].map(w => (
              <FontWeightOption key={w} value={w} />
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#6B6B6B] pointer-events-none" />
        </div>
        {/* V55: font-size reflects resize in real time — reads element.style.fontSize */}
        <div className="flex items-center bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg px-2 py-1.5 gap-1 min-w-0">
          <input
            type="number"
            value={Math.round(elementFontSize)}
            onChange={e => {
              const val = Number(e.target.value);
              if (!isNaN(val) && val > 0) {
                if (element) {
                  updateElement(element.id, { style: { ...element.style, fontSize: val } });
                } else {
                  setTextProp('fontSize', val);
                }
              }
            }}
            className="flex-1 min-w-0 text-[11px] text-[#111111] bg-transparent outline-none text-center"
          />
          <div className="flex flex-col gap-0 shrink-0">
            <button
              onClick={() => {
                if (element) {
                  updateElement(element.id, { style: { ...element.style, fontSize: Math.round(elementFontSize) + 1 } });
                } else {
                  setTextProp('fontSize', textProps.fontSize + 1);
                }
              }}
              className="text-[7px] text-[#6B6B6B] leading-none"
            >▲</button>
            <button
              onClick={() => {
                const next = Math.max(1, Math.round(elementFontSize) - 1);
                if (element) {
                  updateElement(element.id, { style: { ...element.style, fontSize: next } });
                } else {
                  setTextProp('fontSize', next);
                }
              }}
              className="text-[7px] text-[#6B6B6B] leading-none"
            >▼</button>
          </div>
        </div>
      </div>

      {/* Letter spacing + line height */}
      <div className="grid grid-cols-2 gap-2 mb-2 w-full">
        {[
          { label: 'A|', key: 'letterSpacing' as const, val: textProps.letterSpacing },
          { label: 'Ā',  key: 'lineHeight'    as const, val: textProps.lineHeight    },
        ].map(({ label, key, val }) => (
          <div key={key} className="flex items-center gap-1 min-w-0 bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg px-2 py-1.5">
            <span className="text-[9px] text-[#6B6B6B] shrink-0 font-medium">{label}</span>
            <input type="number" value={val} onChange={e => setTextProp(key, Number(e.target.value))}
              className="flex-1 min-w-0 text-[11px] text-[#111111] bg-transparent outline-none text-center" />
            <div className="flex flex-col shrink-0">
              <button onClick={() => setTextProp(key, (val as number) + 1)} className="text-[7px] text-[#6B6B6B] leading-none">▲</button>
              <button onClick={() => setTextProp(key, Math.max(0, (val as number) - 1))} className="text-[7px] text-[#6B6B6B] leading-none">▼</button>
            </div>
          </div>
        ))}
      </div>

      {/* Text alignment */}
      <div className="flex items-center justify-between mb-1.5 w-full">
        <div className="flex items-center gap-0.5">
          {[
            { icon: <AlignLeft size={13} />,    align: 'left'    as const },
            { icon: <AlignCenter size={13} />,  align: 'center'  as const },
            { icon: <AlignRight size={13} />,   align: 'right'   as const },
            { icon: <AlignJustify size={13} />, align: 'justify' as const },
          ].map(({ icon, align }) => (
            <AlignBtn key={align} active={textProps.textAlign === align} onClick={() => setTextProp('textAlign', align)}>{icon}</AlignBtn>
          ))}
        </div>
        <div className="w-px h-5 bg-[#E2E2E2]" />
        <div className="flex items-center gap-0.5">
          {[
            { icon: <AlignVerticalJustifyStart  size={13} />, align: 'top'    as const },
            { icon: <AlignVerticalJustifyCenter size={13} />, align: 'middle' as const },
            { icon: <AlignVerticalJustifyEnd    size={13} />, align: 'bottom' as const },
          ].map(({ icon, align }) => (
            <AlignBtn key={align} active={textProps.verticalAlign === align} onClick={() => setTextProp('verticalAlign', align)}>{icon}</AlignBtn>
          ))}
        </div>
      </div>

      {/* Bold / Italic / etc. */}
      <div className="flex items-center gap-0.5 mb-3 w-full">
        {[
          { icon: <Bold size={13} />,          prop: 'bold'          as const },
          { icon: <Italic size={13} />,        prop: 'italic'        as const },
          { icon: <Underline size={13} />,     prop: 'underline'     as const },
          { icon: <Strikethrough size={13} />, prop: 'strikethrough' as const },
        ].map(({ icon, prop }) => (
          <AlignBtn key={prop} active={textProps[prop] as boolean} onClick={() => setTextProp(prop, !textProps[prop])}>{icon}</AlignBtn>
        ))}
        <AlignBtn active={false} onClick={() => {}}>
          <span className="text-[10px] font-semibold">Aa</span>
        </AlignBtn>
      </div>

      <Separator className="my-2" />

      {/* Style — Fill */}
      <SectionLabel>Style</SectionLabel>
      <div className="flex items-center justify-between mb-1.5 w-full">
        <span className="text-[11px] text-[#6B6B6B]">Fill</span>
        <button onClick={() => setTextProp('fillOpacity', textProps.fillOpacity === 0 ? 100 : 0)} className="text-[#6B6B6B] hover:text-[#111111]">
          <Minus size={12} />
        </button>
      </div>
      <div className="flex items-center gap-2 mb-3 w-full">
        {/* ✅ Clickable colour swatch — opens ColorPicker */}
        <ColorSwatchButton
          color={fillColorHex}
          opacity={fillOpacity}
          property="color"
          elementId={element?.id ?? ''}
          size={24}
          onExtraChange={(hex) => setTextProp('fillColor', hex.replace('#', ''))}
        />
        <div className="flex-1 min-w-0 bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg px-2 py-1.5">
          <input
            value={fillColorHex.replace('#', '')}
            onChange={e => {
              const v = e.target.value.replace('#', '');
              setTextProp('fillColor', v);
              if (element && v.length === 6) {
                updateElement(element.id, { style: { ...element.style, color: `#${v}` } });
              }
            }}
            className="w-full text-[11px] text-[#111111] bg-transparent outline-none uppercase" maxLength={6}
          />
        </div>
        <div className="flex items-center gap-0.5 bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg px-2 py-1.5 w-16 shrink-0">
          <input type="number" value={fillOpacity} onChange={e => setTextProp('fillOpacity', Math.max(0, Math.min(100, Number(e.target.value))))}
            className="w-8 text-[11px] text-[#111111] bg-transparent outline-none" />
          <span className="text-[10px] text-[#6B6B6B]">%</span>
        </div>
        <button onClick={() => setFillVisible(v => !v)} className="text-[#6B6B6B] hover:text-[#111111] transition-colors shrink-0">
          {fillVisible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
      </div>

      {/* Stroke */}
      <div className="flex items-center justify-between mb-2 w-full">
        <span className="text-[11px] text-[#6B6B6B]">Stroke</span>
        <button className="text-[#6B6B6B] hover:text-[#111111]"><Plus size={12} /></button>
      </div>

      <Separator className="my-2" />

      {/* Shadow */}
      <div className="flex items-center justify-between mb-2 w-full">
        <span className="text-[11px] text-[#6B6B6B]">Shadow</span>
        <button className="text-[#6B6B6B] hover:text-[#111111]"><Plus size={12} /></button>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PLACEHOLDER PROPERTIES PANEL
// ═══════════════════════════════════════════════════════════════════

// Replaced by the new PlaceholderPropertiesPanel component (see import above)

// ── Action icons for placeholder panels (unchanged) ───────────────

function PlaceholderPanelIcons() {
  return (
    <>
      <button
        className="w-5 h-5 flex items-center justify-center text-[#1f1d25] hover:text-[#473bab] transition-colors"
        title="More options"
      >
        <MoreHorizontal size={16} />
      </button>
      <button
        className="w-5 h-5 flex items-center justify-center text-[#1f1d25] hover:text-[#473bab] transition-colors"
        title="Collaborators"
      >
        <Users size={16} />
      </button>
      <button
        className="w-5 h-5 flex items-center justify-center text-[#1f1d25] hover:text-[#473bab] transition-colors"
        title="Link"
      >
        <Link size={16} />
      </button>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SHAPE PROPERTIES PANEL
// ═══════════════════════════════════════════════════════════════════

function ShapePropertiesPanel({ element }: { element: CanvasElement | undefined }) {
  const fillColor  = element?.style?.backgroundColor ?? '#6B7280';
  const fillOpacity = element?.style?.opacity !== undefined ? Math.round(element.style.opacity * 100) : 100;

  return (
    <>
      <PositionSection element={element} />

      <Separator className="my-2" />

      <SectionLabel>Style</SectionLabel>

      {/* Fill */}
      <div className="flex items-center justify-between mb-1.5 w-full">
        <span className="text-[11px] text-[#6B6B6B]">Fill</span>
        <button className="text-[#6B6B6B] hover:text-[#111111]"><Plus size={12} /></button>
      </div>
      <div className="flex items-center gap-2 mb-3 w-full">
        {/* ✅ Clickable colour swatch */}
        <ColorSwatchButton
          color={fillColor}
          opacity={fillOpacity}
          property="fill"
          elementId={element?.id ?? ''}
          size={24}
        />
        <div className="flex-1 min-w-0 bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg px-2 py-1.5">
          <input
            className="w-full text-[11px] text-[#111111] bg-transparent outline-none uppercase"
            value={fillColor.replace('#', '')}
            maxLength={6}
            readOnly
          />
        </div>
        <div className="flex items-center gap-0.5 bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg px-2 py-1.5 w-16 shrink-0">
          <input type="number" value={fillOpacity} readOnly className="w-8 text-[11px] text-[#111111] bg-transparent outline-none" />
          <span className="text-[10px] text-[#6B6B6B]">%</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2 w-full">
        <span className="text-[11px] text-[#6B6B6B]">Stroke</span>
        <button className="text-[#6B6B6B] hover:text-[#111111]"><Plus size={12} /></button>
      </div>

      <Separator className="my-2" />

      <div className="flex items-center justify-between mb-2 w-full">
        <span className="text-[11px] text-[#6B6B6B]">Shadow</span>
        <button className="text-[#6B6B6B] hover:text-[#111111]"><Plus size={12} /></button>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ICON PROPERTIES PANEL
// ═══════════════════════════════════════════════════════════════════

function IconPropertiesPanel({ element }: { element: CanvasElement | undefined }) {
  const iconColor = element?.style?.color ?? '#111111';

  return (
    <>
      <PositionSection element={element} />

      <Separator className="my-2" />

      <SectionLabel>Icon</SectionLabel>
      {element?.iconSrc && (
        <div className="flex items-center gap-3 mb-3 p-2.5 bg-[#f5f5f5] rounded-xl border border-[#E2E2E2]">
          <img src={element.iconSrc} alt="selected icon" className="w-8 h-8 object-contain rounded" />
          <span className="text-[11px] text-[#6B6B6B]">Brand icon</span>
        </div>
      )}

      <SectionLabel>Color</SectionLabel>
      <div className="flex items-center gap-2 mb-3 w-full">
        {/* ✅ Clickable colour swatch */}
        <ColorSwatchButton
          color={iconColor}
          opacity={100}
          property="color"
          elementId={element?.id ?? ''}
          size={24}
        />
        <div className="flex-1 min-w-0 bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg px-2 py-1.5">
          <input
            className="w-full text-[11px] text-[#111111] bg-transparent outline-none uppercase"
            value={iconColor.replace('#', '')}
            maxLength={6}
            readOnly
          />
        </div>
      </div>

      <Separator className="my-2" />

      <div className="flex items-center justify-between mb-2 w-full">
        <span className="text-[11px] text-[#6B6B6B]">Shadow</span>
        <button className="text-[#6B6B6B] hover:text-[#111111]"><Plus size={12} /></button>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LINE PROPERTIES PANEL
// ═══════════════════════════════════════════════════════════════════

function LinePropertiesPanel({ element }: { element: CanvasElement | undefined }) {
  const lineColor = element?.style?.borderColor ?? '#6B7280';

  return (
    <>
      <PositionSection element={element} />

      <Separator className="my-2" />

      <SectionLabel>Line Style</SectionLabel>
      <div className="relative mb-3 w-full">
        <select defaultValue={element?.lineVariant ?? 'solid'}
          className="w-full appearance-none bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg px-3 py-2 text-[11px] text-[#111111] pr-6">
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
          <option value="arrow">Arrow</option>
        </select>
        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B6B6B] pointer-events-none" />
      </div>

      <SectionLabel>Color</SectionLabel>
      <div className="flex items-center gap-2 mb-3 w-full">
        {/* ✅ Clickable colour swatch */}
        <ColorSwatchButton
          color={lineColor}
          opacity={100}
          property="stroke"
          elementId={element?.id ?? ''}
          size={24}
        />
        <div className="flex-1 min-w-0 bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg px-2 py-1.5">
          <input
            className="w-full text-[11px] text-[#111111] bg-transparent outline-none uppercase"
            value={lineColor.replace('#', '')}
            maxLength={6}
            readOnly
          />
        </div>
      </div>

      <SectionLabel>Weight</SectionLabel>
      <div className="flex items-center bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg px-2 py-1.5 mb-3 w-full gap-1">
        <input type="number" defaultValue={2} min={1} max={20}
          className="flex-1 min-w-0 text-[11px] text-[#111111] bg-transparent outline-none text-center" />
        <span className="text-[10px] text-[#6B6B6B]">px</span>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GENERIC FALLBACK PANEL
// ══════════════════════════════════════════════════════════════════

function GenericPropertiesPanel({ element }: { element: CanvasElement | undefined }) {
  return (
    <>
      <PositionSection element={element} />

      <Separator className="my-2" />

      <div className="flex flex-col items-center justify-center py-6 text-center">
        <p className="text-[12px] text-[#9CA3AF]">Properties for this element type will appear here.</p>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PROPERTIES CONTENT ROUTER
// ═══════════════════════════════════════════════════════════════════

function PropertiesContent({ element, elementType }: { element: CanvasElement | undefined; elementType: string | null }) {
  switch (elementType) {
    case 'text-header':
    case 'text-subheader':
    case 'text-body':
    case 'text-template':
      return <TextPropertiesPanel element={element} />;

    case 'placeholder-logo':
    case 'placeholder-background':
    case 'placeholder-jellybean':
    case 'placeholder-media':
    case 'placeholder-audio':
      return element
        ? <PlaceholderPropertiesPanel elementId={element.id} />
        : null;

    case 'shape':
      return <ShapePropertiesPanel element={element} />;

    case 'icon':
      return <IconPropertiesPanel element={element} />;

    case 'line':
      return <LinePropertiesPanel element={element} />;

    case '__settings__':
      return <SettingsPanel />;

    case '__activity__':
      return <ActivityPanel />;

    default:
      return <GenericPropertiesPanel element={element} />;
  }
}

// ═══════════════════════════════════════════════════════════════════
// ELEMENT TYPE LABEL MAP
// ═══════════════════════════════════════════════════════════════════

const elementTypeLabel: Record<string, string> = {
  // New typed elements
  'text-header':            'Text',
  'text-subheader':         'Text',
  'text-body':              'Text',
  'text-template':          'Text',
  'placeholder-logo':       'Logo',
  'placeholder-background': 'Background',
  'placeholder-jellybean':  'Jellybean',
  'placeholder-media':      'Media',
  'placeholder-audio':      'Audio',
  'shape':                  'Shape',
  'icon':                   'Icon',
  'line':                   'Line',
  // Legacy fallbacks
  'text':                   'Text',
  'dynamicPlaceholder':     'Dynamic Placeholder',
  'image':                  'Image',
  'component':              'Component',
  'annotation':             'Annotation',
  'audio':                  'Audio',
};

const elementTypeIcon: Record<string, React.ReactNode> = {
  'text-header':            <Type size={13} />,
  'text-subheader':         <Type size={13} />,
  'text-body':              <Type size={13} />,
  'text-template':          <Type size={13} />,
  'placeholder-logo':       <Braces size={13} />,
  'placeholder-background': <Braces size={13} />,
  'placeholder-jellybean':  <Braces size={13} />,
  'placeholder-media':      <Braces size={13} />,
  'placeholder-audio':      <Braces size={13} />,
  'shape':                  <Shapes size={13} />,
  'icon':                   <Smile size={13} />,
  'line':                   <Minus size={13} />,
};

// ═══════════════════════════════════════════════════════════════════
// MAIN RIGHT PANEL
// ═══════════════════════════════════════════════════════════════════

export function RightPanel() {
  const {
    selectedElementIds,
    selectedElementType,
    activePanel,
    canvasElements,
    activityPanelOpen,
  } = useDesignWorkspace();

  // ── Priority-based visibility ─────────────────────────────────────
  const isSettings        = activePanel === 'settings';
  const isConfigure       = activePanel === 'configure';
  const hasSingleSelection = selectedElementIds.length === 1;
  const hasMultiSelection  = selectedElementIds.length > 1;
  const hasSelection       = selectedElementIds.length > 0;
  const showActivity = activityPanelOpen && !hasSelection && !isSettings && !isConfigure;

  const isVisible = isSettings || isConfigure || hasSelection || showActivity;
  if (!isVisible) return null;

  // ── Content router ─────────────────────────────────────────────────
  const renderContent = () => {
    // PRIORITY 0 — Multiple elements selected → group panel
    if (hasMultiSelection) {
      return <MultiSelectionPanel />;
    }

    // PRIORITY 1 — Single element selected → properties panel
    // (takes priority over Configure so users can edit elements while the feed panel is open)
    if (hasSingleSelection) {
      const selectedElement = canvasElements.find(el => el.id === selectedElementIds[0]);
      const isPlaceholder  = selectedElementType?.startsWith('placeholder-');
      const label          = selectedElementType
        ? (elementTypeLabel[selectedElementType] ?? 'Properties')
        : 'Properties';

      // Placeholder panels: RightPanelHeader (with action icons) + scrollable content
      if (isPlaceholder && selectedElement) {
        return (
          <>
            <RightPanelHeader title={label} actions={<PlaceholderPanelIcons />} />
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">
              <PlaceholderPropertiesPanel elementId={selectedElement.id} />
            </div>
          </>
        );
      }

      // Non-placeholder panels: RightPanelHeader (no extra actions) + scrollable content
      return (
        <>
          <RightPanelHeader title={label} />
          <div className="flex flex-col overflow-y-auto overflow-x-hidden flex-1 gap-0 px-4 py-3">
            <PropertiesContent element={selectedElement} elementType={selectedElementType} />
          </div>
        </>
      );
    }

    // PRIORITY 2 — Settings
    if (isSettings) return <SettingsPanel />;

    // PRIORITY 3 — Configure (only when nothing is selected)
    if (isConfigure) return <ConfigurePanel />;

    // PRIORITY 4 — Activity panel
    if (showActivity) return <ActivityPanel />;

    return null;
  };

  return (
    <div
      className="absolute right-1 top-1 bottom-1 w-[268px] bg-white rounded-2xl z-20 flex flex-col overflow-hidden"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
      onClick={e => e.stopPropagation()}
    >
      {renderContent()}
    </div>
  );
}