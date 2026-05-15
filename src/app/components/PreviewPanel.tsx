import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Info, RotateCcw, RotateCw, SlidersHorizontal,
  ChevronDown, ChevronUp, ArrowLeft, Shuffle, Check,
} from 'lucide-react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import type { CanvasElement } from '../store/useDesignWorkspaceStore';
import { BrandKitSelector } from './BrandKitSelector';

// ─── Locale / currency helpers ────────────────────────────────────────────────
interface CountryLocale {
  locale:    string;
  currency:  string;
  symbol:    string;
  placement: 'before' | 'after';
}

const COUNTRY_LOCALE_MAP: Record<string, CountryLocale> = {
  'USA ($/Miles)':   { locale: 'en-US', currency: 'USD', symbol: '$',   placement: 'before' },
  'Canada (CAD/km)': { locale: 'en-CA', currency: 'CAD', symbol: 'CA$', placement: 'before' },
  'UK (£/Miles)':    { locale: 'en-GB', currency: 'GBP', symbol: '£',   placement: 'before' },
  'Germany (€/km)':  { locale: 'de-DE', currency: 'EUR', symbol: '€',   placement: 'after'  },
  'Brazil (R$/km)':  { locale: 'pt-BR', currency: 'BRL', symbol: 'R$',  placement: 'before' },
};

function getLocaleNumberFormat(locale: string): { decimal: string; thousand: string } {
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(1_234_567.89);
    return {
      decimal:  parts.find(p => p.type === 'decimal')?.value ?? '.',
      thousand: parts.find(p => p.type === 'group')?.value   ?? ',',
    };
  } catch {
    return { decimal: '.', thousand: ',' };
  }
}

/** Returns the auto-derived formatting for the given country + browser locale fallback. */
function resolveAutoFormat(country: string): {
  symbol: string; placement: 'before' | 'after'; decimal: string; thousand: string;
} {
  const countryInfo = COUNTRY_LOCALE_MAP[country];
  const locale      = countryInfo?.locale ?? navigator.language ?? 'en-US';
  const numFmt      = getLocaleNumberFormat(locale);

  // Derive placement via Intl if we have a currency code, otherwise fall back to map/default
  let placement: 'before' | 'after' = countryInfo?.placement ?? 'before';
  let symbol = countryInfo?.symbol ?? '$';
  if (!countryInfo) {
    try {
      // Best-effort: detect from browser locale
      const parts = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' })
        .formatToParts(1);
      const symIdx = parts.findIndex(p => p.type === 'currency');
      const intIdx = parts.findIndex(p => p.type === 'integer');
      symbol    = parts[symIdx]?.value ?? symbol;
      placement = symIdx < intIdx ? 'before' : 'after';
    } catch { /* keep defaults */ }
  }

  return { symbol, placement, decimal: numFmt.decimal, thousand: numFmt.thousand };
}

// ─── Variable detection ───────────────────────────────────────────────────────
const PREVIEW_VAR_RE = /\{([^{}]+)\}/g;

function detectVars(elements: CanvasElement[]): string[] {
  const vars = new Set<string>();
  for (const el of elements) {
    if (!el.content) continue;
    for (const m of el.content.matchAll(PREVIEW_VAR_RE)) {
      if (!m[1].startsWith('http') && !m[1].includes('/')) vars.add(m[1]);
    }
  }
  return [...vars];
}

function detectMediaElements(elements: CanvasElement[]): CanvasElement[] {
  // Include all visual placeholder types (audio excluded — not a visual media)
  return elements.filter(el =>
    el.type.startsWith('placeholder-') && el.type !== 'placeholder-audio',
  );
}

// ─── Mock data pools ──────────────────────────────────────────────────────────
const MOCK_POOLS: Record<string, string[]> = {
  year:       ['2023', '2024', '2025', '2026'],
  make:       ['BMW'],
  model:      ['X5', 'X3', '3 Series', 'M4', 'M3', '5 Series', '7 Series', 'iX', 'X7', 'i4'],
  trim:       ['xDrive40i', 'M Sport', 'Competition', 'sDrive30i', 'xDrive50e', 'M xDrive', 'Pure Excellence'],
  header:     [
    '0% APR Financing for 60 mos. on approved credit.',
    'Lease a new BMW X5 from $699/mo for 36 months.',
    'Experience the Ultimate Driving Machine. Now with special financing.',
    'Save up to $5,000 on select new BMW models.',
    '1.9% APR for 48 months on all 2025 BMW X Series.',
    'Drive home a new BMW today. Offers end the 31st.',
  ],
  subheader:  [
    'See dealer for complete details. Offer expires 12/31/25.',
    'On approved credit. $0 due at signing on select models.',
    'Valid on 2024–2025 new BMW vehicles in stock.',
    'Contact your authorized BMW dealer for full terms.',
  ],
  disclaimer: [
    '36-month lease. 10,000 miles/year. $0 due at signing on approved credit.',
    'Not all buyers will qualify. Residency restrictions may apply.',
    'MSRP $62,100. Acquisition fee included. Taxes & title extra.',
    'Offer valid through 12/31/2025 at participating dealers.',
  ],
  cta:        ['View Offer', 'Shop BMW', 'Get Quote', 'Learn More', 'Schedule a Test Drive', 'Build Yours', 'Find a Dealer'],
  dealerName: [
    'BMW of Manhattan',
    'BMW of Beverly Hills',
    'BMW of Chicago',
    'BMW of South Atlanta',
    'BMW of Houston North',
    'Classic BMW Dallas',
    'Flow BMW of Greensboro',
  ],
  address:    [
    '555 W 57th St, New York, NY 10019',
    '8833 Wilshire Blvd, Beverly Hills, CA 90211',
    '1230 N Halsted St, Chicago, IL 60642',
  ],
  phone:      ['(212) 555-0147', '(310) 555-0193', '(312) 555-0251', '(404) 555-0178'],
  vin:        ['WBA3A9C59EF123456', '3MW39CM08P8D01423', 'WBS83CH09NCK73920', '5UXCR4C07M9F12345', '5UXKR0C51M0J89201'],
  price:      ['$42,995', '$54,500', '$67,200', '$76,995', '$89,400', '$103,500'],
  msrp:       ['$43,500', '$55,100', '$67,900', '$77,800', '$90,200'],
  apr:        ['0%', '0.9%', '1.9%', '2.9%', '3.9%'],
  payment:    ['$499/mo', '$599/mo', '$699/mo', '$799/mo', '$449/mo'],
  leasePayment: ['$499/mo', '$549/mo', '$699/mo', '$399/mo'],
  discount:   ['$3,500', '$5,000', '$2,500', '$4,750', '$6,000'],
  savings:    ['$3,500', '$4,000', '$5,500', '$7,200'],
  miles:      ['10,000', '12,000', '15,000'],
  term:       ['24', '36', '48', '60'],
  months:     ['24', '36', '48', '60', '72'],
  downPayment:['$0', '$2,000', '$3,500', '$4,999'],
  mileage:    ['12,450', '8,230', '23,100', '47,820', '5,000'],
  color:      ['Alpine White', 'Black Sapphire', 'Phytonic Blue', 'Brooklyn Grey', 'Carbon Black'],
  interior:   ['Black Leather', 'Cognac Leather', 'Ivory White', 'Tartufo Merino'],
  engine:     ['3.0L TwinPower Turbo Inline 6', '4.4L M TwinPower Turbo V8', '2.0L TwinPower Turbo Inline 4'],
  horsepower: ['248 hp', '335 hp', '382 hp', '503 hp', '523 hp'],
  mpg:        ['24/31 mpg', '21/28 mpg', '17/23 mpg', '26/33 mpg'],
  tagline:    [
    'The Ultimate Driving Machine.',
    'Sheer Driving Pleasure.',
    'Born to Drive.',
    'Designed for Every Road.',
    'Performance Meets Luxury.',
  ],
  offerTitle: [
    'Special Lease Offer',
    'Exceptional APR Financing',
    'Year-End Sales Event',
    'Exclusive BMW Offer',
    'Limited-Time Savings',
  ],
};

