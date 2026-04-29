import React, { useState, useContext, createContext, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────
export type LeftRailItem =
  | 'insert' | 'layers' | 'brandKit'
  | 'configure' | 'export' | 'settings';

export type CanvasElementType =
  | 'text-header' | 'text-subheader' | 'text-body' | 'text-template'
  | 'placeholder-logo' | 'placeholder-background' | 'placeholder-jellybean'
  | 'placeholder-media' | 'placeholder-audio'
  | 'shape' | 'icon' | 'line' | 'group';

// Kept for backward compatibility with panels not yet migrated
export type InsertableElement =
  | 'text' | 'dynamicPlaceholder' | 'image' | 'component'
  | 'annotation' | 'shapes' | 'icons' | 'audio' | 'aiVoice';

export type InsertMenuItem =
  | 'text' | 'dynamicPlaceholder' | 'imagesVideo' | 'component'
  | 'annotation' | 'shapes' | 'icons' | 'audio' | 'aiVoice';

// ─── Canvas element model ─────────────────────────────────────────
export interface ElementStyle {
  color?: string;
  backgroundColor?: string;
  backgroundImage?: string;   // V68: CSS gradient string
  gradientData?: {            // V68: structured gradient for future re-editing
    angle: number;
    stops: Array<{ id: string; position: number; color: string; opacity: number }>;
  };
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  borderColor?: string;
  opacity?: number;
}

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;           // ← V40: editable layer name
  content?: string;
  shapeVariant?: string;
  iconSrc?: string;
  placeholderVariant?: 'logo' | 'background' | 'jellybean' | 'media' | 'audio';
  lineVariant?: 'solid' | 'dashed' | 'dotted' | 'arrow';
  groupId?: string;
  groupedIds?: string[];
  style?: ElementStyle;
}

export interface Layer {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  order: number;
}

export interface CanvasPage {
  id: string;
  name: string;
}

export interface TextProperties {
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  verticalAlign: 'top' | 'middle' | 'bottom';
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  fillColor: string;
  fillOpacity: number;
}

export interface DesignWorkspaceState {
  // ── State ───────────────────────────────────────────────────────
  activePanel: LeftRailItem | null;
  activeInsertItem: InsertMenuItem | null;
  /** V34: replaces selectedElementId — array of selected element IDs */
  selectedElementIds: string[];
  /** Type of the selected element — only set when exactly one element is selected */
  selectedElementType: string | null;
  rightPanelForcedOpen: boolean;
  activityPanelOpen: boolean;
  activityPanelTab: 'eventLog' | 'comments';
  isPreviewMode: boolean;
  isTimelineVisible: boolean;
  isTimelineExpanded: boolean;
  canvasPages: CanvasPage[];
  activePageId: string;
  layers: Layer[];
  templateName: string;
  canvasElements: CanvasElement[];
  textProps: TextProperties;
  canvasOffset: { x: number; y: number } | null;
  canvasScale: number;
  /** Applied canvas dimensions — updated by Save in SettingsPanel */
  canvasWidth:  number;
  canvasHeight: number;
  imagesVideoMenuTrigger: number;
  /** V42: ID of the group currently being edited (children are directly selectable) */
  editingGroupId: string | null;
  /** V55: ID of the text element currently in inline edit mode */
  editingTextId: string | null;
  // V56: Settings state
  settings: Settings;
  /** V49: Undo history — snapshots of canvas state BEFORE each mutating action */
  history: HistorySnapshot[];
  /** V49: Redo stack — states that were undone and can be re-applied */
  future:  HistorySnapshot[];
  /** V59: ID of the group currently highlighted as a drag drop target */
  dragTargetGroupId: string | null;

  // ── Canvas actions ───────────────────────────────────────────────
  insertElement: (element: Omit<CanvasElement, 'id'>) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  /**
   * V69: Resize a group container and all its children proportionally in one
   * atomic update. Both `originalGroup` and `snapshots` must be captured at
   * mousedown so that scale is always computed from the immutable original size,
   * not from the current (mid-drag) state.
   */
  updateGroupWithChildren: (
    groupId:       string,
    newGroup:      { x: number; y: number; width: number; height: number },
    originalGroup: { x: number; y: number; width: number; height: number },
    snapshots:     ChildSnapshot[],
  ) => void;
  deleteElement: (id: string) => void;
  reorderElement: (fromIndex: number, toIndex: number) => void;
  groupElements: (ids: string[]) => void;
  ungroupElements: (groupId: string) => void;
  renameElement: (id: string, name: string) => void;
  /**
   * V49: Duplicate a group with all its children.
   * Generates fresh IDs for the container and every child, re-wires groupId,
   * shifts positions by (dx, dy), and appends everything atomically.
   */
  insertGroupWithChildren: (
    container: CanvasElement,
    children:  CanvasElement[],
    dx?: number,
    dy?: number,
  ) => void;
  /**
   * V50: Silent insert — no history snapshot. Used by Alt+drag so that the
   * duplication + movement are committed as ONE undo step via commitHistory().
   * Returns the newly generated element ID synchronously.
   */
  insertElementSilent: (element: Omit<CanvasElement, 'id'>) => string;
  /**
   * V50: Silent group+children insert — no history snapshot.
   * Returns { containerId, childIds } so the caller can track what to drag.
   */
  insertGroupWithChildrenSilent: (
    container: CanvasElement,
    children:  CanvasElement[],
    dx?: number,
    dy?: number,
  ) => { containerId: string; childIds: string[] };

  /**
   * V53: Move an element to a different group (or to top-level when newGroupId is null).
   * Recalculates bounds for both the old and new group; auto-removes the old group
   * if it becomes empty. Groups with exactly one child remaining are preserved.
   */
  reparentElement: (elementId: string, newGroupId: string | null) => void;

  // ── Text edit actions (V55) ──────────────────────────────────────
  /** Enter inline text-edit mode for the given element. */
  startTextEdit:  (id: string) => void;
  /** Commit the new content and exit inline edit mode. Pushes undo snapshot. */
  commitTextEdit: (id: string, newContent: string) => void;
  /** Cancel inline edit mode without changing content. */
  cancelTextEdit: () => void;

