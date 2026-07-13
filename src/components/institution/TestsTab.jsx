import { ClipboardList, PlusCircle, Sparkles, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchClassroomCourses, fetchTests, generateTest } from "../../api/institutionApi";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import LoadingSpinner from "../common/LoadingSpinner";
import { pct } from "./charts";

const TEST_STATUS_STYLES = {
  draft: "border-line bg-panel2 text-slate-500",
  approved: "border-mint/30 bg-mint/5 text-mint",
  scheduled: "border-[#eda100]/40 bg-[#eda100]/10 text-[#9a6a00]",
  live: "border-mint/40 bg-mint/10 text-mint",
  closed: "border-line bg-panel2 text-slate-400"
};

export function TestStatusChip({ status }) {
  return (
    <span className={`rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${TEST_STATUS_STYLES[status] || TEST_STATUS_STYLES.draft}`}>
      {status}
    </span>
  );
}

function GenerateTestForm({ classroomId, onCreated, onCancel }) {
  const [form, setForm] = useState({
    topic: "",
    title: "",
    classroom_course_id: "",
    num_mcq: 5,
    num_short: 3,
    num_conceptual: 2,
    difficulty_mix: "balanced",
    duration_minutes: 30,
    instructions: ""
  });
  const [courses, setCourses] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClassroomCourses(classroomId)
      .then((data) => setCourses((data.courses || []).filter((c) => c.status !== "archived")))
      .catch(() => setCourses([]));
  }, [classroomId]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleGenerate(event) {
    event.preventDefault();
    if (!form.topic.trim()) return;
    setGenerating(true);
    setError("");
    try {
      const test = await generateTest(classroomId, {
        ...form,
        classroom_course_id: form.classroom_course_id || null,
        num_mcq: Number(form.num_mcq),
        num_short: Number(form.num_short),
        num_conceptual: Number(form.num_conceptual),
        duration_minutes: Number(form.duration_minutes)
      });
      onCreated(test);
    } catch (err) {
      setError(err.message || "Generation failed");
      setGenerating(false);
    }
  }

  return (
    <form onSubmit={handleGenerate} className="border border-line bg-panel space-y-4 rounded-lg p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-mint" />
        <h3 className="text-base font-bold text-slate-100">Generate a test with AI</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-500">Topic *</label>
          <input
            value={form.topic}
            onChange={(e) => set("topic", e.target.value)}
            placeholder="e.g. Kinematics — motion in one dimension"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Title (optional)</label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Auto-generated if empty"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">
            Ground in course (optional)
          </label>
          <select
            value={form.classroom_course_id}
            onChange={(e) => set("classroom_course_id", e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
          >
            <option value="">No specific course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">MCQs</label>
          <input
            type="number" min="0" max="20" value={form.num_mcq}
            onChange={(e) => set("num_mcq", e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Short answer</label>
          <input
            type="number" min="0" max="10" value={form.num_short}
            onChange={(e) => set("num_short", e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Conceptual</label>
          <input
            type="number" min="0" max="10" value={form.num_conceptual}
            onChange={(e) => set("num_conceptual", e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Difficulty mix</label>
          <select
            value={form.difficulty_mix}
            onChange={(e) => set("difficulty_mix", e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
          >
            <option value="easy_heavy">Easier</option>
            <option value="balanced">Balanced</option>
            <option value="hard_heavy">Harder</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Duration (minutes)</label>
          <input
            type="number" min="5" max="240" value={form.duration_minutes}
            onChange={(e) => set("duration_minutes", e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-500">
            Extra instructions for the AI (optional)
          </label>
          <input
            value={form.instructions}
            onChange={(e) => set("instructions", e.target.value)}
            placeholder="e.g. Include one numerical problem per concept"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="text-sm text-rose">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={generating || !form.topic.trim()}>
          <Sparkles className="h-4 w-4" />
          {generating ? "Generating… (10-20s)" : "Generate Test"}
        </Button>
      </div>
    </form>
  );
}

export default function TestsTab({ classroomId, isTeacher, navigateToTest }) {
  const [tests, setTests] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      const data = await fetchTests(classroomId);
      setTests(data.tests || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  if (error) return <p className="text-sm text-rose">{error}</p>;
  if (!tests) return <LoadingSpinner label="Loading tests" />;

  return (
    <div className="space-y-5">
      {isTeacher && !showForm && (
        <div className="flex justify-end">
          <Button onClick={() => setShowForm(true)}>
            <PlusCircle className="h-4 w-4" />
            Generate Test
          </Button>
        </div>
      )}
      {isTeacher && showForm && (
        <GenerateTestForm
          classroomId={classroomId}
          onCancel={() => setShowForm(false)}
          onCreated={(test) => {
            setShowForm(false);
            navigateToTest(test.id);
          }}
        />
      )}

      {tests.length === 0 && !showForm && (
        <EmptyState
          title="No tests yet"
          description={isTeacher
            ? "Generate a difficulty-balanced test from any topic in seconds."
            : "Tests your teacher publishes will appear here."}
        />
      )}

      <div className="space-y-3">
        {tests.map((test) => {
          const status = test.effective_status || test.status;
          const attempt = test.my_attempt;
          return (
            <div key={test.id} className="rounded-lg border border-line bg-panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mint/10 text-mint">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-semibold text-slate-100">{test.title}</h4>
                      <TestStatusChip status={status} />
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-400">
                      <span>{test.topic}</span>
                      <span>{test.question_count} questions</span>
                      <span className="inline-flex items-center gap-1">
                        <Timer className="h-3 w-3" />{test.duration_minutes} min
                      </span>
                      {test.scheduled_start && (
                        <span>Starts {new Date(test.scheduled_start).toLocaleString()}</span>
                      )}
                      {isTeacher && <span>{test.attempt_count} submissions</span>}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isTeacher ? (
                    <Button variant="secondary" onClick={() => navigateToTest(test.id)} className="!px-3 !py-1.5">
                      {test.status === "draft" ? "Review & Edit" : "Open"}
                    </Button>
                  ) : attempt?.status === "graded" ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-100">
                        {pct(attempt.score / (attempt.max_score || 1))}
                      </span>
                      <Link to={`/institution/classrooms/${classroomId}/tests/${test.id}/take`}>
                        <Button variant="secondary" className="!px-3 !py-1.5">View Result</Button>
                      </Link>
                    </div>
                  ) : status === "live" ? (
                    <Link to={`/institution/classrooms/${classroomId}/tests/${test.id}/take`}>
                      <Button className="!px-3 !py-1.5">
                        {attempt ? "Resume Test" : "Take Test"}
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500">
                      {status === "scheduled" ? "Not started yet" : "Closed"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
