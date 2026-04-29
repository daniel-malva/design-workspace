import { BrandKitSelector } from './BrandKitSelector';
import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Type, Braces, ImageIcon, Component, MessageSquare,
  Shapes, Smile, Music, Mic, Eye, EyeOff, Lock, Unlock,
  ChevronDown, Zap, Settings2, FileDown, FileJson, Cpu, ChevronRight,
  Minus, Layers, Square, Image as LayerImage, GripVertical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDesignWorkspace, InsertMenuItem } from '../store/useDesignWorkspaceStore';
import type { CanvasElement, Layer } from '../store/useDesignWorkspaceStore';
import { defaultLayerName } from '../store/useDesignWorkspaceStore';
import { InsertSubPanel } from './InsertSubPanels';
import { ImagesVideoOverflowMenu } from './ImagesVideoOverflowMenu';

interface InsertItem {
  id: InsertMenuItem;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
}

const insertItems: InsertItem[] = [
  { id: 'text',               icon: <Type size={15} />,          label: 'Text',                shortcut: 'T'   },
  { id: 'dynamicPlaceholder', icon: <Braces size={15} />,        label: 'Dynamic Placeholder', shortcut: 'M'   },
  { id: 'imagesVideo',        icon: <ImageIcon size={15} />,     label: 'Images / Video',      shortcut: 'U'   },
  { id: 'component',          icon: <Component size={15} />,     label: 'Component',           shortcut: 'C'   },
  { id: 'annotation',         icon: <MessageSquare size={15} />, label: 'Annotation',          shortcut: 'A'   },
  { id: 'shapes',             icon: <Shapes size={15} />,        label: 'Shapes',              shortcut: 'H'   },
  { id: 'icons',              icon: <Smile size={15} />,         label: 'Icons',               shortcut: 'I'   },
  { id: 'audio',              icon: <Music size={15} />,         label: 'Audio',               shortcut: '⇧ A' },
  { id: 'aiVoice',            icon: <Mic size={15} />,           label: 'AI Voice',            shortcut: '⌘ V' },
];

// ── Sub-panels ────────────────────────────────────────────────────

function PanelHeader({ title }: { title: string }) {
  return (
    <div className="px-4 py-3 border-b border-[#E2E2E2]">
      <p className="text-[13px] font-semibold text-[#111111]">{title}</p>
    </div>
  );
}

