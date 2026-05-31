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

// uploadLiveClassAudioChunk is no longer used — recording is now sent
// as a single blob at finish. Kept here for reference only.
export function uploadLiveClassAudioChunk(sessionId, blob) {
  const formData = new FormData();
  formData.append("file", blob, `chunk-${Date.now()}.webm`);

  return studyRequest(`/live-class/${encodeURIComponent(sessionId)}/audio-chunk`, {
    method: "POST",
    body: formData,
  });
}

// Sends the complete recording blob directly to the finish endpoint.
// The backend now accepts an optional `file` field on this endpoint.
export function finishLiveClassSession(sessionId, recordingBlob) {
  if (recordingBlob) {
    const formData = new FormData();
    formData.append("file", recordingBlob, "recording.webm");
    return studyRequest(`/live-class/${encodeURIComponent(sessionId)}/finish`, {
      method: "POST",
      body: formData,
    });
  }
  // Fallback: no blob (e.g. called without recording)
  return studyRequest(`/live-class/${encodeURIComponent(sessionId)}/finish`, {
    method: "POST",
  });
}
