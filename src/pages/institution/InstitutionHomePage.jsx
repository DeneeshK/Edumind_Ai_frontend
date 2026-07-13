import {
  ArrowRight,
  Check,
  GraduationCap,
  Mail,
  PlusCircle,
  School,
  Users
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { acceptInvitation } from "../../api/institutionApi";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useInstitutionHome } from "../../hooks/useInstitution";

function ClassroomRow({ classroom, role }) {
  const archived = classroom.status === "archived";
  return (
    <Link
      to={`/institution/classrooms/${classroom.id}`}
      className={`group flex items-center gap-4 rounded-lg border border-line bg-white p-4 transition hover:border-mint/50 hover:bg-panel2/50 ${archived ? "opacity-60" : ""}`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-mint/10 text-mint">
        {role === "teacher" ? <School className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-slate-100">{classroom.name}</h3>
          {archived && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
              Archived
            </span>
          )}
        </div>
        <p className="truncate text-sm text-slate-400">
          {classroom.subject || "General"}
          {role === "teacher" && ` · ${classroom.member_count || 0} students`}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-mint" />
    </Link>
  );
}

export default function InstitutionHomePage() {
  const { teaching, joined, invitations, loading, error, reload } = useInstitutionHome();
  const [accepting, setAccepting] = useState("");
  const [actionError, setActionError] = useState("");
  const navigate = useNavigate();

  async function handleAccept(classroomId) {
    setAccepting(classroomId);
    setActionError("");
    try {
      await acceptInvitation(classroomId);
      navigate(`/institution/classrooms/${classroomId}`);
    } catch (err) {
      setActionError(err.message);
      setAccepting("");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="pt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint">My Institution</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Your classrooms</h1>
      </header>

      {/* Two entry points: Join (left) and Create (right) */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col rounded-lg border border-line bg-panel p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-panel2 text-slate-500">
            <Mail className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-100">Join a classroom</h2>
          <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-400">
            No code needed. When your teacher adds your email, the classroom shows up
            here to join in one tap.
          </p>
          <p className={`mt-4 text-sm font-medium ${invitations.length > 0 ? "text-mint" : "text-slate-500"}`}>
            {invitations.length > 0
              ? `${invitations.length} invitation${invitations.length > 1 ? "s" : ""} waiting below`
              : "No invitations yet."}
          </p>
        </div>

        <div className="flex flex-col rounded-lg border border-line bg-panel p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint/10 text-mint">
            <School className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-100">Create a classroom</h2>
          <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-400">
            Start a classroom, invite your students by email, and assign courses,
            tests, and revision plans.
          </p>
          <Link to="/institution/classrooms/new" className="mt-4">
            <Button>
              <PlusCircle className="h-4 w-4" />
              Create classroom
            </Button>
          </Link>
        </div>
      </section>

      {actionError && <p className="text-sm text-rose">{actionError}</p>}

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-100">You&apos;ve been invited</h2>
          <div className="space-y-3">
            {invitations.map((invite) => (
              <div
                key={invite.classroom_id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-mint/30 bg-mint/5 p-4"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-100">{invite.name}</h3>
                  <p className="text-sm text-slate-400">
                    {invite.subject || "General"}
                    {invite.teacher_name ? ` · invited by ${invite.teacher_name}` : ""}
                  </p>
                </div>
                <Button
                  onClick={() => handleAccept(invite.classroom_id)}
                  disabled={accepting === invite.classroom_id}
                >
                  <Check className="h-4 w-4" />
                  {accepting === invite.classroom_id ? "Joining…" : "Join"}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {loading && <LoadingSpinner label="Loading your classrooms" />}
      {error && <p className="text-sm text-rose">{error}</p>}

      {!loading && (
        <>
          {teaching.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <School className="h-4 w-4 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-100">Classrooms I teach</h2>
              </div>
              <div className="space-y-2">
                {teaching.map((classroom) => (
                  <ClassroomRow key={classroom.id} classroom={classroom} role="teacher" />
                ))}
              </div>
            </section>
          )}

          {joined.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-100">Classrooms I&apos;m in</h2>
              </div>
              <div className="space-y-2">
                {joined.map((classroom) => (
                  <ClassroomRow key={classroom.id} classroom={classroom} role="student" />
                ))}
              </div>
            </section>
          )}

          {teaching.length === 0 && joined.length === 0 && invitations.length === 0 && (
            <p className="rounded-lg border border-dashed border-line bg-white/50 p-8 text-center text-sm text-slate-400">
              You&apos;re not in any classrooms yet. Create one to get started, or ask your
              teacher to invite your email.
            </p>
          )}
        </>
      )}
    </div>
  );
}