const MEDIA_LABELS: Record<string, string> = {
  // current types
  'placeholder-product':          'Product',
  'placeholder-image':            'Image',
  'placeholder-background-image': 'Background',
  'placeholder-background-video': 'Background Video',
  'placeholder-primary-logo':     'Primary Logo',
  'placeholder-secondary-logo':   'Secondary Logo',
  'placeholder-event-logo':       'Event Logo',
  // legacy
  'placeholder-logo':       'Logo',
  'placeholder-background': 'Background',
  'placeholder-jellybean':  'Product',
  'placeholder-media':      'Media',
};

const THUMB_COLORS = ['#C8D8E8', '#D4E8D4', '#E8D4C8', '#D4C8E8', '#E8E8C8'];

// ─── Random placeholder image pools — automotive / BMW-aligned ───────────────

// Product / jellybean shots — sourced from the Jellybean column of the feed spreadsheet.
// Official OEM PNGs with transparent backgrounds, ideal for product placement on backgrounds.
const PRODUCT_IMGS = [
  'https://automobiles.honda.com/-/media/Honda-Automobiles/Vehicles/2026/civic-sedan/OP-360/R-513_Rallye_Red/Large/Honda_2026_Civic_Sedan_360_Exterior_Rallye_Red_0029.png',
  'https://automobiles.honda.com/-/media/Honda-Automobiles/Vehicles/2026/civic-type-r/OP-360/B-637P_Boost_Blue_Pearl/Large/Honda_2026_Civic_TypeR_360_Exterior_Boost_Blue_Pearl_0029.png',
  'https://automobiles.honda.com/-/media/Honda-Automobiles/Vehicles/2026/accord-sedan/OP-360/NH-904M_Meteorite_Gray_Metallic/Large/Honda_2026_Accord_360_Exterior_Meteorite_Gray_Metallic_0029.png',
  'https://automobiles.honda.com/-/media/Honda-Automobiles/Vehicles/2026/CR-V/OP-360/G-545M_Ash_Green_Metallic/Large/Honda_2026_CRV_360_Exterior_Ash_Green_Metallic_0029.png',
  'https://automobiles.honda.com/-/media/Honda-Automobiles/Vehicles/2027/HR-V/OP-360/NH-904M_Meteorite_Gray_Metallic/Large/Honda_2027_HRV_360_Exterior_Meteorite_Gray_Metallic_0029.png',
  'https://automobiles.honda.com/-/media/Honda-Automobiles/Vehicles/2026/Pilot/OP-360/NH-904M_Meteorite_Gray_Metallic/Large/Honda_2026_Pilot_360_Exterior_Meteorite_Gray_Metallic_0029.png',
  'https://automobiles.honda.com/-/media/Honda-Automobiles/Vehicles/2026/Prologue/OP-360/139P_North_Shore_Pearl/Large/Honda_2026_Prologue_360_Exterior_North_Shore_Pearl_0029.png',
];

// Backgrounds — sourced directly from the feed spreadsheet (Background column).
// These are pre-approved automotive-friendly compositions with open space for product placement.
const BACKGROUND_IMGS = [
  'https://lh3.googleusercontent.com/d/1Dad9cWpDG7IYGzemjujjO-NQWtk8-X2J',
  'https://lh3.googleusercontent.com/d/1En_aeQjy4LoybJpZFcer27zYrutNtnBu',
  'https://lh3.googleusercontent.com/d/1VaCbqRMFO2X6MCfNMg4vJY6fFfB35PaY',
  'https://lh3.googleusercontent.com/d/1-hI8sy7sD3mMzcv91_J-BUNsj-nArAM_',
  'https://lh3.googleusercontent.com/d/1o3nyFmPmH6uF4MzE1NqPxMGkM5tfHFPc',
  'https://lh3.googleusercontent.com/d/1X3MdNoqZK1ryeROEW7UlTKLTCnaxlvK7',
  'https://lh3.googleusercontent.com/d/1jBl9x6w-wzkFAlmJ1GT4ahM1iIud-Mki',
  'https://lh3.googleusercontent.com/d/1k0dnNocm_3AP_4ItFW66k92cVFS2B7Mw',
];

// Automotive brand logos — Wikipedia CDN (transparent PNG / SVG renders)
const LOGO_IMGS = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/240px-BMW.svg.png',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Logo.svg/200px-Mercedes-Logo.svg.png',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Audi-Logo_2016.svg/240px-Audi-Logo_2016.svg.png',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Toyota_logo_%28Red%29.svg/240px-Toyota_logo_%28Red%29.svg.png',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Honda_logo.svg/200px-Honda_logo.svg.png',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Lexus_division_wordmark.svg/240px-Lexus_division_wordmark.svg.png',
];

