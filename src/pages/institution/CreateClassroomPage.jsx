import { ArrowLeft, School } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createClassroom } from "../../api/institutionApi";
import Button from "../../components/common/Button";

const JOIN_POLICIES = [
  { value: "approval", label: "Approval required", hint: "Students request to join; you approve them (recommended)" },
  { value: "open", label: "Open", hint: "Anyone with the code joins instantly" },
  { value: "invite_only", label: "Invite only", hint: "The join code is disabled; you add students yourself" }
];

export default function CreateClassroomPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    subject: "",
    grade_level: "",
    description: "",
    join_policy: "approval"
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
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-mint hover:text-[#6d28d9]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Institution
      </Link>

      <div className="glass-panel rounded-xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-mint/10 text-mint">
            <School className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Create a classroom</h1>
            <p className="text-sm text-slate-400">You&apos;ll get a join code to share with students.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-100">
              Classroom name *
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Class 12A Physics — Morning Batch"
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-slate-100 focus:border-mint focus:outline-none"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-100">Subject</label>
              <input
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
                placeholder="e.g. Physics"
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-slate-100 focus:border-mint focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-100">
                Grade / level
              </label>
              <input
                value={form.grade_level}
                onChange={(e) => set("grade_level", e.target.value)}
                placeholder="e.g. Class 12 / JEE"
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-slate-100 focus:border-mint focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-100">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="What this classroom covers, timings, expectations…"
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-slate-100 focus:border-mint focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-100">How students join</label>
            <div className="space-y-2">
              {JOIN_POLICIES.map((policy) => (
                <label
                  key={policy.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                    form.join_policy === policy.value
                      ? "border-mint bg-mint/5"
                      : "border-line hover:border-slate-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="join_policy"
                    value={policy.value}
                    checked={form.join_policy === policy.value}
                    onChange={() => set("join_policy", policy.value)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-100">{policy.label}</span>
                    <span className="block text-xs text-slate-400">{policy.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-rose">{error}</p>}

          <Button type="submit" disabled={saving || !form.name.trim()} className="w-full">
            {saving ? "Creating…" : "Create Classroom"}
          </Button>
        </form>
      </div>
    </div>
  );
}
