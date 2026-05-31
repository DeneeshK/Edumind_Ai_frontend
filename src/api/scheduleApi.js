import { apiRequest } from "./client";

export function generateSchedule(courseId, payload) {
  return apiRequest(`/api/courses/${courseId}/schedule/generate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSchedule(courseId) {
  return apiRequest(`/api/courses/${courseId}/schedule`);
}

export function updateModuleCompletion(courseId, moduleId, completed) {
  return apiRequest(`/api/courses/${courseId}/schedule/progress`, {
    method: "PATCH",
    body: JSON.stringify({ module_id: moduleId, completed }),
  });
}
