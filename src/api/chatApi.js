import { apiRequest } from "./client";

export function sendModuleChat(courseId, moduleId, payload) {
  return apiRequest(`/api/courses/${courseId}/modules/${moduleId}/chat`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getModuleChatHistory(courseId, moduleId) {
  return apiRequest(`/api/courses/${courseId}/modules/${moduleId}/chat-history`);
}
