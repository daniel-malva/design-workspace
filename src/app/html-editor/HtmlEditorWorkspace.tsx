import { useState, useRef, useEffect, useCallback } from 'react';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '../components/ui/resizable';
import { HtmlEditorProvider } from './store/useHtmlEditorStore';
import { HtmlEditorLeftRail } from './HtmlEditorLeftRail';
import { HtmlCodePanel } from './HtmlCodePanel';
import { HtmlEditorMainArea } from './HtmlEditorMainArea';
import { HtmlAgentPanel } from './HtmlAgentPanel';

const PANEL_STORAGE_KEY = 'html-editor-panels';
const MIN_PX = 280;
const LEFT_DEFAULT_PX = 320;
const RIGHT_DEFAULT_PX = 320;
// Two 16px handles consume 32px of the panel group width
const HANDLE_TOTAL_PX = 32;

function pct(px: number, available: number) {
  return (px / available) * 100;
}

function computePcts(containerWidth: number) {
  const space = Math.max(containerWidth - HANDLE_TOTAL_PX, MIN_PX * 3);
  const left = pct(LEFT_DEFAULT_PX, space);
  const right = pct(RIGHT_DEFAULT_PX, space);
  return {
    left,
    right,
    main: 100 - left - right,
    min: pct(MIN_PX, space),
  };
}

function HtmlEditorShell() {
  const [codePanelVisible, setCodePanelVisible] = useState(false);
  const codePanelRef = useRef<ImperativePanelHandle>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const [pcts, setPcts] = useState(() =>
    computePcts(
      typeof window !== 'undefined'
        ? window.innerWidth - 72 - 8 // minus rail, minus pr-[8px]
        : 1456,
    ),
  );

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setPcts(computePcts(entry.contentRect.width)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Always start with code panel collapsed
  useEffect(() => {
    codePanelRef.current?.collapse();
  }, []);

  const handleToggleCodePanel = useCallback(() => {
    const panel = codePanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
      setCodePanelVisible(true);
    } else {
      panel.collapse();
      setCodePanelVisible(false);
    }
  }, []);

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-[#f0f2f4]">
      {/* Left Rail — transparent, 72px */}
      <HtmlEditorLeftRail onToggleCodePanel={handleToggleCodePanel} codePanelVisible={codePanelVisible} />

      {/* Body area: 8px top/bottom padding, 8px right — panels go inside */}
      <div ref={bodyRef} className="flex-1 min-w-0 py-[8px] pr-[8px] h-full">
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId={PANEL_STORAGE_KEY}
          className="h-full"
        >
          {/* ── Left / Code Panel ──────────────────────────────────── */}
          <ResizablePanel
            ref={codePanelRef}
            id="code-panel"
            order={1}
            defaultSize={pcts.left}
            minSize={pcts.min}
            collapsible
            collapsedSize={0}
            onCollapse={() => setCodePanelVisible(false)}
            onExpand={() => setCodePanelVisible(true)}
          >
            <HtmlCodePanel />
          </ResizablePanel>

          {/* 16px gap between code and preview */}
          <ResizableHandle className="w-4 bg-transparent cursor-col-resize hover:bg-[rgba(0,0,0,0.03)] data-[resize-handle-active]:bg-[rgba(91,78,255,0.08)] transition-colors" />

          {/* ── Center / Preview Panel ──────────────────────────────── */}
          <ResizablePanel
            id="main-panel"
            order={2}
            defaultSize={pcts.main}
            minSize={pcts.min}
          >
            <HtmlEditorMainArea
              codePanelVisible={codePanelVisible}
              onToggleCodePanel={handleToggleCodePanel}
            />
          </ResizablePanel>

          {/* 16px gap between preview and agent */}
          <ResizableHandle className="w-4 bg-transparent cursor-col-resize hover:bg-[rgba(0,0,0,0.03)] data-[resize-handle-active]:bg-[rgba(91,78,255,0.08)] transition-colors" />

          {/* ── Right / Agent Panel ─────────────────────────────────── */}
          <ResizablePanel
            id="agent-panel"
            order={3}
            defaultSize={pcts.right}
            minSize={pcts.min}
          >
            <HtmlAgentPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
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
