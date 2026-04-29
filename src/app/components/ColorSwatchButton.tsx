import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ColorPicker } from './ColorPicker';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import type { LinearGradient } from '../types/gradient';
import { buildGradientCSS } from '../utils/gradientUtils';

// ── Types ──────────────────────────────────────────────────────────

export interface ColorSwatchButtonProps {
  /** Current colour — hex with or without #. */
  color:      string;
  /** Alpha/opacity 0–100. Defaults to 100. */
  opacity?:   number;
  /** Which CSS property to update on the target element. */
  property:   'fill' | 'stroke' | 'color';
  /** ID of the canvas element to update. Pass '' to disable updates. */
  elementId:  string;
  /** Square size of the swatch in px. Defaults to 16. */
  size?:      number;
  /** Optional callback fired after every colour change (in addition to updateElement). */
  onExtraChange?: (hex: string, opacity: number) => void;
}

// ── ColorPickerPopover (portal) ────────────────────────────────────

interface PopoverProps {
  anchorRef:         React.RefObject<HTMLButtonElement | null>;
  value:             string;
  opacity:           number;
  onChange:          (hex: string, opacity: number) => void;
  onClose:           () => void;
  onGradientChange?: (gradient: LinearGradient) => void;
  initialGradient?:  LinearGradient;
}

function ColorPickerPopover({ anchorRef, value, opacity, onChange, onClose, onGradientChange, initialGradient }: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click (with a small delay to avoid closing immediately)
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        popoverRef.current  && !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current   && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    const tid = setTimeout(() => document.addEventListener('mousedown', handleOutside), 80);
    return () => {
      clearTimeout(tid);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Position the popover near the anchor
  const PICKER_W = 240;
  const PICKER_H = 420;

  const anchor   = anchorRef.current?.getBoundingClientRect();
  const vpW      = window.innerWidth;
  const vpH      = window.innerHeight;

  let top  = anchor ? anchor.bottom + 6 : 0;
  let left = anchor ? anchor.left       : 0;

  if (anchor && left + PICKER_W > vpW - 8) left = Math.max(8, anchor.right - PICKER_W);
  if (anchor && top  + PICKER_H > vpH - 8) top  = Math.max(8, anchor.top  - PICKER_H - 6);

  const style: CSSProperties = { position: 'fixed', top, left, zIndex: 9999 };

  return createPortal(
    <div ref={popoverRef} style={style}>
      <ColorPicker
        value={value}
        opacity={opacity}
        onChange={onChange}
        onClose={onClose}
        onGradientChange={onGradientChange}
        initialGradient={initialGradient}
      />
    </div>,
    document.body,
  );
}

// ── ColorSwatchButton ──────────────────────────────────────────────

export function ColorSwatchButton({
  color,
  opacity     = 100,
  property,
  elementId,
  size        = 16,
  onExtraChange,
}: ColorSwatchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef           = useRef<HTMLButtonElement>(null);
  const { updateElement, canvasElements } = useDesignWorkspace();

  // Read live element data for gradient state
  const element         = canvasElements.find(e => e.id === elementId);
  const existingGradient = element?.style?.gradientData as LinearGradient | undefined;
  const existingBgImage  = element?.style?.backgroundImage;

  // Normalise colour to include #
  const normColor = color.startsWith('#') ? color : `#${color}`;

  function handleChange(newColor: string, newOpacity: number) {
    if (elementId) {
      const el = canvasElements.find(e => e.id === elementId);
      if (el) {
        if (property === 'fill') {
          updateElement(elementId, {
            style: {
              ...el.style,
              backgroundColor: newColor,
              backgroundImage: undefined,  // clear gradient when switching to solid
              gradientData:    undefined,
              opacity:         newOpacity / 100,
            },
          });
        } else if (property === 'stroke') {
          updateElement(elementId, {
            style: { ...el.style, borderColor: newColor },
          });
        } else {
          updateElement(elementId, {
            style: { ...el.style, color: newColor, opacity: newOpacity / 100 },
          });
        }
      }
    }
    onExtraChange?.(newColor, newOpacity);
  }

  function handleGradientChange(g: LinearGradient) {
    if (!elementId) return;
    const el = canvasElements.find(e => e.id === elementId);
    if (!el) return;
    updateElement(elementId, {
      style: {
        ...el.style,
        backgroundImage: buildGradientCSS(g),
        backgroundColor: undefined,  // clear solid colour when gradient active
        gradientData:    g,          // structurally identical to ElementStyle['gradientData']
      },
    });
  }

  // Swatch visual: show gradient preview if element has one, else solid colour
  const swatchBg = existingBgImage ?? (normColor.length >= 7 ? normColor : '#cccccc');
  const hasGradient = !!existingBgImage;

  return (
    <>
      <button
        ref={anchorRef}
        onClick={() => setIsOpen(prev => !prev)}
        className="rounded-[3px] border border-[rgba(0,0,0,0.15)] hover:scale-105 transition-transform shrink-0 cursor-pointer"
        style={{
          width:   size,
          height:  size,
          background: swatchBg,
          // Only apply colour opacity for solid swatches; gradient has its own opacity built in
          opacity: hasGradient ? 1 : opacity / 100,
        }}
        title="Click to change colour"
        type="button"
      />

      {isOpen && (
        <ColorPickerPopover
          anchorRef={anchorRef}
          value={normColor}
          opacity={opacity}
          onChange={handleChange}
          onClose={() => setIsOpen(false)}
          onGradientChange={property === 'fill' ? handleGradientChange : undefined}
          initialGradient={property === 'fill' ? existingGradient : undefined}
        />
      )}
    </>
  );
}