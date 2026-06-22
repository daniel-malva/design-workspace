import { useState } from 'react';
import { HtmlEditorProvider } from './store/useHtmlEditorStore';
import { HtmlEditorLeftRail } from './HtmlEditorLeftRail';
import { HtmlCodePanel } from './HtmlCodePanel';
import { HtmlEditorMainArea } from './HtmlEditorMainArea';
import { HtmlAgentPanel } from './HtmlAgentPanel';

function HtmlEditorShell() {
  const [codePanelVisible, setCodePanelVisible] = useState(true);

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-[#f0f2f4]">
      {/* Left Rail — transparent, no border, 72px wide */}
      <HtmlEditorLeftRail />

      {/* Body area — gap-[8px] from nav rail, py-[8px] top/bottom, pr-[8px] right */}
      <div className="flex flex-1 min-w-0 items-start gap-[16px] py-[8px] pr-[8px] h-full">
        {/* Code panel — shown when Code is active */}
        {codePanelVisible && <HtmlCodePanel />}

        {/* Main preview area */}
        <HtmlEditorMainArea
          codePanelVisible={codePanelVisible}
          onToggleCodePanel={() => setCodePanelVisible(v => !v)}
        />

        {/* Agent panel */}
        <HtmlAgentPanel />
      </div>
    </div>
  );
}

export function HtmlEditorWorkspace() {
  return (
    <HtmlEditorProvider>
      <HtmlEditorShell />
    </HtmlEditorProvider>
  );
}
