import { apiRequest } from "./client";

export function getModule(courseId, moduleId) {
  return apiRequest(`/api/courses/${courseId}/modules/${moduleId}`);
}

export function generateModule(courseId, moduleId) {
  return apiRequest(`/api/courses/${courseId}/modules/${moduleId}/generate`, {
    method: "POST"
  });
}

export function completeModule(courseId, moduleId) {
  return apiRequest(`/api/courses/${courseId}/modules/${moduleId}/complete`, {
    method: "POST"
  });
}

export function getQuestions(courseId, moduleId) {
  return apiRequest(`/api/courses/${courseId}/modules/${moduleId}/questions`);
}

export function evaluateAnswer(courseId, moduleId, payload) {
  return apiRequest(`/api/courses/${courseId}/modules/${moduleId}/evaluate`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function startEvaluation(courseId, moduleId) {
  return apiRequest(`/api/courses/${courseId}/modules/${moduleId}/evaluation/start`, {
    method: "POST"
  });
}

export function submitEvaluationAnswer(courseId, moduleId, sessionId, payload) {
  return apiRequest(`/api/courses/${courseId}/modules/${moduleId}/evaluation/${sessionId}/answer`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getNextModule(courseId, moduleId) {
  return apiRequest(`/api/courses/${courseId}/modules/${moduleId}/next`);
}

export function getLatestEvaluationReport(courseId, moduleId) {
  return apiRequest(`/api/courses/${courseId}/modules/${moduleId}/evaluation/latest-full`);
}
