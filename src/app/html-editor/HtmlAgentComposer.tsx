import { ArrowUp, Paperclip, Monitor, ShieldCheck } from 'lucide-react';
import { useRef, KeyboardEvent } from 'react';
import { useHtmlEditor } from './store/useHtmlEditorStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

export function HtmlAgentComposer() {
  const { agentInput, setAgentInput, sendAgentMessage, status } = useHtmlEditor();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isGenerating = status === 'generating';

  function handleSubmit() {
    if (!agentInput.trim() || isGenerating) return;
    sendAgentMessage(agentInput);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <TooltipProvider delayDuration={400}>
      <div className="px-4 pb-4 shrink-0">
        <div className="rounded-2xl border border-[#E2E2E2] bg-[#F8F8FA] overflow-hidden">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={agentInput}
            onChange={e => setAgentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything"
            disabled={isGenerating}
            rows={2}
            aria-label="Message to agent"
            className="w-full px-4 pt-3 pb-1 text-[13px] text-[#1f1d25] placeholder:text-[#9c99a9] bg-transparent resize-none outline-none leading-relaxed disabled:opacity-50"
          />

          {/* Actions row */}
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Attach file"
                    disabled={isGenerating}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-[#6B6B6B] hover:bg-[#ECECF0] transition-colors disabled:opacity-40"
                  >
                    <Paperclip size={15} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Attach file</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Insert screenshot"
                    disabled={isGenerating}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-[#6B6B6B] hover:bg-[#ECECF0] transition-colors disabled:opacity-40"
                  >
                    <Monitor size={15} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Insert screenshot</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Compliance check"
                    disabled={isGenerating}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-[#6B6B6B] hover:bg-[#ECECF0] transition-colors disabled:opacity-40"
                  >
                    <ShieldCheck size={15} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Compliance check</TooltipContent>
              </Tooltip>
            </div>

            {/* Send button */}
            <button
              onClick={handleSubmit}
              disabled={!agentInput.trim() || isGenerating}
              aria-label="Send message"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-[#5B4EFF] text-white hover:bg-[#4a3ee0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
