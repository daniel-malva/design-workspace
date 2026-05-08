import { DesignWorkspaceProvider, useDesignWorkspace } from './store/useDesignWorkspaceStore';
import { LeftRail } from './components/LeftRail';
import { LeftPane } from './components/LeftPane';
import { CanvasArea } from './components/CanvasArea';
import { RightPanel } from './components/RightPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { Timeline } from './components/Timeline';
import { useInsertMenuShortcuts } from './hooks/useInsertMenuShortcuts';
import { useCanvasKeyboardShortcuts } from './hooks/useCanvasKeyboardShortcuts';

function DesignWorkspaceLayout() {
  // Global keyboard shortcuts — mounted once, inside provider (has store access)
  useInsertMenuShortcuts();
  useCanvasKeyboardShortcuts();

  const { isPreviewMode } = useDesignWorkspace();

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      {/* Left Rail — always visible, fixed width */}
      <LeftRail />

      {/* Canvas region — all overlays live here as absolute children */}
      <div
        className="relative flex-1 overflow-hidden transition-colors duration-300 ease-in-out"
        style={{ backgroundColor: isPreviewMode ? '#888888' : '#E8E8E8' }}
      >
        {/* Infinite pan/zoom canvas */}
        <CanvasArea />

        {/* Floating left pane */}
        <LeftPane />

        {/* Floating right panel — hidden when preview mode is active */}
        <RightPanel />

        {/* Preview panel — shown when preview mode is active */}
        <PreviewPanel />

        {/* Floating timeline — bottom, between LeftPane and RightPanel */}
        <Timeline />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DesignWorkspaceProvider>
      <DesignWorkspaceLayout />
    </DesignWorkspaceProvider>
  );
}