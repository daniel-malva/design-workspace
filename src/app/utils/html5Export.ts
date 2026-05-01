import { zipSync, strToU8 } from 'fflate';
import type { CanvasElement } from '../store/useDesignWorkspaceStore';

// ── Placeholder config — mirrors CanvasFrame.tsx PLACEHOLDER_CFG ───

const PLACEHOLDER_CFG: Record<string, { color: string; label: string; shortLabel: string }> = {
  logo:               { color: '#7b1fa2', label: 'Logo',             shortLabel: 'Logo'       },
  background:         { color: '#4caf50', label: 'Background',       shortLabel: 'Background' },
  jellybean:          { color: '#3949ab', label: 'Jellybean',        shortLabel: 'Jellybean'  },
  media:              { color: '#0277bd', label: 'Media',            shortLabel: 'Media'      },
  audio:              { color: '#ff7043', label: 'Audio',            shortLabel: 'Audio'      },
  product:            { color: '#3949ab', label: 'Product',          shortLabel: 'Product'    },
  image:              { color: '#0277bd', label: 'Image',            shortLabel: 'Image'      },
  'background-image': { color: '#4caf50', label: 'Background Image', shortLabel: 'Background' },
  'background-video': { color: '#4caf50', label: 'Background Video', shortLabel: 'Bg. Video'  },
  'primary-logo':     { color: '#7b1fa2', label: 'Primary Logo',     shortLabel: 'Primary'    },
  'secondary-logo':   { color: '#c62828', label: 'Secondary Logo',   shortLabel: 'Secondary'  },
  'event-logo':       { color: '#1565c0', label: 'Event Logo',       shortLabel: 'Event'      },
};

// ── Helpers ────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const VAR_PATTERN = /\{([^{}]+)\}/g;

function extractVarKeys(content: string): string[] {
  const keys: string[] = [];
  const matches = [...content.matchAll(VAR_PATTERN)];
  matches.forEach(m => { const k = m[1].trim(); if (k && !keys.includes(k)) keys.push(k); });
  return keys;
}

// ── Placeholder HTML — matches CanvasFrame.tsx exactly ─────────────

function placeholderVariantKey(el: CanvasElement): string {
  // el.placeholderVariant is the canonical key (e.g. 'product', 'background-image')
  // Fall back to stripping the 'placeholder-' prefix from el.type
  return el.placeholderVariant ?? el.type.replace('placeholder-', '');
}

function buildPlaceholderHtml(el: CanvasElement): string {
  const variant  = placeholderVariantKey(el);
  const cfg      = PLACEHOLDER_CFG[variant] ?? PLACEHOLDER_CFG['media'];
  const isBg     = variant === 'background' || variant === 'background-image' || variant === 'background-video';
  const radius   = isBg ? 0 : 4;
  const minDim   = Math.min(el.width, el.height);
  const opacity  = el.style?.opacity !== undefined ? el.style.opacity : 1;

  const labelTier: 'large' | 'compact' | 'none' =
    minDim >= 200 ? 'large' : minDim >= 50 ? 'compact' : 'none';

  // SVG dashed border (mirrors PlaceholderDashedBorder)
  const sw = 3;
  const svgBorder = `<svg aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible">
      <rect x="${sw / 2}" y="${sw / 2}" width="calc(100% - ${sw}px)" height="calc(100% - ${sw}px)"
        fill="none" stroke="${cfg.color}" stroke-width="${sw}" stroke-dasharray="12 10"
        rx="${radius}" ry="${radius}"/>
    </svg>`;

  // Badge label
  let badge = '';
  if (labelTier !== 'none') {
    const text   = labelTier === 'large' ? cfg.label : cfg.shortLabel;
    const fSize  = labelTier === 'large' ? 14 : 12;
    const fWeight = labelTier === 'large' ? 500 : 400;
    const pad    = labelTier === 'large' ? 'padding:8px 6px' : 'padding:4px';
    const lh     = labelTier === 'large' ? '1.3' : '12px';
    badge = `<span style="position:relative;color:#fff;background-color:${cfg.color};font-size:${fSize}px;font-family:'Roboto',sans-serif;font-weight:${fWeight};line-height:${lh};${pad};border-radius:4px;white-space:nowrap;letter-spacing:0.15px;overflow:hidden;max-height:35px">${esc(text)}</span>`;
  }

  // Data attributes for feed connectivity
  const name   = esc(el.name ?? el.type);
  const dataAttrs = [
    `data-dw-id="${esc(el.id)}"`,
    `data-dw-type="${esc(el.type)}"`,
    `data-dw-name="${name}"`,
    `data-dw-placeholder="${esc(variant)}"`,
  ].join(' ');

  const outerStyle = [
    'position:absolute',
    `left:${el.x}px`,
    `top:${el.y}px`,
    `width:${el.width}px`,
    `height:${el.height}px`,
    `opacity:${opacity}`,
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'overflow:hidden',
    `border-radius:${radius}px`,
    'background-color:rgba(17,16,20,0.04)',
  ].join(';');

  return `<div style="${outerStyle}" ${dataAttrs}>\n    ${svgBorder}\n    ${badge}\n  </div>`;
}

