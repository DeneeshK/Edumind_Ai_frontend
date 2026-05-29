import { apiRequest } from "./client";

export function listCourses() {
  return apiRequest("/api/courses");
}

export function createCourse(payload) {
  return apiRequest("/api/courses", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function createCourseIntent(payload) {
  return apiRequest("/api/courses/create-intent", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getCourse(courseId) {
  return apiRequest(`/api/courses/${courseId}`);
}

export function deleteCourse(courseId) {
  return apiRequest(`/api/courses/${courseId}`, {
    method: "DELETE"
  });
}

export function getCourseRoadmap(courseId) {
  return apiRequest(`/api/courses/${courseId}/roadmap`);
}

export function regenerateCourseRoadmap(courseId, payload) {
  return apiRequest(`/api/courses/${courseId}/roadmap/regenerate`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getCourseModules(courseId) {
  return apiRequest(`/api/courses/${courseId}/modules`);
}
