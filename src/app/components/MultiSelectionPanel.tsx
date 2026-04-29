import { Group } from 'lucide-react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import { RightPanelHeader } from './RightPanelHeader';
import { Separator } from './ui/separator';
import { Input } from './ui/input';

// ─────────────────────────────────────────────────────────────────────────────
// MultiSelectionPanel — shown in RightPanel when ≥ 2 elements are selected
//
// Displays:
//   • Position section: X, Y of the unified bounding box origin
//   • Size section: W, H of the unified bounding box (proportional scale)
//   • Opacity: uniform if all equal, "Mixed" otherwise
//   • Selection: chips listing the type of each selected element
//
// Header has a "Group" shortcut button (same as Cmd+G).
// ─────────────────────────────────────────────────────────────────────────────

const elementTypeLabel: Record<string, string> = {
  'text-header':            'Header',
  'text-subheader':         'Subheader',
  'text-body':              'Body',
  'text-template':          'Text',
  'placeholder-logo':       'Logo',
  'placeholder-background': 'Background',
  'placeholder-jellybean':  'Jellybean',
  'placeholder-media':      'Media',
  'placeholder-audio':      'Audio',
  'shape':                  'Shape',
  'icon':                   'Icon',
  'line':                   'Line',
  'group':                  'Group',
};

// ─── GroupAxisField ───────────────────────────────────────────────────────────
// A labelled numeric input for bounding-box axis editing.

function GroupAxisField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-1 items-center gap-0 min-w-0">
      {/* Label column */}
      <div className="w-8 shrink-0 flex items-center justify-center h-9">
        <span className="text-[12px] text-[#1f1d25] tracking-[0.17px] text-center">
          {label}
        </span>
      </div>
      <Input
        className="flex-1 min-w-0 h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px] text-[#1f1d25]"
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export function MultiSelectionPanel() {
  const {
    selectedElementIds,
    canvasElements,
    updateElement,
    groupElements,
  } = useDesignWorkspace();

  const selected = canvasElements.filter(el => selectedElementIds.includes(el.id));
  if (selected.length < 2) return null;

  // ── Unified bounding box ────────────────────────────────────────
  const minX   = Math.min(...selected.map(el => el.x));
  const minY   = Math.min(...selected.map(el => el.y));
  const maxX   = Math.max(...selected.map(el => el.x + el.width));
  const maxY   = Math.max(...selected.map(el => el.y + el.height));
  const groupW = maxX - minX;
  const groupH = maxY - minY;

  // ── Opacity ──────────────────────────────────────────────────────
  const opacities      = selected.map(el => el.style?.opacity ?? 1);
  const allSameOpacity = opacities.every(o => o === opacities[0]);
  const opacityDisplay = allSameOpacity
    ? `${Math.round(opacities[0] * 100)}`
    : 'Mixed';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <RightPanelHeader
        title={`${selected.length} elements`}
        actions={
          <button
            onClick={() => groupElements(selectedElementIds)}
            className="flex items-center gap-1 text-xs text-[#473bab] hover:text-[#5B4EFF] font-medium transition-colors"
            title="Group (⌘G)"
          >
            <Group size={13} />
            Group
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
        <div className="flex flex-col gap-4 w-full">

          {/* ── Position ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-2 w-full">
            <p className="text-[12px] font-medium text-[#1f1d25] tracking-[0.1px]">
              Position
            </p>

            {/* X / Y */}
            <div className="flex items-center gap-1 w-full">
              <GroupAxisField
                label="X"
                value={Math.round(minX)}
                onChange={newX => {
                  const diff = newX - minX;
                  selected.forEach(el => updateElement(el.id, { x: el.x + diff }));
                }}
              />
              <GroupAxisField
                label="Y"
                value={Math.round(minY)}
                onChange={newY => {
                  const diff = newY - minY;
                  selected.forEach(el => updateElement(el.id, { y: el.y + diff }));
                }}
              />
            </div>

            {/* W / H */}
            <div className="flex items-center gap-1 w-full">
              <GroupAxisField
                label="W"
                value={Math.round(groupW)}
                onChange={newW => {
                  if (newW < 1) return;
                  const scaleX = newW / groupW;
                  selected.forEach(el =>
                    updateElement(el.id, {
                      x:     minX + (el.x - minX) * scaleX,
                      width: Math.max(1, el.width * scaleX),
                    })
                  );
                }}
              />
              <GroupAxisField
                label="H"
                value={Math.round(groupH)}
                onChange={newH => {
                  if (newH < 1) return;
                  const scaleY = newH / groupH;
                  selected.forEach(el =>
                    updateElement(el.id, {
                      y:      minY + (el.y - minY) * scaleY,
                      height: Math.max(1, el.height * scaleY),
                    })
                  );
                }}
              />
            </div>
          </div>

          <Separator />

          {/* ── Layer / Opacity ───────────────────────────────────── */}
          <div className="flex flex-col gap-2 w-full">
            <p className="text-[12px] font-medium text-[#1f1d25] tracking-[0.1px]">
              Layer
            </p>
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-[#686576] w-14 shrink-0">Opacity %</span>
              <Input
                className="flex-1 min-w-0 h-9 py-1.5 px-2 text-xs bg-[#f9fafa] border border-[#dddce0] rounded-[4px] text-[#1f1d25]"
                type={allSameOpacity ? 'number' : 'text'}
                value={opacityDisplay}
                min={0}
                max={100}
                onChange={e => {
                  const val = parseFloat(e.target.value) / 100;
                  if (!isNaN(val)) {
                    selected.forEach(el =>
                      updateElement(el.id, {
                        style: { ...el.style, opacity: Math.min(1, Math.max(0, val)) },
                      })
                    );
                  }
                }}
              />
            </div>
          </div>

          <Separator />

          {/* ── Selection chips ───────────────────────────────────── */}
          <div className="flex flex-col gap-2 w-full">
            <p className="text-[12px] font-medium text-[#1f1d25] tracking-[0.1px]">
              Selection
            </p>
            <div className="flex flex-wrap gap-1 w-full">
              {selected.map(el => (
                <span
                  key={el.id}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-[rgba(91,78,255,0.07)] text-[#473bab]"
                >
                  {elementTypeLabel[el.type] ?? el.type}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