// ── Text HTML ──────────────────────────────────────────────────────

function buildTextHtml(el: CanvasElement): string {
  const s       = el.style ?? {};
  const opacity = s.opacity !== undefined ? s.opacity : 1;
  const content = el.content ?? '';
  const varKeys = extractVarKeys(content);

  const dataAttrs = [
    `data-dw-id="${esc(el.id)}"`,
    `data-dw-type="${esc(el.type)}"`,
    `data-dw-name="${esc(el.name ?? el.type)}"`,
    ...(varKeys.length > 0 ? [`data-dw-vars="${esc(JSON.stringify(varKeys))}"`] : []),
  ].join(' ');

  const css = [
    'position:absolute',
    `left:${el.x}px`,
    `top:${el.y}px`,
    `width:${el.width}px`,
    `height:${el.height}px`,
    `opacity:${opacity}`,
    `font-size:${s.fontSize ?? 16}px`,
    `font-weight:${s.fontWeight ?? '400'}`,
    `font-family:${s.fontFamily ? `'${s.fontFamily}',` : ''}sans-serif`,
    `color:${s.color ?? '#111111'}`,
    'line-height:1.2',
    'white-space:pre-wrap',
    'word-break:break-word',
    'overflow:hidden',
  ].join(';');

  return `<div style="${css}" ${dataAttrs}>${esc(content)}</div>`;
}

// ── Shape HTML ─────────────────────────────────────────────────────

function buildShapeHtml(el: CanvasElement): string {
  const s      = el.style ?? {};
  const bg     = s.backgroundImage ?? s.backgroundColor ?? '#D0D0D0';
  const radius = el.shapeVariant === 'circle' ? '50%' : '0';
  const opacity = s.opacity !== undefined ? s.opacity : 1;

  const dataAttrs = `data-dw-id="${esc(el.id)}" data-dw-type="shape" data-dw-name="${esc(el.name ?? 'Shape')}"`;

  const css = [
    'position:absolute',
    `left:${el.x}px`,
    `top:${el.y}px`,
    `width:${el.width}px`,
    `height:${el.height}px`,
    `opacity:${opacity}`,
    `background:${bg}`,
    `border-radius:${radius}`,
  ].join(';');

  return `<div style="${css}" ${dataAttrs}></div>`;
}

// ── Line HTML ──────────────────────────────────────────────────────

function buildLineHtml(el: CanvasElement): string {
  const s      = el.style ?? {};
  const opacity = s.opacity !== undefined ? s.opacity : 1;
  const dataAttrs = `data-dw-id="${esc(el.id)}" data-dw-type="line" data-dw-name="${esc(el.name ?? 'Line')}"`;

  const css = [
    'position:absolute',
    `left:${el.x}px`,
    `top:${el.y}px`,
    `width:${el.width}px`,
    `height:${el.height}px`,
    `opacity:${opacity}`,
    `background-color:${s.color ?? '#111111'}`,
  ].join(';');

  return `<div style="${css}" ${dataAttrs}></div>`;
}

// ── Icon HTML ──────────────────────────────────────────────────────

function buildIconHtml(el: CanvasElement): string {
  if (!el.iconSrc) return '';
  const opacity = el.style?.opacity !== undefined ? el.style.opacity : 1;
  const dataAttrs = `data-dw-id="${esc(el.id)}" data-dw-type="icon" data-dw-name="${esc(el.name ?? 'Icon')}"`;

  const css = [
    'position:absolute',
    `left:${el.x}px`,
    `top:${el.y}px`,
    `width:${el.width}px`,
    `height:${el.height}px`,
    `opacity:${opacity}`,
    'object-fit:contain',
  ].join(';');

  return `<img src="${esc(el.iconSrc)}" alt="" style="${css}" ${dataAttrs} />`;
}

