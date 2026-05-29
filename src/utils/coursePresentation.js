const createdFields = ["created_at", "createdAt", "created_on", "createdOn"];
const updatedFields = ["updated_at", "updatedAt", "last_updated_at", "lastUpdatedAt", "modified_at", "modifiedAt"];
const fallbackDateFields = ["timestamp", "date"];

function readDateValue(item, fields) {
  for (const field of fields) {
    if (item?.[field]) return item[field];
  }
  return null;
}

function toTimestamp(value) {
  if (!value) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatDate(value) {
  const timestamp = toTimestamp(value);
  if (!timestamp) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(timestamp));
}

export function getCourseCreatedTimestamp(course) {
  return toTimestamp(readDateValue(course, createdFields));
}

export function getCourseUpdatedTimestamp(course) {
  return toTimestamp(readDateValue(course, updatedFields));
}

export function getCourseSortTimestamp(course) {
  return (
    getCourseCreatedTimestamp(course) ??
    getCourseUpdatedTimestamp(course) ??
    toTimestamp(readDateValue(course, fallbackDateFields))
  );
}

export function sortCoursesNewestFirst(courses = []) {
  return courses
    .map((course, index) => ({ course, index, timestamp: getCourseSortTimestamp(course) }))
    .sort((a, b) => {
      if (a.timestamp && b.timestamp && a.timestamp !== b.timestamp) {
        return b.timestamp - a.timestamp;
      }
      if (a.timestamp && !b.timestamp) return -1;
      if (!a.timestamp && b.timestamp) return 1;
      return a.index - b.index;
    })
    .map(({ course }) => course);
}

export function getCourseDateLabel(course) {
  const updated = readDateValue(course, updatedFields);
  const created = readDateValue(course, createdFields);
  const fallback = readDateValue(course, fallbackDateFields);

  if (updated) {
    const formatted = formatDate(updated);
    if (formatted) return `Updated ${formatted}`;
  }

  if (created) {
    const formatted = formatDate(created);
    if (formatted) return `Created ${formatted}`;
  }

  if (fallback) {
    const formatted = formatDate(fallback);
    if (formatted) return formatted;
  }

  return "Date unavailable";
}

function readNestedPace(course) {
  if (!course || typeof course !== "object") return course;
  const profile = course.personalization_profile || {};
  const intent = profile.current_intent || {};

  const nestedPace =
    course.pace_label ??
    intent.pace ??
    profile.pace ??
    course.setup?.pace ??
    course.course_setup?.pace;
  const coursePace = course.pace;
  const normalizedCoursePace = String(coursePace || "").replace(/[_-]+/g, " ").trim().toLowerCase();

  if (nestedPace && normalizedCoursePace === "medium") return nestedPace;
  return coursePace ?? nestedPace ?? null;
}

export function getCoursePaceLabel(courseOrPace) {
  const pace = readNestedPace(courseOrPace);
  if (!pace) return "PACE UNAVAILABLE";

  const normalized = String(pace).replace(/[_-]+/g, " ").trim().toLowerCase();
  if (!normalized) return "PACE UNAVAILABLE";

  const labels = {
    fast: "FAST PACE",
    medium: "MEDIUM PACE",
    deep: "DEEP PACE",
    balanced: "BALANCED PACE"
  };

  if (labels[normalized]) return labels[normalized];
  return normalized.includes("pace")
    ? normalized.toUpperCase()
    : `${normalized.toUpperCase()} PACE`;
}

export function getCourseTitle(course) {
  return course?.title || course?.topic || "Untitled course";
}
