import { ArrowRight, GraduationCap, KeyRound, PlusCircle, School, Users } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { joinClassroom } from "../../api/institutionApi";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useInstitutionHome } from "../../hooks/useInstitution";

function ClassroomCard({ classroom, role, membershipStatus }) {
  const archived = classroom.status === "archived";
  return (
    <Link
      to={`/institution/classrooms/${classroom.id}`}
      className={`group glass-panel flex flex-col rounded-xl p-5 transition hover:-translate-y-0.5 hover:shadow-glow ${archived ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint/10 text-mint">
          {role === "teacher" ? <School className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
        </div>
        <div className="flex gap-1">
          {archived && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
              Archived
            </span>
          )}
          {membershipStatus === "pending" && (
            <span className="rounded-full bg-[#eda100]/15 px-2 py-0.5 text-xs font-semibold text-[#9a6a00]">
              Awaiting approval
            </span>
          )}
        </div>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-100">{classroom.name}</h3>
      <p className="mt-1 text-sm text-slate-400">
        {[classroom.subject, classroom.grade_level].filter(Boolean).join(" · ") || "General"}
      </p>
      <div className="mt-auto flex items-center justify-between pt-4 text-sm">
        <span className="flex items-center gap-1.5 text-slate-400">
          <Users className="h-4 w-4" />
          {classroom.member_count || 0} students
          {role === "teacher" && classroom.pending_count > 0 && (
            <span className="ml-1 rounded-full bg-rose/10 px-1.5 text-xs font-semibold text-rose">
              +{classroom.pending_count} pending
            </span>
          )}
        </span>
        <ArrowRight className="h-4 w-4 text-mint transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export default function InstitutionHomePage() {
  const { teaching, joined, loading, error, reload } = useInstitutionHome();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState(null);
  const navigate = useNavigate();

  async function handleJoin(event) {
    event.preventDefault();
    if (!code.trim()) return;
    setJoining(true);
    setJoinMessage(null);
    try {
      const result = await joinClassroom(code.trim());
      if (result.membership_status === "active") {
        navigate(`/institution/classrooms/${result.classroom.id}`);
        return;
      }
      setJoinMessage({
        type: "success",
        text: `Request sent to "${result.classroom.name}" — your teacher will approve you shortly.`
      });
      setCode("");
      reload();
    } catch (err) {
      setJoinMessage({ type: "error", text: err.message });
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <section className="flex flex-col justify-between gap-6 pt-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-mint">My Institution</p>
          <h1 className="mt-2 text-3xl font-black text-slate-100 sm:text-4xl">
            AI-powered classrooms for teachers &amp; students
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
            Create a classroom, invite your students, assign AI-built courses, generate tests,
            and let the analytics tell you exactly who needs help — while every student&apos;s
            course adapts to them individually.
          </p>
        </div>
        <Link to="/institution/classrooms/new">
          <Button>
            <PlusCircle className="h-4 w-4" />
            Create Classroom
          </Button>
        </Link>
      </section>

      <section className="glass-panel rounded-xl p-5">
        <form onSubmit={handleJoin} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <KeyRound className="h-4 w-4 text-mint" />
            Join a classroom
          </div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter join code, e.g. K7MPX2A"
            maxLength={10}
            className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm font-mono tracking-widest text-slate-100 focus:border-mint focus:outline-none"
          />
          <Button type="submit" variant="secondary" disabled={joining || !code.trim()}>
            {joining ? "Joining…" : "Join"}
          </Button>
        </form>
        {joinMessage && (
          <p className={`mt-3 text-sm ${joinMessage.type === "error" ? "text-rose" : "text-mint"}`}>
            {joinMessage.text}
          </p>
        )}
      </section>

      {loading && <LoadingSpinner label="Loading your classrooms" />}
      {error && <p className="text-sm text-rose">{error}</p>}

      {!loading && (
        <>
          <section>
            <h2 className="mb-4 text-xl font-semibold text-slate-100">Classrooms I teach</h2>
            {teaching.length === 0 ? (
              <EmptyState
                title="No classrooms yet"
                description="Create your first classroom, share the join code with your students, and assign an AI-built course to the whole class."
                action={
                  <Link to="/institution/classrooms/new">
                    <Button>Create Classroom</Button>
                  </Link>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teaching.map((classroom) => (
                  <ClassroomCard key={classroom.id} classroom={classroom} role="teacher" />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-slate-100">Classrooms I&apos;m in</h2>
            {joined.length === 0 ? (
              <EmptyState
                title="You haven't joined any classroom"
                description="Ask your teacher for the join code and enter it above."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {joined.map((classroom) => (
                  <ClassroomCard
                    key={classroom.id}
                    classroom={classroom}
                    role="student"
                    membershipStatus={classroom.membership_status}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
