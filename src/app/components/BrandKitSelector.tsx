import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown } from 'lucide-react';

// ── Figma asset imports — all 9 automotive brands ──────────────────
import imgBmw      from 'figma:asset/cfe78815307074a2ddb466b691f701682a2b8e8a.png';
import imgAudi     from 'figma:asset/a7db45ce5ec2bc6c67c2b4c79a3f5cbe80a77726.png';
import imgBentley  from 'figma:asset/aefd339d0501936210f7f222e494cd30fba38200.png';
import imgBuick    from 'figma:asset/a68f828053121b39f306d1b4f35e382e7a63ebf0.png';
import imgCadillac from 'figma:asset/d711f75e493096cebb0aa9579abce0cd04e339c7.png';
import imgFerrari  from 'figma:asset/6abee879ede2f3e36501bf263576e2dd5fd1247a.png';
import imgFord     from 'figma:asset/0ff321504b68bfeaaffbd9e3a196888bf63d2387.png';
import imgHonda    from 'figma:asset/0654d1a3e9deccdb283f45b0d7cbcd950688dd06.png';
import imgJeep     from 'figma:asset/ce4d8a6bb5cf3e1b798b47524d59bf32c7305dff.png';

// ── Brand data — logo image + exact positioning from Figma ─────────
interface Brand {
  id:       string;
  name:     string;
  logo:     string;
  /** Absolute positioning for the <img> inside its rounded container.
   *  Percentage-based so it works for both 24×24 (trigger) and 20×20 (list) sizes. */
  imgStyle: CSSProperties;
}

const BRANDS: Brand[] = [
  {
    id: 'audi', name: 'Audi', logo: imgAudi,
    imgStyle: { left: '-1.04%', top: '-1.04%', width: '102.08%', height: '102.08%' },
  },
  {
    id: 'bmw', name: 'BMW', logo: imgBmw,
    imgStyle: { left: '-22.03%', top: '-23.13%', width: '143.46%', height: '144.56%' },
  },
  {
    id: 'bentley', name: 'Bentley', logo: imgBentley,
    imgStyle: { left: '5.36%', top: '7.14%', width: '89.29%', height: '89.29%' },
  },
  {
    id: 'buick', name: 'Buick', logo: imgBuick,
    imgStyle: { left: '3.23%', top: '3.23%', width: '93.55%', height: '93.55%' },
  },
  {
    id: 'cadillac', name: 'Cadillac', logo: imgCadillac,
    imgStyle: { left: '11.68%', top: '11.68%', width: '76.64%', height: '76.64%' },
  },
  {
    id: 'ferrari', name: 'Ferrari', logo: imgFerrari,
    imgStyle: { left: '0', top: '0', width: '100%', height: '100%' },
  },
  {
    id: 'ford', name: 'Ford', logo: imgFord,
    imgStyle: { left: '7.58%', top: '7.58%', width: '84.85%', height: '84.85%' },
  },
  {
    id: 'honda', name: 'Honda', logo: imgHonda,
    imgStyle: { left: '10%', top: '10%', width: '80%', height: '80%' },
  },
  {
    id: 'jeep', name: 'Jeep', logo: imgJeep,
    imgStyle: { left: '12.16%', top: '32.44%', width: '75.68%', height: '35.12%' },
  },
];

// ── Brand logo — reusable for both trigger (size 24) and list (size 20) ──
function BrandLogo({ brand, size }: { brand: Brand; size: number }) {
  return (
    <div
      className="bg-white rounded-[4px] shrink-0 overflow-hidden relative"
      style={{ width: size, height: size }}
    >
      <img
        alt={brand.name}
        src={brand.logo}
        className="absolute max-w-none pointer-events-none"
        style={brand.imgStyle}
      />
    </div>
  );
}

// ── Dropdown rendered via portal so it escapes overflow:hidden panels ──
interface DropdownProps {
  brands:   Brand[];
  selected: Brand | undefined;
  rect:     DOMRect;
  onSelect: (id: string) => void;
  onClose:  () => void;
}

