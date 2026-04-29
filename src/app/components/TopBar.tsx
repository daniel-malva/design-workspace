import { useState } from 'react';
import { ChevronRight, ChevronDown, Cloud, RefreshCw, Save } from 'lucide-react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';

export function TopBar() {
  const { templateName, isPreviewMode, setIsPreviewMode } = useDesignWorkspace();
  const [saveDropdownOpen, setSaveDropdownOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex items-center justify-between h-12 px-4 bg-white border-b border-[rgba(0,0,0,0.08)] shrink-0 z-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-[#686576] tracking-wide">Design Workspace</span>
        <ChevronRight size={12} className="text-[#686576]" />
        <span className="text-[11px] text-[#1f1d25] tracking-wide">{templateName}</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Preview Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#686576]">Preview Mode</span>
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
              isPreviewMode ? 'bg-[#473bab]' : 'bg-[rgba(17,16,20,0.20)]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                isPreviewMode ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Save Split Button */}
        <div className="flex items-center relative">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-[#473bab] hover:bg-[#3b30a0] text-white text-[12px] font-medium px-3 py-1.5 rounded-l-lg transition-colors"
          >
            <Cloud size={14} />
            {saved ? 'Saved!' : 'Save'}
          </button>
          <button
            onClick={() => setSaveDropdownOpen(!saveDropdownOpen)}
            className="flex items-center bg-[#473bab] hover:bg-[#3b30a0] text-white px-1.5 py-1.5 rounded-r-lg border-l border-[rgba(255,255,255,0.25)] transition-colors"
          >
            <ChevronDown size={14} />
          </button>

          {saveDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-[rgba(0,0,0,0.08)] py-1 w-48 z-50">
              <button
                onClick={() => { handleSave(); setSaveDropdownOpen(false); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-[#1f1d25] hover:bg-[rgba(17,16,20,0.06)] transition-colors"
              >
                <Save size={13} className="text-[#686576]" />
                Save new version
              </button>
              <button
                onClick={() => setSaveDropdownOpen(false)}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-[#1f1d25] hover:bg-[rgba(17,16,20,0.06)] transition-colors"
              >
                <RefreshCw size={13} className="text-[#686576]" />
                Push changes
              </button>
            </div>
          )}
        </div>

        {/* Extra action buttons */}
        <div className="flex items-center gap-1">
          {[
            { icon: '⚙', title: 'Settings' },
            { icon: '↩', title: 'Undo' },
            { icon: '↪', title: 'Redo' },
          ].map((btn, i) => (
            <button
              key={i}
              title={btn.title}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[rgba(17,16,20,0.06)] text-[14px] text-[#686576] transition-colors"
            >
              {btn.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
