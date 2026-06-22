import { ChevronDown, History, Expand, X } from 'lucide-react';
import { HtmlAgentConversation } from './HtmlAgentConversation';
import { HtmlAgentComposer } from './HtmlAgentComposer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

interface Props {
  onClose?: () => void;
}

export function HtmlAgentPanel({ onClose }: Props) {
  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex flex-col h-full w-[320px] shrink-0 border-l border-[#E2E2E2] bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E2E2] shrink-0">
          <button
            className="flex items-center gap-1 text-[13px] font-semibold text-[#1f1d25] hover:text-[#5B4EFF] transition-colors"
            aria-label="Platform Agent options"
          >
            Platform Agent
            <ChevronDown size={14} className="text-[#9c99a9]" />
          </button>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="View history"
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-[#6B6B6B] hover:bg-[#F5F5F5] transition-colors"
                >
                  <History size={15} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">History</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Expand panel"
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-[#6B6B6B] hover:bg-[#F5F5F5] transition-colors"
                >
                  <Expand size={15} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Expand</TooltipContent>
            </Tooltip>

            {onClose && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onClose}
                    aria-label="Close agent panel"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-[#6B6B6B] hover:bg-[#F5F5F5] transition-colors"
                  >
                    <X size={15} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Close</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Conversation */}
        <HtmlAgentConversation />

        {/* Composer */}
        <HtmlAgentComposer />
      </div>
    </TooltipProvider>
  );
}