// Automotive detail / lifestyle shots (interiors, wheels, headlights) — confirmed via metadata
const MEDIA_IMGS = [
  'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=800&q=80', // car interior / dashboard (confirmed)
  'https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=800&q=80', // car interior detail
  'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&q=80', // steering wheel detail
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80', // car wheel / rim
  'https://images.unsplash.com/photo-1490902931801-d6f80ca94fe4?w=800&q=80', // headlights
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomImg(type: string): string {
  if (type === 'placeholder-product' || type === 'placeholder-jellybean') return pickRandom(PRODUCT_IMGS);
  if (type.includes('background')) return pickRandom(BACKGROUND_IMGS);
  if (type.includes('logo'))       return pickRandom(LOGO_IMGS);
  if (type === 'placeholder-image' || type === 'placeholder-media') return pickRandom(MEDIA_IMGS);
  return pickRandom(MEDIA_IMGS);
}

function generateMockForVar(varName: string, textLength?: 'short' | 'medium' | 'long'): string {
  const lv = varName.toLowerCase();
  for (const [key, vals] of Object.entries(MOCK_POOLS)) {
    const lk = key.toLowerCase();
    if (lv === lk || lv.includes(lk)) return pickRandom(vals);
  }
  if (textLength === 'short')  return pickRandom(['Yes', 'Now', 'Go', varName.slice(0, 4)]);
  if (textLength === 'long')   return `Experience the Ultimate Driving Machine — featuring the all-new ${varName} with unmatched performance and luxury.`;
  if (textLength === 'medium') return `Premium ${varName} designed for the road ahead`;
  return `${varName}`;
}

// Generate mock for a single variable (respects numeric special cases from Advanced Randomization)
function generateSingleMock(
  varName: string,
  varConfigs: Record<string, VarConfig>,
  globalCfg?: { offerPct?: number; paymentAmt?: number },
): string {
  const lv = varName.toLowerCase();

  // If globalCfg has explicit ranges, use them for APR / payment generation
  if (globalCfg?.offerPct !== undefined && (lv.includes('apr') || lv === 'rate' || lv === 'offer')) {
    const max = globalCfg.offerPct;
    return `${(Math.random() * max).toFixed(1)}%`;
  }
  if (globalCfg?.paymentAmt !== undefined && (lv === 'payment' || lv === 'leasepayment')) {
    const max = globalCfg.paymentAmt;
    const amt = Math.floor(Math.random() * (max - 349) + 349);
    return `$${amt.toLocaleString()}/mo`;
  }

  const vCfg = varConfigs[varName];
  const tl = vCfg?.textLength ?? undefined;
  return generateMockForVar(varName, tl);
}

// ─── Google Sheets live feed ──────────────────────────────────────────────────
const SHEET_URL =
  '/gsheets-proxy/spreadsheets/d/1krXFKvgnN3YBh3d7aY-ZCdbR3Ql63Qomzs3MJYB5v6s/export?format=csv&gid=1844900552';

interface SheetData {
  headers: string[];
  rows:    string[][];
}

/** Parse a single CSV line, handling quoted fields with embedded commas. */
function parseCSVLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQ  = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      cells.push(cur.trim()); cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

async function fetchSheetData(): Promise<SheetData> {
  const res  = await fetch(SHEET_URL);
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split('\n').filter(Boolean);
  const headers = parseCSVLine(lines[0]);
  const rows    = lines.slice(1).map(parseCSVLine);
  return { headers, rows };
}

/**
 * Normalise a variable name or column header to a lowercase key with no
 * spaces, hyphens, or underscores, so "Lease Monthly" and "leaseMonthly"
 * both resolve to "leasemonthly".
 */
function normalizeKey(s: string): string {
  // Insert a separator before every uppercase letter run, then lowercase + strip
  return s
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase → spaced
    .toLowerCase()
    .replace(/[\s_\-]+/g, '');
}

/** Build a header→index lookup with normalized keys. */
function buildHeaderMap(headers: string[]): Map<string, number> {
  const map = new Map<string, number>();
  headers.forEach((h, i) => map.set(normalizeKey(h), i));
  return map;
}

/**
 * Given a parsed sheet, pick one row at random and return a { varName → value }
 * map for every variable name that matches a column header.
 * Unmatched variables are omitted — callers fall back to mock generation.
 */
function pickSheetRow(
  data: SheetData,
  headerMap: Map<string, number>,
  varNames: string[],
): { values: Record<string, string>; rowIndex: number } {
  const rowIndex = Math.floor(Math.random() * data.rows.length);
  const row      = data.rows[rowIndex];
  const values: Record<string, string> = {};
  for (const v of varNames) {
    const idx = headerMap.get(normalizeKey(v));
    if (idx !== undefined) {
      const cell = row[idx] ?? '';
      if (cell !== '') values[v] = cell;
    }
  }
  return { values, rowIndex };
}

/** Pick a random non-empty value for a single variable from any sheet row. */
function pickSheetColumn(
  data: SheetData,
  headerMap: Map<string, number>,
  varName: string,
): string | null {
  const idx = headerMap.get(normalizeKey(varName));
  if (idx === undefined) return null;
  const candidates = data.rows.map(r => r[idx] ?? '').filter(Boolean);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface VarConfig {
  textLength:      'short' | 'medium' | 'long' | null;  // null = unset (empty state)
  forceLineBreaks: boolean;
}

type Scenario = 'custom' | 'long-copy' | 'financial-max' | 'mobile-fit' | 'compliance' | 'extreme';

interface AdvancedConfig {
  scenario:          Scenario;
  varConfigs:        Record<string, VarConfig>;
  offerPct:          number;   // 0–10
  paymentAmt:        number;   // 349–999
  country:           string;
  numberFmt:         { decimal: string; thousand: string };
  currencyMode:      'auto' | 'custom';
  currencySymbol:    string;
  currencyPlacement: 'before' | 'after';
  distanceUnit:      string;
  fuelUnit:          string;
  dateFormat:        string;
}

function generateAllMock(
  vars: string[],
  varConfigs: Record<string, VarConfig>,
  globalCfg?: { offerPct?: number; paymentAmt?: number },
): Record<string, string> {
  const vals: Record<string, string> = {};
  for (const v of vars) {
    vals[v] = generateSingleMock(v, varConfigs, globalCfg);
  }
  return vals;
}

// ─── Scenario presets ─────────────────────────────────────────────────────────
// Each preset fully specifies every AdvancedConfig field so selecting a
// scenario produces a completely coherent, deterministic stress environment.
interface PresetParams {
  // Per-variable text stress
  textLength:      'short' | 'medium' | 'long';
  forceLineBreaks: boolean;
  // Numeric ranges
  offerPct:        number;   // APR/offer cap (0–10)
  paymentAmt:      number;   // monthly payment cap (349–999)
  // Regional / locale
  country:         string;
  currencyMode:    'auto' | 'custom';
  currencySymbol:  string;
  currencyPlacement: 'before' | 'after';
  numberFmt:       { decimal: string; thousand: string };
  distanceUnit:    string;
  fuelUnit:        string;
  dateFormat:      string;
}

const PRESET_CONFIGS: Record<Exclude<Scenario, 'custom'>, PresetParams> = {
  // ── Long Copy ──────────────────────────────────────────────────────────────
  // Stress-tests layout with maximum-length text values across all variables.
  // Standard USA market — isolates the text overflow problem from locale noise.
  'long-copy': {
    textLength:        'long',
    forceLineBreaks:   true,
    offerPct:          5,
    paymentAmt:        699,
    country:           'USA ($/Miles)',
    currencyMode:      'auto',
    currencySymbol:    '$',
    currencyPlacement: 'before',
    numberFmt:         { decimal: '.', thousand: ',' },
    distanceUnit:      'Miles',
    fuelUnit:          'MPG',
    dateFormat:        'mm/dd/yyyy',
  },

  // ── Financial Max Values ───────────────────────────────────────────────────
  // Pushes all numeric fields to their ceiling: 9.9% APR, $999/mo payment,
  // high MSRP/purchase prices. Text stays medium so number overflow is visible.
  'financial-max': {
    textLength:        'medium',
    forceLineBreaks:   false,
    offerPct:          10,
    paymentAmt:        999,
    country:           'USA ($/Miles)',
    currencyMode:      'auto',
    currencySymbol:    '$',
    currencyPlacement: 'before',
    numberFmt:         { decimal: '.', thousand: ',' },
    distanceUnit:      'Miles',
    fuelUnit:          'MPG',
    dateFormat:        'mm/dd/yyyy',
  },

  // ── Mobile Fit ────────────────────────────────────────────────────────────
  // Simulates a narrow mobile viewport: short copy, forced line breaks inside
  // containers, low APR values typical of compact-format ads.
  'mobile-fit': {
    textLength:        'short',
    forceLineBreaks:   true,
    offerPct:          2,
    paymentAmt:        449,
    country:           'USA ($/Miles)',
    currencyMode:      'auto',
    currencySymbol:    '$',
    currencyPlacement: 'before',
    numberFmt:         { decimal: '.', thousand: ',' },
    distanceUnit:      'Miles',
    fuelUnit:          'MPG',
    dateFormat:        'mm/dd/yyyy',
  },

  // ── Compliance Edge Cases ─────────────────────────────────────────────────
  // Legal and compliance copy is long and dense but should NOT break mid-clause.
  // APR and payment values represent a realistic mid-market offer.
  compliance: {
    textLength:        'long',
    forceLineBreaks:   false,
    offerPct:          5,
    paymentAmt:        749,
    country:           'USA ($/Miles)',
    currencyMode:      'auto',
    currencySymbol:    '$',
    currencyPlacement: 'before',
    numberFmt:         { decimal: '.', thousand: ',' },
    distanceUnit:      'Miles',
    fuelUnit:          'MPG',
    dateFormat:        'mm/dd/yyyy',
  },

  // ── Extreme Everything ────────────────────────────────────────────────────
  // Absolute worst case: longest text + forced breaks + max financial values +
  // a fully different locale (Germany) — European decimal comma, period
  // thousands separator, € placed after the number, km, L/100km, DD/MM/YYYY.
  // If the design survives this, it survives everything.
  extreme: {
    textLength:        'long',
    forceLineBreaks:   true,
    offerPct:          10,
    paymentAmt:        999,
    country:           'Germany (€/km)',
    currencyMode:      'auto',
    currencySymbol:    '€',
    currencyPlacement: 'after',
    numberFmt:         { decimal: ',', thousand: '.' },
    distanceUnit:      'km',
    fuelUnit:          'L/100km',
    dateFormat:        'dd/mm/yyyy',
  },
};

const SCENARIO_LABELS: Record<Scenario, string> = {
  custom:          'Custom',
  'long-copy':     'Long Copy',
  'financial-max': 'Financial Max Values',
  'mobile-fit':    'Mobile Fit',
  compliance:      'Compliance Edge Cases',
  extreme:         'Extreme Everything',
};

const DEFAULT_CONFIG: AdvancedConfig = {
  scenario:          'custom',
  varConfigs:        {},
  offerPct:          0,
  paymentAmt:        349,
  country:           'USA ($/Miles)',
  numberFmt:         { decimal: '.', thousand: ',' },
  currencyMode:      'auto',
  currencySymbol:    '$',
  currencyPlacement: 'before',
  distanceUnit:      'Miles',
  fuelUnit:          'Gallons',
  dateFormat:        'mm/dd/yyyy',
};

// ─── Primitive UI helpers ─────────────────────────────────────────────────────
function PanelButton({
  children, onClick, variant = 'ghost', size = 'sm', disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'ghost' | 'outline-accent' | 'filled-accent' | 'outline-gray';
  size?: 'sm' | 'xs';
  disabled?: boolean;
}) {
  const base = 'inline-flex items-center gap-1.5 font-medium transition-colors rounded-full select-none';
  const sz   = size === 'xs' ? 'px-2.5 py-1 text-[10px]' : 'px-3.5 py-1.5 text-[11px]';
  const cls = {
    ghost:           'text-[#686576] hover:bg-[#f0eff8] hover:text-[#5B4EFF]',
    'outline-accent':'border border-[#5B4EFF] text-[#5B4EFF] hover:bg-[rgba(91,78,255,0.06)]',
    'filled-accent': 'bg-[#5B4EFF] text-white hover:bg-[#4a3ee0] disabled:opacity-40',
    'outline-gray':  'border border-[#E2E2E2] text-[#686576] hover:bg-[#f0eff8]',
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sz} ${cls} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );
}

function IconBtn({
  onClick, disabled, children, title,
}: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; title?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#686576] hover:bg-[#f0eff8] hover:text-[#5B4EFF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f9fafa] border border-[#E2E2E2] rounded-xl overflow-hidden">
      {children}
    </div>
  );
}

