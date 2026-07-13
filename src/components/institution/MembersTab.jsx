import { Check, Clock, Mail, Phone, UserMinus, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchInvitations,
  fetchMembers,
  inviteStudents,
  removeMember,
  revokeInvitation
} from "../../api/institutionApi";
import Button from "../common/Button";
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

const EMPTY = { name: "", phone: "", email: "" };

function InviteForm({ classroomId, onDone }) {
  const [entry, setEntry] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function set(field, value) {
    setEntry((e) => ({ ...e, [field]: value }));
  }

  async function handleAdd(event) {
    event.preventDefault();
    if (!entry.email.trim()) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await inviteStudents(classroomId, [
        { email: entry.email.trim(), name: entry.name.trim(), phone: entry.phone.trim() }
      ]);
      if (result.added > 0) {
        setNotice(`Added ${entry.name.trim() || entry.email.trim()} to allowed students.`);
        setEntry(EMPTY);
        onDone();
      } else {
        setError("That email couldn't be added — check it's valid and not already invited.");
      }
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-panel p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        <UserPlus className="h-4 w-4 text-mint" />
        Add a student
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
        The <span className="font-medium text-slate-300">email</span> is what lets them into
        the classroom — they sign in with it to join. Name and phone are for your roster.
      </p>
      <form onSubmit={handleAdd} className="mt-3 grid gap-2.5 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
        <input
          value={entry.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Name"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
        />
        <input
          value={entry.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="Phone (optional)"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
        />
        <input
          type="email"
          value={entry.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="Email (required)"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
          required
        />
        <Button type="submit" disabled={busy || !entry.email.trim()}>
          {busy ? "Adding…" : "Add"}
        </Button>
      </form>
      {notice && <p className="mt-2 text-sm font-medium text-mint">{notice}</p>}
      {error && <p className="mt-2 text-sm text-rose">{error}</p>}
    </div>
  );
}

function StudentRow({ name, email, phone, right }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint/10 text-xs font-semibold text-mint">
          {initials(name || email)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-100">{name || email}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{email}</span>
            {phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{phone}</span>}
          </p>
        </div>
      </div>
      {right}
    </li>
  );
}

export default function MembersTab({ classroomId, isTeacher }) {
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    try {
      setLoading(true);
      const memberData = await fetchMembers(classroomId);
      setMembers(memberData.members || []);
      if (isTeacher) {
        const inviteData = await fetchInvitations(classroomId);
        setInvitations(inviteData.invitations || []);
      }
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

  // Roster detail (name/phone) entered at invite time, keyed by email.
  const inviteByEmail = useMemo(() => {
    const map = {};
    invitations.forEach((i) => { map[(i.email || "").toLowerCase()] = i; });
    return map;
  }, [invitations]);

  async function handleRevoke(email) {
    setBusy(`revoke:${email}`);
    try {
      await revokeInvitation(classroomId, email);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function handleRemove(studentId) {
    setBusy(`remove:${studentId}`);
    try {
      await removeMember(classroomId, studentId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  const joined = members
    .filter((m) => m.status === "active")
    .map((m) => {
      const invite = inviteByEmail[(m.email || "").toLowerCase()] || {};
      return { ...m, phone: invite.phone || "", name: m.name || invite.name || m.email };
    });
  const allowed = invitations.filter((i) => i.status === "invited");

  if (!isTeacher) {
    // Students see only the class roster (names).
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-5 py-3.5">
          <h3 className="text-sm font-semibold text-slate-100">Classmates ({joined.length})</h3>
        </div>
        {loading ? (
          <div className="p-6"><LoadingSpinner label="Loading" /></div>
        ) : joined.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">No students yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {joined.map((m) => <StudentRow key={m.student_id} name={m.name} email={m.email} />)}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <InviteForm classroomId={classroomId} onDone={load} />

      {error && <p className="text-sm text-rose">{error}</p>}
      {loading && <LoadingSpinner label="Loading roster" />}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Joined */}
        <div className="rounded-lg border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Check className="h-4 w-4 text-[#0c7a53]" />
              Joined students
            </h3>
            <span className="rounded-md border border-line bg-panel2 px-2 py-0.5 text-xs font-medium text-slate-400">
              {joined.length}
            </span>
          </div>
          {joined.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              No one has joined yet. Students appear here once they sign in with their invited email.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {joined.map((m) => (
                <StudentRow
                  key={m.student_id}
                  name={m.name}
                  email={m.email}
                  phone={m.phone}
                  right={
                    <button
                      type="button"
                      onClick={() => handleRemove(m.student_id)}
                      disabled={busy === `remove:${m.student_id}`}
                      title="Remove from classroom"
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose/10 hover:text-rose disabled:opacity-50"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  }
                />
              ))}
            </ul>
          )}
        </div>

        {/* Allowed / not joined */}
        <div className="rounded-lg border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Clock className="h-4 w-4 text-[#9a6a00]" />
              Allowed · not joined yet
            </h3>
            <span className="rounded-md border border-line bg-panel2 px-2 py-0.5 text-xs font-medium text-slate-400">
              {allowed.length}
            </span>
          </div>
          {allowed.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              Everyone you&apos;ve added has joined. Add more students above.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {allowed.map((invite) => (
                <StudentRow
                  key={invite.email}
                  name={invite.name}
                  email={invite.email}
                  phone={invite.phone}
                  right={
                    <div className="flex items-center gap-2">
                      <span className="hidden shrink-0 rounded-md border border-line bg-panel2 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 sm:inline">
                        {invite.has_account ? "Waiting" : "No account"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRevoke(invite.email)}
                        disabled={busy === `revoke:${invite.email}`}
                        title="Remove from allowlist"
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose/10 hover:text-rose disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
