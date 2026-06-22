import { ArrowLeft, Plus, Palette, Terminal, Settings, Upload } from 'lucide-react';
import { Code2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { useHtmlEditor, HtmlRailItem } from './store/useHtmlEditorStore';
import { FitScreenIcon } from '../components/icons/FitScreenIcon';

interface RailItem {
  id: HtmlRailItem;
  icon: React.ReactNode;
  label: string;
}

const railItems: RailItem[] = [
  { id: 'code',          icon: <Code2 size={18} />,         label: 'Code'           },
  { id: 'insert',        icon: <Plus size={18} />,           label: 'Insert'         },
  { id: 'brandKit',      icon: <Palette size={18} />,        label: 'Brand Kit'      },
  { id: 'promptLibrary', icon: <Terminal size={18} />,       label: 'Prompt Library' },
  { id: 'settings',      icon: <Settings size={18} />,       label: 'Settings'       },
  { id: 'configure',     icon: <FitScreenIcon size={18} />,  label: 'Configure'      },
  { id: 'export',        icon: <Upload size={18} />,         label: 'Export'         },
];

export function HtmlEditorLeftRail() {
  const { activeRailItem, setActiveRailItem } = useHtmlEditor();

  return (
    <TooltipProvider delayDuration={400}>
      <div
        className="flex flex-col items-center w-[72px] h-full py-2 shrink-0 z-30"
        role="navigation"
        aria-label="HTML Editor navigation"
      >
        {/* Exit */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="flex flex-col items-center gap-1 py-2 px-1 w-full hover:bg-[#F5F5F5] transition-colors mb-2"
              aria-label="Exit Design Workspace"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl">
                <ArrowLeft size={16} className="text-[#6B6B6B]" />
              </div>
              <span className="text-[8px] text-[#6B6B6B] text-center leading-tight font-medium px-1">
                Exit Design<br />Workspace
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Exit Design Workspace</TooltipContent>
        </Tooltip>

        <div className="w-8 h-px bg-[#E2E2E2] mb-2" />

        {/* Nav items */}
        <div className="flex flex-col items-center gap-0.5 flex-1 w-full px-1">
          {railItems.map(item => {
            const isActive = activeRailItem === item.id;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveRailItem(item.id)}
                    aria-pressed={isActive}
                    aria-label={item.label}
                    className={`flex flex-col items-center gap-1 py-2 w-full rounded-xl transition-colors ${
                      isActive
                        ? 'bg-[rgba(91,78,255,0.12)]'
                        : 'hover:bg-[#F5F5F5]'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-xl ${
                        isActive ? 'text-[#5B4EFF]' : 'text-[#6B6B6B]'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span
                      className={`text-[8.5px] text-center leading-tight font-medium ${
                        isActive ? 'text-[#5B4EFF]' : 'text-[#6B6B6B]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