  // ── History actions (V49) ────────────────────────────────────────
  /** Save current canvas state NOW as a snapshot (called after drag / resize ends). */
  commitHistory: () => void;
  /** Restore the previous canvas snapshot (Cmd+Z). */
  undo: () => void;
  /** Re-apply the next canvas snapshot (Cmd+Shift+Z / Cmd+Y). */
  redo: () => void;

  // ── Selection actions ────────────────────────────────────────────
  /** Select a single element (deselects all others). Pass null to clear. */
  selectElement: (id: string | null) => void;
  /** Shift+click: add or remove one element from the selection. */
  toggleElementSelection: (id: string) => void;
  /** Deselect everything. */
  clearSelection: () => void;
  /** Replace the entire selection set with the provided IDs. */
  setSelection: (ids: string[]) => void;
  /** Legacy helper used by LeftPane/CanvasFrame — sets a single selection with explicit type. */
  setSelectedElement: (id: string | null, type: string | null) => void;

  // ── Group editing actions (V42) ──────────────────────────────────
  /** Enter group-edit mode: children become directly selectable. */
  enterGroup: (groupId: string) => void;
  /** Exit group-edit mode: re-selects the group container. */
  exitGroup: () => void;
  /** V48: Atomically enter a group AND select a specific child in one update. */
  enterGroupAndSelectChild: (groupId: string, childId: string) => void;

  // ── UI actions ──────────────────────��────────────────────────────
  setActivePanel: (panel: LeftRailItem | null) => void;
  setActiveInsertItem: (item: InsertMenuItem | null) => void;
  setIsPreviewMode: (v: boolean) => void;
  setIsTimelineVisible: (v: boolean) => void;
  setIsTimelineExpanded: (v: boolean) => void;
  setActivePageId: (id: string) => void;
  setLayerVisibility: (id: string, visible: boolean) => void;
  setLayerLocked: (id: string, locked: boolean) => void;
  setLayerName: (id: string, name: string) => void;
  setTextProp: (key: keyof TextProperties, value: TextProperties[keyof TextProperties]) => void;
  setCanvasOffset: (
    offset: { x: number; y: number } |
    ((prev: { x: number; y: number } | null) => { x: number; y: number })
  ) => void;
  setCanvasScale: (updater: number | ((prev: number) => number)) => void;
  /** Apply new canvas dimensions and re-fit to screen */
  setCanvasDimensions: (w: number, h: number) => void;
  /** V66: Fit canvas to screen — reads [data-canvas-container] from DOM */
  fitCanvasToScreen: () => void;
  setRightPanelForcedOpen: (v: boolean) => void;
  setActivityPanelOpen: (v: boolean) => void;
  setActivityPanelTab: (tab: 'eventLog' | 'comments') => void;
  triggerImagesVideoMenu: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  /** V59: Set the group that should pulse as a drop target (null to clear) */
  setDragTargetGroupId: (id: string | null) => void;
}

// ─── Settings model (V56) ─────────────────────────────────────────
export interface Settings {
  templateName:         string;
  templateType:         string;
  assetType:            string;
  brand:                string;
  accounts:             string;
  format:               'static' | 'video';
  // Static
  dimensionPreset:      string;
  dimensionW:           number;
  dimensionH:           number;
  // Video
  aspectRatio:          string;
  dimensionVideoPreset: string;
  dimensionVideoW:      number;
  dimensionVideoH:      number;
  durationType:         string;
  duration:             string;
  frames:               string;
  lockDuration:         boolean;
  loopPlayback:         boolean;
  snapToFrames:         boolean;
  // Metadata (shared)
  tags:                 string;
  offerTypes:           string;
}

const defaultSettings: Settings = {
  templateName:         '{default template name}',
  templateType:         'non-html',
  assetType:            '',
  brand:                '',
  accounts:             '',
  format:               'static',
  dimensionPreset:      'custom',
  dimensionW:           600,
  dimensionH:           600,
  aspectRatio:          'all',
  dimensionVideoPreset: 'custom',
  dimensionVideoW:      1920,
  dimensionVideoH:      1080,
  durationType:         'time',
  duration:             '00:10.999',
  frames:               '24',
  lockDuration:         true,
  loopPlayback:         true,
  snapToFrames:         true,
  tags:                 '',
  offerTypes:           '',
};

// ─── History ──────────────────────────────────────────────────────
const MAX_HISTORY = 50;

export interface HistorySnapshot {
  canvasElements:     CanvasElement[];
  layers:             Layer[];
  selectedElementIds: string[];
  editingGroupId:     string | null;
}

/**
 * V69: Immutable snapshot of a group child captured at resize mousedown.
 * All fields reflect the state BEFORE any transformation begins.
 */
