import {
  Archive,
  ArrowLeft,
  BarChart3,
  Bot,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  LibraryBig,
  LogOut,
  Megaphone,
  Sparkles,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { archiveClassroom, leaveClassroom } from "../../api/institutionApi";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AiStudioTab from "../../components/institution/AiStudioTab";
import AnalyticsTab from "../../components/institution/AnalyticsTab";
import AssistantTab from "../../components/institution/AssistantTab";
import CoursesTab from "../../components/institution/CoursesTab";
import ExamsTab from "../../components/institution/ExamsTab";
import MembersTab from "../../components/institution/MembersTab";
import MyProgressTab from "../../components/institution/MyProgressTab";
import StreamTab from "../../components/institution/StreamTab";
import TestsTab from "../../components/institution/TestsTab";
import { useAuth } from "../../hooks/useAuth";
import { useClassroom } from "../../hooks/useInstitution";
import { trackEvent } from "../../utils/eventTracker";

const TEACHER_TABS = [
  { key: "stream", label: "Stream", icon: Megaphone },
  { key: "students", label: "Students", icon: Users },
  { key: "courses", label: "Courses", icon: LibraryBig },
  { key: "tests", label: "Tests", icon: ClipboardList },
  { key: "exams", label: "Exams", icon: FileCheck2 },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "ai", label: "AI Studio", icon: Sparkles },
  { key: "assistant", label: "Assistant", icon: Bot }
];

const STUDENT_TABS = [
  { key: "stream", label: "Stream", icon: Megaphone },
  { key: "courses", label: "My Courses", icon: LibraryBig },
  { key: "tests", label: "Tests", icon: ClipboardList },
  { key: "exams", label: "Exams", icon: FileCheck2 },
  { key: "progress", label: "My Progress", icon: GraduationCap }
];

export default function ClassroomPage() {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { classroom, loading, error, reload } = useClassroom(classroomId);
  const [searchParams, setSearchParams] = useSearchParams();
  const [busy, setBusy] = useState(false);

  const isTeacher = classroom?.viewer_role === "teacher";
  const tabs = isTeacher ? TEACHER_TABS : STUDENT_TABS;
  const activeTab = useMemo(() => {
    const requested = searchParams.get("tab");
    return tabs.some((t) => t.key === requested) ? requested : tabs[0].key;
  }, [searchParams, tabs]);

  useEffect(() => {
    if (classroom && !isTeacher) {
      trackEvent("classroom_opened", { classroomId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroom?.id]);

  async function handleArchive() {
    setBusy(true);
    try {
      await archiveClassroom(classroomId);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    if (!window.confirm("Leave this classroom? Your assigned courses stay in your Courses list.")) {
      return;
    }
    setBusy(true);
    try {
      await leaveClassroom(classroomId);
      navigate("/institution");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <LoadingSpinner label="Loading classroom" />
      </div>
    );
  }
  if (error || !classroom) {
    return (
      <div className="mx-auto max-w-2xl pt-10 text-center">
        <p className="text-sm text-rose">{error || "Classroom not found"}</p>
        <Link to="/institution" className="mt-3 inline-block text-sm font-semibold text-mint">
          ← Back to My Institution
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        to="/institution"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-mint"
      >
        <ArrowLeft className="h-4 w-4" />
        My Institution
      </Link>

      <div className="rounded-lg border border-line bg-panel/60 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-mint">
                {isTeacher ? "Teacher" : "Student"}
              </span>
              {classroom.status === "archived" && (
                <span className="rounded-md border border-line bg-panel2 px-2 py-0.5 text-xs font-medium text-slate-500">
                  Archived
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">{classroom.name}</h1>
            {(classroom.subject || classroom.description) && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                {classroom.subject && (
                  <span className="font-medium text-slate-300">{classroom.subject}</span>
                )}
                {classroom.subject && classroom.description ? " — " : ""}
                {classroom.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {isTeacher ? (
              <Button variant="secondary" onClick={handleArchive} disabled={busy}>
                <Archive className="h-4 w-4" />
                {classroom.status === "archived" ? "Re-activate" : "Archive"}
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleLeave} disabled={busy} className="hover:!border-rose/40 hover:!text-rose">
                <LogOut className="h-4 w-4" />
                Leave
              </Button>
            )}
          </div>
        </div>
      </div>

      <nav
        className="flex gap-1 overflow-x-auto rounded-lg border border-line bg-panel2 p-1"
        aria-label="Classroom sections"
      >
        {tabs.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSearchParams({ tab: key })}
              className={`flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition ${
                active
                  ? "bg-white text-slate-100 shadow-sm ring-1 ring-line"
                  : "text-slate-400 hover:bg-white/60 hover:text-slate-100"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-mint" : "text-slate-400"}`} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="pb-10">
        {activeTab === "stream" && <StreamTab classroomId={classroomId} isTeacher={isTeacher} />}
        {activeTab === "students" && isTeacher && (
          <MembersTab classroomId={classroomId} isTeacher />
        )}
        {activeTab === "courses" && <CoursesTab classroomId={classroomId} isTeacher={isTeacher} />}
        {activeTab === "tests" && (
          <TestsTab
            classroomId={classroomId}
            isTeacher={isTeacher}
            navigateToTest={(testId) =>
              navigate(`/institution/classrooms/${classroomId}/tests/${testId}`)}
          />
        )}
        {activeTab === "exams" && <ExamsTab isTeacher={isTeacher} />}
        {activeTab === "analytics" && isTeacher && <AnalyticsTab classroomId={classroomId} />}
        {activeTab === "ai" && isTeacher && <AiStudioTab classroomId={classroomId} />}
        {activeTab === "assistant" && isTeacher && <AssistantTab classroomId={classroomId} />}
        {activeTab === "progress" && !isTeacher && user?.student_id && (
          <MyProgressTab classroomId={classroomId} studentId={user.student_id} />
        )}
      </div>
    </div>
  );
}
