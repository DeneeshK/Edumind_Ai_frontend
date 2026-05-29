function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL;

  if (configured) {
    try {
      const url = new URL(configured);
      const frontendHost = window.location.hostname;
      const apiHostIsLocal = ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
      const frontendHostIsLocal = ["localhost", "127.0.0.1", "0.0.0.0"].includes(frontendHost);

      if (apiHostIsLocal && !frontendHostIsLocal) {
        url.hostname = frontendHost;
      }

      return url.toString().replace(/\/$/, "");
    } catch {
      return configured.replace(/\/$/, "");
    }
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }

  return "http://localhost:8000";
}

const API_BASE_URL = resolveApiBaseUrl();

export function apiUrl(path) {
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiRequest(path, options = {}) {
  const { headers, ...fetchOptions } = options;
  const response = await fetch(apiUrl(path), {
    ...fetchOptions,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(headers || {})
    }
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail = typeof payload === "string" ? payload : payload.detail;
    throw new Error(detail || `Request failed: ${response.status}`);
  }

  return payload;
}

export { API_BASE_URL };
