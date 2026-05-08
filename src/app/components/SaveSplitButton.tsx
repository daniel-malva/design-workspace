import { useState } from 'react';
import { Cloud, Save, RefreshCw, ChevronDown } from 'lucide-react';

export function SaveSplitButton() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="relative flex">
      <button
        onClick={handleSave}
        className="flex items-center gap-1.5 bg-[#5B4EFF] hover:bg-[#4a3ee0] text-white text-[11px] font-medium pl-3 pr-2 py-1.5 rounded-l-lg transition-colors"
      >
        <Cloud size={12} />
        {saved ? 'Saved!' : 'Save'}
      </button>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center bg-[#5B4EFF] hover:bg-[#4a3ee0] text-white px-1.5 py-1.5 rounded-r-lg border-l border-white/25 transition-colors"
      >
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-[#E2E2E2] py-1 w-48 z-50">
          <button onClick={() => { handleSave(); setOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-[#111111] hover:bg-[#f5f5f5] transition-colors">
            <Save size={12} className="text-[#6B6B6B]" /> Save new version
          </button>
          <button onClick={() => setOpen(false)} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-[#111111] hover:bg-[#f5f5f5] transition-colors">
            <RefreshCw size={12} className="text-[#6B6B6B]" /> Push changes
          </button>
        </div>
      )}
    </div>
  );
}