function SectionHeader({
  label, collapsible, open, onToggle,
}: {
  label: string; collapsible?: boolean; open?: boolean; onToggle?: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2.5 ${collapsible ? 'cursor-pointer select-none' : ''}`}
      onClick={collapsible ? onToggle : undefined}
    >
      <span className="text-[12px] font-semibold text-[#1f1d25]">{label}</span>
      {collapsible && (
        <span className="text-[#9c99a9]">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      )}
    </div>
  );
}

function RangeSlider({ min, max, value, onChange }: {
  min: number; max: number; value: number; onChange: (v: number) => void;
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div className="relative w-full h-4 flex items-center">
      <div className="w-full h-1 rounded-full bg-[#E2E2E2] relative">
        <div className="absolute left-0 h-full rounded-full bg-[#5B4EFF]" style={{ width: `${pct}%` }} />
      </div>
      <input
        type="range"
        min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer h-4"
      />
      <div
        className="absolute w-3.5 h-3.5 rounded-full bg-[#5B4EFF] border-2 border-white shadow-md pointer-events-none"
        style={{ left: `calc(${pct}% - 7px)` }}
      />
    </div>
  );
}

function SelectField({ value, options, onChange, className = '' }: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-[#f4f5f6] border border-[#cac9cf] rounded pl-2 pr-7 text-[12px] text-[#1f1d25] cursor-pointer outline-none focus:border-[#5B4EFF] transition-colors min-h-[36px]"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#686576] pointer-events-none"
      />
    </div>
  );
}

// ─── Media picker menu (portal, opens below thumb) ────────────────────────────
const PORTAL_PATH =
  'M3.33 5.11V16.22M6.89 4.22V17.11M18 5.43V15.9C18 16.32 17.71 16.69 17.29 16.77' +
  'L11.52 17.99C10.96 18.11 10.44 17.69 10.44 17.13V4.21C10.44 3.64 10.96 3.22 11.52 3.34' +
  'L17.29 4.56C17.71 4.65 18 5.01 18 5.43Z';
const UPLOAD_PATH =
  'M9 0.75V12M9 0.75L13.5 5.25M9 0.75L4.5 5.25M17.25 9.75V16.25' +
  'C17.25 16.8 16.8 17.25 16.25 17.25H1.75C1.2 17.25 0.75 16.8 0.75 16.25V9.75';

function MediaPickerMenu({
  isOpen, anchorRect, onClose, onShuffle, onUpload,
}: {
  isOpen: boolean;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onShuffle: () => void;
  onUpload: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [isOpen, onClose]);

  if (!isOpen || !anchorRect) return null;
  const top  = anchorRect.bottom + 6;
  const left = anchorRect.left;

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[9999] w-[200px] bg-white rounded-[4px] py-1 overflow-hidden"
      style={{
        top, left,
        boxShadow: '0px 3px 14px 2px rgba(0,0,0,0.12), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 5px 5px -3px rgba(0,0,0,0.20)',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Shuffle */}
      <button
        className="w-full flex items-center gap-3 px-4 py-1.5 hover:bg-gray-100 transition-colors cursor-pointer text-left"
        onClick={() => { onShuffle(); onClose(); }}
      >
        <Shuffle size={20} className="text-[#1f1d25] shrink-0" />
        <span className="text-[14px] text-[#1f1d25]">Shuffle</span>
      </button>

      <div className="mx-3 my-1 h-px bg-[rgba(0,0,0,0.08)]" />

      {/* Portal */}
      <button
        className="w-full flex items-center gap-3 px-4 py-1.5 hover:bg-gray-100 transition-colors cursor-pointer text-left"
        onClick={() => { onClose(); }}
      >
        <svg width="20" height="20" viewBox="0 0 21.3333 21.3333" fill="none">
          <path d={PORTAL_PATH} stroke="#1f1d25" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
        <span className="text-[14px] text-[#1f1d25]">Portal</span>
      </button>

      {/* Upload */}
      <button
        className="w-full flex items-center gap-3 px-4 py-1.5 hover:bg-gray-100 transition-colors cursor-pointer text-left"
        onClick={() => { onUpload(); onClose(); }}
      >
        <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
          <path d={UPLOAD_PATH} stroke="#1f1d25" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
        <span className="text-[14px] text-[#1f1d25]">Upload</span>
      </button>
    </div>,
    document.body,
  );
}

// ─── Single media thumbnail with picker ───────────────────────────────────────
function MediaThumb({
  el, imgUrl, onPick,
}: {
  el: CanvasElement;
  imgUrl?: string;
  onPick: (elementId: string, src: string) => void;
}) {
  const [menuOpen, setMenuOpen]     = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const fileRef  = useRef<HTMLInputElement>(null);
  const label    = el.name ?? MEDIA_LABELS[el.type] ?? 'Media';

  function openMenu() {
    setAnchorRect(thumbRef.current?.getBoundingClientRect() ?? null);
    setMenuOpen(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onPick(el.id, url);
    e.target.value = '';
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={thumbRef}
        onClick={openMenu}
        className="relative bg-[#f0f2f4] border border-[rgba(0,0,0,0.12)] rounded-[8px] overflow-hidden cursor-pointer hover:border-[#5B4EFF] transition-colors shrink-0"
        style={{ width: 70, height: 70 }}
      >
        <div className="absolute inset-[4px] rounded-[4px] overflow-hidden bg-white flex items-center justify-center">
          {imgUrl ? (
            <img src={imgUrl} alt={label} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[20px] opacity-30">🖼</span>
          )}
        </div>
      </div>
      <span className="text-[9px] text-[#686576] font-medium text-center leading-tight max-w-[70px] truncate">
        {label}
      </span>
      <MediaPickerMenu
        isOpen={menuOpen}
        anchorRect={anchorRect}
        onClose={() => setMenuOpen(false)}
        onShuffle={() => onPick(el.id, pickRandomImg(el.type))}
        onUpload={() => fileRef.current?.click()}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ─── Main Preview Panel view ──────────────────────────────────────────────────
function MainView({
  vars, mockValues, mediaElements, mockMediaUrls,
  onRandomize, onRandomizeOne, onPickMedia,
  onUndo, onRedo, canUndo, canRedo,
  onOpenAdvanced, onClose,
}: {
  vars:           string[];
  mockValues:     Record<string, string>;
  mediaElements:  CanvasElement[];
  mockMediaUrls:  Record<string, string>;
  onRandomize:    () => void;
  onRandomizeOne: (varName: string) => void;
  onPickMedia:    (elementId: string, src: string) => void;
  onUndo:         () => void;
  onRedo:         () => void;
  canUndo:        boolean;
  canRedo:        boolean;
  onOpenAdvanced: () => void;
  onClose:        () => void;
}) {
  const [selectedBrand, setSelectedBrand] = useState('bmw');
  const [brandCompliant, setBrandCompliant] = useState(true);

  return (
    <div className="flex-1 min-h-0" style={{ display: 'grid', gridTemplateRows: 'auto 1fr', overflow: 'hidden' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <span className="text-[13px] font-semibold text-[#1f1d25]">Preview</span>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-[#9c99a9] hover:text-[#1f1d25] hover:bg-[#f0eff8] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto px-3 pb-4 space-y-3">

        {/* Info banner */}
        <div className="flex items-start gap-2.5 bg-[#E3F2FD] rounded-xl px-3 py-2.5">
          <Info size={14} className="text-[#2196F3] mt-0.5 shrink-0" />
          <p className="text-[11px] leading-[1.5] text-[#1565C0]">
            Mock data is for preview only. Updates in position, size, groups, and constraints will be saved.
          </p>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2">
          <PanelButton variant="outline-accent" onClick={onRandomize}>
            Test With Mock Data
          </PanelButton>
          <div className="flex items-center gap-0.5 ml-auto">
            <IconBtn onClick={onUndo} disabled={!canUndo} title="Undo mock data">
              <RotateCcw size={13} />
            </IconBtn>
            <IconBtn onClick={onRedo} disabled={!canRedo} title="Redo mock data">
              <RotateCw size={13} />
            </IconBtn>
            <IconBtn onClick={onOpenAdvanced} title="Advanced Randomization">
              <SlidersHorizontal size={13} />
            </IconBtn>
          </div>
        </div>

        {/* Brand Kit */}
        <BrandKitSelector value={selectedBrand} onChange={setSelectedBrand} />

        {/* Brand compliant checkbox */}
        <button
          onClick={() => setBrandCompliant(p => !p)}
          className="flex items-center gap-2.5 w-full text-left"
        >
          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
            brandCompliant ? 'bg-[#5B4EFF] border-[#5B4EFF]' : 'border-[#C5C2D0] bg-white'
          }`}>
            {brandCompliant && <Check size={10} strokeWidth={2.5} className="text-white" />}
          </div>
          <span className="text-[11px] font-medium text-[#1f1d25]">Brand-Compliant Mock Data</span>
        </button>

        {/* Text variables */}
        {vars.length > 0 ? (
          <SectionCard>
            <SectionHeader label="Text" />
            <div className="border-t border-[#E2E2E2]">
              {vars.map((v, i) => (
                <div
                  key={v}
                  className={`px-3 py-2.5 ${i < vars.length - 1 ? 'border-b border-[#E2E2E2]' : ''}`}
                >
                  <label className="block text-[10px] text-[#9c99a9] mb-1 font-medium">{v}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-[#E2E2E2] rounded-lg px-2.5 py-1.5 min-w-0">
                      <span className="text-[11px] text-[#1f1d25] block truncate">
                        {mockValues[v] ?? `{${v}}`}
                      </span>
                    </div>
                    <button
                      onClick={() => onRandomizeOne(v)}
                      className="text-[#C5C2D0] hover:text-[#5B4EFF] transition-colors shrink-0"
                      title={`Randomize ${v}`}
                    >
                      <Shuffle size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : (
          <SectionCard>
            <SectionHeader label="Text" />
            <div className="border-t border-[#E2E2E2] px-3 py-4 text-center">
              <p className="text-[11px] text-[#9c99a9]">
                Add template variables using{' '}
                <span className="font-mono text-[#686576]">{'{varName}'}</span>{' '}
                in text elements.
              </p>
            </div>
          </SectionCard>
        )}

        {/* Media section */}
        {mediaElements.length > 0 && (
          <SectionCard>
            <SectionHeader label="Media" />
            <div className="border-t border-[#E2E2E2] px-3 pt-3 pb-4">
              <div className="flex flex-wrap gap-2">
                {mediaElements.map(el => (
                  <MediaThumb
                    key={el.id}
                    el={el}
                    imgUrl={mockMediaUrls[el.id]}
                    onPick={onPickMedia}
                  />
                ))}
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

// ─── Advanced Randomization view ──────────────────────────────────────────────
const TEXT_LENGTHS: { value: VarConfig['textLength']; label: string }[] = [
  { value: 'short',  label: 'Short'  },
  { value: 'medium', label: 'Medium' },
  { value: 'long',   label: 'Long'   },
];

function VarSection({
  varName, cfg, onChange,
}: {
  varName: string;
  cfg: VarConfig;
  onChange: (patch: Partial<VarConfig>) => void;
}) {
  return (
    <div className="flex flex-col gap-[10px]">
      {/* Variable label */}
      <span className="text-[14px] font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]">
        {`{${varName}}`}
      </span>

      {/* Text-length pills */}
      <div className="flex items-center gap-[6px] flex-wrap">
        {TEXT_LENGTHS.map(({ value, label }) => {
          const sel = cfg.textLength === value;
          return (
            <button
              key={value}
              onClick={() => onChange({ textLength: value })}
              className="flex items-center min-h-[24px] px-1 py-[3px] rounded-[8px] transition-colors"
              style={{
                backgroundColor: sel ? '#473bab' : 'transparent',
                border: '1px solid #473bab',
              }}
            >
              <span
                className="px-[7px] text-[11px] leading-[18px] tracking-[0.16px] font-normal whitespace-nowrap"
                style={{ color: sel ? 'white' : '#473bab' }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Force line breaks checkbox */}
      <button
        onClick={() => onChange({ forceLineBreaks: !cfg.forceLineBreaks })}
        className="flex items-center gap-[10px] w-full text-left"
      >
        <div
          className={`w-[18px] h-[18px] rounded flex items-center justify-center border transition-colors shrink-0 ${
            cfg.forceLineBreaks ? 'bg-[#5B4EFF] border-[#5B4EFF]' : 'border-[#cac9cf] bg-white'
          }`}
        >
          {cfg.forceLineBreaks && <Check size={11} strokeWidth={2.5} className="text-white" />}
        </div>
        <span className="text-[14px] text-[#1f1d25] font-normal leading-[1.43] tracking-[0.15px]">
          Force line breaks
        </span>
      </button>
    </div>
  );
}

function AdvancedView({
  vars, config, onChange, onCancel,
}: {
  vars: string[];
  config: AdvancedConfig;
  onChange: (patch: Partial<AdvancedConfig>) => void;
  onCancel: () => void;
}) {
  const [numberOpen,   setNumberOpen]   = useState(true);
  const [regionalOpen, setRegionalOpen] = useState(true);

  // ── Auto-format: apply locale values whenever Auto mode is active ────────────
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (config.currencyMode !== 'auto') return;
    const fmt = resolveAutoFormat(config.country);
    const alreadyApplied =
      config.currencySymbol    === fmt.symbol    &&
      config.currencyPlacement === fmt.placement &&
      config.numberFmt.decimal  === fmt.decimal  &&
      config.numberFmt.thousand === fmt.thousand;
    if (!alreadyApplied) {
      onChangeRef.current({
        currencySymbol:    fmt.symbol,
        currencyPlacement: fmt.placement,
        numberFmt:         { decimal: fmt.decimal, thousand: fmt.thousand },
      });
    }
  // Re-run whenever mode or country changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.currencyMode, config.country]);

  // Apply a general config patch, switching to 'custom' if not already
  const change = (patch: Partial<AdvancedConfig>) => {
    onChange(config.scenario !== 'custom' ? { ...patch, scenario: 'custom' } : patch);
  };

  // Changing country should NOT switch to Custom when Auto is active — it
  // should re-apply the new country's locale (handled by the effect above).
  const handleCountry = (country: string) => {
    if (config.currencyMode === 'auto') {
      onChange({ country });          // keep currencyMode=auto; effect will update fmt
    } else {
      change({ country });
    }
  };

  // Update a single variable's config; if a preset was active, fall back to Custom
  const changeVar = (varName: string, varPatch: Partial<VarConfig>) => {
    const newVarConfigs = {
      ...config.varConfigs,
      [varName]: {
        ...(config.varConfigs[varName] ?? { textLength: null, forceLineBreaks: false }),
        ...varPatch,
      },
    };
    onChange({ varConfigs: newVarConfigs, scenario: 'custom' });
  };

  // When a preset scenario is selected, apply its settings to all variables.
  // Selecting 'custom' explicitly resets all vars back to empty state.
  const handleScenario = (s: Scenario) => {
    if (s === 'custom') {
      const emptyVarConfigs: Record<string, VarConfig> = {};
      for (const v of vars) {
        emptyVarConfigs[v] = { textLength: null, forceLineBreaks: false };
      }
      onChange({ scenario: 'custom', varConfigs: emptyVarConfigs });
      return;
    }
    const preset = PRESET_CONFIGS[s];
    const newVarConfigs: Record<string, VarConfig> = {};
    for (const v of vars) {
      newVarConfigs[v] = { textLength: preset.textLength, forceLineBreaks: preset.forceLineBreaks };
    }
    onChange({
      scenario:          s,
      varConfigs:        newVarConfigs,
      offerPct:          preset.offerPct,
      paymentAmt:        preset.paymentAmt,
      country:           preset.country,
      currencyMode:      preset.currencyMode,
      currencySymbol:    preset.currencySymbol,
      currencyPlacement: preset.currencyPlacement,
      numberFmt:         preset.numberFmt,
      distanceUnit:      preset.distanceUnit,
      fuelUnit:          preset.fuelUnit,
      dateFormat:        preset.dateFormat,
    });
  };

  // ── Preview box values ─────────────────────────────────────────────────────
  const sep1 = config.numberFmt.thousand;
  const sep2 = config.numberFmt.decimal;
  const sym  = config.currencySymbol;
  const symBefore = config.currencyMode === 'auto' || config.currencyPlacement === 'before';
  const formattedPrice = `${symBefore ? sym : ''}12${sep1}499${sep2}50${symBefore ? '' : sym}`;
  const previewDate = config.dateFormat === 'dd/mm/yyyy'
    ? '27/02/2026'
    : config.dateFormat === 'yyyy-mm-dd' ? '2026-02-27' : '02/27/2026';

  return (
    <div className="flex-1 min-h-0" style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', overflow: 'hidden' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-3 pt-3 pb-2 min-h-[48px]">
        <button
          onClick={onCancel}
          className="p-[5px] rounded-full hover:bg-black/5 transition-colors shrink-0"
        >
          <ArrowLeft size={20} className="text-[#1f1d25]" />
        </button>
        <span className="text-[16px] font-medium text-[#1f1d25] tracking-[0.15px] leading-[1.5]">
          Advanced Randomization
        </span>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="overflow-y-auto px-4 pb-4 space-y-3">

        {/* Subtitle */}
        <p className="text-[14px] text-black leading-[1.5] tracking-[0.15px]">
          Select a scenario to auto-apply stress settings.
        </p>

        {/* Scenario dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-[#686576] tracking-[0.15px] leading-[1] pl-[4px]">
            Scenario
          </label>
          <SelectField
            value={config.scenario}
            options={Object.entries(SCENARIO_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            onChange={v => handleScenario(v as Scenario)}
          />
        </div>

        {/* ── Per-variable sections ──────────────────────────────────────────── */}
        {vars.length > 0 && (
          <div
            className="flex flex-col p-3 rounded-[12px]"
            style={{ border: '1px solid rgba(0,0,0,0.12)' }}
          >
            {vars.map((v, i) => (
              <div key={v}>
                {i > 0 && (
                  <div
                    className="my-3"
                    style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.07)' }}
                  />
                )}
                <VarSection
                  varName={v}
                  cfg={config.varConfigs[v] ?? { textLength: null, forceLineBreaks: false }}
                  onChange={patch => changeVar(v, patch)}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Number Generation ────────────────────────────────────────────── */}
        <div
          className="rounded-[12px] overflow-hidden"
          style={{ border: '1px solid rgba(0,0,0,0.12)' }}
        >
          <button
            className="flex items-center justify-between w-full px-3 py-[10px] cursor-pointer select-none"
            onClick={() => setNumberOpen(p => !p)}
          >
            <span className="text-[14px] font-semibold text-[#1f1d25] tracking-[0.1px]">
              Number generation
            </span>
            {numberOpen
              ? <ChevronUp   size={16} className="text-[#686576]" />
              : <ChevronDown size={16} className="text-[#686576]" />}
          </button>

          {numberOpen && (
            <div
              className="px-3 pb-4 pt-3 flex flex-col gap-4"
              style={{ borderTop: '1px solid rgba(0,0,0,0.12)' }}
            >
              {/* Offer Type Range */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#1f1d25] tracking-[0.15px]">
                    Offer Type Range (0-10%)
                  </span>
                  <span className="text-[12px] text-[#9c99a9]">{config.offerPct}%</span>
                </div>
                <RangeSlider
                  min={0} max={10} value={config.offerPct}
                  onChange={v => change({ offerPct: v })}
                />
              </div>

              {/* Payment Range */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#1f1d25] tracking-[0.15px]">
                    Payment&nbsp; Range ($349-$999)
                  </span>
                  <span className="text-[12px] text-[#9c99a9]">${config.paymentAmt}</span>
                </div>
                <RangeSlider
                  min={349} max={999} value={config.paymentAmt}
                  onChange={v => change({ paymentAmt: v })}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Regional Format ──────────────────────────────────────────────── */}
        <div
          className="rounded-[12px] overflow-hidden"
          style={{ border: '1px solid rgba(0,0,0,0.12)' }}
        >
          <button
            className="flex items-center justify-between w-full px-3 py-[10px] cursor-pointer select-none"
            onClick={() => setRegionalOpen(p => !p)}
          >
            <span className="text-[14px] font-semibold text-[#1f1d25] tracking-[0.1px]">
              Regional Format
            </span>
            {regionalOpen
              ? <ChevronUp   size={16} className="text-[#686576]" />
              : <ChevronDown size={16} className="text-[#686576]" />}
          </button>

          {regionalOpen && (
            <div
              className="px-3 pb-4 pt-3 flex flex-col gap-3"
              style={{ borderTop: '1px solid rgba(0,0,0,0.12)' }}
            >
              {/* Country */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-[#686576] tracking-[0.15px]">Country</label>
                <SelectField
                  value={config.country}
                  options={[
                    { value: 'USA ($/Miles)',   label: '🇺🇸 USA ($/Miles)'   },
                    { value: 'Canada (CAD/km)', label: '🇨🇦 Canada (CAD/km)' },
                    { value: 'UK (£/Miles)',    label: '🇬🇧 UK (£/Miles)'    },
                    { value: 'Germany (€/km)',  label: '🇩🇪 Germany (€/km)'  },
                    { value: 'Brazil (R$/km)',  label: '🇧🇷 Brazil (R$/km)'  },
                  ]}
                  onChange={handleCountry}
                />
              </div>

              {/* Number Formatting — read-only in Auto mode */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-[#686576] tracking-[0.15px]">Number Formatting</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1 min-w-0">
                    <label className="text-[12px] text-[#9c99a9] truncate">Decimal Separator</label>
                    <SelectField
                      value={config.numberFmt.decimal}
                      options={[{ value: '.', label: '.' }, { value: ',', label: ',' }]}
                      onChange={v => change({ numberFmt: { ...config.numberFmt, decimal: v } })}
                    />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <label className="text-[12px] text-[#9c99a9] truncate">Thousand Separator</label>
                    <SelectField
                      value={config.numberFmt.thousand}
                      options={[
                        { value: ',', label: ',' },
                        { value: '.', label: '.' },
                        { value: ' ', label: 'Space' },
                      ]}
                      onChange={v => change({ numberFmt: { ...config.numberFmt, thousand: v } })}
                    />
                  </div>
                </div>
              </div>

              {/* Currency */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-[#686576] tracking-[0.15px]">Currency</label>
                <div className="flex items-center gap-5">
                  {(['auto', 'custom'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => onChange({ currencyMode: m })}
                      className="flex items-center gap-[6px]"
                    >
                      <div
                        className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors ${
                          config.currencyMode === m ? 'border-[#5B4EFF]' : 'border-[#cac9cf]'
                        }`}
                      >
                        {config.currencyMode === m && (
                          <div className="w-[8px] h-[8px] rounded-full bg-[#5B4EFF]" />
                        )}
                      </div>
                      <span className="text-[14px] text-[#1f1d25] capitalize tracking-[0.15px]">{m}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1 min-w-0">
                    <label className="text-[12px] text-[#9c99a9]">Symbol</label>
                    <SelectField
                      value={config.currencySymbol}
                      options={[
                        { value: '$',  label: '$'  },
                        { value: '€',  label: '€'  },
                        { value: '£',  label: '£'  },
                        { value: 'R$', label: 'R$' },
                      ]}
                      onChange={v => change({ currencySymbol: v })}
                      className={config.currencyMode === 'auto' ? 'opacity-50 pointer-events-none' : ''}
                    />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <label className="text-[12px] text-[#9c99a9]">Placement</label>
                    <SelectField
                      value={config.currencyPlacement}
                      options={[
                        { value: 'before', label: 'Before' },
                        { value: 'after',  label: 'After'  },
                      ]}
                      onChange={v => change({ currencyPlacement: v as 'before' | 'after' })}
                      className={config.currencyMode === 'auto' ? 'opacity-50 pointer-events-none' : ''}
                    />
                  </div>
                </div>
              </div>

              {/* Units */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-[#686576] tracking-[0.15px]">Units</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1 min-w-0">
                    <label className="text-[12px] text-[#9c99a9]">Distance</label>
                    <SelectField
                      value={config.distanceUnit}
                      options={[{ value: 'Miles', label: 'Miles' }, { value: 'km', label: 'km' }]}
                      onChange={v => change({ distanceUnit: v })}
                    />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <label className="text-[12px] text-[#9c99a9]">Fuel</label>
                    <SelectField
                      value={config.fuelUnit}
                      options={[{ value: 'Gallons', label: 'Gallons' }, { value: 'Litres', label: 'Litres' }]}
                      onChange={v => change({ fuelUnit: v })}
                    />
                  </div>
                </div>
              </div>

              {/* Date format */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-[#686576] tracking-[0.15px]">Date format</label>
                <SelectField
                  value={config.dateFormat}
                  options={[
                    { value: 'mm/dd/yyyy',  label: 'mm/dd/yyyy'  },
                    { value: 'dd/mm/yyyy',  label: 'dd/mm/yyyy'  },
                    { value: 'yyyy-mm-dd',  label: 'yyyy-mm-dd'  },
                    { value: 'MMM D, YYYY', label: 'MMM D, YYYY' },
                  ]}
                  onChange={v => change({ dateFormat: v })}
                />
              </div>

              {/* Preview box */}
              <div
                className="flex flex-col gap-2 rounded-[12px] p-3 w-full"
                style={{
                  backgroundColor: 'rgba(99,86,225,0.04)',
                  border: '1px solid rgba(99,86,225,0.5)',
                }}
              >
                <p className="text-[12px] text-[#1f1d25] tracking-[0.17px] leading-[1.43]">Preview</p>
                <div className="flex flex-col gap-0 w-full">
                  {/* Row 1: price + APR */}
                  <div className="flex items-center gap-1 w-full">
                    <p className="flex-1 min-w-0 text-[16px] leading-[1.75] text-[#1f1d25] tracking-[0.15px]">
                      {formattedPrice}
                    </p>
                    <p className="flex-1 min-w-0 text-[16px] leading-[1.75] text-[#1f1d25] tracking-[0.15px]">
                      39% APR
                    </p>
                  </div>
                  {/* Row 2: mileage + date */}
                  <div className="flex items-start gap-1 w-full">
                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] leading-[1.75] text-[#1f1d25] tracking-[0.15px]">
                        10{sep1}000
                      </p>
                      <p className="text-[11px] leading-[1.66] text-[#686576] tracking-[0.4px]">
                        {config.distanceUnit.toLowerCase()}/year
                      </p>
                    </div>
                    <p className="flex-1 min-w-0 text-[16px] leading-[1.75] text-[#1f1d25] tracking-[0.15px]">
                      {previewDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── Root PreviewPanel ─────────────────────────────────────────────────────────
export function PreviewPanel() {
  const {
    isPreviewMode,
    setIsPreviewMode,
    canvasElements,
    updateElement,
  } = useDesignWorkspace();

  // ── Original content + src snapshots ───────────────────────────────────────
  const originalContentRef = useRef<Map<string, string>>(new Map());
  const originalSrcRef     = useRef<Map<string, string | undefined>>(new Map());

  // ── vars & mediaElements — captured ONCE on activation, stable for the session
  // Recomputing from canvasElements on every render causes the list to vanish
  // after doApplyToCanvas updates the store (substituted content has no {vars}).
  const [vars,         setVars]         = useState<string[]>([]);
  const [mediaElements, setMediaElements] = useState<CanvasElement[]>([]);

  // ── Google Sheet data — fetched once on first preview activation ────────────
  const [sheetData,    setSheetData]    = useState<SheetData | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const headerMapRef = useRef<Map<string, number>>(new Map());
  // Keep a ref so callbacks always read current data without stale closures
  const sheetDataRef = useRef<SheetData | null>(null);

  useEffect(() => {
    if (isPreviewMode) {
      // Snapshot originals and detect vars/media from the CURRENT (pre-substitution) canvas
      const snap = canvasElements;
      snap.forEach(el => {
        if (el.content && !originalContentRef.current.has(el.id)) {
          originalContentRef.current.set(el.id, el.content);
        }
        if (el.type?.startsWith('placeholder-') && !originalSrcRef.current.has(el.id)) {
          originalSrcRef.current.set(el.id, el.src);
        }
      });
      // Fix vars and media once — they reflect the template, not live canvas state
      setVars(detectVars(snap));
      setMediaElements(detectMediaElements(snap));
    } else {
      originalContentRef.current.forEach((content, id) => updateElement(id, { content }));
      originalContentRef.current.clear();
      originalSrcRef.current.forEach((src, id) => updateElement(id, { src: src ?? '' }));
      originalSrcRef.current.clear();
      setVars([]);
      setMediaElements([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreviewMode]);

  // ── Fetch Google Sheet on first preview activation ──────────────────────────
  useEffect(() => {
    if (!isPreviewMode || sheetDataRef.current) return; // already loaded
    setSheetLoading(true);
    fetchSheetData()
      .then(data => {
        sheetDataRef.current = data;
        headerMapRef.current = buildHeaderMap(data.headers);
        setSheetData(data);
      })
      .catch(err => console.warn('[Preview] Sheet fetch failed, using mock data.', err))
      .finally(() => setSheetLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreviewMode]);

  // ── Advanced config ─────────────────────────────────────────────────────────
  const [advConfig, setAdvConfig] = useState<AdvancedConfig>(DEFAULT_CONFIG);

  // Ensure any newly-detected variable gets a default VarConfig entry
  useEffect(() => {
    setAdvConfig(prev => {
      const missing = vars.filter(v => !prev.varConfigs[v]);
      if (missing.length === 0) return prev;
      const newVarConfigs = { ...prev.varConfigs };
      for (const v of missing) {
        newVarConfigs[v] = { textLength: null, forceLineBreaks: false };
      }
      return { ...prev, varConfigs: newVarConfigs };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vars.join(',')]);

  // ── Mock values & media URLs & history ─────────────────────────────────────
  // Each history entry is a unified snapshot of both text values AND media URLs
  // so undo/redo restores the complete preview state in one step.
  //
  // Design: historyRef holds the array as a plain ref (always in sync, always
  // readable synchronously from any callback without stale-closure risk).
  // historyIndex is React state only to trigger re-renders for canUndo/canRedo.
  interface PreviewSnapshot {
    text:  Record<string, string>;
    media: Record<string, string>;
  }
  const [mockValues,    setMockValues]    = useState<Record<string, string>>({});
  const [mockMediaUrls, setMockMediaUrls] = useState<Record<string, string>>({});
  const historyRef      = useRef<PreviewSnapshot[]>([]);
  const historyIndexRef = useRef(-1);
  const [historyIndex,  setHistoryIndex]  = useState(-1);

  /** Push a new snapshot onto the undo stack, trimming any redo tail. */
  const pushHistory = useCallback((snap: PreviewSnapshot) => {
    const idx = historyIndexRef.current;
    historyRef.current = [...historyRef.current.slice(0, idx + 1), snap];
    historyIndexRef.current = idx + 1;
    setHistoryIndex(idx + 1);   // trigger re-render so canUndo/canRedo update
  }, []);

  // ── View state ──────────────────────────────────────────────────────────────
  const [view, setView] = useState<'main' | 'advanced'>('main');

  // ── Apply mock values to canvas ─────────────────────────────────────────────
  const doApplyToCanvas = useCallback((vals: Record<string, string>) => {
    for (const el of canvasElements) {
      if (!el.content) continue;
      const original = originalContentRef.current.get(el.id) ?? el.content;
      const substituted = original.replace(PREVIEW_VAR_RE, (_, key: string) => vals[key] ?? `{${key}}`);
      updateElement(el.id, { content: substituted });
    }
  }, [canvasElements, updateElement]);

  // ── Apply media mock URLs to canvas ─────────────────────────────────────────
  const doApplyMediaToCanvas = useCallback((urls: Record<string, string>) => {
    for (const [id, src] of Object.entries(urls)) {
      updateElement(id, { src });
    }
  }, [updateElement]);

  // ── Sheet-aware text generation ─────────────────────────────────────────────
  // Pick a random row from the sheet; for every variable that has a matching
  // column use the row's value. Fall back to mock generation for the rest.
  const generateWithSheet = useCallback((
    varNames: string[],
    varConfigs: Record<string, VarConfig>,
    globalCfg?: { offerPct?: number; paymentAmt?: number },
  ): Record<string, string> => {
    const sheet = sheetDataRef.current;
    const vals: Record<string, string> = {};

    if (sheet && sheet.rows.length > 0) {
      const { values: sheetVals } = pickSheetRow(sheet, headerMapRef.current, varNames);
      for (const v of varNames) {
        vals[v] = sheetVals[v] ?? generateSingleMock(v, varConfigs, globalCfg);
      }
    } else {
      for (const v of varNames) {
        vals[v] = generateSingleMock(v, varConfigs, globalCfg);
      }
    }
    return vals;
  }, []);

  // Pick a value for a single variable — sheet column first, then mock.
  const generateOneWithSheet = useCallback((
    varName: string,
    varConfigs: Record<string, VarConfig>,
    globalCfg?: { offerPct?: number; paymentAmt?: number },
  ): string => {
    const sheet = sheetDataRef.current;
    if (sheet) {
      const val = pickSheetColumn(sheet, headerMapRef.current, varName);
      if (val !== null) return val;
    }
    return generateSingleMock(varName, varConfigs, globalCfg);
  }, []);

  // ── Auto-init on preview mode activation ───────────────────────────────────
  // 'none'  → not yet initialised
  // 'mock'  → initialised with generated mock data (sheet hadn't loaded yet)
  // 'sheet' → initialised (or re-initialised) with real sheet data
  const initializedRef = useRef<'none' | 'mock' | 'sheet'>('none');
  useEffect(() => {
    if (isPreviewMode && (vars.length > 0 || mediaElements.length > 0)) {
      const hasSheet = sheetDataRef.current !== null;
      const status   = initializedRef.current;

      if (status === 'none') {
        // First init — use whatever data is available right now
        initializedRef.current = hasSheet ? 'sheet' : 'mock';
        const initialText: Record<string, string> = vars.length > 0
          ? generateWithSheet(vars, advConfig.varConfigs, { offerPct: advConfig.offerPct, paymentAmt: advConfig.paymentAmt })
          : {};
        const initialMedia: Record<string, string> = {};
        for (const el of mediaElements) initialMedia[el.id] = pickRandomImg(el.type);
        setMockValues(initialText);
        setMockMediaUrls(initialMedia);
        const snap = { text: initialText, media: initialMedia };
        historyRef.current = [snap];
        historyIndexRef.current = 0;
        setHistoryIndex(0);
        doApplyToCanvas(initialText);
        doApplyMediaToCanvas(initialMedia);
      } else if (status === 'mock' && hasSheet) {
        // Sheet loaded after mock init — silently upgrade to real data
        initializedRef.current = 'sheet';
        const newText = generateWithSheet(vars, advConfig.varConfigs, { offerPct: advConfig.offerPct, paymentAmt: advConfig.paymentAmt });
        setMockValues(newText);
        pushHistory({ text: newText, media: mockMediaUrls });
        doApplyToCanvas(newText);
      }
    }
    if (!isPreviewMode) {
      initializedRef.current = 'none';
      setMockValues({});
      setMockMediaUrls({});
      historyRef.current = [];
      historyIndexRef.current = -1;
      setHistoryIndex(-1);
      setView('main');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreviewMode, vars, mediaElements, sheetData]);

  // ── Randomize all (text + media) ────────────────────────────────────────────
  const handleRandomize = useCallback(() => {
    const newText = generateWithSheet(vars, advConfig.varConfigs, {
      offerPct:   advConfig.offerPct,
      paymentAmt: advConfig.paymentAmt,
    });
    const newMedia: Record<string, string> = {};
    for (const el of mediaElements) newMedia[el.id] = pickRandomImg(el.type);
    setMockValues(newText);
    setMockMediaUrls(newMedia);
    pushHistory({ text: newText, media: newMedia });
    doApplyToCanvas(newText);
    doApplyMediaToCanvas(newMedia);
  }, [vars, advConfig, mediaElements, generateWithSheet, doApplyToCanvas, doApplyMediaToCanvas, pushHistory]);

  // ── Randomize single text variable ──────────────────────────────────────────
  const handleRandomizeOne = useCallback((varName: string) => {
    const newVal  = generateOneWithSheet(varName, advConfig.varConfigs, {
      offerPct:   advConfig.offerPct,
      paymentAmt: advConfig.paymentAmt,
    });
    const newText = { ...mockValues, [varName]: newVal };
    setMockValues(newText);
    pushHistory({ text: newText, media: mockMediaUrls });
    doApplyToCanvas(newText);
  }, [mockValues, mockMediaUrls, advConfig, doApplyToCanvas, pushHistory]);

  // ── Pick / replace a single media placeholder (from file or shuffle) ─────────
  const handlePickMedia = useCallback((elementId: string, src: string) => {
    const newMedia = { ...mockMediaUrls, [elementId]: src };
    setMockMediaUrls(newMedia);
    pushHistory({ text: mockValues, media: newMedia });
    updateElement(elementId, { src });
  }, [mockValues, mockMediaUrls, updateElement, pushHistory]);

  // ── Undo ────────────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx <= 0) return;
    const newIdx = idx - 1;
    const snap   = historyRef.current[newIdx];
    if (!snap) return;
    historyIndexRef.current = newIdx;
    setHistoryIndex(newIdx);
    setMockValues(snap.text);
    setMockMediaUrls(snap.media);
    doApplyToCanvas(snap.text);
    doApplyMediaToCanvas(snap.media);
  }, [doApplyToCanvas, doApplyMediaToCanvas]);

  // ── Redo ────────────────────────────────────────────────────────────────────
  const handleRedo = useCallback(() => {
    const idx    = historyIndexRef.current;
    const newIdx = idx + 1;
    if (newIdx >= historyRef.current.length) return;
    const snap = historyRef.current[newIdx];
    if (!snap) return;
    historyIndexRef.current = newIdx;
    setHistoryIndex(newIdx);
    setMockValues(snap.text);
    setMockMediaUrls(snap.media);
    doApplyToCanvas(snap.text);
    doApplyMediaToCanvas(snap.media);
  }, [doApplyToCanvas, doApplyMediaToCanvas]);

  // ── Advanced apply ──────────────────────────────────────────────────────────
  // Apply a fully-specified config to the canvas immediately — used for live
  // updates from Advanced Randomization so every field change reflects at once.
  // Does not push to the undo history (would flood it on rapid changes).
  const applyConfig = useCallback((cfg: AdvancedConfig) => {
    const newText = generateWithSheet(vars, cfg.varConfigs, {
      offerPct:   cfg.offerPct,
      paymentAmt: cfg.paymentAmt,
    });
    setMockValues(newText);
    doApplyToCanvas(newText);
  }, [vars, generateWithSheet, doApplyToCanvas]);

  // ── Close ───────────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    originalContentRef.current.forEach((content, id) => updateElement(id, { content }));
    originalContentRef.current.clear();
    originalSrcRef.current.forEach((src, id) => updateElement(id, { src: src ?? '' }));
    originalSrcRef.current.clear();
    setIsPreviewMode(false);
  }, [updateElement, setIsPreviewMode]);

  if (!isPreviewMode) return null;

  return (
    <div
      className="absolute right-1 top-1 bottom-1 w-[280px] bg-white rounded-2xl z-20 flex flex-col overflow-hidden"
      style={{ boxShadow: '0px 1px 9px rgba(0,0,0,0.12), 0px 6px 5px rgba(0,0,0,0.14), 0px 3px 2.5px rgba(0,0,0,0.20)' }}
      onClick={e => e.stopPropagation()}
    >
      {view === 'advanced' ? (
        <AdvancedView
          vars={vars}
          config={advConfig}
          onChange={patch => {
            const next = { ...advConfig, ...patch };
            setAdvConfig(next);
            applyConfig(next);
          }}
          onCancel={() => setView('main')}
        />
      ) : (
        <MainView
          vars={vars}
          mockValues={mockValues}
          mediaElements={mediaElements}
          mockMediaUrls={mockMediaUrls}
          onRandomize={handleRandomize}
          onRandomizeOne={handleRandomizeOne}
          onPickMedia={handlePickMedia}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < historyRef.current.length - 1}
          onOpenAdvanced={() => setView('advanced')}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
