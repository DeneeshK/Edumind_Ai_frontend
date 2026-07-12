import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Pencil,
  RefreshCw,
  Rocket,
  Save,
  StopCircle,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchTest,
  fetchTestResults,
  regenerateTestQuestion,
  transitionTest,
  updateTest
} from "../../api/institutionApi";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { ScoreDistributionChart, pct } from "../../components/institution/charts";
import { TestStatusChip } from "../../components/institution/TestsTab";

const TYPE_LABELS = { mcq: "MCQ", short_answer: "Short answer", conceptual: "Conceptual" };

function QuestionEditor({ question, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...question, options: [...(question.options || [])] });

  function setOption(index, value) {
    setDraft((d) => {
      const options = [...d.options];
      options[index] = value;
      return { ...d, options };
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-mint/40 bg-mint/5 p-4">
      <textarea
        value={draft.question_text}
        onChange={(e) => setDraft((d) => ({ ...d, question_text: e.target.value }))}
        rows={2}
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
      />
      {draft.question_type === "mcq" ? (
        <div className="space-y-2">
          {draft.options.map((option, i) => (
            <label key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${draft.id}`}
                checked={String(draft.correct_answer) === String(i)}
                onChange={() => setDraft((d) => ({ ...d, correct_answer: String(i) }))}
              />
              <input
                value={option}
                onChange={(e) => setOption(i, e.target.value)}
                className="flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-slate-100 focus:border-mint focus:outline-none"
              />
            </label>
          ))}
          <p className="text-xs text-slate-500">Select the radio button of the correct option.</p>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Ideal answer (used for AI grading)</label>
          <textarea
            value={draft.correct_answer}
            onChange={(e) => setDraft((d) => ({ ...d, correct_answer: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
          />
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Explanation shown after grading</label>
        <input
          value={draft.explanation || ""}
          onChange={(e) => setDraft((d) => ({ ...d, explanation: e.target.value }))}
          className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-slate-100 focus:border-mint focus:outline-none"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} className="!px-3 !py-1.5"><X className="h-4 w-4" />Cancel</Button>
        <Button onClick={() => onSave(draft)} className="!px-3 !py-1.5"><Save className="h-4 w-4" />Save</Button>
      </div>
    </div>
  );
}

export default function TestBuilderPage() {
  const { classroomId, testId } = useParams();
  const [test, setTest] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [editing, setEditing] = useState("");
  const [schedule, setSchedule] = useState({ start: "", end: "" });
  const [showSchedule, setShowSchedule] = useState(false);

  const editable = test && ["draft", "approved"].includes(test.status);

  async function load() {
    try {
      const data = await fetchTest(classroomId, testId);
      setTest(data);
      if (data.attempt_count > 0) {
        fetchTestResults(classroomId, testId).then(setResults).catch(() => {});
      }
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId, testId]);

  async function act(fn, key) {
    setBusy(key);
    setError("");
    try {
      const updated = await fn();
      if (updated?.id) setTest(updated);
      else await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  function saveQuestion(updated) {
    const questions = test.questions.map((q) => (q.id === updated.id ? updated : q));
    setEditing("");
    act(() => updateTest(classroomId, testId, { questions }), "save");
  }

  function deleteQuestion(questionId) {
    const questions = test.questions.filter((q) => q.id !== questionId);
    act(() => updateTest(classroomId, testId, { questions }), `delete:${questionId}`);
  }

  if (error && !test) return <p className="pt-10 text-center text-sm text-rose">{error}</p>;
  if (!test) return <div className="grid min-h-[50vh] place-items-center"><LoadingSpinner label="Loading test" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <Link
        to={`/institution/classrooms/${classroomId}?tab=tests`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-mint hover:text-[#6d28d9]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tests
      </Link>

      <div className="glass-panel rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-100">{test.title}</h1>
              <TestStatusChip status={test.effective_status || test.status} />
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {test.topic} · {test.questions.length} questions · {test.duration_minutes} min
              {test.scheduled_start && ` · starts ${new Date(test.scheduled_start).toLocaleString()}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {test.status === "draft" && (
              <Button onClick={() => act(() => transitionTest(classroomId, testId, "approve"), "approve")} disabled={!!busy}>
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </Button>
            )}
            {(test.status === "approved" || test.status === "scheduled") && (
              <>
                <Button variant="secondary" onClick={() => setShowSchedule((v) => !v)}>
                  <CalendarClock className="h-4 w-4" />
                  Schedule
                </Button>
                <Button onClick={() => act(() => transitionTest(classroomId, testId, "publish"), "publish")} disabled={!!busy}>
                  <Rocket className="h-4 w-4" />
                  Publish Now
                </Button>
              </>
            )}
            {(test.status === "live" || test.status === "scheduled") && (
              <Button
                variant="danger"
                onClick={() => act(() => transitionTest(classroomId, testId, "close"), "close")}
                disabled={!!busy}
              >
                <StopCircle className="h-4 w-4" />
                Close Test
              </Button>
            )}
          </div>
        </div>

        {showSchedule && (
          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-white p-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Start</label>
              <input
                type="datetime-local"
                value={schedule.start}
                onChange={(e) => setSchedule((s) => ({ ...s, start: e.target.value }))}
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">End (optional)</label>
              <input
                type="datetime-local"
                value={schedule.end}
                onChange={(e) => setSchedule((s) => ({ ...s, end: e.target.value }))}
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
              />
            </div>
            <Button
              disabled={!schedule.start || !!busy}
              onClick={() => {
                setShowSchedule(false);
                act(
                  () => transitionTest(classroomId, testId, "schedule", schedule.start, schedule.end || null),
                  "schedule"
                );
              }}
            >
              Confirm Schedule
            </Button>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-rose">{error}</p>}
      </div>

      {results?.stats?.graded > 0 && (
        <section className="glass-panel rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-100">Results</h2>
          <p className="mt-1 text-sm text-slate-400">
            {results.stats.graded} graded · class average {pct(results.stats.avg_score)} ·
            best {pct(results.stats.max)} · lowest {pct(results.stats.min)}
          </p>
          <div className="mt-4"><ScoreDistributionChart attempts={results.attempts} /></div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {results.attempts.map((attempt) => (
                  <tr key={attempt.id} className="border-b border-line/60">
                    <td className="py-2 pr-4 font-medium text-slate-100">{attempt.student_name}</td>
                    <td className="py-2 pr-4 text-slate-300">
                      {attempt.status === "graded"
                        ? `${attempt.score}/${attempt.max_score} (${pct(attempt.score / (attempt.max_score || 1))})`
                        : attempt.status}
                    </td>
                    <td className="py-2 text-xs text-slate-500">
                      {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-100">Questions</h2>
        {test.questions.map((question, index) => (
          <div key={question.id} className="glass-panel rounded-xl p-4">
            {editing === question.id ? (
              <QuestionEditor
                question={question}
                onSave={saveQuestion}
                onCancel={() => setEditing("")}
              />
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-slate-500">Q{index + 1}</span>
                      <span className="rounded-full bg-panel2 px-2 py-0.5 font-semibold text-slate-500">
                        {TYPE_LABELS[question.question_type]}
                      </span>
                      <span className="rounded-full bg-panel2 px-2 py-0.5 font-semibold text-slate-500">
                        {question.difficulty}
                      </span>
                      {(question.concepts_tested || []).map((concept) => (
                        <span key={concept} className="rounded-full bg-mint/10 px-2 py-0.5 font-semibold text-mint">
                          {concept}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-100">{question.question_text}</p>
                    {question.question_type === "mcq" && (
                      <ul className="mt-2 space-y-1">
                        {question.options.map((option, i) => (
                          <li
                            key={i}
                            className={`rounded-lg px-3 py-1.5 text-sm ${
                              String(question.correct_answer) === String(i)
                                ? "bg-[#1baf7a]/10 font-semibold text-[#0c7a53]"
                                : "bg-panel2/60 text-slate-300"
                            }`}
                          >
                            {String.fromCharCode(65 + i)}. {option}
                            {String(question.correct_answer) === String(i) && " ✓"}
                          </li>
                        ))}
                      </ul>
                    )}
                    {question.question_type !== "mcq" && question.correct_answer && (
                      <p className="mt-2 rounded-lg bg-panel2/60 px-3 py-2 text-xs text-slate-400">
                        <span className="font-semibold text-slate-100">Ideal answer:</span>{" "}
                        {question.correct_answer}
                      </p>
                    )}
                  </div>
                  {editable && (
                    <div className="flex shrink-0 flex-col gap-1">
                      <Button variant="ghost" className="!px-2 !py-1.5" title="Edit" onClick={() => setEditing(question.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="!px-2 !py-1.5"
                        title="Regenerate with AI"
                        disabled={busy === `regen:${question.id}`}
                        onClick={() => act(() => regenerateTestQuestion(classroomId, testId, question.id), `regen:${question.id}`)}
                      >
                        <RefreshCw className={`h-4 w-4 ${busy === `regen:${question.id}` ? "animate-spin" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        className="!px-2 !py-1.5 text-slate-400 hover:!text-rose"
                        title="Delete"
                        disabled={busy === `delete:${question.id}`}
                        onClick={() => deleteQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
