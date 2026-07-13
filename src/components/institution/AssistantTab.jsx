import { Bot, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { askAssistant, fetchAssistantHistory } from "../../api/institutionApi";
import { renderMarkdown } from "../../utils/markdown";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";

const SUGGESTIONS = [
  "Which students need help right now?",
  "Which chapter should I revise before moving on?",
  "Who hasn't completed the assigned course?",
  "Generate homework on our weakest concept",
  "Draft tomorrow's lesson plan"
];

export default function AssistantTab({ classroomId }) {
  const [messages, setMessages] = useState(null);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchAssistantHistory(classroomId)
      .then((data) => setMessages(data.messages || []))
      .catch((err) => {
        setMessages([]);
        setError(err.message);
      });
  }, [classroomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function send(text) {
    const question = (text || input).trim();
    if (!question || thinking) return;
    setInput("");
    setError("");
    setThinking(true);
    setMessages((prev) => [...(prev || []), { role: "user", message: question, id: `u-${Date.now()}` }]);
    try {
      const result = await askAssistant(classroomId, question);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          message: result.answer_markdown,
          suggested_actions: result.suggested_actions,
          id: `a-${Date.now()}`
        }
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setThinking(false);
    }
  }

  if (messages === null) return <LoadingSpinner label="Loading assistant" />;

  return (
    <div className="flex h-[calc(100vh-16rem)] min-h-[420px] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && !thinking && (
          <div className="rounded-lg border border-line bg-panel p-6 text-center">
            <Bot className="mx-auto h-10 w-10 text-mint" />
            <h3 className="mt-3 text-lg font-bold text-slate-100">Your AI teaching assistant</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
              Ask anything about your class — it reads live analytics before answering,
              and can draft homework, lesson plans, and practice material.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-full border border-mint/30 bg-mint/5 px-3 py-1.5 text-xs font-semibold text-mint transition hover:bg-mint/10"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-mint text-white"
                  : "border border-line bg-panel text-slate-300"
              }`}
            >
              {msg.role === "assistant" ? (
                <>
                  <div
                    className="prose prose-sm max-w-none [&_h1]:text-base [&_h2]:text-sm [&_li]:my-0.5 [&_p]:my-1.5"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.message) }}
                  />
                  {msg.suggested_actions?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-2">
                      {msg.suggested_actions.map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => send(action)}
                          className="rounded-full bg-mint/10 px-2.5 py-1 text-xs font-semibold text-mint hover:bg-mint/20"
                        >
                          <Sparkles className="mr-1 inline h-3 w-3" />
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                msg.message
              )}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div className="border border-line bg-panel flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-slate-400">
              <Bot className="h-4 w-4 animate-pulse text-mint" />
              Reading classroom analytics…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mb-2 text-sm text-rose">{error}</p>}

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex items-center gap-2 border-t border-line pt-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your class, or ask for a draft…"
          className="flex-1 rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-slate-100 focus:border-mint focus:outline-none"
          disabled={thinking}
        />
        <Button type="submit" disabled={thinking || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
