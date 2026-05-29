import { Bot, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useEffect, useRef } from "react";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import LoadingSpinner from "../common/LoadingSpinner";

export default function ChatPanel({
  collapsed,
  onToggle,
  messages,
  sending,
  error,
  onSend,
  width
}) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-md border border-mint/40 bg-panel px-4 py-3 text-sm font-semibold text-mint shadow-glow transition hover:border-mint hover:bg-panel2 lg:relative lg:bottom-auto lg:right-auto lg:top-auto lg:h-full lg:w-14 lg:shrink-0 lg:justify-center lg:self-stretch lg:px-0"
        title="Open assistant"
      >
        <PanelRightOpen className="h-5 w-5" />
        <span className="lg:hidden">Assistant</span>
      </button>
    );
  }

  return (
    <aside
      className="glass-panel fixed inset-x-3 bottom-3 top-20 z-40 flex min-h-0 flex-col overflow-hidden rounded-lg shadow-2xl lg:relative lg:inset-auto lg:top-auto lg:z-auto lg:h-full lg:w-[var(--assistant-width)] lg:shrink-0 lg:self-stretch"
      style={{ "--assistant-width": `${width || 420}px` }}
      aria-label="Module learning assistant"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-line bg-panel/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-mint/20 bg-mint/10 text-mint">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">Module assistant</div>
            <div className="text-xs text-slate-500">Grounded in this module</div>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="rounded-md p-2 text-slate-400 transition hover:bg-mint/10 hover:text-mint"
          title="Collapse assistant"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>
      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto bg-ink/30 p-4">
        {messages.length === 0 && (
          <div className="rounded-lg border border-dashed border-mint/30 bg-mint/[0.04] p-4 text-sm text-slate-300">
            <div className="flex items-center gap-2 font-semibold text-slate-100">
              <Bot className="h-4 w-4 text-mint" />
              Ask me anything about this module
            </div>
            <p className="mt-2 leading-relaxed text-slate-400">
              Questions you ask here stay connected to the lesson context and can help personalize later modules.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <ChatMessage key={message.id || `${message.role}-${message.created_at}`} message={message} />
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-line bg-panel2 px-3 py-2">
              <LoadingSpinner label="Assistant is thinking" />
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-rose/30 bg-rose/10 p-3 text-sm text-rose">
            {error}
          </div>
        )}
        <div ref={endRef} />
      </div>
      <ChatInput onSend={onSend} disabled={sending} />
    </aside>
  );
}
