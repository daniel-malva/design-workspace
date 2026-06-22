import { Moon, Sun } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';

export type CodeEditorTheme = 'light' | 'dark';

interface Props {
  theme: CodeEditorTheme;
  onThemeChange: (theme: CodeEditorTheme) => void;
}

export function CodeEditorThemeToggle({ theme, onThemeChange }: Props) {
  const isLight = theme === 'light';
  const nextTheme: CodeEditorTheme = isLight ? 'dark' : 'light';
  const label = isLight ? 'Switch to dark mode' : 'Switch to light mode';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => onThemeChange(nextTheme)}
          aria-label={label}
          className={`
            flex items-center justify-center w-7 h-7 rounded-lg transition-colors
            ${isLight
              ? 'text-[#6B6B6B] hover:bg-[#F0F0F0]'
              : 'text-[#9c99a9] hover:bg-[rgba(255,255,255,0.08)]'
            }
          `}
        >
          {isLight ? <Moon size={14} /> : <Sun size={14} />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

// ─── Theme token map ──────────────────────────────────────────────

export const MONACO_THEME: Record<CodeEditorTheme, string> = {
  light: 'light',   // Monaco built-in VS Light
  dark:  'vs-dark', // Monaco built-in VS Dark
};

export const CODE_PANEL_TOKENS: Record<CodeEditorTheme, {
  panelBg: string;
  border: string;
  headerText: string;
  chevronColor: string;
  skeletonBg: string;
  skeletonText: string;
}> = {
  light: {
    panelBg:     'bg-white',
    border:      'border-[#E2E2E2]',
    headerText:  'text-[#1f1d25]',
    chevronColor:'text-[#9c99a9]',
    skeletonBg:  'bg-[#F8F8FA]',
    skeletonText:'text-[#9c99a9]',
  },
  dark: {
    panelBg:     'bg-[#1e1e1e]',
    border:      'border-[#333]',
    headerText:  'text-[#d4d4d4]',
    chevronColor:'text-[#6B6B6B]',
    skeletonBg:  'bg-[#1e1e1e]',
    skeletonText:'text-[#6B6B6B]',
  },
};

// ─── localStorage persistence ──────────────────────────────────────

const STORAGE_KEY = 'html-editor:code-theme';

export function loadCodeEditorTheme(): CodeEditorTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage unavailable (private browsing, SSR, etc.)
  }
  return 'light'; // default — never inherit system/app theme
}

export function saveCodeEditorTheme(theme: CodeEditorTheme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}
