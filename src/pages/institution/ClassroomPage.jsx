import {
  Archive,
  ArrowLeft,
  BarChart3,
  Bot,
  ClipboardList,
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
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "ai", label: "AI Studio", icon: Sparkles },
  { key: "assistant", label: "Assistant", icon: Bot }
];

const STUDENT_TABS = [
  { key: "stream", label: "Stream", icon: Megaphone },
  { key: "courses", label: "My Courses", icon: LibraryBig },
  { key: "tests", label: "Tests", icon: ClipboardList },
  { key: "progress", label: "My Progress", icon: GraduationCap }
];

export default function ClassroomPage() {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { classroom, loading, error, reload } = useClassroom(classroomId);
  const [searchParams, setSearchParams] = useSearchParams();
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);

  const isTeacher = classroom?.viewer_role === "teacher";
  const tabs = isTeacher ? TEACHER_TABS : STUDENT_TABS;
  const activeTab = useMemo(() => {
    const requested = searchParams.get("tab");
    return tabs.some((t) => t.key === requested) ? requested : tabs[0].key;
  }, [searchParams, tabs]);

  useEffect(() => {
    if (classroom?.join_code) setJoinCode(classroom.join_code);
  }, [classroom]);

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
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Link
          to="/institution"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-mint hover:text-[#6d28d9]"
        >
          <ArrowLeft className="h-4 w-4" />
          My Institution
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">{classroom.name}</h1>
              <span className="rounded-full bg-mint/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-mint">
                {isTeacher ? "Teacher" : "Student"}
              </span>
              {classroom.status === "archived" && (
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  Archived
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {[classroom.subject, classroom.grade_level].filter(Boolean).join(" · ")}
              {classroom.description ? ` — ${classroom.description}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {isTeacher ? (
              <Button variant="ghost" onClick={handleArchive} disabled={busy}>
                <Archive className="h-4 w-4" />
                {classroom.status === "archived" ? "Re-activate" : "Archive"}
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleLeave} disabled={busy} className="text-slate-400 hover:!text-rose">
                <LogOut className="h-4 w-4" />
                Leave
              </Button>
            )}
          </div>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-line pb-px" aria-label="Classroom sections">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSearchParams({ tab: key })}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === key
                ? "border-mint text-mint"
                : "border-transparent text-slate-400 hover:text-slate-100"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="pb-10">
        {activeTab === "stream" && <StreamTab classroomId={classroomId} isTeacher={isTeacher} />}
        {activeTab === "students" && isTeacher && (
          <MembersTab
            classroomId={classroomId}
            isTeacher
            joinCode={joinCode}
            onJoinCodeChange={setJoinCode}
          />
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
