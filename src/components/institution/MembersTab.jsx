import { Check, Copy, RefreshCw, UserMinus, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  approveMember,
  fetchMembers,
  regenerateJoinCode,
  removeMember
} from "../../api/institutionApi";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import LoadingSpinner from "../common/LoadingSpinner";

function initials(name) {
  return (name || "S")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MembersTab({ classroomId, isTeacher, joinCode, onJoinCodeChange }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const data = await fetchMembers(classroomId);
      setMembers(data.members || []);
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

  async function act(action, studentId) {
    setBusy(`${action}:${studentId}`);
    try {
      if (action === "approve") await approveMember(classroomId, studentId);
      if (action === "remove") await removeMember(classroomId, studentId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function rotateCode() {
    setBusy("rotate");
    try {
      const result = await regenerateJoinCode(classroomId);
      onJoinCodeChange?.(result.join_code);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  const pending = members.filter((m) => m.status === "pending");
  const active = members.filter((m) => m.status === "active");

  return (
    <div className="space-y-6">
      {isTeacher && joinCode && (
        <div className="glass-panel flex flex-col gap-3 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-100">Join code</p>
            <p className="text-xs text-slate-400">
              Share this with students — like a WhatsApp group invite.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-mint/30 bg-mint/5 px-4 py-2 font-mono text-lg font-bold tracking-[0.3em] text-mint">
              {joinCode}
            </span>
            <Button variant="ghost" onClick={copyCode} title="Copy code">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              onClick={rotateCode}
              disabled={busy === "rotate"}
              title="Generate a new code (old one stops working)"
            >
              <RefreshCw className={`h-4 w-4 ${busy === "rotate" ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      )}

      {loading && <LoadingSpinner label="Loading members" />}
      {error && <p className="text-sm text-rose">{error}</p>}

      {isTeacher && pending.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <UserPlus className="h-4 w-4 text-mint" />
            Pending requests ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((member) => (
              <div
                key={member.student_id}
                className="glass-panel flex items-center justify-between gap-3 rounded-xl p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eda100]/15 text-xs font-bold text-[#9a6a00]">
                    {initials(member.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">{member.name}</p>
                    {member.email && <p className="truncate text-xs text-slate-500">{member.email}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    onClick={() => act("approve", member.student_id)}
                    disabled={busy === `approve:${member.student_id}`}
                    className="!px-3 !py-1.5"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => act("remove", member.student_id)}
                    disabled={busy === `remove:${member.student_id}`}
                    className="!px-3 !py-1.5 text-rose hover:!bg-rose/10 hover:!text-rose"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Students ({active.length})
        </h3>
        {!loading && active.length === 0 && (
          <EmptyState
            title="No students yet"
            description={isTeacher
              ? "Share the join code above — students appear here once they join."
              : "You're the first one here."}
          />
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {active.map((member) => (
            <div
              key={member.student_id}
              className="glass-panel flex items-center justify-between gap-3 rounded-xl p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint/10 text-xs font-bold text-mint">
                  {initials(member.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{member.name}</p>
                  {isTeacher && member.email && (
                    <p className="truncate text-xs text-slate-500">{member.email}</p>
                  )}
                </div>
              </div>
              {isTeacher && (
                <Button
                  variant="ghost"
                  onClick={() => act("remove", member.student_id)}
                  disabled={busy === `remove:${member.student_id}`}
                  title="Remove from classroom"
                  className="!px-2 !py-1.5 text-slate-400 hover:!text-rose"
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
