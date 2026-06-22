import { Suspense, lazy } from 'react';
import { ChevronDown } from 'lucide-react';
import { useHtmlEditor } from './store/useHtmlEditorStore';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

function CodeEditorSkeleton() {
  return (
    <div className="flex-1 bg-[#1e1e1e] flex items-center justify-center">
      <div className="text-[#6B6B6B] text-xs font-mono">Loading editor…</div>
    </div>
  );
}

export function HtmlCodePanel() {
  const { document, setHtml } = useHtmlEditor();

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-r border-[#333] w-[320px] shrink-0">
      {/* Header */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-[#333] shrink-0">
        <span className="text-[13px] font-medium text-[#d4d4d4]">{document.name}</span>
        <ChevronDown size={14} className="text-[#6B6B6B]" />
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Suspense fallback={<CodeEditorSkeleton />}>
          <MonacoEditor
            height="100%"
            language="html"
            theme="vs-dark"
            value={document.html}
            onChange={value => { if (value !== undefined) setHtml(value); }}
            options={{
              fontSize: 12,
              fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
              lineNumbers: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'off',
              tabSize: 2,
              renderLineHighlight: 'line',
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              scrollbar: {
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
              },
              padding: { top: 8, bottom: 8 },
            }}
            aria-label="HTML code editor"
          />
        </Suspense>
      </div>
    </div>
  );
}
