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
        {/* Save split button — pill shape, primary outlined from Figma */}
        <div className="relative flex rounded-[100px] border border-[rgba(99,86,225,0.5)] overflow-hidden">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-[10px] py-[4px] text-[13px] font-medium capitalize text-[#473bab] hover:bg-[rgba(99,86,225,0.06)] transition-colors"
          >
            <Cloud size={14} />
            {saving ? 'Saved!' : 'Save'}
          </button>
          <div className="w-px bg-[rgba(99,86,225,0.5)]" />
          <button
            onClick={() => setOpen(o => !o)}
            aria-label="More save options"
            className="flex items-center px-2 py-[4px] text-[#473bab] hover:bg-[rgba(99,86,225,0.06)] transition-colors"
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
              className="relative flex items-center justify-center p-[5px] rounded-full border border-[rgba(99,86,225,0.5)] text-[#473bab] hover:bg-[rgba(99,86,225,0.06)] transition-colors"
            >
              <CloudUpload size={20} />
              {/* Badge dot */}
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-[#473bab]" />
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
      {/* Pane: px-16 pb-16, no overflow-hidden (allows save dropdown to escape) */}
      <div className="relative flex flex-col w-full h-full bg-white rounded-[16px] px-[16px] pb-[16px]">
        {/* Header — pt-12 pb-8, no border-b */}
        <div className="flex items-center justify-between pt-[12px] pb-[8px] shrink-0">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleCodePanel}
                  aria-label={codePanelVisible ? 'Hide code panel' : 'Show code panel'}
                  aria-pressed={codePanelVisible}
                  className="flex items-center justify-center p-[5px] rounded-full text-[#6B6B6B] hover:bg-[rgba(0,0,0,0.05)] transition-colors"
                >
                  <PanelLeft size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Toggle code panel</TooltipContent>
            </Tooltip>
            <span className="text-[16px] font-medium tracking-[0.15px] text-[#1f1d25]">Preview</span>
          </div>
          <SaveSplitButton />
        </div>

        {/* Preview area — zoom toolbar floats at bottom-left */}
        <div className="relative flex flex-col flex-1 min-h-0">
          <HtmlTemplatePreview />
          <div className="absolute bottom-[20px] left-[20px] z-10">
            <HtmlPreviewToolbar />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