function BrandDropdown({ brands, selected, rect, onSelect, onClose }: DropdownProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Close on click-outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Decide whether to open above or below
  const spaceBelow = window.innerHeight - rect.bottom;
  const dropHeight = Math.min(brands.length * 36 + 16, 180);
  const openAbove  = spaceBelow < dropHeight + 8 && rect.top > dropHeight + 8;

  const style: CSSProperties = {
    position: 'fixed',
    left:     rect.left,
    width:    rect.width,
    zIndex:   9999,
    ...(openAbove
      ? { bottom: window.innerHeight - rect.top + 4 }
      : { top: rect.bottom + 4 }),
  };

  return createPortal(
    <div
      ref={listRef}
      style={style}
      className="bg-white rounded-[4px] shadow-[0px_3px_14px_2px_rgba(0,0,0,0.12),0px_8px_10px_1px_rgba(0,0,0,0.14),0px_5px_5px_-3px_rgba(0,0,0,0.2)] overflow-y-auto"
      role="listbox"
    >
      <div className="py-2">
        {brands.map(brand => {
          const isActive = selected?.id === brand.id;
          return (
            <div
              key={brand.id}
              role="option"
              aria-selected={isActive}
              className={`flex items-center gap-2 pl-4 pr-1 py-1 min-h-[36px] cursor-pointer transition-colors ${
                isActive ? 'bg-[rgba(99,86,225,0.08)]' : 'hover:bg-[#f5f5f5]'
              }`}
              onMouseDown={e => {
                e.preventDefault(); // don't blur the trigger
                onSelect(brand.id);
                onClose();
              }}
            >
              <BrandLogo brand={brand} size={20} />
              <span className="text-[12px] text-[#1f1d25] tracking-[0.17px] leading-[1.43]">
                {brand.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}

// ═══════════════════════════════════════════════════════════════════
// PUBLIC COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface BrandKitSelectorProps {
  /** Selected brand id (e.g. "bmw"), or empty string for none. */
  value:    string;
  onChange: (id: string) => void;
  /** Label shown above the field. Defaults to "Brand Kit". */
  label?:   string;
}

export function BrandKitSelector({ value, onChange, label = 'Brand Kit' }: BrandKitSelectorProps) {
  const [open, setOpen]         = useState(false);
  const [rect,  setRect]        = useState<DOMRect | null>(null);
  const triggerRef              = useRef<HTMLDivElement>(null);

  const selected = BRANDS.find(b => b.id === value);

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
    setOpen(prev => !prev);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Label */}
      <span className="text-[12px] text-[#686576] tracking-[0.15px] px-1 leading-3">
        {label}
      </span>

      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={handleToggle}
        className="flex items-center gap-2 h-9 px-2 w-full cursor-pointer bg-[#f9fafa] rounded-[4px] relative transition-colors"
        style={{
          border: open
            ? '2px solid rgba(99,86,225,0.7)'
            : '1px solid #cac9cf',
        }}
      >
        {selected ? (
          <>
            <BrandLogo brand={selected} size={24} />
            <span className="flex-1 text-[12px] text-[#1f1d25] tracking-[0.17px] truncate min-w-0">
              {selected.name}
            </span>
            {/* Clear */}
            <button
              onMouseDown={handleClear}
              className="shrink-0 flex items-center justify-center w-5 h-5 text-[rgba(17,16,20,0.56)] hover:text-[#1f1d25] transition-colors"
              aria-label="Clear selection"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <span className="flex-1 text-[12px] text-[#9c99a9] tracking-[0.17px] select-none">
            Select brand kit
          </span>
        )}

        {/* Chevron */}
        <ChevronDown
          size={14}
          className="shrink-0 transition-transform duration-150"
          style={{
            color:     'rgba(17,16,20,0.56)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </div>

      {/* Dropdown portal */}
      {open && rect && (
        <BrandDropdown
          brands={BRANDS}
          selected={selected}
          rect={rect}
          onSelect={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}