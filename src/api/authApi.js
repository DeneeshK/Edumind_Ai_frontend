import { apiRequest } from "./client";

export function getMe() {
  return apiRequest("/api/auth/me", {
    credentials: "include"
  });
}

export function logout() {
  return apiRequest("/api/auth/logout", {
    method: "POST",
    credentials: "include"
  });
}
