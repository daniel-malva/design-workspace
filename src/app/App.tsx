import { Routes, Route } from 'react-router';
import { DesignWorkspaceProvider } from './store/useDesignWorkspaceStore';
import { LeftRail } from './components/LeftRail';
import { LeftPane } from './components/LeftPane';
import { CanvasArea } from './components/CanvasArea';
import { RightPanel } from './components/RightPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { Timeline } from './components/Timeline';
import { useInsertMenuShortcuts } from './hooks/useInsertMenuShortcuts';
import { useCanvasKeyboardShortcuts } from './hooks/useCanvasKeyboardShortcuts';
import { HtmlEditorWorkspace } from './html-editor/HtmlEditorWorkspace';

function DesignWorkspaceLayout() {
  useInsertMenuShortcuts();
  useCanvasKeyboardShortcuts();

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <LeftRail />
      <div className="relative flex-1 overflow-hidden">
        <CanvasArea />
        <LeftPane />
        <RightPanel />
        <PreviewPanel />
        <Timeline />
      </div>
    </div>
  );
}

function CanvasEditorApp() {
  return (
    <DesignWorkspaceProvider>
      <DesignWorkspaceLayout />
    </DesignWorkspaceProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CanvasEditorApp />} />
      <Route path="/html-editor" element={<HtmlEditorWorkspace />} />
    </Routes>
  );
}
