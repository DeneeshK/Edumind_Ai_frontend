import { recordEvents } from "../api/institutionApi";

// Lightweight batched learning-event tracker for the institution module.
// Events queue locally and flush every 30s or on page hide.
const queue = [];
let flushTimer = null;

async function flush() {
  if (!queue.length) return;
  const batch = queue.splice(0, queue.length);
  try {
    await recordEvents(batch);
  } catch {
    // Analytics must never break the UX — drop silently.
  }
}

export function trackEvent(eventType, { classroomId, courseId, moduleId, payload } = {}) {
  queue.push({
    event_type: eventType,
    classroom_id: classroomId || null,
    course_id: courseId || null,
    module_id: moduleId || null,
    payload: payload || {}
  });
  if (!flushTimer) {
    flushTimer = setInterval(flush, 30000);
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") flush();
      });
    }
  }
  if (queue.length >= 20) flush();
}
