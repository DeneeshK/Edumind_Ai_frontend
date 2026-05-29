import { useCallback, useRef, useState } from "react";
import { openSSE } from "../api/sse";

export function useSSE() {
  const sourceRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const close = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
  }, []);

  const start = useCallback((path, handlers = {}) => {
    close();
    setEvents([]);
    setError("");
    setStatus("connecting");
    sourceRef.current = openSSE(path, {
      ...handlers,
      onEvent: (eventName, data, event) => {
        setEvents((prev) => [...prev, { event: eventName, data }]);
        setStatus(eventName === "done" ? "done" : "streaming");
        handlers.onEvent?.(eventName, data, event);
      },
      onError: (event) => {
        setError("The stream disconnected. You can retry safely.");
        setStatus("error");
        handlers.onError?.(event);
      }
    });
    return sourceRef.current;
  }, [close]);

  return { events, status, error, start, close };
}
