import { useEffect, useState } from "react";
import { getModuleChatHistory, sendModuleChat } from "../api/chatApi";

export function useModuleChat(courseId, moduleId) {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!courseId || !moduleId) return;
      try {
        const result = await getModuleChatHistory(courseId, moduleId);
        if (active) setMessages(result.messages || []);
      } catch (err) {
        if (active) setError(err.message);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [courseId, moduleId]);

  async function send(message) {
    if (!message.trim()) return;
    const userMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      message,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);
    setSending(true);
    setError("");
    try {
      const result = await sendModuleChat(courseId, moduleId, {
        message
      });
      setMessages((prev) => [...prev, {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        message: result.reply,
        doubt_type: result.doubt_type,
        related_concepts: result.related_concepts,
        created_at: new Date().toISOString()
      }]);
      return result;
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return { messages, sending, error, send };
}
