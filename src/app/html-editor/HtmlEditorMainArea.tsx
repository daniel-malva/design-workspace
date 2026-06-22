import { PanelLeft, Cloud, ChevronDown, CloudUpload } from 'lucide-react';
import { useState } from 'react';
import { HtmlTemplatePreview } from './HtmlTemplatePreview';
import { HtmlPreviewToolbar } from './HtmlPreviewToolbar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

interface Props {
  codePanelVisible: boolean;
  onToggleCodePanel: () => void;
}

function SaveSplitButton() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleSave() {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
    setOpen(false);
  }

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex items-center gap-2">
        {/* Save split button — outlined primary style from Figma */}
        <div className="relative flex rounded-lg border border-[#5B4EFF] overflow-hidden">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#5B4EFF] hover:bg-[rgba(91,78,255,0.06)] transition-colors"
          >
            <Cloud size={13} />
            {saving ? 'Saved!' : 'Save'}
          </button>
          <div className="w-px bg-[#5B4EFF] opacity-30" />
          <button
            onClick={() => setOpen(o => !o)}
            aria-label="More save options"
            className="flex items-center px-2 py-1.5 text-[#5B4EFF] hover:bg-[rgba(91,78,255,0.06)] transition-colors"
          >
            <ChevronDown size={12} />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-[#E2E2E2] py-1 w-44 z-50">
              <button
                onClick={handleSave}
                className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-[#1f1d25] hover:bg-[#F5F5F5] transition-colors"
              >
                Save new version
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-[#1f1d25] hover:bg-[#F5F5F5] transition-colors"
              >
                Push changes
              </button>
            </div>
          )}
        </div>

        {/* Cloud upload with badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Publish"
              className="relative flex items-center justify-center w-8 h-8 rounded-full border border-[#5B4EFF] text-[#5B4EFF] hover:bg-[rgba(91,78,255,0.06)] transition-colors"
            >
              <CloudUpload size={14} />
              {/* Badge dot */}
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-[#5B4EFF]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Publish</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export function HtmlEditorMainArea({ codePanelVisible, onToggleCodePanel }: Props) {
  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex flex-col w-full h-full bg-white rounded-[16px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E2E2] shrink-0">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleCodePanel}
                  aria-label={codePanelVisible ? 'Hide code panel' : 'Show code panel'}
                  aria-pressed={codePanelVisible}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-[#6B6B6B] hover:bg-[#F5F5F5] transition-colors"
                >
                  <PanelLeft size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Toggle code panel</TooltipContent>
            </Tooltip>
            <span className="text-[13px] font-semibold text-[#1f1d25]">Preview</span>
          </div>
          <SaveSplitButton />
        </div>

        {/* Preview + Zoom toolbar */}
        <div className="flex flex-col flex-1 min-h-0">
          <HtmlTemplatePreview />
          <HtmlPreviewToolbar />
        </div>
      </div>
    </TooltipProvider>
  );
}
