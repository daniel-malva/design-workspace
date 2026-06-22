import { Suspense, lazy, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TooltipProvider } from '../components/ui/tooltip';
import { useHtmlEditor } from './store/useHtmlEditorStore';
import {
  CodeEditorThemeToggle,
  MONACO_THEME,
  CODE_PANEL_TOKENS,
  loadCodeEditorTheme,
  saveCodeEditorTheme,
  type CodeEditorTheme,
} from './CodeEditorThemeToggle';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

function CodeEditorSkeleton({ theme }: { theme: CodeEditorTheme }) {
  const tokens = CODE_PANEL_TOKENS[theme];
  return (
    <div className={`flex-1 ${tokens.skeletonBg} flex items-center justify-center`}>
      <div className={`${tokens.skeletonText} text-xs font-mono`}>Loading editor…</div>
    </div>
  );
}

export function HtmlCodePanel() {
  const { document, setHtml } = useHtmlEditor();
  const [codeEditorTheme, setCodeEditorTheme] = useState<CodeEditorTheme>(loadCodeEditorTheme);

  function handleThemeChange(theme: CodeEditorTheme) {
    setCodeEditorTheme(theme);
    saveCodeEditorTheme(theme);
  }

  const tokens = CODE_PANEL_TOKENS[codeEditorTheme];

  return (
    <TooltipProvider delayDuration={400}>
      <div
        className={`flex flex-col h-full ${tokens.panelBg} border-r ${tokens.border} w-[320px] shrink-0 transition-colors`}
      >
        {/* Header */}
        <div className={`flex items-center gap-1 px-4 py-3 border-b ${tokens.border} shrink-0`}>
          {/* Filename + chevron */}
          <span className={`text-[13px] font-medium ${tokens.headerText} flex-1 truncate`}>
            {document.name}
          </span>
          <ChevronDown size={14} className={tokens.chevronColor} />

          {/* Theme toggle */}
          <CodeEditorThemeToggle
            theme={codeEditorTheme}
            onThemeChange={handleThemeChange}
          />
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <Suspense fallback={<CodeEditorSkeleton theme={codeEditorTheme} />}>
            <MonacoEditor
              height="100%"
              language="html"
              theme={MONACO_THEME[codeEditorTheme]}
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
    </TooltipProvider>
  );
}
