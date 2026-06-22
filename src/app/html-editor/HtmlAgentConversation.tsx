import { useEffect, useRef } from 'react';
import { ScrollArea } from '../components/ui/scroll-area';
import { useHtmlEditor, AgentMessage } from './store/useHtmlEditorStore';

function AgentMessageBubble({ message }: { message: AgentMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
          isUser
            ? 'bg-[#5B4EFF] text-white rounded-br-sm'
            : 'bg-[#F0F0F3] text-[#1f1d25] rounded-bl-sm'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <p className="text-[13px] text-[#9c99a9] leading-relaxed">
        Ask the Platform Agent to create or modify your HTML template.
      </p>
    </div>
  );
}

function GeneratingIndicator() {
  return (
    <div className="flex justify-start px-4">
      <div className="flex items-center gap-1.5 bg-[#F0F0F3] rounded-2xl rounded-bl-sm px-4 py-2.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#9c99a9] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function HtmlAgentConversation() {
  const { agentMessages, status } = useHtmlEditor();
  const bottomRef = useRef<HTMLDivElement>(null);
  const isGenerating = status === 'generating';

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages, isGenerating]);

  if (agentMessages.length === 0 && !isGenerating) {
    return <EmptyState />;
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="flex flex-col gap-3 py-4">
        {agentMessages.map(msg => (
          <AgentMessageBubble key={msg.id} message={msg} />
        ))}
        {isGenerating && <GeneratingIndicator />}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
