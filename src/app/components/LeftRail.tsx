import {
  Plus, Layers, Palette, Upload, Settings,
  Clock, ArrowLeft,
} from 'lucide-react';
import { FitScreenIcon } from './icons/FitScreenIcon';
import { useDesignWorkspace, LeftRailItem } from '../store/useDesignWorkspaceStore';

interface NavItem {
  id: LeftRailItem;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'insert',    icon: <Plus size={18} />,            label: 'Insert'    },
  { id: 'layers',    icon: <Layers size={18} />,          label: 'Layers'    },
  { id: 'brandKit',  icon: <Palette size={18} />,         label: 'Brand Kit' },
  { id: 'configure', icon: <FitScreenIcon size={18} />,   label: 'Configure' },
  { id: 'export',    icon: <Upload size={18} />,          label: 'Export'    },
  { id: 'settings',  icon: <Settings size={18} />,        label: 'Settings'  },
];

export function LeftRail() {
  const { activePanel, setActivePanel, selectElement, isTimelineVisible, setIsTimelineVisible } = useDesignWorkspace();

  return (
    <div className="flex flex-col items-center bg-[#E8E8E8] w-[64px] h-full py-2 shrink-0 z-30">
      {/* Exit */}
      <button
        className="flex flex-col items-center gap-1 py-2 px-1 w-full hover:bg-[#DCDCDC] transition-colors mb-2"
        title="Exit Design Workspace"
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-[#DCDCDC] transition-colors">
          <ArrowLeft size={16} className="text-[#6B6B6B]" />
        </div>
        <span className="text-[8px] text-[#6B6B6B] text-center leading-tight font-medium px-1">Exit<br/>Workspace</span>
      </button>

      <div className="w-8 h-px bg-[#D0D0D0] mb-2" />

      {/* Nav items */}
      <div className="flex flex-col items-center gap-0.5 flex-1 w-full px-1">
        {navItems.map(item => {
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActivePanel(item.id);
                // Configure and Settings live in the right panel — clear any canvas
                // selection so they are never masked by the Properties panel.
                if (item.id === 'configure' || item.id === 'settings') {
                  selectElement(null);
                }
              }}
              className={`flex flex-col items-center gap-1 py-2 w-full rounded-xl transition-colors ${
                isActive ? 'bg-[rgba(91,78,255,0.12)]' : 'hover:bg-[#DCDCDC]'
              }`}
              title={item.label}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${isActive ? 'text-[#5B4EFF]' : 'text-[#6B6B6B]'}`}>
                {item.icon}
              </div>
              <span className={`text-[8.5px] text-center leading-tight font-medium ${isActive ? 'text-[#5B4EFF]' : 'text-[#6B6B6B]'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="w-8 h-px bg-[#D0D0D0] mt-2 mb-2" />

      {/* Timeline toggle */}
      <button
        onClick={() => setIsTimelineVisible(!isTimelineVisible)}
        className={`flex flex-col items-center gap-1 py-2 px-1 w-full rounded-xl transition-colors ${
          isTimelineVisible ? 'bg-[rgba(91,78,255,0.12)]' : 'hover:bg-[#DCDCDC]'
        }`}
        title="Toggle Timeline"
      >
        <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${isTimelineVisible ? 'text-[#5B4EFF]' : 'text-[#6B6B6B]'}`}>
          <Clock size={18} />
        </div>
        <span className={`text-[8.5px] text-center leading-tight font-medium ${isTimelineVisible ? 'text-[#5B4EFF]' : 'text-[#6B6B6B]'}`}>
          Timeline
        </span>
      </button>
    </div>
  );
}