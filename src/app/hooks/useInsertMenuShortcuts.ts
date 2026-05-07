import { useEffect, useRef } from 'react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import type { InsertMenuItem } from '../store/useDesignWorkspaceStore';

// ── Single-key shortcuts ──────────────────────────────────────────

const KEY_MAP: Record<string, InsertMenuItem> = {
  t: 'text',
  m: 'dynamicPlaceholder',
  u: 'imagesVideo',
  p: 'component',   // was 'c' — changed to avoid conflict with comment mode (C)
  a: 'annotation',
  h: 'shapes',
  i: 'icons',
};

// ── Shift + key shortcuts ─────────────────────────────────────────

const SHIFT_KEY_MAP: Record<string, InsertMenuItem> = {
  a: 'audio', // Shift + A
};

// ─────────────────────────────────────────────────────────────────
// Hook — mounted once in DesignWorkspaceLayout, listens globally
// ─────────────────────────────────────────────────────────────────

export function useInsertMenuShortcuts() {
  const {
    activePanel,
    activeInsertItem,
    setActivePanel,
    setActiveInsertItem,
    triggerImagesVideoMenu,
  } = useDesignWorkspace();

  // Refs keep the keydown handler from going stale while the effect
  // itself stays registered only once (stable setter deps).
  const activePanelRef       = useRef(activePanel);
  const activeInsertItemRef  = useRef(activeInsertItem);

  useEffect(() => { activePanelRef.current = activePanel; },      [activePanel]);
  useEffect(() => { activeInsertItemRef.current = activeInsertItem; }, [activeInsertItem]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {

      // ── Skip if focus is inside a text field ─────────────────────
      const tag        = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isEditable = (e.target as HTMLElement)?.isContentEditable;
      if (tag === 'input' || tag === 'textarea' || isEditable) return;

      // ── Escape — close sub-panel or collapse the Insert pane ─────
      if (e.key === 'Escape') {
        if (activePanelRef.current !== 'insert') return; // nothing to escape

        if (activeInsertItemRef.current !== null) {
          e.preventDefault();
          setActiveInsertItem(null);   // back to level-1 list
          return;
        }

        e.preventDefault();
        setActivePanel(null);          // collapse Insert pane entirely
        return;
      }

      // ── Skip ctrl / meta / alt combos (Cmd+V stays as native paste) ─
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();

      // ── Shift + key ───────────────────────────────────────────────
      if (e.shiftKey) {
        const item = SHIFT_KEY_MAP[key];
        if (item) {
          e.preventDefault();
          // Force-open Insert pane without toggling if already open
          if (activePanelRef.current !== 'insert') setActivePanel('insert');
          setActiveInsertItem(item);
        }
        return; // always return after checking shift combos
      }

      // ── Simple key ───────────────────────────────────────────────
      const item = KEY_MAP[key];
      if (!item) return;

      e.preventDefault();

      // Ensure the Insert pane is visible without toggling it closed
      if (activePanelRef.current !== 'insert') setActivePanel('insert');

      // Images / Video — stays at level-1 and opens the overflow menu
      if (item === 'imagesVideo') {
        setActiveInsertItem(null);   // remain at level-1 list
        triggerImagesVideoMenu();    // signal InsertMenuPanel to open the popover
        return;
      }

      // All other items — navigate directly to the sub-panel
      setActiveInsertItem(item);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);

    // setActivePanel, setActiveInsertItem, triggerImagesVideoMenu are all
    // stable useCallback refs — the effect runs once on mount.
  }, [setActivePanel, setActiveInsertItem, triggerImagesVideoMenu]);
}
