import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  PlusCircle,
  Rocket,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listCourses } from "../../api/coursesApi";
import {
  approveClassroomCourse,
  assignClassroomCourse,
  fetchClassroomCourses,
  fetchCourseProgressMatrix,
  registerClassroomCourse
} from "../../api/institutionApi";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import LoadingSpinner from "../common/LoadingSpinner";
import { pct } from "./charts";

const STATUS_STYLES = {
  draft: "bg-slate-200 text-slate-600",
  approved: "bg-[#1baf7a]/15 text-[#0c7a53]",
  assigned: "bg-mint/10 text-mint",
  archived: "bg-slate-200 text-slate-500"
};

function StatusChip({ status }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
      {status}
    </span>
  );
}

function ProgressMatrix({ classroomId, ccId }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCourseProgressMatrix(classroomId, ccId)
      .then((data) => setRows(data.students || []))
      .catch((err) => setError(err.message));
  }, [classroomId, ccId]);

  if (error) return <p className="mt-3 text-sm text-rose">{error}</p>;
  if (!rows) return <LoadingSpinner label="Loading progress" />;
  if (!rows.length) return <p className="mt-3 text-sm text-slate-400">No students assigned yet.</p>;

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-4">Student</th>
            <th className="py-2 pr-4">Modules</th>
            <th className="py-2 pr-4">Progress</th>
            <th className="py-2">Last activity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.student_id} className="border-b border-line/60">
              <td className="py-2 pr-4 font-medium text-slate-100">{row.student_name}</td>
              <td className="py-2 pr-4 text-slate-400">
                {row.completed_modules}/{row.module_count}
              </td>
              <td className="py-2 pr-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-panel2">
                    <div
                      className="h-full rounded-full bg-mint"
                      style={{ width: `${Math.round((row.progress || 0) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{pct(row.progress)}</span>
                </div>
              </td>
              <td className="py-2 text-xs text-slate-500">
                {row.last_activity ? new Date(row.last_activity).toLocaleDateString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeacherCourses({ classroomId }) {
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [expanded, setExpanded] = useState("");
  const [assignResult, setAssignResult] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const [classroomData, mine] = await Promise.all([
        fetchClassroomCourses(classroomId),
        listCourses().catch(() => [])
      ]);
      setCourses(classroomData.courses || []);
      setMyCourses(Array.isArray(mine) ? mine : mine?.courses || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  const usedTemplates = new Set(courses.filter((c) => c.status !== "archived").map((c) => c.template_course_id));
  const available = myCourses.filter((c) => !usedTemplates.has(c.id));

  async function handleRegister(courseId) {
    setBusy(`register:${courseId}`);
    try {
      await registerClassroomCourse(classroomId, courseId);
      setShowPicker(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function handleApprove(ccId) {
    setBusy(`approve:${ccId}`);
    try {
      await approveClassroomCourse(classroomId, ccId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function handleAssign(ccId) {
    setBusy(`assign:${ccId}`);
    setAssignResult(null);
    try {
      const result = await assignClassroomCourse(classroomId, ccId);
      setAssignResult({ ccId, ...result });
      await load();
      setExpanded(ccId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Build a course with the AI Course Creator, review it, then assign it to the whole class.
          Each student receives their own copy that adapts to them individually.
        </p>
        <div className="flex gap-2">
          <Link to="/courses/new">
            <Button variant="secondary">
              <PlusCircle className="h-4 w-4" />
              Build New Course
            </Button>
          </Link>
          <Button onClick={() => setShowPicker((v) => !v)}>
            <BookOpen className="h-4 w-4" />
            Add to Classroom
          </Button>
        </div>
      </div>

      {showPicker && (
        <div className="glass-panel rounded-xl p-4">
          <h4 className="text-sm font-bold text-slate-100">Pick one of your courses</h4>
          {available.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">
              All your courses are already in this classroom — or you haven&apos;t built one yet.{" "}
              <Link to="/courses/new" className="font-semibold text-mint">Create a course</Link> first.
            </p>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {available.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => handleRegister(course.id)}
                  disabled={busy === `register:${course.id}`}
                  className="rounded-lg border border-line bg-white p-3 text-left transition hover:border-mint disabled:opacity-50"
                >
                  <p className="text-sm font-semibold text-slate-100">
                    {course.title || course.topic}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {course.module_count || 0} modules · {course.topic}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && <LoadingSpinner label="Loading classroom courses" />}
      {error && <p className="text-sm text-rose">{error}</p>}
      {!loading && courses.length === 0 && (
        <EmptyState
          title="No courses in this classroom yet"
          description='Click "Add to Classroom" to publish one of your AI-built courses here.'
        />
      )}

      <div className="space-y-3">
        {courses.map((course) => (
          <div key={course.id} className="glass-panel rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-semibold text-slate-100">{course.title}</h4>
                  <StatusChip status={course.status} />
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {course.module_count} modules · topic: {course.topic}
                  {course.status === "assigned" && ` · assigned to ${course.assigned_count} students`}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link to={`/courses/${course.template_course_id}`}>
                  <Button variant="ghost" className="!px-3 !py-1.5">
                    <ExternalLink className="h-4 w-4" />
                    Review
                  </Button>
                </Link>
                {course.status === "draft" && (
                  <Button
                    onClick={() => handleApprove(course.id)}
                    disabled={busy === `approve:${course.id}`}
                    className="!px-3 !py-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                )}
                {(course.status === "approved" || course.status === "assigned") && (
                  <Button
                    onClick={() => handleAssign(course.id)}
                    disabled={busy === `assign:${course.id}`}
                    className="!px-3 !py-1.5"
                  >
                    <Rocket className="h-4 w-4" />
                    {busy === `assign:${course.id}`
                      ? "Assigning…"
                      : course.status === "assigned" ? "Re-sync" : "Assign to Class"}
                  </Button>
                )}
                {course.status === "assigned" && (
                  <Button
                    variant="ghost"
                    className="!px-2 !py-1.5"
                    onClick={() => setExpanded(expanded === course.id ? "" : course.id)}
                  >
                    <Users className="h-4 w-4" />
                    {expanded === course.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
            {assignResult?.ccId === course.id && (
              <p className="mt-2 text-sm font-medium text-mint">
                Assigned to {assignResult.assigned} students
                {assignResult.failed ? ` (${assignResult.failed} failed)` : ""}.
              </p>
            )}
            {expanded === course.id && (
              <ProgressMatrix classroomId={classroomId} ccId={course.id} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentCourses({ classroomId }) {
  const [assignments, setAssignments] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClassroomCourses(classroomId)
      .then((data) => setAssignments(data.assignments || []))
      .catch((err) => setError(err.message));
  }, [classroomId]);

  if (error) return <p className="text-sm text-rose">{error}</p>;
  if (!assignments) return <LoadingSpinner label="Loading your courses" />;
  if (!assignments.length) {
    return (
      <EmptyState
        title="No courses assigned yet"
        description="When your teacher assigns a course, it appears here and in your Courses list."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {assignments.map((assignment) => (
        <Link
          key={assignment.id}
          to={`/courses/${assignment.course_id}`}
          className="group glass-panel rounded-xl p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-mint/10 px-2 py-0.5 text-xs font-semibold text-mint">
              Assigned
            </span>
            {assignment.due_date && (
              <span className="text-xs text-slate-500">
                Due {new Date(assignment.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
          <h4 className="mt-3 text-base font-semibold text-slate-100">
            {assignment.classroom_course_title || assignment.course_title}
          </h4>
          <p className="mt-1 text-xs text-slate-400">
            {assignment.completed_modules}/{assignment.module_count} modules complete
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-panel2">
            <div
              className="h-full rounded-full bg-mint"
              style={{ width: `${Math.round((assignment.progress || 0) * 100)}%` }}
            />
          </div>
          <p className="mt-3 text-sm font-semibold text-mint group-hover:text-[#6d28d9]">
            Continue learning →
          </p>
        </Link>
      ))}
    </div>
  );
}

export default function CoursesTab({ classroomId, isTeacher }) {
  return isTeacher
    ? <TeacherCourses classroomId={classroomId} />
    : <StudentCourses classroomId={classroomId} />;
}
