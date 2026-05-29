import { apiRequest } from "./client";

export function getDashboard() {
  return apiRequest("/api/students/me/progress");
}

export function getSkills() {
  return apiRequest("/api/students/me/skills");
}

export function getDoubts() {
  return apiRequest("/api/students/me/doubts");
}