export interface ChildSnapshot {
  id:       string;
  x:        number;
  y:        number;
  width:    number;
  height:   number;
  groupX:   number;
  groupY:   number;
  fontSize: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'el-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}

/** Default human-readable name for a newly inserted element. */
export function defaultLayerName(type: CanvasElementType): string {
  const map: Record<CanvasElementType, string> = {
    'text-header':            'Header',
    'text-subheader':         'Subheader',
    'text-body':              'Body text',
    'text-template':          'Text',
    'placeholder-logo':       'Logo',
    'placeholder-background': 'Background',
    'placeholder-jellybean':  'Jellybean',
    'placeholder-media':      'Media',
    'placeholder-audio':      'Audio',
    'shape':                  'Shape',
    'icon':                   'Icon',
    'line':                   'Line',
    'group':                  'Group',
  };
  return map[type] ?? 'Layer';
}

function typeToLabel(type: CanvasElementType): string {
  return defaultLayerName(type);
}

// ─── Group bounds helper ───────────────────────────────────────────
// Recalculates the bounding box of a group from its current children.
// Called automatically by updateElement / deleteElement / insertElement
// whenever a child is modified, so the group container always stays accurate.
function recalcGroupBounds(
  elements: CanvasElement[],
  groupId: string,
): Partial<CanvasElement> {
  const children = elements.filter(el => el.groupId === groupId);
  if (children.length === 0) return {};
  const minX = Math.min(...children.map(c => c.x));
  const minY = Math.min(...children.map(c => c.y));
  const maxX = Math.max(...children.map(c => c.x + c.width));
  const maxY = Math.max(...children.map(c => c.y + c.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// ─── Default values ───────────────────────────────────────────────
const defaultTextProps: TextProperties = {
  fontFamily: 'Roboto',
  fontWeight: 'Bold',
  fontSize: 34,
  letterSpacing: 6,
  lineHeight: 6,
  textAlign: 'left',
  verticalAlign: 'top',
  bold: true,
  italic: false,
  underline: false,
  strikethrough: false,
  fillColor: '000000',
  fillOpacity: 100,
};

const noop = () => { /* no-op */ };

const defaultContextValue: DesignWorkspaceState = {
  activePanel: 'insert',
  activeInsertItem: null,
  selectedElementIds: [],
  selectedElementType: null,
  rightPanelForcedOpen: false,
  activityPanelOpen: false,
  activityPanelTab: 'eventLog',
  isPreviewMode: false,
  isTimelineVisible: true,
  isTimelineExpanded: false,
  canvasPages: [{ id: 'page-1', name: 'Canvas 1' }],
  activePageId: 'page-1',
  layers: [],
  templateName: 'APR Square Banner 600 x 600px',
  canvasElements: [],
  textProps: defaultTextProps,
  canvasOffset: null,
  canvasScale: 1,
  canvasWidth:  600,
  canvasHeight: 600,
  imagesVideoMenuTrigger: 0,
  editingGroupId: null,
  editingTextId: null,
  // V56: Settings state
  settings: defaultSettings,
  history: [],
  future:  [],
  insertElement: noop,
  updateElement: noop,
  updateGroupWithChildren: noop,
  deleteElement: noop,
  reorderElement: noop,
  groupElements: noop,
  ungroupElements: noop,
  renameElement: noop,
  insertGroupWithChildren: noop,
  commitHistory: noop,
  undo: noop,
  redo: noop,
  enterGroup: noop,
  exitGroup: noop,
  enterGroupAndSelectChild: noop,
  selectElement: noop,
  toggleElementSelection: noop,
  clearSelection: noop,
  setSelection: noop,
  setSelectedElement: noop,
  setActivePanel: noop,
  setActiveInsertItem: noop,
  setIsPreviewMode: noop,
  setIsTimelineVisible: noop,
  setIsTimelineExpanded: noop,
  setActivePageId: noop,
  setLayerVisibility: noop,
  setLayerLocked: noop,
  setLayerName: noop,
  setTextProp: noop,
  setCanvasOffset: noop,
  setCanvasScale: noop,
  setCanvasDimensions: noop,
  fitCanvasToScreen: noop,
  setRightPanelForcedOpen: noop,
  setActivityPanelOpen: noop,
  setActivityPanelTab: noop,
  triggerImagesVideoMenu: noop,
  insertElementSilent: () => '',
  insertGroupWithChildrenSilent: () => ({ containerId: '', childIds: [] }),
  reparentElement: noop,
  startTextEdit:  noop,
  commitTextEdit: noop,
  cancelTextEdit: noop,
  updateSettings: noop,
  setDragTargetGroupId: noop,
};

const DesignWorkspaceContext = createContext<DesignWorkspaceState>(defaultContextValue);

// ─── Provider ─────────────────────────────────────────────────────
export function DesignWorkspaceProvider(props: { children: React.ReactNode }) {
  const [activePanel, setActivePanelState] = useState<LeftRailItem | null>('insert');
  const [activeInsertItem, setActiveInsertItemState] = useState<InsertMenuItem | null>(null);

  // V34: multi-selection array
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [selectedElementType, setSelectedElementType] = useState<string | null>(null);

  const [rightPanelForcedOpen, setRightPanelForcedOpenState] = useState(false);
  const [activityPanelOpen, setActivityPanelOpenState] = useState(false);
  const [activityPanelTab, setActivityPanelTabState] = useState<'eventLog' | 'comments'>('eventLog');
  const [isPreviewMode, setIsPreviewModeState] = useState(false);
  const [isTimelineVisible, setIsTimelineVisibleState] = useState(true);
  const [isTimelineExpanded, setIsTimelineExpandedState] = useState(false);
  const [canvasPages] = useState<CanvasPage[]>([{ id: 'page-1', name: 'Canvas 1' }]);
  const [activePageId, setActivePageIdState] = useState('page-1');
  const [layers, setLayers] = useState<Layer[]>([]);
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [textProps, setTextPropsState] = useState<TextProperties>(defaultTextProps);
  const [canvasOffset, setCanvasOffsetState] = useState<{ x: number; y: number } | null>(null);
  const [canvasScale, setCanvasScaleState] = useState(1);
  const [canvasWidth,  setCanvasWidthState]  = useState(600);
  const [canvasHeight, setCanvasHeightState] = useState(600);
  const [imagesVideoMenuTrigger, setImagesVideoMenuTrigger] = useState(0);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  // V56: Settings state
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // V49: History stacks
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [future,  setFuture]  = useState<HistorySnapshot[]>([]);

  // V59: Group drag target
  const [dragTargetGroupId, setDragTargetGroupIdState] = useState<string | null>(null);

  // Ref tracks consecutive insert count for +16px offset stagger
  const insertCountRef = useRef(0);

  // V49: Ref tracks current editingGroupId for stable exitGroup callback
  const editingGroupIdRef = useRef<string | null>(null);
  editingGroupIdRef.current = editingGroupId;

  // ── Derived helpers ────────────────────────────────────────────
  // We keep live refs so stable callbacks can read current state without
  // being listed as deps (avoids cascade re-creation of all actions).
  const canvasWidthRef  = useRef(canvasWidth);
  canvasWidthRef.current  = canvasWidth;
  const canvasHeightRef = useRef(canvasHeight);
  canvasHeightRef.current = canvasHeight;

  const canvasElementsRef = useRef<CanvasElement[]>([]);
  canvasElementsRef.current = canvasElements;
  const selectedIdsRef = useRef<string[]>([]);
  selectedIdsRef.current = selectedElementIds;
  const layersRef = useRef<Layer[]>([]);
  layersRef.current = layers;
  const historyRef = useRef<HistorySnapshot[]>([]);
  historyRef.current = history;
  const futureRef = useRef<HistorySnapshot[]>([]);
  futureRef.current = future;

  function typeForId(id: string): string | null {
    return canvasElementsRef.current.find(el => el.id === id)?.type ?? null;
  }

  // ── V49: Snapshot helpers ──────────────────────────────────────
  // buildSnap — creates a snapshot of the CURRENT canvas state from refs.
  // Called synchronously; refs are always up-to-date for the current render.
  function buildSnap(): HistorySnapshot {
    return {
      canvasElements:     [...canvasElementsRef.current],
      layers:             [...layersRef.current],
      selectedElementIds: [...selectedIdsRef.current],
      editingGroupId:     editingGroupIdRef.current,
    };
  }

  // takeSnapshot — call at the START of any discrete mutating action.
  // Saves state BEFORE the mutation; clears the redo queue.
  const takeSnapshot = useCallback(() => {
    const snap = buildSnap();
    setHistory(h => [...h, snap].slice(-MAX_HISTORY));
    setFuture([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ref so that actions with [] deps can call the latest takeSnapshot safely
  const takeSnapshotRef = useRef(takeSnapshot);
  takeSnapshotRef.current = takeSnapshot;

  // commitHistory — call at the END of a continuous operation (drag / resize).
  // Saves state AFTER the mutation (the final position); clears redo queue.
  const commitHistory = useCallback(() => {
    const snap = buildSnap();
    setHistory(h => [...h, snap].slice(-MAX_HISTORY));
    setFuture([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Canvas actions ─────────────────────────────────────────────
  const insertElement = useCallback((element: Omit<CanvasElement, 'id'>) => {
    takeSnapshotRef.current();        // ← snapshot BEFORE insert
    const id   = generateId();
    const name = element.name ?? defaultLayerName(element.type);

    const isBackground = element.placeholderVariant === 'background';

    // Background: fixed full-canvas size at (0,0), no stagger offset
    // All other elements: apply the consecutive-insert stagger
    let newEl: CanvasElement;
    if (isBackground) {
      newEl = {
        ...element,
        id,
        name,
        x:      0,
        y:      0,
        width:  canvasWidthRef.current,
        height: canvasHeightRef.current,
      };
    } else {
      const offset = insertCountRef.current * 16;
      insertCountRef.current = (insertCountRef.current + 1) % 10;
      newEl = {
        ...element,
        id,
        name,
        x: Math.min(element.x + offset, 500),
        y: Math.min(element.y + offset, 500),
      };
    }

    setCanvasElements(prev => {
      const next = isBackground ? [newEl, ...prev] : [...prev, newEl];
      // V47: If inserting into a group, recalculate the group's bounding box
      if (newEl.groupId) {
        const bounds = recalcGroupBounds(next, newEl.groupId);
        return next.map(el => el.id === newEl.groupId ? { ...el, ...bounds } : el);
      }
      return next;
    });
    setLayers(prev => [
      ...prev,
      {
        id,
        name: typeToLabel(element.type),
        type: element.type,
        visible: true,
        locked:  false,
        order:   prev.length,
      },
    ]);
    setSelectedElementIds([id]);
    setSelectedElementType(element.type);
  }, []);

  const insertElementSilent = useCallback((element: Omit<CanvasElement, 'id'>) => {
    const id   = generateId();
    const name = element.name ?? defaultLayerName(element.type);

    const isBackground = element.placeholderVariant === 'background';

    // Silent insert: use the element's position EXACTLY as given — no stagger offset.
    // This is intentional: Alt+drag duplicates should start at the same position as
    // the original. The stagger offset is only for fresh inserts from the insert panel.
    const newEl: CanvasElement = isBackground
      ? { ...element, id, name, x: 0, y: 0, width: canvasWidthRef.current, height: canvasHeightRef.current }
      : { ...element, id, name };

    setCanvasElements(prev => {
      const next = isBackground ? [newEl, ...prev] : [...prev, newEl];
      // V47: If inserting into a group, recalculate the group's bounding box
      if (newEl.groupId) {
        const bounds = recalcGroupBounds(next, newEl.groupId);
        return next.map(el => el.id === newEl.groupId ? { ...el, ...bounds } : el);
      }
      return next;
    });
    setLayers(prev => [
      ...prev,
      {
        id,
        name: typeToLabel(element.type),
        type: element.type,
        visible: true,
        locked:  false,
        order:   prev.length,
      },
    ]);
    setSelectedElementIds([id]);
    setSelectedElementType(element.type);
    return id;
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    // updateElement is called on every mousemove during drag/resize — NO snapshot here.
    // commitHistory() is called on mouseup instead (see InteractionOverlay + useResizeHandler).
    setCanvasElements(prev => {
      // Apply the update to the target element
      const updated = prev.map(el => el.id === id ? { ...el, ...updates } : el);

      // V47: If this element belongs to a group, recalculate the group's bounding box
      const element = prev.find(el => el.id === id);
      const parentGroupId = element?.groupId;
      if (parentGroupId) {
        const groupBounds = recalcGroupBounds(updated, parentGroupId);
        return updated.map(el =>
          el.id === parentGroupId ? { ...el, ...groupBounds } : el
        );
      }

      return updated;
    });
  }, []);

  const updateGroupWithChildren = useCallback((
    groupId:       string,
    newGroup:      { x: number; y: number; width: number; height: number },
    originalGroup: { x: number; y: number; width: number; height: number },
    snapshots:     ChildSnapshot[],
  ) => {
    // Scale is always computed from the immutable original size captured at
    // mousedown — never from the current (mid-drag) state, which changes every frame.
    const scaleX = newGroup.width  / originalGroup.width;
    const scaleY = newGroup.height / originalGroup.height;

    setCanvasElements(prev =>
      prev.map(el => {
        if (el.id === groupId) {
          return { ...el, ...newGroup };
        }

        const snap = snapshots.find(s => s.id === el.id);
        if (!snap) return el;

        const scaledEl: CanvasElement = {
          ...el,
          x:      newGroup.x + (snap.x - originalGroup.x) * scaleX,
          y:      newGroup.y + (snap.y - originalGroup.y) * scaleY,
          width:  Math.max(1, snap.width  * scaleX),
          height: Math.max(1, snap.height * scaleY),
        };

        if (el.type.startsWith('text') && snap.fontSize !== null) {
          scaledEl.style = {
            ...el.style,
            fontSize: Math.round(
              Math.max(6, Math.min(400, snap.fontSize * Math.min(scaleX, scaleY)))
            ),
          };
        }

        return scaledEl;
      })
    );
  }, []);

  const deleteElement = useCallback((id: string) => {
    takeSnapshotRef.current();        // ← snapshot BEFORE delete
    // Track whether a group container was removed so we can clear editingGroupId
    let removedGroupId: string | null = null;

    setCanvasElements(prev => {
      const target = prev.find(el => el.id === id);

      if (target?.type === 'group') {
        // Deleting the group itself: remove container, clear groupId from children
        removedGroupId = id;
        return prev
          .filter(el => el.id !== id)
          .map(el => el.groupId === id ? { ...el, groupId: undefined } : el);
      }

      const groupId = target?.groupId;

      // Remove the element
      let updated = prev.filter(el => el.id !== id);

      if (groupId) {
        const remaining = updated.filter(el => el.groupId === groupId);

        if (remaining.length === 0) {
          // Group is now empty → remove the group container too
          removedGroupId = groupId;
          updated = updated.filter(el => el.id !== groupId);
        } else {
          // V60: 1 or more children remain → group is preserved, just recalculate bounds
          const groupBounds = recalcGroupBounds(updated, groupId);
          updated = updated.map(el =>
            el.id === groupId ? { ...el, ...groupBounds } : el
          );
        }
      }

      return updated;
    });

    setLayers(prev => prev.filter(l => l.id !== id));

    // Remove from selection; if it was the only selected item, clear type
    setSelectedElementIds(prev => {
      const next = prev.filter(x => x !== id);
      if (next.length === 0) setSelectedElementType(null);
      else if (next.length === 1) setSelectedElementType(typeForId(next[0]));
      return next;
    });

    // V47: If the group was removed (empty / auto-ungroup), exit group-edit mode
    if (removedGroupId !== null) {
      setEditingGroupId(gid => gid === removedGroupId ? null : gid);
    }
  }, []);

  const reorderElement = useCallback((fromIndex: number, toIndex: number) => {
    setCanvasElements(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setLayers(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const groupElements = useCallback((ids: string[]) => {
    if (ids.length < 2) return;
    takeSnapshotRef.current();        // ← snapshot BEFORE group

    setCanvasElements(prev => {
      const elements = prev.filter(el => ids.includes(el.id));
      if (elements.length < 2) return prev;

      const minX = Math.min(...elements.map(el => el.x));
      const minY = Math.min(...elements.map(el => el.y));
      const maxX = Math.max(...elements.map(el => el.x + el.width));
      const maxY = Math.max(...elements.map(el => el.y + el.height));

      const groupId = generateId();

      // Add layer for the group container
      setLayers(layersPrev => [
        ...layersPrev,
        { id: groupId, name: 'Group', type: 'group', visible: true, locked: false, order: layersPrev.length },
      ]);
      setSelectedElementIds([groupId]);
      setSelectedElementType('group');

      return [
        // ✅ Keep ALL existing elements — just tag the grouped ones with groupId
        ...prev.map(el =>
          ids.includes(el.id) ? { ...el, groupId } : el
        ),
        // ✅ Append the group container (purely a visual bounding box)
        {
          id:         groupId,
          type:       'group' as CanvasElementType,
          name:       'Group',
          x:          minX,
          y:          minY,
          width:      maxX - minX,
          height:     maxY - minY,
          groupedIds: ids,
        },
      ];
    });
  }, []);

  const ungroupElements = useCallback((groupId: string) => {
    takeSnapshotRef.current();        // ← snapshot BEFORE ungroup
    setCanvasElements(prev => {
      const group = prev.find(el => el.id === groupId);
      if (!group || group.type !== 'group') return prev;

      const childIds = prev.filter(el => el.groupId === groupId).map(el => el.id);

      setLayers(layersPrev => layersPrev.filter(l => l.id !== groupId));
      // V60: Select the freed children after ungrouping
      setSelectedElementIds(childIds.length > 0 ? childIds : []);
      setSelectedElementType(null);

      // Remove the group container; clear groupId from its children
      return prev
        .filter(el => el.id !== groupId)
        .map(el => el.groupId === groupId ? { ...el, groupId: undefined } : el);
    });
    // Exit group-edit mode if the ungrouped group was being edited
    setEditingGroupId(gid => gid === groupId ? null : gid);
  }, []);

  const renameElement = useCallback((id: string, name: string) => {
    takeSnapshotRef.current();        // ← snapshot BEFORE rename
    setCanvasElements(prev =>
      prev.map(el =>
        el.id === id
          ? { ...el, name: name.trim() || defaultLayerName(el.type) }
          : el
      )
    );
  }, []);

  /**
   * V49: Duplicate a group with all its children.
   */
  const insertGroupWithChildren = useCallback(
    (container: CanvasElement, children: CanvasElement[], dx = 0, dy = 0) => {
      takeSnapshotRef.current();      // ← snapshot BEFORE insert
      const newGroupId = generateId();

      // Re-assign IDs and offset positions for every child
      const newChildren: CanvasElement[] = children.map(child => ({
        ...child,
        id:      generateId(),
        x:       child.x + dx,
        y:       child.y + dy,
        groupId: newGroupId,   // wire to new container
      }));

      const newContainer: CanvasElement = {
        ...container,
        id: newGroupId,
        x:  container.x + dx,
        y:  container.y + dy,
      };

      // Children first, container last — matches the groupElements ordering so the
      // hit-test (which reverses the array) finds the container before children in
      // normal (non-edit) mode, keeping single-click-to-select-group working.
      setCanvasElements(prev => {
        const next = [...prev, ...newChildren, newContainer];
        // Recompute bounds from the new children to ensure accuracy
        const bounds = recalcGroupBounds(next, newGroupId);
        return next.map(el =>
          el.id === newGroupId ? { ...el, ...bounds } : el
        );
      });

      // Add layer entries for EVERY new element (children + container)
      setLayers(prev => [
        ...prev,
        ...newChildren.map((child, i) => ({
          id:      child.id,
          name:    child.name ?? defaultLayerName(child.type),
          type:    child.type,
          visible: true,
          locked:  false,
          order:   prev.length + i,
        })),
        {
          id:      newGroupId,
          name:    container.name ?? 'Group',
          type:    'group',
          visible: true,
          locked:  false,
          order:   prev.length + newChildren.length,
        },
      ]);

      setSelectedElementIds([newGroupId]);
      setSelectedElementType('group');
    },
    [],
  );

  /**
   * V50: Silent group+children insert — no history snapshot.
   * Returns { containerId, childIds } so the caller can track what to drag.
   */
  const insertGroupWithChildrenSilent = useCallback(
    (container: CanvasElement, children: CanvasElement[], dx = 0, dy = 0) => {
      const newGroupId = generateId();

      // Re-assign IDs and offset positions for every child
      const newChildren: CanvasElement[] = children.map(child => ({
        ...child,
        id:      generateId(),
        x:       child.x + dx,
        y:       child.y + dy,
        groupId: newGroupId,   // wire to new container
      }));

      const newContainer: CanvasElement = {
        ...container,
        id: newGroupId,
        x:  container.x + dx,
        y:  container.y + dy,
      };

      // Children first, container last — matches the groupElements ordering so the
      // hit-test (which reverses the array) finds the container before children in
      // normal (non-edit) mode, keeping single-click-to-select-group working.
      setCanvasElements(prev => {
        const next = [...prev, ...newChildren, newContainer];
        // Recompute bounds from the new children to ensure accuracy
        const bounds = recalcGroupBounds(next, newGroupId);
        return next.map(el =>
          el.id === newGroupId ? { ...el, ...bounds } : el
        );
      });

      // Add layer entries for EVERY new element (children + container)
      setLayers(prev => [
        ...prev,
        ...newChildren.map((child, i) => ({
          id:      child.id,
          name:    child.name ?? defaultLayerName(child.type),
          type:    child.type,
          visible: true,
          locked:  false,
          order:   prev.length + i,
        })),
        {
          id:      newGroupId,
          name:    container.name ?? 'Group',
          type:    'group',
          visible: true,
          locked:  false,
          order:   prev.length + newChildren.length,
        },
      ]);

      setSelectedElementIds([newGroupId]);
      setSelectedElementType('group');
      return { containerId: newGroupId, childIds: newChildren.map(c => c.id) };
    },
    [],
  );

  /**
   * V53: Move an element to a different group (or to top-level when newGroupId is null).
   * Recalculates bounds for both the old and new group; auto-removes the old group
   * if it becomes empty. Groups with exactly one child remaining are preserved.
   */
  const reparentElement = useCallback(
    (elementId: string, newGroupId: string | null) => {
      takeSnapshotRef.current();      // ← snapshot BEFORE reparent

      let removedGroupId: string | null = null;

      setCanvasElements(prev => {
        const element = prev.find(el => el.id === elementId);
        if (!element) return prev;

        const oldGroupId = element.groupId ?? null;

        // No-op if already in the target group
        if (oldGroupId === newGroupId) return prev;

        // Apply reparenting
        let updated = prev.map(el =>
          el.id === elementId
            ? { ...el, groupId: newGroupId ?? undefined }
            : el
        );

        // ── Recalculate / clean up the OLD group ──
        if (oldGroupId) {
          const oldChildren = updated.filter(el => el.groupId === oldGroupId);

          if (oldChildren.length === 0) {
            // Group is now empty → remove the container
            removedGroupId = oldGroupId;
            updated = updated.filter(el => el.id !== oldGroupId);
          } else {
            // V60: 1 or more children remain → group is preserved, just recalculate bounds
            const minX = Math.min(...oldChildren.map(c => c.x));
            const minY = Math.min(...oldChildren.map(c => c.y));
            const maxX = Math.max(...oldChildren.map(c => c.x + c.width));
            const maxY = Math.max(...oldChildren.map(c => c.y + c.height));
            updated = updated.map(el =>
              el.id === oldGroupId
                ? { ...el, x: minX, y: minY, width: maxX - minX, height: maxY - minY }
                : el
            );
          }
        }

        // ── Recalculate the NEW group bounds ──
        if (newGroupId) {
          const newChildren = updated.filter(el => el.groupId === newGroupId);
          if (newChildren.length > 0) {
            const minX = Math.min(...newChildren.map(c => c.x));
            const minY = Math.min(...newChildren.map(c => c.y));
            const maxX = Math.max(...newChildren.map(c => c.x + c.width));
            const maxY = Math.max(...newChildren.map(c => c.y + c.height));
            updated = updated.map(el =>
              el.id === newGroupId
                ? { ...el, x: minX, y: minY, width: maxX - minX, height: maxY - minY }
                : el
            );
          }
        }

        return updated;
      });

      // Remove the layer for any auto-removed group container
      if (removedGroupId !== null) {
        const rg = removedGroupId;
        setLayers(prev => prev.filter(l => l.id !== rg));
        setEditingGroupId(gid => gid === rg ? null : gid);
      }

      // Keep the reparented element selected
      setSelectedElementIds([elementId]);
      setSelectedElementType(typeForId(elementId));
    },
    [],
  );

  // ── Text edit actions (V55) ──────────────────────────────────────
  const startTextEdit = useCallback((id: string) => {
    setEditingTextId(id);
  }, []);

  const commitTextEdit = useCallback((id: string, newContent: string) => {
    takeSnapshotRef.current();        // ← snapshot BEFORE edit
    const finalContent = newContent.trim() || '';
    const truncated = finalContent.length > 40 ? finalContent.slice(0, 40) + '…' : finalContent;
    setCanvasElements(prev =>
      prev.map(el => {
        if (el.id !== id) return el;
        return {
          ...el,
          content: finalContent || el.content || '',
          // Sync layer display name with whatever the user typed
          ...(finalContent ? { name: truncated } : {}),
        };
      })
    );
    setEditingTextId(null);
  }, []);

  const cancelTextEdit = useCallback(() => {
    setEditingTextId(null);
  }, []);

  // ── V49: Undo / Redo ───────────────────────────────────────────
  const undo = useCallback(() => {
    const hist = historyRef.current;
    if (hist.length === 0) return;

    const snapshot    = hist[hist.length - 1];
    const currentSnap = buildSnap();

    setHistory(h => h.slice(0, -1));
    setFuture(f  => [currentSnap, ...f].slice(0, MAX_HISTORY));

    // Restore snapshot
    setCanvasElements(snapshot.canvasElements);
    setLayers(snapshot.layers);
    setSelectedElementIds(snapshot.selectedElementIds);
    setSelectedElementType(
      snapshot.selectedElementIds.length === 1
        ? snapshot.canvasElements.find(el => el.id === snapshot.selectedElementIds[0])?.type ?? null
        : null
    );
    setEditingGroupId(snapshot.editingGroupId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redo = useCallback(() => {
    const fut = futureRef.current;
    if (fut.length === 0) return;

    const snapshot    = fut[0];
    const currentSnap = buildSnap();

    setFuture(f  => f.slice(1));
    setHistory(h => [...h, currentSnap].slice(-MAX_HISTORY));

    // Restore snapshot
    setCanvasElements(snapshot.canvasElements);
    setLayers(snapshot.layers);
    setSelectedElementIds(snapshot.selectedElementIds);
    setSelectedElementType(
      snapshot.selectedElementIds.length === 1
        ? snapshot.canvasElements.find(el => el.id === snapshot.selectedElementIds[0])?.type ?? null
        : null
    );
    setEditingGroupId(snapshot.editingGroupId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Group editing (V42) ───────────────────────────────────────
  const enterGroup = useCallback((groupId: string) => {
    setEditingGroupId(groupId);
  }, []);

  const exitGroup = useCallback(() => {
    // V49: Read current editingGroupId via ref so the callback stays stable ([] deps).
    // Before exiting, explicitly recalculate and commit the group's bounding box one
    // final time. This guarantees that the SingleSelectionHandles that appear after
    // exiting are at the correct position even if a prior updateElement call was
    // slightly out of sync during a high-frequency drag.
    const gid = editingGroupIdRef.current;
    if (gid) {
      setCanvasElements(prev => {
        const bounds = recalcGroupBounds(prev, gid);
        if (Object.keys(bounds).length === 0) return prev;
        const hasChange = prev.find(el => el.id === gid && (
          el.x !== bounds.x || el.y !== bounds.y ||
          el.width !== bounds.width || el.height !== bounds.height
        ));
        if (!hasChange) return prev; // avoid unnecessary re-renders
        return prev.map(el => el.id === gid ? { ...el, ...bounds } : el);
      });
      setSelectedElementIds([gid]);
      setSelectedElementType('group');
    }
    setEditingGroupId(null);
  }, []);

  // V48: Atomic action — enter group-edit mode AND select a child in one render pass.
  // Prevents the two-render flash that occurred when calling enterGroup + selectElement separately.
  const enterGroupAndSelectChild = useCallback((groupId: string, childId: string) => {
    setEditingGroupId(groupId);
    setSelectedElementIds([childId]);
    setSelectedElementType(typeForId(childId));
  }, []);

  // ── Selection actions ──────────────────────────────────────────
  const selectElement = useCallback((id: string | null) => {
    if (!id) {
      setSelectedElementIds([]);
      setSelectedElementType(null);
      return;
    }
    setSelectedElementIds([id]);
    setSelectedElementType(typeForId(id));
    setActivityPanelOpenState(false);
  }, []);

  const toggleElementSelection = useCallback((id: string) => {
    setSelectedElementIds(prev => {
      const already = prev.includes(id);
      const next = already ? prev.filter(x => x !== id) : [...prev, id];
      // Update type: only set when exactly one element remains
      if (next.length === 1) {
        setSelectedElementType(typeForId(next[0]));
      } else {
        setSelectedElementType(null);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElementIds([]);
    setSelectedElementType(null);
  }, []);

  const setSelection = useCallback((ids: string[]) => {
    setSelectedElementIds(ids);
    if (ids.length === 1) {
      setSelectedElementType(typeForId(ids[0]));
    } else {
      setSelectedElementType(null);
    }
  }, []);

  /** Legacy: set a single selection with an explicit known type (used by LeftPane). */
  const setSelectedElement = useCallback((id: string | null, type: string | null) => {
    if (!id) {
      setSelectedElementIds([]);
      setSelectedElementType(null);
    } else {
      setSelectedElementIds([id]);
      setSelectedElementType(type);
    }
  }, []);

  // ── UI actions ─────────────────────────────────────────────────
  const setActivePanel = useCallback((panel: LeftRailItem | null) => {
    setActivePanelState(prev => (prev === panel ? null : panel));
    setActiveInsertItemState(null);
  }, []);

  const setActiveInsertItem = useCallback((item: InsertMenuItem | null) => {
    setActiveInsertItemState(item);
  }, []);

  const setIsPreviewMode = useCallback((v: boolean) => setIsPreviewModeState(v), []);
  const setIsTimelineVisible = useCallback((v: boolean) => setIsTimelineVisibleState(v), []);
  const setIsTimelineExpanded = useCallback((v: boolean) => setIsTimelineExpandedState(v), []);
  const setActivePageId = useCallback((id: string) => setActivePageIdState(id), []);
  const setRightPanelForcedOpen = useCallback((v: boolean) => setRightPanelForcedOpenState(v), []);
  const setActivityPanelOpen = useCallback((v: boolean) => setActivityPanelOpenState(v), []);
  const setActivityPanelTab  = useCallback((tab: 'eventLog' | 'comments') => setActivityPanelTabState(tab), []);

  const triggerImagesVideoMenu = useCallback(
    () => setImagesVideoMenuTrigger(prev => prev + 1),
    [],
  );

  const setLayerVisibility = useCallback((id: string, visible: boolean) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible } : l));
  }, []);

  const setLayerLocked = useCallback((id: string, locked: boolean) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, locked } : l));
  }, []);

  const setLayerName = useCallback((id: string, name: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, name } : l));
  }, []);

  const setTextProp = useCallback((key: keyof TextProperties, value: TextProperties[keyof TextProperties]) => {
    setTextPropsState(prev => ({ ...prev, [key]: value }));
  }, []);

  const setCanvasOffset = useCallback((
    offset: { x: number; y: number } |
    ((prev: { x: number; y: number } | null) => { x: number; y: number })
  ) => {
    setCanvasOffsetState(prev =>
      typeof offset === 'function' ? offset(prev) : offset
    );
  }, []);

  const setCanvasScale = useCallback((updater: number | ((prev: number) => number)) => {
    setCanvasScaleState(prev => typeof updater === 'function' ? updater(prev) : updater);
  }, []);

  const setCanvasDimensions = useCallback((w: number, h: number) => {
    const oldW   = canvasWidthRef.current;
    const oldH   = canvasHeightRef.current;
    const scaleX = oldW > 0 ? w / oldW : 1;
    const scaleY = oldH > 0 ? h / oldH : 1;

    // Scale every element proportionally; background always fills the full canvas
    setCanvasElements(prev => prev.map(el => {
      if (el.placeholderVariant === 'background') {
        return { ...el, x: 0, y: 0, width: w, height: h };
      }
      const isText = (
        el.type === 'text-header' || el.type === 'text-subheader' ||
        el.type === 'text-body'   || el.type === 'text-template'
      );
      return {
        ...el,
        x:      el.x      * scaleX,
        y:      el.y      * scaleY,
        width:  el.width  * scaleX,
        height: el.height * scaleY,
        ...(isText && el.style?.fontSize != null ? {
          style: {
            ...el.style,
            fontSize: Math.round(
              Math.max(6, Math.min(400, el.style.fontSize * Math.min(scaleX, scaleY)))
            ),
          },
        } : {}),
      };
    }));

    setCanvasWidthState(w);
    setCanvasHeightState(h);

    // Immediate fit (will be refined by the double-rAF in handleSave once the panel closes)
    const container = document.querySelector('[data-canvas-container]') as HTMLElement;
    if (!container) return;
    const rect    = container.getBoundingClientRect();
    const PADDING = 60;
    const scale   = Math.min((rect.width - PADDING * 2) / w, (rect.height - PADDING * 2) / h);
    const offsetX = (rect.width  - w * scale) / 2;
    const offsetY = (rect.height - h * scale) / 2;
    setCanvasScaleState(scale);
    setCanvasOffsetState({ x: offsetX, y: offsetY });
  }, []);

  /** V66: Fit canvas to screen — reads container dimensions from DOM */
  const fitCanvasToScreen = useCallback(() => {
    const container = document.querySelector('[data-canvas-container]') as HTMLElement;
    if (!container) return;
    const rect    = container.getBoundingClientRect();
    const CW      = canvasWidthRef.current;
    const CH      = canvasHeightRef.current;
    const PADDING = 60;
    const scaleX  = (rect.width  - PADDING * 2) / CW;
    const scaleY  = (rect.height - PADDING * 2) / CH;
    const scale   = Math.min(scaleX, scaleY);
    const offsetX = (rect.width  - CW * scale) / 2;
    const offsetY = (rect.height - CH * scale) / 2;
    setCanvasScaleState(scale);
    setCanvasOffsetState({ x: offsetX, y: offsetY });
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  // V59: Set/clear the group highlighted as a drag drop target
  const setDragTargetGroupId = useCallback((id: string | null) => {
    setDragTargetGroupIdState(id);
  }, []);

  const value: DesignWorkspaceState = {
    activePanel, activeInsertItem,
    selectedElementIds, selectedElementType,
    rightPanelForcedOpen,
    activityPanelOpen, activityPanelTab,
    isPreviewMode, isTimelineVisible, isTimelineExpanded,
    canvasPages, activePageId,
    layers,
    templateName: 'APR Square Banner 600 x 600px',
    canvasElements,
    textProps,
    canvasOffset, canvasScale,
    canvasWidth, canvasHeight,
    imagesVideoMenuTrigger,
    editingGroupId,
    editingTextId,
    history,
    future,
    dragTargetGroupId,
    insertElement, updateElement, updateGroupWithChildren, deleteElement, reorderElement,
    groupElements, ungroupElements,
    renameElement,
    insertGroupWithChildren,
    commitHistory,
    undo,
    redo,
    enterGroup, exitGroup,
    enterGroupAndSelectChild,
    selectElement, toggleElementSelection, clearSelection, setSelection,
    setSelectedElement,
    setActivePanel, setActiveInsertItem,
    setIsPreviewMode, setIsTimelineVisible, setIsTimelineExpanded,
    setActivePageId, setLayerVisibility, setLayerLocked, setLayerName,
    setTextProp, setCanvasOffset, setCanvasScale, setCanvasDimensions, fitCanvasToScreen, setRightPanelForcedOpen,
    setActivityPanelOpen, setActivityPanelTab,
    triggerImagesVideoMenu,
    insertElementSilent,
    insertGroupWithChildrenSilent,
    reparentElement,
    startTextEdit,
    commitTextEdit,
    cancelTextEdit,
    settings,
    updateSettings,
    setDragTargetGroupId,
  };

  return (
    <DesignWorkspaceContext.Provider value={value}>
      {props.children}
    </DesignWorkspaceContext.Provider>
  );
}

export function useDesignWorkspace(): DesignWorkspaceState {
  return useContext(DesignWorkspaceContext);
}