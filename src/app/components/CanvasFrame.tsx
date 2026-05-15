import { GroupDropTargetOverlay } from './GroupDropTargetOverlay';
import { GroupDropTooltip } from './GroupDropTooltip';
import { useState, useRef, useMemo, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { PROJECT_VARIABLES } from '../constants/variables';
import { buildTextStyle, verticalAlignToFlexAlign } from '../utils/textStyle';
import {
  Star, Heart, Home, Cloud, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Play, AlertTriangle, Square, Circle, CheckCircle, PlusCircle,
  User, Users, Smile, Settings, Trophy, Lightbulb, Plane, Anchor, Clock,
  ChevronsLeftRight, Triangle, Maximize2, Mountain, Image as ImageIcon,
  UserPlus, UserMinus, UserCheck, Bot, Coffee, Bug, Infinity, Accessibility,
  Landmark, Zap, Check, ChevronRight,
} from 'lucide-react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import type { CanvasElement, CanvasElementType } from '../store/useDesignWorkspaceStore';
import { AlignmentGuidesOverlay } from './AlignmentGuidesOverlay';
import type { AlignmentGuide } from '../hooks/useAlignmentGuides';
import { useResizeHandler } from '../hooks/useResizeHandler';
import { HANDLE_POSITIONS, HANDLE_CURSORS, ALL_HANDLES } from '../constants/canvasHandles';
import type { ResizeHandle } from '../constants/canvasHandles';
import { MultiSelectionBoundingBox } from './MultiSelectionBoundingBox';
import { InteractionOverlay } from './InteractionOverlay';
import type { MarqueeRect } from './InteractionOverlay';
import { CanvasOutOfBoundsOverlay } from './CanvasOutOfBoundsOverlay';
import { ResizeGuidesOverlay } from './ResizeGuidesOverlay';
import type { ResizeGuide } from '../hooks/useResizeGuides';

// ═══════════════════════════════════════════════════════════════════
// PLACEHOLDER ELEMENT
// ═══════════════════════════════════════════════════════════════════

// Figma tokens — file X4fBgtV9XD7b5Wy93GQmYw
// semantic/success/main=#4caf50 · action/hover=rgba(17,16,20,0.04)
const PLACEHOLDER_CFG: Record<string, { color: string; label: string; shortLabel: string }> = {
  // Legacy
  logo:       { color: '#7b1fa2', label: 'Logo',             shortLabel: 'Logo'       },
  background: { color: '#4caf50', label: 'Background',       shortLabel: 'Background' },
  jellybean:  { color: '#3949ab', label: 'Jellybean',        shortLabel: 'Jellybean'  },
  media:      { color: '#0277bd', label: 'Media',            shortLabel: 'Media'      },
  audio:      { color: '#ff7043', label: 'Audio',            shortLabel: 'Audio'      },
  // New
  product:            { color: '#3949ab', label: 'Product',          shortLabel: 'Product'    },
  image:              { color: '#0277bd', label: 'Image',            shortLabel: 'Image'      },
  'background-image': { color: '#4caf50', label: 'Background Image', shortLabel: 'Background' },
  'background-video': { color: '#4caf50', label: 'Background Video', shortLabel: 'Bg. Video'  },
  'primary-logo':     { color: '#7b1fa2', label: 'Primary Logo',     shortLabel: 'Primary'    },
  'secondary-logo':   { color: '#c62828', label: 'Secondary Logo',   shortLabel: 'Secondary'  },
  'event-logo':       { color: '#1565c0', label: 'Event Logo',       shortLabel: 'Event'      },
};

// SVG dashed border — larger dash (12px) / gap (10px) per Figma spec
function PlaceholderDashedBorder({ color, radius }: { color: string; radius: number }) {
  const sw = 3;
  return (
    <svg
      aria-hidden
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
    >
      <rect
        x={sw / 2}
        y={sw / 2}
        width={`calc(100% - ${sw}px)`}
        height={`calc(100% - ${sw}px)`}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeDasharray="12 10"
        rx={radius}
        ry={radius}
      />
    </svg>
  );
}

function PlaceholderElement({ variant, width, height, src }: { variant: string; width: number; height: number; src?: string }) {
  // When a feed image URL has been resolved, render it directly
  if (src) {
    const isBg      = variant === 'background' || variant === 'background-image' || variant === 'background-video';
    const isLogo    = variant === 'logo' || variant === 'primary-logo' || variant === 'secondary-logo' || variant === 'event-logo';
    const isProduct = variant === 'product' || variant === 'jellybean' || variant === 'image' || variant === 'media';

    // ── Non-product: logo = contain, background = cover ──────────────
    if (!isProduct) {
      return (
        <div className="w-full h-full relative overflow-hidden" style={{ borderRadius: isBg ? 0 : 4 }}>
          <img
            src={src}
            alt=""
            draggable={false}
            className="w-full h-full"
            style={{ objectFit: isLogo ? 'contain' : 'cover', display: 'block' }}
          />
        </div>
      );
    }

    // ── Product / car shots ───────────────────────────────────────────
    // `cover` + `center center`: fills the placeholder completely so the car
    // always looks appropriately large. For landscape press/editorial shots
    // (1920×1080) in a square placeholder the scale factor is height-bound
    // (390/1080 ≈ 0.36), which clips only ~8% from each horizontal side —
    // that is road or background, not the car body itself.
    // The bottom linear fade dissolves the ground shadow without hard edges.
    return (
      <div className="w-full h-full overflow-hidden" style={{ borderRadius: 4 }}>
        <img
          src={src}
          alt=""
          draggable={false}
          className="w-full h-full"
          style={{
            objectFit:       'cover',
            objectPosition:  'center center',
            display:         'block',
            WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 30%)',
            maskImage:       'linear-gradient(to top, transparent 0%, black 30%)',
          }}
        />
      </div>
    );
  }
  const cfg        = PLACEHOLDER_CFG[variant] ?? PLACEHOLDER_CFG['media'];
  const isBg       = variant === 'background' || variant === 'background-image' || variant === 'background-video';
  const minDim     = Math.min(width, height);

  // ── Adaptive label — Figma breakpoints ──────────────────────────────
  // min(w,h) ≥ 200 → large (20px, 500 weight, px-32 py-16, multi-line)
  // min(w,h) ≥ 50  → compact (12px, 400 weight, p-4, single line, short)
  // min(w,h) < 50  → no label
  const labelTier: 'large' | 'compact' | 'none' =
    minDim >= 200 ? 'large' : minDim >= 50 ? 'compact' : 'none';

  const badgeStyle: React.CSSProperties =
    labelTier === 'large'
      ? {
          backgroundColor: cfg.color,
          fontSize: 14,
          fontFamily: "'Roboto', sans-serif",
          fontWeight: 500,
          letterSpacing: '0.15px',
          lineHeight: 1.3,
          paddingTop: 8, paddingBottom: 8,
          paddingLeft: 6, paddingRight: 6,
          borderRadius: '4px',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          maxHeight: 35,
          overflow: 'hidden',
        }
      : {
          backgroundColor: cfg.color,
          fontSize: 12,
          fontFamily: "'Roboto', sans-serif",
          fontWeight: 400,
          lineHeight: '12px',
          padding: '4px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
        };

  return (
    <div
      className="w-full h-full relative flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(17,16,20,0.04)',  // semantic/action/hover token
        borderRadius:    isBg ? 0 : '4px',
      }}
    >
      <PlaceholderDashedBorder color={cfg.color} radius={isBg ? 0 : 4} />

      {labelTier !== 'none' && (
        <span className="relative text-white select-none" style={badgeStyle}>
          {labelTier === 'large' ? cfg.label : cfg.shortLabel}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SHAPE ELEMENT
// ═══════════════════════════════════════════════════════════════════

const shapeIconMap: Record<string, React.ReactNode> = {
  'star-f':   <Star fill="currentColor" className="w-full h-full" />,
  'star':     <Star className="w-full h-full" />,
  'heart':    <Heart fill="currentColor" className="w-full h-full" />,
  'home':     <Home className="w-full h-full" />,
  'cloud':    <Cloud className="w-full h-full" />,
  'arr-up':   <ArrowUp className="w-full h-full" />,
  'arr-dn':   <ArrowDown className="w-full h-full" />,
  'arr-lt':   <ArrowLeft className="w-full h-full" />,
  'arr-rt':   <ArrowRight className="w-full h-full" />,
  'dbl-arr':  <ChevronsLeftRight className="w-full h-full" />,
  'tri-up':   <Triangle fill="currentColor" className="w-full h-full" />,
  'play':     <Play fill="currentColor" className="w-full h-full" />,
  'warn':     <AlertTriangle fill="currentColor" className="w-full h-full" />,
  'square-f': <Square fill="currentColor" className="w-full h-full" />,
  'square':   <Square className="w-full h-full" />,
  'circle-f': <Circle fill="currentColor" className="w-full h-full" />,
  'circle':   <Circle className="w-full h-full" />,
  'chk-c':    <CheckCircle className="w-full h-full" />,
  'plus-c':   <PlusCircle className="w-full h-full" />,
  'minimize': <Maximize2 className="w-full h-full" />,
  'mtn':      <Mountain className="w-full h-full" />,
  'img':      <ImageIcon className="w-full h-full" />,
  'person':   <User className="w-full h-full" />,
  'per-add':  <UserPlus className="w-full h-full" />,
  'persons':  <Users className="w-full h-full" />,
  'per-rm':   <UserMinus className="w-full h-full" />,
  'per-chk':  <UserCheck className="w-full h-full" />,
  'emoji':    <Smile className="w-full h-full" />,
  'emoji-a':  <Bot className="w-full h-full" />,
  'settings': <Settings className="w-full h-full" />,
  'trophy':   <Trophy className="w-full h-full" />,
  'bulb':     <Lightbulb className="w-full h-full" />,
  'symbols':  <Zap className="w-full h-full" />,
  'mug':      <Coffee className="w-full h-full" />,
  'walk':     <Accessibility className="w-full h-full" />,
  'bug':      <Bug className="w-full h-full" />,
  'bank':     <Landmark className="w-full h-full" />,
  'inf':      <Infinity className="w-full h-full" />,
  'plane':    <Plane className="w-full h-full" />,
  'anchor':   <Anchor className="w-full h-full" />,
  'clock':    <Clock className="w-full h-full" />,
  'check':    <Check className="w-full h-full" />,
  'chk-c-o':  <Check className="w-full h-full" />,
  'warn-o':   <AlertTriangle className="w-full h-full" />,
  'tri-up-o': <Triangle className="w-full h-full" />,
  'per-o':    <User className="w-full h-full" />,
  'play-c':   <Play className="w-full h-full" />,
};

function ShapeElement({ variant, style }: { variant: string; style?: ElementStyle }) {
  const icon = shapeIconMap[variant] ?? <Square className="w-full h-full" />;
  return (
    <div
      className="w-full h-full flex items-center justify-center p-2"
      style={{ color: style?.color ?? '#6B7280', opacity: style?.opacity }}
    >
      {icon}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LINE ELEMENT
// ═══════════════════════════════════════════════════════════════════

function LineElement({ variant }: { variant: string }) {
  if (variant === 'arrow') {
    return (
      <div className="w-full h-full flex items-center">
        <div className="flex-1 h-0.5 bg-gray-500" />
        <ChevronRight size={14} className="text-gray-500 shrink-0" />
      </div>
    );
  }
  if (variant === 'dashed') {
    return <div className="w-full h-full flex items-center"><div className="w-full border-t-2 border-dashed border-gray-500" /></div>;
  }
  if (variant === 'dotted') {
    return <div className="w-full h-full flex items-center"><div className="w-full border-t-2 border-dotted border-gray-500" /></div>;
  }
  return <div className="w-full h-full flex items-center"><div className="w-full h-0.5 bg-gray-500" /></div>;
}

// ═══════════════════════════════════════════════════════════════════
// ELEMENT CONTENT — visual renderer per type
// ══════════════════════════════════════════════════════════════════

function ElementContent({ element }: { element: CanvasElement }) {
  switch (element.type) {
    case 'text-header':
    case 'text-subheader':
    case 'text-body':
    case 'text-template':
      return (
        <div
          className="w-full h-full flex"
          style={{
            ...buildTextStyle(element),
            alignItems: verticalAlignToFlexAlign(element.style?.verticalAlign),
          }}
        >
          {element.content ?? ''}
        </div>
      );

    case 'placeholder-logo':
    case 'placeholder-background':
    case 'placeholder-jellybean':
    case 'placeholder-media':
    case 'placeholder-audio':
    case 'placeholder-product':
    case 'placeholder-image':
    case 'placeholder-background-image':
    case 'placeholder-background-video':
    case 'placeholder-primary-logo':
    case 'placeholder-secondary-logo':
    case 'placeholder-event-logo':
      return (
        <PlaceholderElement
          variant={element.placeholderVariant ?? 'media'}
          width={element.width}
          height={element.height}
          src={element.src}
        />
      );

    case 'shape':
      return <ShapeElement variant={element.shapeVariant ?? 'square'} style={element.style} />;

    case 'icon':
      return element.iconSrc
        ? <img src={element.iconSrc} alt="icon" className="w-full h-full object-contain" draggable={false} />
        : <div className="w-full h-full flex items-center justify-center text-gray-400"><Smile size={32} /></div>;

    case 'line':
      return <LineElement variant={element.lineVariant ?? 'solid'} />;

    case 'group':

      return <div className="w-full h-full" />;

    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// VARIABLE AUTOCOMPLETE MENU
// Appears when user types { in inline text editing mode.
// ═══════════════════════════════════════════════════════════════════

interface VarSuggestionMenuProps {
  query:        string;
  customVars:   string[];
  anchorRect:   DOMRect;
  selectedIdx:  number;
  onSelect:     (name: string) => void;
  onViewAll:    () => void;
  onClose:      () => void;
}

function VariableSuggestionMenu({
  query, customVars, anchorRect, selectedIdx, onSelect, onViewAll, onClose,
}: VarSuggestionMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // ── Smart positioning: measure rendered size then clamp to viewport ─
  // Start invisible so the initial unclamped position never flashes.
  const [pos,     setPos]     = useState({ top: anchorRect.bottom + 6, left: anchorRect.left });
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const menuH = el.offsetHeight;
    const menuW = el.offsetWidth;
    const vw    = window.innerWidth;
    const vh    = window.innerHeight;
    const GAP   = 6;
    const MARGIN = 8; // keep away from viewport edges

    // Prefer below; flip above if it would clip the bottom edge
    let top  = anchorRect.bottom + GAP;
    let left = anchorRect.left;

    if (top + menuH > vh - MARGIN) {
      // Would overflow bottom → show above anchor
      const topIfAbove = anchorRect.top - menuH - GAP;
      // Only flip if it actually fits above (or fits better)
      top = topIfAbove >= MARGIN ? topIfAbove : Math.max(MARGIN, vh - menuH - MARGIN);
    }

    // Clamp horizontally
    if (left + menuW > vw - MARGIN) {
      left = vw - menuW - MARGIN;
    }
    left = Math.max(MARGIN, left);

    setPos({ top, left });
    setVisible(true);
  // Re-run whenever the anchor changes (e.g. canvas scrolled/zoomed while typing)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorRect.top, anchorRect.bottom, anchorRect.left]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  const q = query.toLowerCase();
  const filteredCustom   = customVars.filter(v => !q || v.toLowerCase().includes(q)).slice(0, 5);
  const filteredProjects = PROJECT_VARIABLES.filter(v => !q || v.toLowerCase().includes(q)).slice(0, 5);

  if (filteredCustom.length === 0 && filteredProjects.length === 0) return null;

  let globalIdx = 0;

  function VarRow({ name }: { name: string }) {
    const i = globalIdx++;
    const isActive = selectedIdx === i;
    return (
      <button
        className={`w-full flex items-center px-3 py-[7px] text-left text-[13px] font-mono transition-colors ${
          isActive ? 'bg-[rgba(91,78,255,0.08)] text-[#5B4EFF]' : 'text-[#1f1d25] hover:bg-[#f5f5f5]'
        }`}
        onMouseDown={e => { e.preventDefault(); onSelect(name); }}
      >
        {`{${name}}`}
      </button>
    );
  }

  function SectionLabel({ label }: { label: string }) {
    return (
      <div className="px-3 pt-2 pb-0.5">
        <span className="text-[9px] font-semibold text-[#9c99a9] uppercase tracking-wider">{label}</span>
      </div>
    );
  }

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[9999] bg-white rounded-xl overflow-hidden py-1"
      style={{
        top:        pos.top,
        left:       pos.left,
        minWidth:   210,
        maxWidth:   300,
        visibility: visible ? 'visible' : 'hidden',
        boxShadow: '0px 3px 14px 2px rgba(0,0,0,0.12), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 5px 5px -3px rgba(0,0,0,0.20)',
      }}
      onClick={e => e.stopPropagation()}
    >
      {filteredCustom.length > 0 && (
        <>
          <SectionLabel label="Custom" />
          {filteredCustom.map(v => <VarRow key={v} name={v} />)}
        </>
      )}
      {filteredProjects.length > 0 && (
        <>
          <SectionLabel label="Projects" />
          {filteredProjects.map(v => <VarRow key={v} name={v} />)}
        </>
      )}
      {/* View All footer */}
      <div className="h-px bg-[#f0f0f0] mt-1 mb-0" />
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#1f1d25] hover:bg-[#f5f5f5] transition-colors"
        onMouseDown={e => { e.preventDefault(); onViewAll(); }}
      >
        <ArrowRight size={14} className="text-[#686576] shrink-0" />
        <span>View All</span>
      </button>
    </div>,
    document.body,
  );
}

// ═══════════════════════════════════════════════════════════════════
// CANVAS ELEMENT VIEW
// Purely visual renderer. All pointer interaction is handled by
// InteractionOverlay (z-50). Inline text editing activates on double-click.
// ═══════════════════════════════════════════════════════════════════

/** Text element types that support inline editing */
const INLINE_TEXT_TYPES: CanvasElementType[] = [
  'text-header', 'text-subheader', 'text-body', 'text-template',
];

interface ElementViewProps {
  element: CanvasElement;
  zIndex:  number;
}

function CanvasElementView({ element, zIndex }: ElementViewProps) {
  const {
    editingTextId, textEditClickPos,
    commitTextEdit, cancelTextEdit,
    customVariables, setActivePanel, openPanel, setActiveInsertItem, setTextInsertTab,
    setVarInsertContext,
  } = useDesignWorkspace();

  const isTextElement = INLINE_TEXT_TYPES.includes(element.type);
  const isEditingText = editingTextId === element.id;

  // Local draft — kept in sync with external changes (e.g. undo) when not editing
  const [localText, setLocalText] = useState(element.content ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Variable autocomplete state ─────────────────────────────────
  const [varMenuOpen,    setVarMenuOpen]    = useState(false);
  const [varQuery,       setVarQuery]       = useState('');
  const [varAnchorRect,  setVarAnchorRect]  = useState<DOMRect | null>(null);
  const [varSelectedIdx, setVarSelectedIdx] = useState(0);

  useEffect(() => {
    if (!isEditingText) setLocalText(element.content ?? '');
  }, [element.content, isEditingText]);

  // Auto-focus when edit mode starts.
  // Places the cursor at the double-clicked position (Figma-like) when
  // coordinates are available; otherwise falls back to end-of-text.
  useEffect(() => {
    if (!isEditingText) return;

    // rAF ensures the textarea is painted and in its final screen position
    // before we query caretPositionFromPoint.
    const raf = requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();

      // ── Cursor placement at the exact click point ──────────────────
      const clickPos = textEditClickPos;   // read from store snapshot
      if (clickPos) {
        let placed = false;

        // Standard (Firefox 20+)
        if (!placed && 'caretPositionFromPoint' in document) {
          const pos = (document as any).caretPositionFromPoint(
            clickPos.clientX, clickPos.clientY,
          );
          if (pos && typeof pos.offset === 'number') {
            ta.setSelectionRange(pos.offset, pos.offset);
            placed = true;
          }
        }

        // Webkit/Blink (Chrome, Safari — caretRangeFromPoint)
        if (!placed && 'caretRangeFromPoint' in document) {
          const range = (document as any).caretRangeFromPoint(
            clickPos.clientX, clickPos.clientY,
          );
          if (range) {
            ta.setSelectionRange(range.startOffset, range.startOffset);
            placed = true;
          }
        }

        // Fallback: place cursor at end
        if (!placed) {
          ta.setSelectionRange(ta.value.length, ta.value.length);
        }
      } else {
        // No click position (e.g. programmatic edit start) → cursor at end
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }
    });

    return () => cancelAnimationFrame(raf);
  // textEditClickPos is intentionally excluded — we only want this to run
  // when isEditingText first becomes true, not on every click-pos change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditingText]);

  // ── Insert a variable suggestion at the current { position ──────
  const insertVarSuggestion = useCallback((varName: string) => {
    const ta = textareaRef.current;
    const cursor = ta?.selectionStart ?? localText.length;
    const before = localText.slice(0, cursor);
    const after  = localText.slice(cursor);
    const braceStart = before.lastIndexOf('{');
    if (braceStart === -1) return;
    const newBefore = before.slice(0, braceStart) + `{${varName}}`;
    const newText   = newBefore + after;
    setLocalText(newText);
    setVarMenuOpen(false);
    requestAnimationFrame(() => {
      if (ta) {
        ta.focus();
        ta.setSelectionRange(newBefore.length, newBefore.length);
      }
    });
  }, [localText]);

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newText = e.target.value;
    setLocalText(newText);
    // Detect `{partialName` pattern before the cursor to trigger autocomplete
    const cursor = e.target.selectionStart ?? newText.length;
    const before = newText.slice(0, cursor);
    const match  = before.match(/\{([a-zA-Z0-9]*)$/);
    if (match) {
      setVarQuery(match[1]);
      setVarSelectedIdx(0);
      const rect = textareaRef.current?.getBoundingClientRect();
      if (rect) setVarAnchorRect(rect);
      setVarMenuOpen(true);
    } else {
      setVarMenuOpen(false);
    }
  }

  function handleTextKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    e.stopPropagation(); // prevent canvas shortcuts from firing

    // ── When autocomplete menu is open, intercept nav keys ─────────
    if (varMenuOpen) {
      const q = varQuery.toLowerCase();
      const filteredCustom   = customVariables.filter(v => !q || v.toLowerCase().includes(q)).slice(0, 5);
      const filteredProjects = PROJECT_VARIABLES.filter(v => !q || v.toLowerCase().includes(q)).slice(0, 5);
      const allItems = [...filteredCustom, ...filteredProjects];

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setVarSelectedIdx(i => Math.min(i + 1, allItems.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setVarSelectedIdx(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (allItems[varSelectedIdx]) insertVarSuggestion(allItems[varSelectedIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setVarMenuOpen(false);
        return;
      }
    }

    // Escape exits edit mode (commit current draft)
    if (e.key === 'Escape') {
      e.preventDefault();
      commitTextEdit(element.id, localText);
      return;
    }
    // Enter / Shift+Enter → native newline (textarea default behaviour)
    // Cmd/Ctrl+Enter → explicit commit (keyboard shortcut to confirm)
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      commitTextEdit(element.id, localText);
    }
    // All other keys (arrows, option-word-jump, shift-select, copy/paste…)
    // are handled natively by the textarea — no interception needed.
  }

  const textStyle = buildTextStyle(element);

  // Editing: elevate above InteractionOverlay (z-50) and resize handles (z-70)
  const effectiveZIndex = isEditingText ? 80 : zIndex;

  return (
    <div
      className="absolute select-none"
      style={{
        left:            element.x,
        top:             element.y,
        width:           element.width,
        height:          element.height,
        opacity:         element.style?.opacity,
        zIndex:          effectiveZIndex,
        backgroundColor: element.style?.backgroundColor,
        backgroundImage: element.style?.backgroundImage,
        // Allow pointer events only while editing so the textarea is clickable
        pointerEvents:   isEditingText ? 'auto' : 'none',
      }}
      onMouseDown={isEditingText ? e => e.stopPropagation() : undefined}
    >
      {isTextElement && isEditingText ? (
        // ── Inline edit mode ──────────────────────────────────────────────
        <>
          <textarea
            ref={textareaRef}
            value={localText}
            onChange={handleTextChange}
            onKeyDown={handleTextKeyDown}
            onBlur={() => {
              // Guard: only commit if still in editing mode (prevents double-commit
              // when React unmounts the textarea as a result of an earlier commit)
              if (editingTextId === element.id) {
                setVarMenuOpen(false);
                commitTextEdit(element.id, localText);
              }
            }}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            className="absolute inset-0 resize-none outline-none border-none bg-transparent cursor-text pointer-events-auto"
            style={{
              // Mirror every typographic property from the display div so
              // the text renders identically with no visual jump on enter/exit.
              ...textStyle,
              // Box-model: collapse all browser-default textarea chrome
              padding:        0,
              margin:         0,
              boxSizing:      'border-box' as const,
              // Show the edit ring without shifting content
              boxShadow:      '0 0 0 2px #5B4EFF',
              borderRadius:   2,
              // Scroll when content overflows during editing (fixed-size box)
              overflow:       'auto',
              // Prevent textarea from adding its own scrollbar gutter
              overflowX:      'hidden',
            }}
            spellCheck={false}
          />
          {/* Editing hint badge — shown above the element */}
          <div className="absolute pointer-events-none whitespace-nowrap" style={{ top: -26, left: 0 }}>
            <span className="text-[9px] text-white bg-[#5B4EFF] px-1.5 py-0.5 rounded-full">
              Editing — Esc to exit  •  Enter for new line
            </span>
          </div>

          {/* Variable autocomplete menu */}
          {varMenuOpen && varAnchorRect && (
            <VariableSuggestionMenu
              query={varQuery}
              customVars={customVariables}
              anchorRect={varAnchorRect}
              selectedIdx={varSelectedIdx}
              onSelect={insertVarSuggestion}
              onViewAll={() => {
                // Save insertion context BEFORE committing so the Variable
                // Text panel knows to insert into this element (not create new).
                const cursorAt = textareaRef.current?.selectionStart ?? localText.length;
                setVarInsertContext({ elementId: element.id, text: localText, cursorAt });
                setVarMenuOpen(false);
                commitTextEdit(element.id, localText);
                setTextInsertTab('variable');
                openPanel('insert');   // force-open without toggling (panel may already be 'insert')
                setActiveInsertItem('text');
              }}
              onClose={() => setVarMenuOpen(false)}
            />
          )}
        </>
      ) : (
        // ── View mode ─────────────────────────────────────────────────────
        <ElementContent element={element} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SINGLE SELECTION HANDLES — rendered at CanvasFrame level (z-70)
// ═══════════════════════════════════════════════════════════════════

interface SingleSelectionHandlesProps {
  element:              CanvasElement;
  onResizeGuidesChange: (guides: ResizeGuide[]) => void;
}

function SingleSelectionHandles({ element, onResizeGuidesChange }: SingleSelectionHandlesProps) {
  const { startResize } = useResizeHandler(element.id, onResizeGuidesChange);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left:   element.x,
        top:    element.y,
        width:  element.width,
        height: element.height,
        zIndex: 70, // above InteractionOverlay (z-50) and Marquee (z-60)
      }}
    >
      {/* Bounding box border */}
      <div className="absolute inset-0 border-2 border-[#5B4EFF] rounded-[1px]" />

      {/* 8 resize handles — pointer-events-auto so they capture events above the overlay */}
      {ALL_HANDLES.map(handle => (
        <div
          key={handle}
          className="absolute w-2 h-2 bg-white border-2 border-[#5B4EFF] rounded-[1px] pointer-events-auto"
          style={{
            ...HANDLE_POSITIONS[handle],
            cursor: HANDLE_CURSORS[handle],
          }}
          onMouseDown={e => {
            e.stopPropagation(); // ← prevent InteractionOverlay from seeing this
            startResize(e, handle as ResizeHandle);
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ─── Semi-transparent dim applied to each out-of-group element ────
function GroupEditDimOverlay({ element }: { element: CanvasElement }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left:            element.x,
        top:             element.y,
        width:           element.width,
        height:          element.height,
        zIndex:          45,
        backgroundColor: 'rgba(255,255,255,0.50)',
      }}
    />
  );
}

// GROUP EDIT OVERLAY — dims elements outside the group being edited
// ═══════════════════════════════════════════════════════════════════

function GroupEditOverlay({ editingGroupId }: { editingGroupId: string }) {
  const { canvasElements } = useDesignWorkspace();

  // Group bounding box derived live from children — always accurate regardless of store timing.
  // This is resilient against any store-update timing issue — the border always
  // reflects the true extent of the children, regardless of whether the group
  // container element has been synced yet.
  const children = canvasElements.filter(el => el.groupId === editingGroupId);
  const groupBorder = children.length > 0
    ? {
        x:      Math.min(...children.map(c => c.x)),
        y:      Math.min(...children.map(c => c.y)),
        width:  Math.max(...children.map(c => c.x + c.width))  - Math.min(...children.map(c => c.x)),
        height: Math.max(...children.map(c => c.y + c.height)) - Math.min(...children.map(c => c.y)),
      }
    : null;

  return (
    <>
      {/* White overlay on every element that is NOT part of the editing group */}
      {canvasElements
        .filter(el =>
          el.id !== editingGroupId &&
          el.groupId !== editingGroupId &&
          el.type !== 'group'
        )
        .map(el => (
          <GroupEditDimOverlay key={el.id} element={el} />
        ))
      }

      {/* Dashed border around the group — derived live from children bounds */}
      {groupBorder && (
        <div
          className="absolute pointer-events-none"
          style={{
            left:         groupBorder.x - 4,
            top:          groupBorder.y - 4,
            width:        groupBorder.width  + 8,
            height:       groupBorder.height + 8,
            border:       '1.5px dashed #5B4EFF',
            borderRadius: 4,
            zIndex:       47,
          }}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CANVAS FRAME
// ═══════════════════════════════════════════════════════════════════

export function CanvasFrame() {
  const {
    canvasElements,
    layers,
    selectedElementIds,
    isPreviewMode,
    editingGroupId,
    editingTextId,
    setDragTargetGroupId,
    canvasWidth,
    canvasHeight,
  } = useDesignWorkspace();

  const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([]);
  const [resizeGuides, setResizeGuides] = useState<ResizeGuide[]>([]);
  const [marquee,      setMarquee]      = useState<MarqueeRect | null>(null);


  // Stable ref to frame DOM — passed to InteractionOverlay for coordinate math
  const frameRef = useRef<HTMLDivElement>(null);

  // Render groups before their children so children appear on top.
  // Group containers are transparent — children provide the actual visuals.
  const orderedElements = useMemo(() => {
    const groups    = canvasElements.filter(el => el.type === 'group');
    const children  = canvasElements.filter(el => el.type !== 'group');
    return [...groups, ...children];
  }, [canvasElements]);

  // Resolve the single selected element (for SingleSelectionHandles).
  // In group-edit mode, only show handles for children of the editing group
  // is actually a child of the group being edited — never on the group container itself.
  const singleSelectedEl = (() => {
    if (selectedElementIds.length !== 1) return null;
    const el = canvasElements.find(el => el.id === selectedElementIds[0]) ?? null;
    if (!el) return null;
    if (editingGroupId) {
      // In group-edit mode: only show handles if this element is a child of the group
      return el.groupId === editingGroupId ? el : null;
    }
    return el;
  })();

  return (
    <div
      ref={frameRef}
      className="relative bg-white shadow-xl select-none"
      style={{
        width:    canvasWidth,
        height:   canvasHeight,
        overflow: 'visible', // handles and out-of-bounds elements must remain visible
        // ✅ V63: isolation:'isolate' deliberately absent — it forces the browser
        //         to rasterize this subtree before compositing, destroying vector
        //         quality at any zoom level other than 100%.
        //
        //         Stacking-context isolation is already provided for free by the
        //         parent transform div (transform ≠ none always creates a new
        //         stacking context), so z-index values for child layers (handles
        //         z-70, InteractionOverlay z-50, etc.) remain correctly scoped.
        //
        // ✅ shadow-xl → CSS box-shadow — vectorial, never rasterizes content.
        //    Do NOT replace with filter:drop-shadow() which DOES rasterize.
        //
        // ✅ NO will-change here — only the zoom container parent carries it.
        //    Putting will-change on individual elements forces per-element
        //    GPU layers and defeats the single-layer vectorial zoom strategy.
        //
        // ✅ NO filter, NO backdrop-filter, NO translateZ(0), NO opacity < 1
        //    on this container — all would create rasterized composite layers.
      }}
      // ✅ stopPropagation on the entire frame — nothing inside can ever trigger pan in CanvasArea
      onMouseDown={e => e.stopPropagation()}
      // ✅ stopPropagation on click — prevents CanvasArea's handleBackgroundClick from
      // firing after every canvas interaction and immediately deselecting elements
      onClick={e => e.stopPropagation()}
    >
      {/* ── Layer 1: Elements — purely visual, pointer-events-none ── */}
      {orderedElements.map((element, index) => {
        const layer = layers.find(l => l.id === element.id);
        if (layer && !layer.visible) return null;
        return (
          <CanvasElementView
            key={element.id}
            element={element}
            zIndex={index + 1}
          />
        );
      })}

      {/* ── Layer 2: Multi-selection bounding box (border + handles) ── */}
      {selectedElementIds.length > 1 && (
        <MultiSelectionBoundingBox selectedIds={selectedElementIds} />
      )}

      {/* ── Layer 2b: Group-edit dim overlay (z-45) ── */}
      {editingGroupId && (
        <GroupEditOverlay editingGroupId={editingGroupId} />
      )}

      {/* ── Layer 2c: Resize guides — visible during resize (z-46) ── */}
      <ResizeGuidesOverlay
        guides={resizeGuides}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
      />

      {/* ── Layer 2d: Group drop target highlight — pulses during drag (z-46, V59) ── */}
      <GroupDropTargetOverlay />

      {/* ── Layer 2e: Group drop tooltip — "Drop to add to …" (z-47, V61) ── */}
      <GroupDropTooltip />

      {/* ── Layer 3: Out-of-bounds mask — dims area outside the canvas bounds (z-48) ── */}
      <CanvasOutOfBoundsOverlay canvasWidth={canvasWidth} canvasHeight={canvasHeight} />

      {/* ── Layer 4: Interaction overlay — captures ALL clicks & drags ── */}
      <InteractionOverlay
        frameRef={frameRef}
        onMarqueeChange={setMarquee}
        onGuidesChange={setActiveGuides}
        onDragTargetChange={setDragTargetGroupId}
      />

      {/* ── Layer 5: Marquee selection box ── */}
      {marquee && marquee.w > 2 && marquee.h > 2 && (
        <div
          className="absolute pointer-events-none border border-[#5B4EFF]"
          style={{
            left:            marquee.x,
            top:             marquee.y,
            width:           marquee.w,
            height:          marquee.h,
            backgroundColor: 'rgba(91,78,255,0.10)',
            zIndex:          60,
          }}
        />
      )}

      {/* ── Layer 6: Single-element resize handles (above overlay) ── */}
      {/* V55: Hide handles while text element is being edited inline */}
      {singleSelectedEl && editingTextId !== singleSelectedEl.id && (
        <SingleSelectionHandles
          element={singleSelectedEl}
          onResizeGuidesChange={setResizeGuides}
        />
      )}

      {/* ── Group-edit mode badge — bottom of canvas ── */}
      {editingGroupId && !isPreviewMode && (
        <div
          className="absolute pointer-events-none"
          style={{
            bottom:    12,
            left:      '50%',
            transform: 'translateX(-50%)',
            zIndex:    80,
          }}
        >
          <span className="text-[10px] text-white bg-[#5B4EFF] px-2 py-1 rounded-full whitespace-nowrap shadow-md">
            Editing group — Esc to exit
          </span>
        </div>
      )}

      {/* ── Alignment guides (visual only, no z conflict) ── */}
      <AlignmentGuidesOverlay
        guides={activeGuides}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
      />

      {/* ── Empty canvas hint ── */}
      {canvasElements.length === 0 && !isPreviewMode && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none" style={{ zIndex: 45 }}>
          <p className="text-[13px] text-[#CCCCCC] font-medium">Empty canvas</p>
          <p className="text-[11px] text-[#DDDDDD] mt-1">Use the Insert panel to add elements</p>
        </div>
      )}

      {/* ── Shift+click hint — when exactly one element selected ── */}
      {selectedElementIds.length === 1 && !isPreviewMode && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 45 }}>
          <span className="text-[10px] text-[#9c99a9] bg-white/90 px-2 py-1 rounded-full whitespace-nowrap shadow-sm">
            Shift + click to select more
          </span>
        </div>
      )}
    </div>
  );
}