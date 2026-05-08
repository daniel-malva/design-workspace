// ── CSV / feed parsing utilities ──────────────────────────────────────

export function parseCSV(csv: string): { headers: string[]; rows: Record<string, string>[]; rowCount: number } {
  const lines = csv.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [], rowCount: 0 };

  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers   = parseLine(lines[0]).filter(Boolean);
  const dataLines = lines.slice(1);

  const rows: Record<string, string>[] = dataLines.map(line => {
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });

  return { headers, rows, rowCount: lines.length - 1 };
}

// Normalize a string for fuzzy matching: lowercase, strip non-alphanumeric
export function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Find the best column match for a variable key/name. Returns '' if none found.
export function autoMatchColumn(hint: string, columns: string[]): string {
  const h = norm(hint);
  return columns.find(c => norm(c) === h) ?? '';
}

// Extra column hints per placeholder variant — tried after the primary match fails.
// Keeps domain-specific knowledge out of the generic fuzzy matcher.
export const MEDIA_COLUMN_ALIASES: Record<string, string[]> = {
  'product':          ['jellybean', 'jelly bean', 'jelly_bean', 'jellybeans'],
  'background-image': ['background', 'bg', 'background image', 'background_image', 'bg image'],
  'background-video': ['background', 'bg', 'background video', 'background_video', 'bg video'],
  'background':       ['background', 'bg', 'background image', 'background_image'],
};

// Try variant, then layer name, then domain aliases.
export function autoMatchMedia(variant: string, name: string, columns: string[]): string {
  return (
    autoMatchColumn(variant, columns) ||
    autoMatchColumn(name, columns) ||
    (MEDIA_COLUMN_ALIASES[variant] ?? []).reduce<string>(
      (found, alias) => found || autoMatchColumn(alias, columns),
      '',
    )
  );
}
