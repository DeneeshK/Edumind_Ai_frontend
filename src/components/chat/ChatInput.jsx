import { Send } from "lucide-react";
import { useState } from "react";
import Button from "../common/Button";

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");

  async function submit(event) {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    setValue("");
    await onSend(text);
  }

  return (
    <form onSubmit={submit} className="shrink-0 border-t border-line bg-panel/80 p-3">
      <div className="flex items-end gap-2 rounded-lg border border-line bg-ink p-2 transition focus-within:border-mint">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          disabled={disabled}
          rows={2}
          placeholder="Ask about this module..."
          className="min-h-[44px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm leading-relaxed text-slate-100 outline-none placeholder:text-slate-600"
        />
        <Button className="h-10 w-10 shrink-0 px-0" disabled={disabled || !value.trim()} title="Send">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
