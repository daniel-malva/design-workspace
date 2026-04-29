import { ReactNode } from 'react';
import { Separator } from './ui/separator';

// ─────────────────────────────────────────────────────────────────────────────
// RightPanelHeader — standardised header used by every RightPanel pane.
//
// Design tokens (Figma V32):
//   Title font  : Roboto Medium 14px (text-sm) tracking-[0.1px] leading-[1.57]
//   Padding     : px-4 py-3
//   Separator   : immediately below, m-0 (zero gap)
//   Actions slot: optional — each panel passes its own icon set unchanged
// ─────────────────────────────────────────────────────────────────────────────

interface RightPanelHeaderProps {
  title: string;
  /** Ícones específicos de cada painel — não mudam. */
  actions?: ReactNode;
}

export function RightPanelHeader({ title, actions }: RightPanelHeaderProps) {
  return (
    <>
      {/* Header row: title + optional action icons */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span
          className="text-sm font-medium text-[#1f1d25] tracking-[0.1px] leading-[1.57]"
          style={{ fontFamily: "'Roboto', sans-serif" }}
        >
          {title}
        </span>

        {/* Actions slot — rendered only when provided */}
        {actions && (
          <div className="flex items-center gap-1 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Separator — zero margin, flush below header */}
      <Separator className="w-full m-0 shrink-0" />
    </>
  );
}
