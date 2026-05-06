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
  // Current types (audio excluded — it lives only in timeline, handled separately)
  'placeholder-product',
  'placeholder-image',
  'placeholder-background-image',
  'placeholder-background-video',
  'placeholder-primary-logo',
  'placeholder-secondary-logo',
  'placeholder-event-logo',
  // Legacy types
  'placeholder-logo',
  'placeholder-background',
  'placeholder-jellybean',
  'placeholder-media',
];

const PLACEHOLDER_BADGE_COLORS: Partial<Record<CanvasElementType, string>> = {
  // Current
  'placeholder-product':          '#3949ab',
  'placeholder-image':            '#0277bd',
  'placeholder-background-image': '#4caf50',
  'placeholder-background-video': '#4caf50',
  'placeholder-primary-logo':     '#7b1fa2',
  'placeholder-secondary-logo':   '#c62828',
  'placeholder-event-logo':       '#1565c0',
  'placeholder-audio':            '#ff7043',
  // Legacy
  'placeholder-logo':             '#7b1fa2',
  'placeholder-background':       '#4caf50',
  'placeholder-jellybean':        '#3949ab',
  'placeholder-media':            '#0277bd',
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
  const { canvasElements, masterElements, audioPlaceholderInTimeline } = useDesignWorkspace();

  // Always scan the master template for variables — not the current canvas view.
  // When on a variant, canvasElements contains substituted values (e.g. "2026" not "{Year}"),
  // which would make textVariables empty and trigger a cleanup→regenerate loop.
  const sourceElements = masterElements.length > 0 ? masterElements : canvasElements;

  // ── Text variables ─────────────────────────────────────────────
  const textVariables = useMemo<TextVariable[]>(() => {
    const seen = new Map<string, string>(); // key → label

    sourceElements
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
  }, [sourceElements]);

  // ── Media variables ────────────────────────────────────────────
  const mediaVariables = useMemo<MediaVariable[]>(() => {
    const fromCanvas = sourceElements
      .filter(el => MEDIA_TYPES.includes(el.type))
      .map(el => ({
        id:         el.id,
        name:       el.name ?? defaultLayerName(el.type),
        type:       el.type,
        variant:    el.placeholderVariant ?? el.type.replace(/^placeholder-/, ''),
        badgeColor: PLACEHOLDER_BADGE_COLORS[el.type] ?? '#6B7280',
      }));

    // Audio lives only in the timeline (never in canvasElements); synthesise the entry
    if (audioPlaceholderInTimeline) {
      fromCanvas.push({
        id:         'audio-placeholder',
        name:       'Audio Placeholder',
        type:       'placeholder-audio',
        variant:    'audio',
        badgeColor: '#ff7043',
      });
    }

    return fromCanvas;
  }, [sourceElements, audioPlaceholderInTimeline]);

  const hasAnyVariable = textVariables.length > 0 || mediaVariables.length > 0;

  return { textVariables, mediaVariables, hasAnyVariable };
}
