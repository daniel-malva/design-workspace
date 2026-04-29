import { Undo2, Redo2 } from 'lucide-react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';

// ─────────────────────────────────────────────────────────────────────────────
// UndoRedoButtons — V49
//
// Floating pair of Undo / Redo icon buttons mounted in CanvasArea next to the
// BreadcrumbNav.  Reads `history` and `future` from the store to show the
// correct disabled state without any extra props.
//
// Shortcuts (handled by useCanvasKeyboardShortcuts):
//   Cmd/Ctrl + Z         → undo
//   Cmd/Ctrl + Shift + Z → redo
//   Cmd/Ctrl + Y         → redo (Windows)
// ─────────────────────────────────────────────────────────────────────────────

export function UndoRedoButtons() {
  const { history, future, undo, redo } = useDesignWorkspace();

  const canUndo = history.length > 0;
  const canRedo = future.length  > 0;

  const baseBtn =
    'flex items-center justify-center w-5 rounded-md transition-colors';
  const activeBtn   = `${baseBtn} text-[#1f1d25] hover:bg-black/8 cursor-pointer`;
  const disabledBtn = `${baseBtn} text-[#C0C0C0] cursor-not-allowed`;

  return (
    <div className="flex items-center gap-0.5 px-1 py-1.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-[#E2E2E2]">
      <button
        onClick={canUndo ? undo : undefined}
        disabled={!canUndo}
        title={canUndo ? `Undo (⌘Z) · ${history.length} step${history.length !== 1 ? 's' : ''}` : 'Nothing to undo'}
        className={canUndo ? activeBtn : disabledBtn}
      >
        <Undo2 size={14} />
      </button>

      <button
        onClick={canRedo ? redo : undefined}
        disabled={!canRedo}
        title={canRedo ? `Redo (⌘⇧Z) · ${future.length} step${future.length !== 1 ? 's' : ''}` : 'Nothing to redo'}
        className={canRedo ? activeBtn : disabledBtn}
      >
        <Redo2 size={14} />
      </button>
    </div>
  );
}