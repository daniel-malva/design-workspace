// ── Design Workspace brand color tokens ──────────────────────────────
// Use these constants in inline styles. For Tailwind classes, use the
// CSS custom properties added to src/styles/theme.css (--dw-* vars).

export const DW_COLORS = {
  // Accent (purple)
  accent:         '#5B4EFF',
  accentHover:    '#4a3ee0',
  accentDark:     '#473bab',
  accentDarker:   '#3a2f8f',
  accentAlpha04:  'rgba(91,78,255,0.04)',
  accentAlpha07:  'rgba(91,78,255,0.07)',
  accentAlpha08:  'rgba(91,78,255,0.08)',
  accentAlpha12:  'rgba(91,78,255,0.12)',
  accentAlpha20:  'rgba(91,78,255,0.2)',

  // Text
  textPrimary:    '#1f1d25',
  textSecondary:  '#686576',
  textTertiary:   '#9c99a9',
  textDisabled:   '#b5b3bf',
  textDark:       '#111111',
  textMid:        '#6B6B6B',

  // Borders & surfaces
  border:         '#E2E2E2',
  borderLight:    'rgba(0,0,0,0.06)',
  borderFocus:    '#473bab',
  surface:        '#ffffff',
  surfaceLight:   '#f9fafa',
  surfaceMid:     '#f5f5f5',
  surfaceHover:   '#f0f0f0',

  // Canvas
  canvasBg:       '#E8E8E8',

  // Status
  warning:        '#92400e',
  warningBg:      '#fef3c7',

  // Avatars (mock collaborators)
  avatarBlue:     '#7BB3E0',
  avatarCoral:    '#E8A598',
  avatarTeal:     '#6EC4A7',
  avatarPurple:   '#9B8EC4',
} as const;

export type DWColor = typeof DW_COLORS[keyof typeof DW_COLORS];
