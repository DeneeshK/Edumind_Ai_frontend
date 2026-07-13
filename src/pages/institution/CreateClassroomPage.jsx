import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createClassroom } from "../../api/institutionApi";
import Button from "../../components/common/Button";

export default function CreateClassroomPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    subject: "",
    description: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const classroom = await createClassroom(form);
      navigate(`/institution/classrooms/${classroom.id}`);
    } catch (err) {
      setError(err.message || "Failed to create classroom");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/institution"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-mint"
      >
        <ArrowLeft className="h-4 w-4" />
        My Institution
      </Link>

      <div className="rounded-lg border border-line bg-panel/60 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint">New classroom</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-50">Set up your classroom</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Name it, then invite students by email. Only people you invite can join.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-panel p-6">
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-100">
              Classroom name
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. NEET Physics — Evening Batch"
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-slate-100 transition focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/15"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-100">
              Subject <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="e.g. Physics, Spoken English, Web Development"
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-slate-100 transition focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-100">
              Description <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="What this classroom covers, timings, what students should expect…"
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-slate-100 transition focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/15"
            />
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-line bg-panel2/60 p-3.5">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p className="text-xs leading-relaxed text-slate-400">
              After you create the classroom, you&apos;ll add students by their email.
              Only the emails you add can join — no codes, no open sign-ups.
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-rose/30 bg-rose/10 p-3 text-sm text-rose">{error}</p>
          )}

          <div className="flex justify-end gap-3 border-t border-line pt-5">
            <Link to="/institution">
              <Button type="button" variant="ghost">Cancel</Button>
            </Link>
            <Button type="submit" disabled={saving || !form.name.trim()}>
              {saving ? "Creating…" : "Create classroom"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
