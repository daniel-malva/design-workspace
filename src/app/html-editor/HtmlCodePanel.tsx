import { Suspense, lazy, useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TooltipProvider } from '../components/ui/tooltip';
import { useHtmlEditor } from './store/useHtmlEditorStore';
import type { ActiveFile } from './store/useHtmlEditorStore';
import {
  CodeEditorThemeToggle,
  MONACO_THEME,
  CODE_PANEL_TOKENS,
  loadCodeEditorTheme,
  saveCodeEditorTheme,
  type CodeEditorTheme,
} from './CodeEditorThemeToggle';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

// ─── File definitions ─────────────────────────────────────────────

const FILES: { key: ActiveFile; label: string; lang: string; badge: string; badgeBg: string; badgeText: string }[] = [
  { key: 'html', label: 'index.html', lang: 'html',       badge: 'HTML', badgeBg: '#E34F26', badgeText: '#fff' },
  { key: 'css',  label: 'styles.css', lang: 'css',        badge: 'CSS',  badgeBg: '#264DE4', badgeText: '#fff' },
  { key: 'js',   label: 'script.js',  lang: 'javascript', badge: 'JS',   badgeBg: '#F0DB4F', badgeText: '#333' },
];

// ─── Subcomponents ────────────────────────────────────────────────

function FileBadge({ badge, badgeBg, badgeText }: { badge: string; badgeBg: string; badgeText: string }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[3px] px-[4px] py-[1px] text-[9px] font-bold leading-none shrink-0"
      style={{ background: badgeBg, color: badgeText, minWidth: 28 }}
    >
      {badge}
    </span>
  );
}

function FileSelector({
  activeFile,
  onSelect,
  theme,
}: {
  activeFile: ActiveFile;
  onSelect: (f: ActiveFile) => void;
  theme: CodeEditorTheme;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tokens = CODE_PANEL_TOKENS[theme];
  const current = FILES.find(f => f.key === activeFile)!;

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', handle);
    return () => window.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger — filename + inline chevron */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex items-center gap-[4px] text-[13px] font-semibold ${tokens.headerText} hover:opacity-75 transition-opacity`}
      >
        {current.label}
        {open ? <ChevronUp size={13} className={tokens.chevronColor} /> : <ChevronDown size={13} className={tokens.chevronColor} />}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 w-[200px] bg-white rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-[rgba(0,0,0,0.06)] py-1 z-50 overflow-hidden">
          <p className="px-3 pt-2 pb-1 text-[11px] text-[#9c99a9] font-normal select-none">Select file</p>
          <ul role="listbox">
            {FILES.map(f => (
              <li key={f.key} role="option" aria-selected={f.key === activeFile}>
                <button
                  onClick={() => { onSelect(f.key); setOpen(false); }}
                  className={`flex w-full items-center gap-[10px] px-3 py-[9px] text-[14px] transition-colors ${
                    f.key === activeFile
                      ? 'bg-[rgba(99,86,225,0.07)] text-[#1f1d25]'
                      : 'text-[#1f1d25] hover:bg-[#F5F5F5]'
                  }`}
                >
                  <FileBadge badge={f.badge} badgeBg={f.badgeBg} badgeText={f.badgeText} />
                  <span className="font-normal">{f.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CodeEditorSkeleton({ theme }: { theme: CodeEditorTheme }) {
  const tokens = CODE_PANEL_TOKENS[theme];
  return (
    <div className={`flex-1 ${tokens.skeletonBg} flex items-center justify-center`}>
      <div className={`${tokens.skeletonText} text-xs font-mono`}>Loading editor…</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────

export function HtmlCodePanel() {
  const { document, cssContent, jsContent, activeFile, setActiveFile, setFileContent } = useHtmlEditor();
  const [codeEditorTheme, setCodeEditorTheme] = useState<CodeEditorTheme>(loadCodeEditorTheme);

  function handleThemeChange(theme: CodeEditorTheme) {
    setCodeEditorTheme(theme);
    saveCodeEditorTheme(theme);
  }

  const tokens = CODE_PANEL_TOKENS[codeEditorTheme];
  const fileDef = FILES.find(f => f.key === activeFile)!;

  const currentContent =
    activeFile === 'html' ? document.html :
    activeFile === 'css'  ? cssContent :
    jsContent;

  return (
    <TooltipProvider delayDuration={400}>
      <div
        className={`flex flex-col h-full w-full ${tokens.panelBg} rounded-[16px] transition-colors`}
      >
        {/* Header */}
        <div className={`flex items-center gap-2 px-4 py-3 border-b ${tokens.border} shrink-0`}>
          {/* File selector — title + inline chevron */}
          <FileSelector activeFile={activeFile} onSelect={setActiveFile} theme={codeEditorTheme} />

          <div className="flex-1" />

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
              key={activeFile}
              height="100%"
              language={fileDef.lang}
              theme={MONACO_THEME[codeEditorTheme]}
              value={currentContent}
              onChange={value => { if (value !== undefined) setFileContent(activeFile, value); }}
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
              aria-label={`${fileDef.label} code editor`}
            />
          </Suspense>
        </div>
      </div>
    </TooltipProvider>
  );
}
