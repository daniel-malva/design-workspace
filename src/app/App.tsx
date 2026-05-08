import { DesignWorkspaceProvider } from './store/useDesignWorkspaceStore';
import { LeftRail } from './components/LeftRail';
import { LeftPane } from './components/LeftPane';
import { CanvasArea } from './components/CanvasArea';
import { RightPanel } from './components/RightPanel';
import { Timeline } from './components/Timeline';
import { useInsertMenuShortcuts } from './hooks/useInsertMenuShortcuts';
import { useCanvasKeyboardShortcuts } from './hooks/useCanvasKeyboardShortcuts';

function DesignWorkspaceLayout() {
  // Global keyboard shortcuts — mounted once, inside provider (has store access)
  useInsertMenuShortcuts();
  useCanvasKeyboardShortcuts();

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      {/* Left Rail — always visible, fixed width */}
      <LeftRail />

      {/* Canvas region — all overlays live here as absolute children */}
      <div className="relative flex-1 overflow-hidden bg-[#E8E8E8]">
        {/* Infinite pan/zoom canvas */}
        <CanvasArea />

        {/* Floating left pane */}
        <LeftPane />

        {/* Floating right panel */}
        <RightPanel />

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