// ─── Single row in the Insert menu list ───────────────────────────
function InsertMenuItemButton({
  item,
  isActive,
  buttonRef,
  onClick,
}: {
  item: InsertItem;
  isActive: boolean;
  buttonRef?: React.RefObject<HTMLButtonElement>;
  onClick: () => void;
}) {
  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 transition-colors text-left group ${
        isActive
          ? 'bg-[rgba(91,78,255,0.08)] text-[#473bab]'
          : 'hover:bg-[#f5f5f5]'
      }`}
    >
      <span className={`w-5 shrink-0 transition-colors ${
        isActive ? 'text-[#473bab]' : 'text-[#6B6B6B] group-hover:text-[#5B4EFF]'
      }`}>
        {item.icon}
      </span>
      <span className={`text-[13px] flex-1 ${
        isActive ? 'text-[#473bab]' : 'text-[#111111]'
      }`}>
        {item.label}
      </span>
      <span className="flex items-center gap-1.5">
        <kbd className="text-[10px] text-[#6B6B6B] bg-[#f0f0f0] px-1.5 py-0.5 rounded font-mono">
          {item.shortcut}
        </kbd>
        <ChevronRight size={12} className={`transition-colors ${
          isActive ? 'text-[#473bab]' : 'text-[#AAAAAA] group-hover:text-[#5B4EFF]'
        }`} />
      </span>
    </button>
  );
}

// Level 1 — list of insertable element types
function InsertMenuPanel() {
  const { setActiveInsertItem, activeInsertItem, imagesVideoMenuTrigger } = useDesignWorkspace();
  const [imagesMenuOpen, setImagesMenuOpen] = useState(false);
  const imagesItemRef = useRef<HTMLButtonElement>(null);

  // Open the Images/Video overflow menu when the 'U' shortcut fires
  useEffect(() => {
    if (imagesVideoMenuTrigger > 0) {
      setImagesMenuOpen(true);
    }
  }, [imagesVideoMenuTrigger]);

  return (
    <>
      <PanelHeader title="Insert" />
      <div className="flex flex-col py-1 overflow-y-auto flex-1">
        {insertItems.map(item => {
          const isImages = item.id === 'imagesVideo';
          const isActive = isImages ? imagesMenuOpen : activeInsertItem === item.id;
          return (
            <InsertMenuItemButton
              key={item.id}
              item={item}
              isActive={isActive}
              buttonRef={isImages ? imagesItemRef : undefined}
              onClick={() =>
                isImages
                  ? setImagesMenuOpen(prev => !prev)
                  : setActiveInsertItem(item.id)
              }
            />
          );
        })}
      </div>

      {/* Overflow menu — portaled to document.body to escape LeftPane's overflow:hidden */}
      <ImagesVideoOverflowMenu
        isOpen={imagesMenuOpen}
        anchorRef={imagesItemRef}
        onClose={() => setImagesMenuOpen(false)}
      />
    </>
  );
}

// Composite — shows Level 1 or Level 2 depending on activeInsertItem
function InsertPanel() {
  const { activeInsertItem } = useDesignWorkspace();
  return activeInsertItem ? <InsertSubPanel /> : <InsertMenuPanel />;
}

// ═══════════════════════════════════════════════════════════════════
// LAYERS PANEL — hierarchical tree with group expand/collapse
// ═══════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────

interface LayerNode {
  element: CanvasElement;
  children: LayerNode[];
}

// ── Drag state (V53) ───────────────────────────────────────────────
interface LayerDragState {
  draggingId: string;
  overId: string | null;
  overZone: 'before' | 'inside' | 'after' | null;
}

// ── Build tree from flat canvasElements array ──────────────────────
function buildLayerTree(elements: CanvasElement[]): LayerNode[] {
  // Reversed so topmost canvas element appears first in the list
  const reversed = [...elements].reverse();

  const groups     = reversed.filter(el => el.type === 'group');
  const standalone = reversed.filter(el => el.type !== 'group' && !el.groupId);

  const groupNodes: LayerNode[] = groups.map(group => ({
    element: group,
    children: reversed
      .filter(el => el.groupId === group.id)
      .map(child => ({ element: child, children: [] })),
  }));

  const standaloneNodes: LayerNode[] = standalone.map(el => ({
    element: el,
    children: [],
  }));

  return [...groupNodes, ...standaloneNodes];
}

// ── Single layer node (recursive for children) ─────────────────────

interface LayerNodeItemProps {
  node: LayerNode;
  depth: number;
  layers: Layer[];
  selectedIds: string[];
  onSelect: (id: string, type: string) => void;
  onToggleVisible: (id: string, visible: boolean) => void;
  onToggleLocked: (id: string, locked: boolean) => void;
  // V53: Zone-based drag props (replaces simple onReorder)
  dragState: LayerDragState | null;
  onDragStart: (id: string) => void;
  onDragOver: (id: string, zone: 'before' | 'inside' | 'after') => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

function LayerNodeItem({
  node, depth, layers, selectedIds,
  onSelect, onToggleVisible, onToggleLocked,
  dragState, onDragStart, onDragOver, onDrop, onDragEnd,
}: LayerNodeItemProps) {
  const { renameElement, enterGroup, canvasElements } = useDesignWorkspace();

  const [expanded,  setExpanded]  = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected   = selectedIds.includes(node.element.id);
  const hasChildren  = node.children.length > 0;
  const layer        = layers.find(l => l.id === node.element.id);
  const visible      = layer?.visible ?? true;
  const locked       = layer?.locked  ?? false;

  // V53: derive drag/over state from parent's dragState
  const isDragging   = dragState?.draggingId === node.element.id;
  const isOver       = dragState?.overId === node.element.id;
  const overZone     = isOver ? dragState?.overZone : null;

  // Resolved display name — prefers element.name, falls back to type label
  const displayName = node.element.type === 'group'
    ? (node.element.name ?? `Group (${node.children.length})`)
    : (node.element.name ?? defaultLayerName(node.element.type as import('../store/useDesignWorkspaceStore').CanvasElementType));

  // Focus + select-all when entering edit mode
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setEditValue(displayName);
    setIsEditing(true);
  }

  function handleConfirm() {
    const trimmed = editValue.trim();
    renameElement(node.element.id, trimmed || defaultLayerName(node.element.type as import('../store/useDesignWorkspaceStore').CanvasElementType));
    setIsEditing(false);
  }

  function handleCancel() {
    setEditValue(displayName);
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter')  { e.preventDefault(); handleConfirm(); }
    if (e.key === 'Escape') { e.preventDefault(); handleCancel();  }
  }

  // When the user selects a node from the Layers panel, also enter group-edit
  // mode if the node is a direct child of a group.
  function handleSelectFromPanel(id: string, type: string) {
    const element = canvasElements.find(el => el.id === id);
    if (element?.groupId) {
      enterGroup(element.groupId);
    }
    onSelect(id, type);
  }

  return (
    <div className="w-full">
      {/* ── Drop indicator: BEFORE ── */}
      {isOver && overZone === 'before' && (
        <div className="h-0.5 bg-[#5B4EFF] mx-3 rounded-full pointer-events-none" />
      )}

      {/* ── Row ── */}
      <div
        draggable
        onDragStart={e => {
          e.stopPropagation();
          e.dataTransfer.effectAllowed = 'move';
          onDragStart(node.element.id);
        }}
        onDragOver={e => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'move';
          // Determine zone: top 25% = before, middle 50% = inside (groups only), bottom 25% = after
          const rect  = e.currentTarget.getBoundingClientRect();
          const relY  = (e.clientY - rect.top) / rect.height;
          const zone: 'before' | 'inside' | 'after' =
            relY < 0.25
              ? 'before'
              : relY > 0.75
                ? 'after'
                : node.element.type === 'group'
                  ? 'inside'
                  : 'after';
          onDragOver(node.element.id, zone);
        }}
        onDragLeave={e => {
          // Only clear if truly leaving (not entering a child)
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            onDragOver(node.element.id, 'after'); // keep overId but reset to neutral
          }
        }}
        onDrop={e => {
          e.preventDefault();
          e.stopPropagation();
          onDrop();
        }}
        onDragEnd={e => {
          e.stopPropagation();
          onDragEnd();
        }}
        className={[
          'flex items-center gap-1 py-[5px] cursor-pointer select-none border-l-2 transition-colors group',
          isDragging  ? 'opacity-40' : '',
          isSelected  ? 'bg-[rgba(91,78,255,0.06)] border-l-[#5B4EFF]' : 'border-l-transparent hover:bg-[#f9f9f9]',
          isOver && overZone === 'inside' && node.element.type === 'group'
            ? 'bg-[rgba(91,78,255,0.06)] outline outline-1 outline-[#5B4EFF] outline-offset-[-1px] rounded-[3px]'
            : '',
        ].join(' ')}
        style={{ paddingLeft: `${12 + depth * 16}px`, paddingRight: '8px' }}
        onClick={() => !isEditing && handleSelectFromPanel(node.element.id, node.element.type)}
        onMouseDown={e => {
          // V65 note: e.preventDefault() was removed here — it blocked HTML5 drag-and-drop.
          // The window-level keydown listener in useCanvasKeyboardShortcuts still receives
          // arrow-key events from focused divs (only input/textarea/select are skipped),
          // so keyboard shortcuts continue to work without preventing mousedown.
          // tabIndex={-1} is kept so Tab navigation skips layer rows.
        }}
        tabIndex={-1}
      >
        {/* Expand / collapse toggle — only for groups */}
        {hasChildren ? (
          <button
            className="w-4 h-4 flex items-center justify-center shrink-0 text-[#9CA3AF] hover:text-[#111111] transition-colors"
            onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
          >
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
        ) : (
          <div className="w-4 shrink-0" />
        )}

        {/* Grip icon — visible on hover to signal draggability */}
        <GripVertical
          size={11}
          className="text-[#C0C0C0] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        />

        {/* Type icon */}
        <LayerTypeIcon type={node.element.type} />

        {/* Name — static span or inline input */}
        <div className="flex-1 min-w-0 ml-1">
          {isEditing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={handleConfirm}
              onKeyDown={handleKeyDown}
              onClick={e => e.stopPropagation()}
              className="w-full text-[12px] text-[#111111] bg-white border border-[#5B4EFF] rounded-[3px] px-1 py-0.5 outline-none focus:ring-1 focus:ring-[#5B4EFF]"
            />
          ) : (
            <span
              className="block text-[12px] text-[#111111] truncate"
              onDoubleClick={handleDoubleClick}
              title={`Double-click to rename "${displayName}"`}
            >
              {displayName}
            </span>
          )}
        </div>

        {/* Visibility + lock toggles — hidden while editing */}
        {!isEditing && (
          <>
            <button
              onClick={e => { e.stopPropagation(); onToggleVisible(node.element.id, !visible); }}
              className="text-[#9CA3AF] hover:text-[#111111] transition-colors shrink-0 p-0.5"
              title={visible ? 'Hide layer' : 'Show layer'}
            >
              {visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
            <button
              onClick={e => { e.stopPropagation(); onToggleLocked(node.element.id, !locked); }}
              className="text-[#9CA3AF] hover:text-[#111111] transition-colors shrink-0 p-0.5"
              title={locked ? 'Unlock layer' : 'Lock layer'}
            >
              {locked ? <Lock size={12} /> : <Unlock size={12} />}
            </button>
          </>
        )}

        {/* Selection indicator dot */}
        {isSelected && !isEditing && (
          <div className="w-1.5 h-1.5 rounded-full bg-[#5B4EFF] shrink-0 ml-0.5" />
        )}
      </div>

      {/* ── Drop indicator: AFTER ── */}
      {isOver && overZone === 'after' && (
        <div className="h-0.5 bg-[#5B4EFF] mx-3 rounded-full pointer-events-none" />
      )}

      {/* ── Children (indented) ── */}
      {hasChildren && expanded && (
        <div>
          {node.children.map(child => (
            <LayerNodeItem
              key={child.element.id}
              node={child}
              depth={depth + 1}
              layers={layers}
              selectedIds={selectedIds}
              onSelect={onSelect}
              onToggleVisible={onToggleVisible}
              onToggleLocked={onToggleLocked}
              dragState={dragState}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── LayersPanel ─────���──────────────────────────────────────────────

function LayersPanel() {
  const {
    canvasElements,
    layers,
    selectedElementIds,
    setSelectedElement,
    setLayerVisibility,
    setLayerLocked,
    reparentElement,
    setDragTargetGroupId,
  } = useDesignWorkspace();

  // V53: Zone-based drag state — lifted here so all nodes share one source of truth
  const [dragState, setDragState] = useState<LayerDragState | null>(null);

  const layerTree = useMemo(
    () => buildLayerTree(canvasElements),
    [canvasElements],
  );

  // Count visible (non-group) elements for the header badge
  const elementCount = canvasElements.filter(el => el.type !== 'group').length;
  const groupCount   = canvasElements.filter(el => el.type === 'group').length;

  // V53: Determine target action on drop based on zone and target element
  function handleDrop() {
    if (!dragState?.draggingId || !dragState?.overId) {
      setDragState(null);
      setDragTargetGroupId(null);
      return;
    }

    const { draggingId, overId, overZone } = dragState;
    const target = canvasElements.find(el => el.id === overId);

    // Guard: can't drop on itself
    if (!target || draggingId === overId) {
      setDragState(null);
      setDragTargetGroupId(null);
      return;
    }

    if (overZone === 'inside' && target.type === 'group') {
      // Drop INSIDE a group → reparent into that group
      reparentElement(draggingId, overId);
    } else if (target.groupId && overZone !== 'inside') {
      // Drop on a sibling inside a group → reparent into the same group
      reparentElement(draggingId, target.groupId);
    } else {
      // Drop outside any group → promote to top-level
      reparentElement(draggingId, null);
    }

    setDragState(null);
    setDragTargetGroupId(null);
  }

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E2E2E2] shrink-0 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-[#111111]">Layers</p>
        <span className="text-[11px] text-[#9CA3AF]">
          {elementCount}{groupCount > 0 ? ` · ${groupCount}G` : ''}
        </span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {canvasElements.length === 0 ? (
          <EmptyLayersState />
        ) : (
          <div className="flex flex-col">
            {layerTree.map(node => (
              <LayerNodeItem
                key={node.element.id}
                node={node}
                depth={0}
                layers={layers}
                selectedIds={selectedElementIds}
                onSelect={setSelectedElement}
                onToggleVisible={setLayerVisibility}
                onToggleLocked={setLayerLocked}
                dragState={dragState}
                onDragStart={id => setDragState({ draggingId: id, overId: null, overZone: null })}
                onDragOver={(id, zone) => {
                  setDragState(s => s ? { ...s, overId: id, overZone: zone } : null);
                  // V59: highlight the target group on the canvas
                  const target = canvasElements.find(el => el.id === id);
                  if (zone === 'inside' && target?.type === 'group') {
                    setDragTargetGroupId(id);
                  } else {
                    setDragTargetGroupId(null);
                  }
                }}
                onDrop={handleDrop}
                onDragEnd={() => {
                  setDragState(null);
                  setDragTargetGroupId(null);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const elementTypeLabel: Record<string, string> = {
  'text-header':            'Header',
  'text-subheader':         'Sub Header',
  'text-body':              'Body Text',
  'text-template':          'Text Template',
  'placeholder-logo':       'Logo',
  'placeholder-background': 'Background',
  'placeholder-jellybean':  'Jellybean',
  'placeholder-media':      'Media',
  'placeholder-audio':      'Audio Placeholder',
  'shape':                  'Shape',
  'icon':                   'Icon',
  'line':                   'Line',
};

function LayerTypeIcon({ type }: { type: string }) {
  const p = { size: 12, className: 'text-[#9CA3AF] shrink-0' };
  switch (type) {
    case 'text-header':
    case 'text-subheader':
    case 'text-body':
    case 'text-template':
      return <Type {...p} />;
    case 'placeholder-logo':
    case 'placeholder-background':
    case 'placeholder-jellybean':
    case 'placeholder-media':
      return <LayerImage {...p} />;
    case 'placeholder-audio':
      return <Music {...p} />;
    case 'shape':
      return <Shapes {...p} />;
    case 'icon':
      return <Smile {...p} />;
    case 'line':
      return <Minus {...p} />;
    case 'group':
      return <Layers {...p} />;
    default:
      return <Square {...p} />;
  }
}

function EmptyLayersState() {
  return (
    <div className="flex flex-col items-center justify-center h-32 px-6 text-center">
      <Layers size={24} className="text-[#E2E2E2] mb-2" />
      <p className="text-[11px] text-[#9CA3AF]">
        No layers yet. Add elements via the Insert menu.
      </p>
    </div>
  );
}

function BrandKitPanel() {
  const [brandKit, setBrandKit] = useState('');
  return (
    <>
      <PanelHeader title="Brand Kit" />
      <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
        <BrandKitSelector value={brandKit} onChange={setBrandKit} label="Select a brand" />
        {brandKit && (
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Colors</p>
              <div className="flex gap-2 flex-wrap">
                {['#5B4EFF', '#7b1fa2', '#3949ab', '#43a047', '#111111'].map(c => (
                  <div key={c} title={c} className="w-8 h-8 rounded-full border-2 border-white shadow cursor-pointer ring-1 ring-[#E2E2E2]" style={{ background: c }} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Typography</p>
              <div className="flex flex-col gap-1">
                {['Roboto', 'Inter', 'Helvetica'].map((f, i) => (
                  <div key={f} className="flex items-center justify-between p-2.5 bg-[#f5f5f5] rounded-xl border border-[#E2E2E2]">
                    <span className="text-[12px] text-[#111111]" style={{ fontFamily: f }}>{f}</span>
                    <span className="text-[10px] text-[#6B6B6B]">{i === 0 ? 'Primary' : i === 1 ? 'Secondary' : 'Mono'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ConfigurePanel() {
  const [feedUrl, setFeedUrl] = useState('');
  const [feedType, setFeedType] = useState('csv');
  const mappings = [
    { placeholder: '{SocialHeader}',           column: 'headline'       },
    { placeholder: '{year} {make} {model}',    column: 'vehicle_title'  },
    { placeholder: '{dealerName}',             column: 'dealer_name'    },
    { placeholder: '{vin}',                    column: 'vin'            },
    { placeholder: '{disclaimer}',             column: 'disclaimer_text'},
  ];
  return (
    <>
      <PanelHeader title="Configure Data Feed" />
      <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-[#6B6B6B] font-semibold uppercase tracking-wider">Feed Type</label>
          <div className="flex gap-2">
            {['csv', 'json', 'api'].map(t => (
              <button key={t} onClick={() => setFeedType(t)}
                className={`flex-1 py-2 rounded-lg text-[11px] uppercase font-semibold transition-colors ${feedType === t ? 'bg-[#5B4EFF] text-white' : 'bg-[#f5f5f5] border border-[#E2E2E2] text-[#6B6B6B] hover:border-[#5B4EFF]'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-[#6B6B6B] font-semibold uppercase tracking-wider">Feed URL / Source</label>
          <input value={feedUrl} onChange={e => setFeedUrl(e.target.value)} placeholder="https://example.com/feed.csv"
            className="bg-[#f5f5f5] border border-[#E2E2E2] rounded-xl px-3 py-2 text-[12px] text-[#111111] placeholder:text-[#AAAAAA] outline-none focus:border-[#5B4EFF] transition-colors" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider">Column Mapping</p>
          {mappings.map(m => (
            <div key={m.placeholder} className="flex items-center gap-2">
              <span className="text-[9px] text-[#5B4EFF] font-mono bg-[rgba(91,78,255,0.08)] px-1.5 py-1 rounded-lg flex-1 truncate">{m.placeholder}</span>
              <span className="text-[#6B6B6B] text-[10px]">→</span>
              <select className="flex-1 bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg text-[11px] px-2 py-1 text-[#111111]">
                <option>{m.column}</option>
              </select>
            </div>
          ))}
        </div>
        <button className="w-full bg-[#5B4EFF] text-white text-[12px] font-semibold py-2.5 rounded-xl hover:bg-[#4a3ee0] transition-colors">
          Connect Feed
        </button>
      </div>
    </>
  );
}

function ExportPanel() {
  const [format, setFormat] = useState('png');
  const [destination, setDestination] = useState('local');
  const formats = ['png', 'jpg', 'gif', 'mp4', 'html5'];
  return (
    <>
      <PanelHeader title="Export" />
      <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-[#6B6B6B] font-semibold uppercase tracking-wider">Format</label>
          <div className="grid grid-cols-3 gap-1.5">
            {formats.map(f => (
              <button key={f} onClick={() => setFormat(f)}
                className={`py-2 rounded-lg text-[10px] uppercase font-semibold transition-colors ${format === f ? 'bg-[#5B4EFF] text-white' : 'bg-[#f5f5f5] border border-[#E2E2E2] text-[#6B6B6B] hover:border-[#5B4EFF]'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-[#6B6B6B] font-semibold uppercase tracking-wider">Destination</label>
          <div className="flex flex-col gap-1.5">
            {[{ id: 'local', label: 'Download locally', icon: <FileDown size={14} /> }, { id: 'platform', label: 'Save to platform', icon: <FileJson size={14} /> }].map(d => (
              <button key={d.id} onClick={() => setDestination(d.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${destination === d.id ? 'border-[#5B4EFF] bg-[rgba(91,78,255,0.06)]' : 'border-[#E2E2E2] hover:bg-[#f5f5f5]'}`}>
                <span className={destination === d.id ? 'text-[#5B4EFF]' : 'text-[#6B6B6B]'}>{d.icon}</span>
                <span className={`text-[12px] font-medium ${destination === d.id ? 'text-[#5B4EFF]' : 'text-[#111111]'}`}>{d.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {['1x', '2x', '3x'].map(s => (
            <button key={s} className="flex-1 py-2 bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg text-[11px] font-semibold text-[#6B6B6B] hover:border-[#5B4EFF] hover:text-[#5B4EFF] transition-colors">{s}</button>
          ))}
        </div>
        <button className="w-full bg-[#5B4EFF] text-white text-[12px] font-semibold py-2.5 rounded-xl hover:bg-[#4a3ee0] transition-colors flex items-center justify-center gap-2">
          <FileDown size={14} /> Export Asset
        </button>
      </div>
    </>
  );
}

// ── Floating LeftPane overlay ─────────────────────────────────────

export function LeftPane() {
  const { activePanel } = useDesignWorkspace();

  const panelContent: Record<string, React.ReactNode> = {
    insert:    <InsertPanel />,
    layers:    <LayersPanel />,
    brandKit:  <BrandKitPanel />,
    configure: <ConfigurePanel />,
    export:    <ExportPanel />,
  };

  return (
    <AnimatePresence>
      {/* 'settings' and 'configure' open the RightPanel, not the LeftPane */}
      {activePanel && activePanel !== 'settings' && activePanel !== 'configure' && (
        <motion.div
          key="left-pane"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute left-1 top-1 bottom-1 w-[260px] bg-white rounded-2xl overflow-hidden z-20 flex flex-col"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
          onClick={e => e.stopPropagation()}
        >
          {panelContent[activePanel]}
        </motion.div>
      )}
    </AnimatePresence>
  );
}