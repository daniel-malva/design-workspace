import { useState, useEffect, useCallback } from 'react';

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

export interface CurrentUser {
  name:     string;
  initials: string;
  color:    string;
}

// ══════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'dw_current_user';

// Palette of avatar colors — deterministically assigned from name hash
const PALETTE = [
  '#7BB3E0', // blue
  '#E8A598', // coral
  '#6EC4A7', // teal
  '#9B8EC4', // purple
  '#F4A261', // orange
  '#E76F51', // red-orange
  '#2A9D8F', // green-teal
  '#E9C46A', // gold
  '#4A90D9', // sky blue
  '#A8DADC', // light teal
  '#457B9D', // steel blue
  '#E63946', // red
];

const CUSTOM_EVENT = 'dw_user_changed';

// ══════════════════════════════════════════════════════════════════
// HELPERS (pure, no React)
// ══════════════════════════════════════════════════════════════════

function nameHash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h) + name.charCodeAt(i);
    h |= 0; // convert to 32-bit int
  }
  return Math.abs(h);
}

function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0)  return '??';
  if (words.length === 1)  return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function deriveColor(name: string): string {
  return PALETTE[nameHash(name) % PALETTE.length];
}

function buildUser(name: string): CurrentUser {
  const trimmed = name.trim();
  return {
    name:     trimmed,
    initials: deriveInitials(trimmed),
    color:    deriveColor(trimmed),
  };
}

function loadUserFromStorage(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { name?: string };
    if (typeof data.name === 'string' && data.name.trim()) {
      return buildUser(data.name);
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════
// PUBLIC UTILITIES (non-hook, safe to call anywhere)
// ══════════════════════════════════════════════════════════════════

/**
 * Returns the current user from localStorage.
 * Falls back to a generic "You" identity if no name is stored.
 * Safe to call outside of React (e.g. in store callbacks).
 */
export function getCurrentUser(): CurrentUser {
  return loadUserFromStorage() ?? { name: 'You', initials: 'YO', color: '#7BB3E0' };
}

/**
 * Persists the user name to localStorage and fires a custom event
 * so all mounted `useCurrentUser` instances update reactively.
 */
export function saveCurrentUser(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: trimmed }));
  window.dispatchEvent(new Event(CUSTOM_EVENT));
}

// ══════════════════════════════════════════════════════════════════
// HOOK
// ══════════════════════════════════════════════════════════════════

/**
 * Reactive hook for the current user identity.
 *
 * - `user`       — { name, initials, color }
 * - `needsSetup` — true when no name is stored yet (show the setup prompt)
 * - `setName`    — persist a new name; updates all consumers immediately
 */
export function useCurrentUser() {
  const [user, setUser]           = useState<CurrentUser>(() => getCurrentUser());
  const [needsSetup, setNeedsSetup] = useState<boolean>(() => !loadUserFromStorage());

  useEffect(() => {
    function onChanged() {
      const u = loadUserFromStorage();
      if (u) {
        setUser(u);
        setNeedsSetup(false);
      }
    }
    window.addEventListener(CUSTOM_EVENT, onChanged);
    window.addEventListener('storage', onChanged); // cross-tab sync
    return () => {
      window.removeEventListener(CUSTOM_EVENT, onChanged);
      window.removeEventListener('storage', onChanged);
    };
  }, []);

  const setName = useCallback((name: string) => {
    saveCurrentUser(name);
    setUser(buildUser(name));
    setNeedsSetup(false);
  }, []);

  return { user, needsSetup, setName };
}
