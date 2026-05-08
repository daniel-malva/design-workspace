// ── Centralized type re-exports ───────────────────────────────────────

export type {
  LeftRailItem,
  CanvasElementType,
  InsertableElement,
  InsertMenuItem,
  ElementStyle,
  CanvasElement,
  Layer,
  CanvasPage,
  CommentReply,
  CanvasComment,
  TextProperties,
  DesignWorkspaceState,
  FeedState,
  FeedVariant,
  Settings,
  HistorySnapshot,
  ChildSnapshot,
} from '../store/useDesignWorkspaceStore';

export type {
  TextVariable,
  MediaVariable,
} from '../hooks/useConfigureVariables';

export type {
  GradientStop,
  LinearGradient,
} from './gradient';
