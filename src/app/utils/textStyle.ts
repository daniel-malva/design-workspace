import type { CanvasElement } from '../store/useDesignWorkspaceStore';

// Human-readable font weight labels → valid CSS font-weight values
const FONT_WEIGHT_CSS: Record<string, string> = {
  Thin:      '100',
  Light:     '300',
  Regular:   '400',
  Medium:    '500',
  SemiBold:  '600',
  Bold:      '700',
  ExtraBold: '800',
  Black:     '900',
};

export function fontWeightToCss(w: string | undefined): string {
  if (!w) return '400';
  return FONT_WEIGHT_CSS[w] ?? w;
}

/**
 * Returns a React.CSSProperties object with all typographic styles for a text
 * element. Used in both view mode (ElementContent) and edit mode (textarea) so
 * the two are always visually identical.
 */
export function buildTextStyle(element: CanvasElement): React.CSSProperties {
  const s = element.style;
  return {
    fontSize:       s?.fontSize        ?? 16,
    fontWeight:     fontWeightToCss(s?.fontWeight),
    color:          s?.color           ?? '#111111',
    fontFamily:     s?.fontFamily      ?? "'Roboto', sans-serif",
    fontStyle:      s?.italic          ? 'italic' : 'normal',
    textDecoration: [
      s?.underline     ? 'underline'    : '',
      s?.strikethrough ? 'line-through' : '',
    ].filter(Boolean).join(' ') || 'none',
    letterSpacing:  s?.letterSpacing !== undefined
      ? `${s.letterSpacing}px` : 'normal',
    lineHeight:     s?.lineHeight      ?? 1.2,
    textAlign:      s?.textAlign       ?? 'left',
    textTransform:  (s?.textTransform  ?? 'none') as React.CSSProperties['textTransform'],
    wordBreak:      'break-word',
    whiteSpace:     'pre-wrap',
  };
}

/**
 * Vertical alignment → flexbox alignItems value.
 * Needed in view mode where the text sits inside a flex container.
 */
export function verticalAlignToFlexAlign(
  align: 'top' | 'middle' | 'bottom' | undefined,
): React.CSSProperties['alignItems'] {
  if (align === 'middle') return 'center';
  if (align === 'bottom') return 'flex-end';
  return 'flex-start';
}
