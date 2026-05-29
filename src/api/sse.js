import { apiUrl } from "./client";

export function openSSE(path, handlers = {}) {
  const source = new EventSource(apiUrl(path), { withCredentials: true });
  const events = [
    "connected",
    "understanding_started",
    "history_checked",
    "research_started",
    "source_found",
    "curriculum_started",
    "module_planned",
    "roadmap_started",
    "roadmap_ready",
    "first_module_prepared",
    "course_ready",
    "lesson_started",
    "chunk",
    "question_generated",
    "saved",
    "done",
    "error"
  ];

  events.forEach((eventName) => {
    source.addEventListener(eventName, (event) => {
      let data = event.data;
      try {
        data = JSON.parse(event.data);
      } catch {
        // plain text chunks are expected
      }
      handlers[eventName]?.(data, event);
      handlers.onEvent?.(eventName, data, event);
      if (eventName === "done" || eventName === "error") {
        source.close();
      }
    });
  });

  source.onerror = (event) => {
    handlers.onError?.(event);
    source.close();
  };

  return source;
}
