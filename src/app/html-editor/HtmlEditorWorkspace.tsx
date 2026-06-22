import { useState } from 'react';
import { HtmlEditorProvider } from './store/useHtmlEditorStore';
import { HtmlEditorLeftRail } from './HtmlEditorLeftRail';
import { HtmlCodePanel } from './HtmlCodePanel';
import { HtmlEditorMainArea } from './HtmlEditorMainArea';
import { HtmlAgentPanel } from './HtmlAgentPanel';

function HtmlEditorShell() {
  const [codePanelVisible, setCodePanelVisible] = useState(true);

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-white">
      {/* Left Rail */}
      <HtmlEditorLeftRail />

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
  );
}

export function HtmlEditorWorkspace() {
  return (
    <HtmlEditorProvider>
      <HtmlEditorShell />
    </HtmlEditorProvider>
  );
}
