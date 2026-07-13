import { apiRequest } from "./client";

const BASE = "/api/institution";

// ── Home & classrooms ─────────────────────────────────────────────────────────

export function fetchInstitutionHome() {
  return apiRequest(`${BASE}/me/home`);
}

export function createClassroom(payload) {
  return apiRequest(`${BASE}/classrooms`, { method: "POST", body: JSON.stringify(payload) });
}

export function fetchClassroom(classroomId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}`);
}

export function updateClassroom(classroomId, payload) {
  return apiRequest(`${BASE}/classrooms/${classroomId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function archiveClassroom(classroomId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/archive`, { method: "POST" });
}

// ── Invitations (email allowlist) ─────────────────────────────────────────────

export function acceptInvitation(classroomId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/accept`, { method: "POST" });
}

export function fetchInvitations(classroomId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/invitations`);
}

export function inviteStudents(classroomId, students) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/invitations`, {
    method: "POST",
    body: JSON.stringify({ students })
  });
}

export function revokeInvitation(classroomId, email) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/invitations/revoke`, {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

// ── Members ───────────────────────────────────────────────────────────────────

export function fetchMembers(classroomId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/members`);
}

export function removeMember(classroomId, studentId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/members/${studentId}/remove`, {
    method: "POST"
  });
}

export function leaveClassroom(classroomId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/leave`, { method: "POST" });
}

// ── Courses ───────────────────────────────────────────────────────────────────

export function fetchClassroomCourses(classroomId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/courses`);
}

export function registerClassroomCourse(classroomId, templateCourseId, title = "") {
  return apiRequest(`${BASE}/classrooms/${classroomId}/courses`, {
    method: "POST",
    body: JSON.stringify({ template_course_id: templateCourseId, title })
  });
}

export function approveClassroomCourse(classroomId, ccId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/courses/${ccId}/approve`, {
    method: "POST"
  });
}

export function assignClassroomCourse(classroomId, ccId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/courses/${ccId}/assign`, {
    method: "POST"
  });
}

export function fetchCourseProgressMatrix(classroomId, ccId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/courses/${ccId}/progress`);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

export function fetchTests(classroomId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/tests`);
}

export function generateTest(classroomId, payload) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/tests/generate`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function fetchTest(classroomId, testId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/tests/${testId}`);
}

export function updateTest(classroomId, testId, payload) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/tests/${testId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function regenerateTestQuestion(classroomId, testId, questionId) {
  return apiRequest(
    `${BASE}/classrooms/${classroomId}/tests/${testId}/questions/${questionId}/regenerate`,
    { method: "POST" }
  );
}

export function transitionTest(classroomId, testId, action, scheduledStart, scheduledEnd) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/tests/${testId}/transition`, {
    method: "POST",
    body: JSON.stringify({
      action,
      scheduled_start: scheduledStart || null,
      scheduled_end: scheduledEnd || null
    })
  });
}

export function fetchTestResults(classroomId, testId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/tests/${testId}/results`);
}

export function startAttempt(classroomId, testId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/tests/${testId}/attempts/start`, {
    method: "POST"
  });
}

export function saveAttemptAnswers(attemptId, answers) {
  return apiRequest(`${BASE}/attempts/${attemptId}/answers`, {
    method: "POST",
    body: JSON.stringify({ answers })
  });
}

export function submitAttempt(attemptId) {
  return apiRequest(`${BASE}/attempts/${attemptId}/submit`, { method: "POST" });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function fetchAnalyticsOverview(classroomId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/analytics/overview`);
}

export function fetchConceptHeatmap(classroomId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/analytics/concepts`);
}

export function fetchStudentTable(classroomId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/analytics/students`);
}

export function fetchDoubtAnalytics(classroomId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/analytics/doubts`);
}

export function fetchStudentDrilldown(classroomId, studentId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/analytics/student/${studentId}`);
}

// ── AI layer ──────────────────────────────────────────────────────────────────

export function generateInsights(classroomId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/ai/insights`, { method: "POST" });
}

export function generateClusters(classroomId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/ai/clusters`, { method: "POST" });
}

export function generateRevisionPlan(classroomId, days = 7, publish = false) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/ai/revision-plan`, {
    method: "POST",
    body: JSON.stringify({ days, publish })
  });
}

export function generateRecommendations(classroomId, studentId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/ai/recommendations/${studentId}`, {
    method: "POST"
  });
}

export function fetchLatestArtifact(classroomId, artifactType, scopeKey = "") {
  const query = scopeKey ? `?scope_key=${encodeURIComponent(scopeKey)}` : "";
  return apiRequest(`${BASE}/classrooms/${classroomId}/ai/artifacts/${artifactType}${query}`);
}

// ── Assistant ─────────────────────────────────────────────────────────────────

export function askAssistant(classroomId, message) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/assistant/chat`, {
    method: "POST",
    body: JSON.stringify({ message })
  });
}

export function fetchAssistantHistory(classroomId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/assistant/history`);
}

// ── Posts & events ────────────────────────────────────────────────────────────

export function fetchPosts(classroomId) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/posts`);
}

export function createPost(classroomId, payload) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/posts`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function createResourcePost(classroomId, { postType, title, bodyMarkdown, linkUrl, eventTime }) {
  return apiRequest(`${BASE}/classrooms/${classroomId}/posts`, {
    method: "POST",
    body: JSON.stringify({
      post_type: postType,
      title: title || "",
      body_markdown: bodyMarkdown || "",
      link_url: linkUrl || "",
      event_time: eventTime || ""
    })
  });
}

export function recordEvents(events) {
  return apiRequest(`${BASE}/events`, {
    method: "POST",
    body: JSON.stringify({ events })
  });
}
