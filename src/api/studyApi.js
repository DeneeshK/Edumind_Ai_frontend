export const STUDY_API_URL = import.meta.env.VITE_STUDY_API_URL || "http://localhost:8100";

function studyApiUrl(path) {
  if (path.startsWith("http")) return path;
  return `${STUDY_API_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function formatErrorDetail(detail) {
  if (!detail) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || item?.message || JSON.stringify(item)).join(", ");
  }
  return detail.message || JSON.stringify(detail);
}

export async function studyRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(studyApiUrl(path), options);
  } catch (error) {
    throw new Error("Could not reach the Study Assistant API. Make sure it is running on port 8100.");
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Session not found. Please start a new session.");
    }
    const detail = typeof payload === "string" ? payload : payload.detail;
    throw new Error(formatErrorDetail(detail) || `Request failed: ${response.status}`);
  }

  return payload;
}

export function getStudyApiHealth() {
  return studyRequest("/health");
}

function appendOptional(formData, key, value) {
  if (value !== undefined && value !== null && String(value).trim()) {
    formData.append(key, value);
  }
}

export function createPdfNotes({ file, title, subject, depth = "medium" }) {
  const formData = new FormData();
  formData.append("file", file);
  appendOptional(formData, "title", title);
  appendOptional(formData, "subject", subject);
  appendOptional(formData, "depth", depth);

  return studyRequest("/pdf/short-note", {
    method: "POST",
    body: formData,
  });
}

export function createYoutubeNotes({ url, subject, depth = "medium" }) {
  return studyRequest("/youtube/learnable-note", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      subject: subject?.trim() || undefined,
      depth,
    }),
  });
}

export function startLiveClassSession({ title, subject, depth = "medium" }) {
  return studyRequest("/live-class/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      subject: subject?.trim() || undefined,
      depth,
    }),
  });
}

// Sends the complete recording blob to the finish endpoint. The backend saves
// it and responds immediately (202) with a status_url — conversion,
// transcription, and note generation continue in the background, since a
// long recording can take minutes to process and would otherwise risk being
// killed by a proxy/gateway timeout on one long-held request.
export function finishLiveClassSession(sessionId, recordingBlob) {
  const formData = new FormData();
  formData.append("file", recordingBlob, "recording.webm");
  return studyRequest(`/live-class/${encodeURIComponent(sessionId)}/finish`, {
    method: "POST",
    body: formData,
  });
}

export function getLiveClassStatus(sessionId) {
  return studyRequest(`/live-class/${encodeURIComponent(sessionId)}/status`);
}

// Polls GET /live-class/{sessionId}/status until the backend reports
// "completed" or "failed". Resolves with the final status payload, or
// rejects if the session fails or polling exceeds maxWaitMs.
export function pollLiveClassStatus(sessionId, { intervalMs = 4000, maxWaitMs = 60 * 60 * 1000 } = {}) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    async function tick() {
      let data;
      try {
        data = await getLiveClassStatus(sessionId);
      } catch (error) {
        reject(error);
        return;
      }

      if (data.status === "completed") {
        resolve(data);
        return;
      }
      if (data.status === "failed") {
        reject(new Error(data.error || "Live class processing failed."));
        return;
      }
      if (Date.now() - startedAt > maxWaitMs) {
        reject(new Error("Timed out waiting for the live class to finish processing."));
        return;
      }
      setTimeout(tick, intervalMs);
    }
    tick();
  });
}
