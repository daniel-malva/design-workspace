import { useMemo } from 'react';
import { useDesignWorkspace, defaultLayerName } from '../store/useDesignWorkspaceStore';
import type { CanvasElementType } from '../store/useDesignWorkspaceStore';

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

export interface TextVariable {
  key:   string;   // variable name — e.g. "year", "make", "model"
  label: string;   // display label — same as key by default
}

export interface MediaVariable {
  id:         string;
  name:       string;   // editable layer name — reactive to LayersPanel renames
  type:       string;
  variant:    string;
  badgeColor: string;
}

// ══════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════

const TEXT_TYPES: CanvasElementType[] = [
  'text-header', 'text-subheader', 'text-body', 'text-template',
];

const MEDIA_TYPES: CanvasElementType[] = [
  'placeholder-logo',
  'placeholder-background',
  'placeholder-jellybean',
  'placeholder-media',
  // NOTE: placeholder-audio is intentionally excluded
];

const PLACEHOLDER_BADGE_COLORS: Partial<Record<CanvasElementType, string>> = {
  'placeholder-logo':       '#7B2FFF',
  'placeholder-background': '#22C55E',
  'placeholder-jellybean':  '#3B82F6',
  'placeholder-media':      '#3B82F6',
};

// Regex: matches {variableName} but not {{nested}}
const VAR_PATTERN = /\{([^{}]+)\}/g;

// ══════════════════════════════════════════════════════════════════
// HOOK
// ══════════════════════════════════════════════════════════════════

/**
 * Derives text variables and media variables directly from canvasElements.
 * Fully reactive — re-computes whenever the canvas changes.
 *
 * Text variables: extracted from {curly bracket} patterns in text element content.
 *   - Case-sensitive: {Year} ≠ {year}
 *   - Deduplicated: same key across multiple elements → single field
 *   - Trims internal whitespace: { year } → key "year"
 *   - Excludes nested: {{nested}} → not extracted
 *   - Excludes placeholder-audio from media
 *
 * Media variables: each Dynamic Placeholder element (logo, background,
 *   jellybean, media) becomes one entry. Name is the live editable layer name.
 */
export function useConfigureVariables() {
  const { canvasElements } = useDesignWorkspace();

  // ── Text variables ─────────────────────────────────────────────
  const textVariables = useMemo<TextVariable[]>(() => {
    const seen = new Map<string, string>(); // key → label

    canvasElements
      .filter(el => TEXT_TYPES.includes(el.type) && el.content?.includes('{'))
      .forEach(el => {
        const content = el.content ?? '';
        const matches = [...content.matchAll(VAR_PATTERN)];
        matches.forEach(match => {
          const key = match[1].trim();
          if (key && !seen.has(key)) {
            seen.set(key, key); // label = key by default
          }
        });
      });

    return Array.from(seen.entries()).map(([key, label]) => ({ key, label }));
  }, [canvasElements]);

  // ── Media variables ────────────────────────────────────────────
  const mediaVariables = useMemo<MediaVariable[]>(() => {
    return canvasElements
      .filter(el => MEDIA_TYPES.includes(el.type))
      .map(el => ({
        id:         el.id,
        name:       el.name ?? defaultLayerName(el.type),
        type:       el.type,
        variant:    el.placeholderVariant ?? '',
        badgeColor: PLACEHOLDER_BADGE_COLORS[el.type] ?? '#6B7280',
      }));
  }, [canvasElements]);

  const hasAnyVariable = textVariables.length > 0 || mediaVariables.length > 0;

  return { textVariables, mediaVariables, hasAnyVariable };
}
