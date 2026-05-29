import { Bot, UserRound } from "lucide-react";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const Icon = isUser ? UserRound : Bot;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[86%] rounded-lg px-3 py-2 text-sm shadow-sm ${
          isUser
            ? "rounded-br-sm bg-mint text-white"
            : "rounded-bl-sm border border-line bg-panel2 text-slate-200"
        }`}
      >
        <div className={`mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${isUser ? "text-white/80" : "text-mint"}`}>
          <Icon className="h-3 w-3" />
          {isUser ? "You" : "Assistant"}
        </div>
        <p className="whitespace-pre-wrap leading-relaxed">{message.message}</p>
        {message.doubt_type && !isUser && (
          <div className="mt-2 inline-flex rounded-md border border-line px-2 py-1 text-xs text-slate-400">
            {message.doubt_type}
          </div>
        )}
      </div>
    </div>
  );
}
