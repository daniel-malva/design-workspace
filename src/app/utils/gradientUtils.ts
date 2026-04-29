import type { LinearGradient } from '../types/gradient';

/** Converts a LinearGradient to a valid CSS `linear-gradient(...)` string. */
export function buildGradientCSS(gradient: LinearGradient): string {
  const stops = [...gradient.stops]
    .sort((a, b) => a.position - b.position)
    .map(stop => {
      const hex = stop.color.startsWith('#') ? stop.color : `#${stop.color}`;
      const r   = parseInt(hex.slice(1, 3), 16) || 0;
      const g   = parseInt(hex.slice(3, 5), 16) || 0;
      const b   = parseInt(hex.slice(5, 7), 16) || 0;
      const a   = stop.opacity / 100;
      return `rgba(${r},${g},${b},${a}) ${stop.position}%`;
    })
    .join(', ');

  return `linear-gradient(${gradient.angle}deg, ${stops})`;
}

/**
 * Interpolates the gradient colour at a given position (0–100)
 * by linearly blending the two surrounding stops in RGB space.
 */
export function interpolateGradientColor(
  gradient: LinearGradient,
  position: number,
): string {
  const sorted = [...gradient.stops].sort((a, b) => a.position - b.position);
  const before = sorted.filter(s => s.position <= position).pop() ?? sorted[0];
  const after  = sorted.find(s => s.position >= position) ?? sorted[sorted.length - 1];

  if (before.id === after.id) return before.color;

  const t    = (position - before.position) / (after.position - before.position);
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);

  const r1 = parseInt(before.color.slice(1, 3), 16);
  const g1 = parseInt(before.color.slice(3, 5), 16);
  const b1 = parseInt(before.color.slice(5, 7), 16);
  const r2 = parseInt(after.color.slice(1, 3),  16);
  const g2 = parseInt(after.color.slice(3, 5),  16);
  const b2 = parseInt(after.color.slice(5, 7),  16);

  return `#${[lerp(r1, r2), lerp(g1, g2), lerp(b1, b2)]
    .map(v => v.toString(16).padStart(2, '0'))
    .join('')}`;
}