// ── Element router ─────────────────────────────────────────────────

function elementToHtml(el: CanvasElement): string {
  if (el.type === 'group') return '';
  if (el.type.startsWith('text-'))        return buildTextHtml(el);
  if (el.type === 'shape')                return buildShapeHtml(el);
  if (el.type === 'line')                 return buildLineHtml(el);
  if (el.type === 'icon')                 return buildIconHtml(el);
  if (el.type.startsWith('placeholder-')) return buildPlaceholderHtml(el);
  return '';
}

// ── Shared CSS block ───────────────────────────────────────────────

const SHARED_CSS = `
  /* Reset */
  *{margin:0;padding:0;box-sizing:border-box}
  body{overflow:hidden;background:#fff}
  #ad{position:relative;overflow:hidden;background:#fff}

  /*
   * Design Workspace — HTML5 Ad Export
   *
   * Feed connectivity attributes added to every element:
   *   data-dw-id         — unique element ID from the template
   *   data-dw-type       — element type (text-header, placeholder-product, shape, …)
   *   data-dw-name       — editable layer name
   *
   * On placeholder elements (data-dw-placeholder):
   *   data-dw-placeholder — slot key: "product" | "image" | "background-image" |
   *                          "background-video" | "primary-logo" | "secondary-logo" |
   *                          "event-logo" | "logo" | "background" | "jellybean" | "media"
   *
   *   To swap a placeholder for a real asset at runtime:
   *     const el = document.querySelector('[data-dw-placeholder="product"]');
   *     el.style.backgroundImage = 'url(https://…)';
   *     el.style.backgroundSize  = 'cover';
   *     el.innerHTML = '';          // remove badge / dashed border
   *
   * On text elements with {variables} (data-dw-vars):
   *   data-dw-vars — JSON array of variable keys, e.g. ["Year","Make","Model"]
   *
   *   To inject values at runtime:
   *     document.querySelectorAll('[data-dw-vars]').forEach(el => {
   *       const keys = JSON.parse(el.dataset.dwVars);
   *       let text = el.textContent;
   *       keys.forEach(k => { text = text.replaceAll('{' + k + '}', feed[k] ?? ''); });
   *       el.textContent = text;
   *     });
   */
`.trim();

// ── Full HTML document ─────────────────────────────────────────────

export function buildHtml5Ad(
  elements: CanvasElement[],
  canvasWidth: number,
  canvasHeight: number,
  title = 'Ad',
): string {
  const body = elements
    .filter(el => el.type !== 'group')
    .map(elementToHtml)
    .filter(Boolean)
    .join('\n  ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="ad.size" content="width=${canvasWidth},height=${canvasHeight}">
  <title>${esc(title)}</title>
  <style>
    ${SHARED_CSS}
    body{width:${canvasWidth}px;height:${canvasHeight}px}
    #ad{width:${canvasWidth}px;height:${canvasHeight}px}
  </style>
</head>
<body>
  <div id="ad">
  ${body}
  </div>
</body>
</html>`;
}

// ── Download helpers ───────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSingleHtml5(
  elements: CanvasElement[],
  canvasWidth: number,
  canvasHeight: number,
  filename = 'ad.html',
) {
  const html = buildHtml5Ad(elements, canvasWidth, canvasHeight, filename.replace(/\.html$/, ''));
  triggerDownload(new Blob([html], { type: 'text/html' }), filename);
}

export interface VariantExport {
  name:     string;
  elements: CanvasElement[];
}

export function downloadHtml5Zip(
  variants: VariantExport[],
  canvasWidth: number,
  canvasHeight: number,
  zipFilename = 'ads.zip',
) {
  const files: Record<string, Uint8Array> = {};
  variants.forEach(({ name, elements }) => {
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    files[`${safeName}.html`] = strToU8(buildHtml5Ad(elements, canvasWidth, canvasHeight, name));
  });
  triggerDownload(
    new Blob([zipSync(files)], { type: 'application/zip' }),
    zipFilename,
  );
}
