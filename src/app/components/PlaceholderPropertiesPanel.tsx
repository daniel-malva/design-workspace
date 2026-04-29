import { useState } from 'react';
import {
  AlignLeft, AlignCenter, AlignRight,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
} from 'lucide-react';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { BrandKitSelector } from './BrandKitSelector';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import svgPaths from '../../imports/Frame1000002053/svg-92ft12mtq4';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS (Figma V31/V32 — exact values)
// pt-2  = 8px content top padding (relative to Separator)
// gap-3 = 12px between top-level sections
// gap-2 = 8px between internal section elements
// p-2   = 8px padding on bordered cards
// h-9   = 36px input height · py-1.5 px-2 = 6px/8px input padding
// NOTE: horizontal padding (px-4) is applied by the RightPanel scroll wrapper.
// ─────────────────────────────────────────────────────────────────────────────

// ── Border-radius icon (from Figma SVG import) ────────────────────

function RoundedCornerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
      <path d={svgPaths.p2ce4700} fill="currentColor" fillOpacity="0.56" />
    </svg>
  );
}

// ── AxisField — label (w-10 fixed) + input ────────────────────────
// Figma: label Roboto Regular 14px tracking-[0.17px], input Roboto Regular 12px

function AxisField({
  label, value, onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-1 items-center gap-0 min-w-0">
      {/* Label — w-10 (40px) fixed, h-9 to match input height */}
      <div className="w-10 shrink-0 flex items-center justify-center h-9">
        <span
          className="text-[14px] text-[#1f1d25] tracking-[0.17px] leading-6 text-center select-none"
          style={{ fontFamily: "'Roboto', sans-serif" }}
        >
          {label}
        </span>
      </div>
      {/* Input — Roboto Regular 12px, h-9, py-1.5 px-2 */}
      <Input
        className="flex-1 min-w-0 h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border-[#dddce0] text-[#1f1d25] rounded-[4px] tracking-[0.17px]"
        value={value}
        onChange={e => {
          const v = Number(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
      />
    </div>
  );
}

// ── Alignment buttons — 3 horizontal + 3 vertical ─────────────────

function PlaceholderAlignmentButtons() {
  const [activeH, setActiveH] = useState<number | null>(null);
  const [activeV, setActiveV] = useState<number | null>(null);

  const hIcons = [
    <AlignLeft size={13} />,
    <AlignCenter size={13} />,
    <AlignRight size={13} />,
  ];
  const vIcons = [
    <AlignVerticalJustifyStart size={13} />,
    <AlignVerticalJustifyCenter size={13} />,
    <AlignVerticalJustifyEnd size={13} />,
  ];

  return (
    <div className="flex gap-2 w-full">
      <div className="flex flex-1 border border-[rgba(0,0,0,0.12)] rounded-[4px] overflow-hidden">
        {hIcons.map((icon, i) => (
          <button
            key={i}
            onClick={() => setActiveH(i === activeH ? null : i)}
            className={`flex-1 flex items-center justify-center h-8 transition-colors ${
              activeH === i
                ? 'bg-[rgba(71,59,171,0.08)] text-[#473bab]'
                : 'bg-[#f9fafa] text-[#686576] hover:bg-[rgba(0,0,0,0.04)]'
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
      <div className="flex flex-1 border border-[rgba(0,0,0,0.12)] rounded-[4px] overflow-hidden">
        {vIcons.map((icon, i) => (
          <button
            key={i}
            onClick={() => setActiveV(i === activeV ? null : i)}
            className={`flex-1 flex items-center justify-center h-8 transition-colors ${
              activeV === i
                ? 'bg-[rgba(71,59,171,0.08)] text-[#473bab]'
                : 'bg-[#f9fafa] text-[#686576] hover:bg-[rgba(0,0,0,0.04)]'
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Layer — "Show carcut" switch (Jellybean only)
//
// V32 change: the title row (layer name + action icons) has been removed.
// That role is now fulfilled by RightPanelHeader in RightPanel.tsx.
// This component now renders only the carcut switch, or nothing at all.
// ─────────────────────────────────────────────────────────────────────────────

function PlaceholderLayerTitleSection({
  showCarcut,
  onShowCarcutChange,
}: {
  showCarcut?: boolean;
  onShowCarcutChange?: (v: boolean) => void;
}) {
  // No switch needed for most variants
  if (showCarcut === undefined) return null;

  return (
    <div className="flex items-center gap-2 w-full">
      <Switch
        checked={showCarcut}
        onCheckedChange={onShowCarcutChange}
        className="shrink-0"
      />
      <label
        className="text-[14px] text-[#1f1d25] tracking-[0.15px] leading-[1.5] cursor-pointer select-none"
        style={{ fontFamily: "'Roboto', sans-serif" }}
      >
        Show carcut
      </label>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Position
// gap-2 (8px) between all internal elements
// Section title: Roboto Medium 14px tracking-[0.1px]
// ─────────────────────────────────────────────────────────────────────────────

function PlaceholderPositionSection({ elementId }: { elementId: string }) {
  const { updateElement, canvasElements } = useDesignWorkspace();
  const el = canvasElements.find(e => e.id === elementId);
  if (!el) return null;

  return (
    <div className="flex flex-col gap-2 items-start w-full">

      <p
        className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]"
        style={{ fontFamily: "'Roboto', sans-serif" }}
      >
        Position
      </p>

      <PlaceholderAlignmentButtons />

      {/* X / Y */}
      <div className="flex items-start justify-between w-full">
        <AxisField label="X" value={el.x}      onChange={v => updateElement(elementId, { x: v })} />
        <AxisField label="Y" value={el.y}      onChange={v => updateElement(elementId, { y: v })} />
      </div>

      {/* W / H */}
      <div className="flex items-start justify-between w-full">
        <AxisField label="W" value={el.width}  onChange={v => updateElement(elementId, { width: v })} />
        <AxisField label="H" value={el.height} onChange={v => updateElement(elementId, { height: v })} />
      </div>

      {/* Border Radius — icon w-10 h-9 aligns with AxisField label cell */}
      <div className="flex items-center w-full">
        <button className="w-10 h-9 flex items-center justify-center shrink-0 text-[rgba(0,0,0,0.56)]">
          <RoundedCornerIcon />
        </button>
        <Input
          className="flex-1 min-w-0 h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border-[#dddce0] text-[#1f1d25] rounded-[4px] tracking-[0.17px]"
          placeholder="0"
        />
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Properties (bordered card)
// p-2 (8px) padding · gap-3 (12px) internal · rounded-[8px]
// ─────────────────────────────────────────────────────────────────────────────

function PlaceholderPropertiesSection() {
  const [brand, setBrand] = useState('');
  return (
    <div className="flex flex-col gap-3 items-start p-2 w-full border border-[rgba(0,0,0,0.12)] rounded-[8px]">

      {/* Header: title + Reset */}
      <div className="flex items-center justify-between gap-4 w-full h-5">
        <p
          className="flex-1 min-w-0 text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]"
          style={{ fontFamily: "'Roboto', sans-serif" }}
        >
          Properties
        </p>
        <button className="flex items-center justify-center px-[5px] py-1 rounded-full hover:bg-[rgba(71,59,171,0.08)] transition-colors shrink-0">
          <span
            className="text-[13px] font-medium text-[#473bab] tracking-[0.46px] leading-[22px] capitalize whitespace-nowrap"
            style={{ fontFamily: "'Roboto', sans-serif" }}
          >
            Reset
          </span>
        </button>
      </div>

      {/* Brand selector */}
      <BrandKitSelector value={brand} onChange={setBrand} label="Brand" />

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Motion (bordered card)
// p-2 (8px) padding · gap-3 (12px) internal · rounded-[8px]
// start/end groups: gap-4 (16px) between, gap-3 (12px) label→input
// ─────────────────────────────────────────────────────────────────────────────

function PlaceholderMotionSection() {
  return (
    <div className="flex flex-col gap-3 items-start p-2 w-full border border-[rgba(0,0,0,0.12)] rounded-[8px]">

      <p
        className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]"
        style={{ fontFamily: "'Roboto', sans-serif" }}
      >
        Motion
      </p>

      {/* Start / End — gap-4 (16px) between groups */}
      <div className="flex items-center gap-4 w-full">

        {/* Start — gap-3 (12px) label→input */}
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <span
            className="text-xs text-[#1f1d25] tracking-[0.17px] text-center shrink-0"
            style={{ fontFamily: "'Roboto', sans-serif" }}
          >
            start
          </span>
          <Input
            className="flex-1 min-w-0 h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border-[#dddce0] text-[#1f1d25] rounded-[4px] tracking-[0.17px]"
            defaultValue="0:00"
          />
        </div>

        {/* End — gap-3 (12px) label→input */}
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <span
            className="text-xs text-[#1f1d25] tracking-[0.17px] text-center shrink-0"
            style={{ fontFamily: "'Roboto', sans-serif" }}
          >
            end
          </span>
          <Input
            className="flex-1 min-w-0 h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border-[#dddce0] text-[#1f1d25] rounded-[4px] tracking-[0.17px]"
            defaultValue="1:30"
          />
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT PANELS
//
// V32 change: title row + action icons removed from here → RightPanelHeader.
// Horizontal padding (px-4) comes from RightPanel's scroll wrapper.
// Root keeps: pt-2 (8px Figma token) · gap-3 (12px) · overflow-x-hidden.
// ─────────────────────────────────────────────────────────────────────────────

function JellybeanPropertiesPanel({ elementId }: { elementId: string }) {
  const [showCarcut, setShowCarcut] = useState(false);
  return (
    <div className="flex flex-col gap-3 items-start pt-2 w-full overflow-x-hidden">
      <PlaceholderLayerTitleSection
        showCarcut={showCarcut}
        onShowCarcutChange={setShowCarcut}
      />
      <PlaceholderPositionSection elementId={elementId} />
      <PlaceholderPropertiesSection />
      <PlaceholderMotionSection />
    </div>
  );
}

function LogoPropertiesPanel({ elementId }: { elementId: string }) {
  return (
    <div className="flex flex-col gap-3 items-start pt-2 w-full overflow-x-hidden">
      <PlaceholderLayerTitleSection />
      <PlaceholderPositionSection elementId={elementId} />
      <PlaceholderPropertiesSection />
      <PlaceholderMotionSection />
    </div>
  );
}

function BackgroundPropertiesPanel({ elementId }: { elementId: string }) {
  return (
    <div className="flex flex-col gap-3 items-start pt-2 w-full overflow-x-hidden">
      <PlaceholderLayerTitleSection />
      <PlaceholderPositionSection elementId={elementId} />
      <PlaceholderPropertiesSection />
      <PlaceholderMotionSection />
    </div>
  );
}

function MediaPropertiesPanel({ elementId }: { elementId: string }) {
  return (
    <div className="flex flex-col gap-3 items-start pt-2 w-full overflow-x-hidden">
      <PlaceholderLayerTitleSection />
      <PlaceholderPositionSection elementId={elementId} />
      <PlaceholderPropertiesSection />
      <PlaceholderMotionSection />
    </div>
  );
}

function AudioPropertiesPanel({ elementId }: { elementId: string }) {
  return (
    <div className="flex flex-col gap-3 items-start pt-2 w-full overflow-x-hidden">
      <PlaceholderLayerTitleSection />
      <PlaceholderPositionSection elementId={elementId} />
      <PlaceholderPropertiesSection />
      <PlaceholderMotionSection />
    </div>
  );
}

function GenericPlaceholderPanel({ elementId }: { elementId: string }) {
  return (
    <div className="flex flex-col gap-3 items-start pt-2 w-full overflow-x-hidden">
      <PlaceholderLayerTitleSection />
      <PlaceholderPositionSection elementId={elementId} />
      <PlaceholderPropertiesSection />
      <PlaceholderMotionSection />
    </div>
  );
}

// ── Main router ───────────────────────────────────────────────────

export function PlaceholderPropertiesPanel({ elementId }: { elementId: string }) {
  const { canvasElements } = useDesignWorkspace();
  const element = canvasElements.find(el => el.id === elementId);
  if (!element) return null;

  switch (element.placeholderVariant) {
    case 'jellybean':  return <JellybeanPropertiesPanel  elementId={elementId} />;
    case 'logo':       return <LogoPropertiesPanel       elementId={elementId} />;
    case 'background': return <BackgroundPropertiesPanel elementId={elementId} />;
    case 'media':      return <MediaPropertiesPanel      elementId={elementId} />;
    case 'audio':      return <AudioPropertiesPanel      elementId={elementId} />;
    default:           return <GenericPlaceholderPanel   elementId={elementId} />;
  }
}