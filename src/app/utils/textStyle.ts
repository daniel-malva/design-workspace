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
 * Measures the pixel height a string occupies when constrained to `width` px
 * and allowed to wrap. Mirrors the exact CSS the canvas applies to text
 * elements (pre-wrap, break-word). Used during resize to auto-adjust height.
 */
export function measureTextHeight(
  content: string,
  width: number,
  style: {
    fontSize?:     number;
    fontWeight?:   string;
    fontFamily?:   string;
    letterSpacing?: number;
    lineHeight?:   number;
    textTransform?: string;
    fontStyle?:    string;
  },
): number {
  const el = document.createElement('div');
  el.style.cssText = [
    'position:absolute',
    'visibility:hidden',
    'pointer-events:none',
    `width:${width}px`,
    'white-space:pre-wrap',
    'word-break:break-word',
    `font-size:${style.fontSize ?? 14}px`,
    `font-weight:${fontWeightToCss(style.fontWeight)}`,
    `font-family:${style.fontFamily ?? "'Roboto', sans-serif"}`,
    `letter-spacing:${style.letterSpacing != null ? `${style.letterSpacing}px` : 'normal'}`,
    `line-height:${style.lineHeight ?? 1.2}`,
    `text-transform:${style.textTransform ?? 'none'}`,
    `font-style:${style.fontStyle ?? 'normal'}`,
  ].join(';');
  el.textContent = content;
  document.body.appendChild(el);
  const h = el.getBoundingClientRect().height;
  document.body.removeChild(el);
  return Math.ceil(h);
}

/**
 * Measures the pixel width a string occupies on a single line with the given
 * typographic styles. Uses a temporarily-appended hidden DOM span so the
 * browser uses the real font metrics (including custom/loaded fonts).
 *
 * Returns width in CSS pixels, rounded up, plus a small 2 px breathing room.
 */
export function measureTextWidth(
  text: string,
  style: {
    fontSize?:     number;
    fontWeight?:   string;
    fontFamily?:   string;
    letterSpacing?: number;
    textTransform?: string;
    fontStyle?:    string;
  },
): number {
  const el = document.createElement('span');
  el.style.cssText = [
    'position:absolute',
    'visibility:hidden',
    'white-space:nowrap',
    'pointer-events:none',
    `font-size:${style.fontSize ?? 14}px`,
    `font-weight:${fontWeightToCss(style.fontWeight)}`,
    `font-family:${style.fontFamily ?? "'Roboto', sans-serif"}`,
    `letter-spacing:${style.letterSpacing != null ? `${style.letterSpacing}px` : 'normal'}`,
    `text-transform:${style.textTransform ?? 'none'}`,
    `font-style:${style.fontStyle ?? 'normal'}`,
  ].join(';');
  el.textContent = text;
  document.body.appendChild(el);
  const w = el.getBoundingClientRect().width;
  document.body.removeChild(el);
  return Math.ceil(w) + 2;
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
