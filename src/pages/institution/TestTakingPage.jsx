import { ArrowLeft, CheckCircle2, Clock, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchTest,
  saveAttemptAnswers,
  startAttempt,
  submitAttempt
} from "../../api/institutionApi";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { pct } from "../../components/institution/charts";
import { trackEvent } from "../../utils/eventTracker";

function formatSeconds(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ResultView({ test, attempt, classroomId }) {
  const perQuestion = attempt.per_question_json || [];
  const byId = Object.fromEntries(perQuestion.map((p) => [p.question_id, p]));
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-line bg-panel p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-[#1baf7a]" />
        <h2 className="mt-2 text-2xl font-bold text-slate-100">
          {attempt.score}/{attempt.max_score}
        </h2>
        <p className="text-sm text-slate-400">
          {pct(attempt.score / (attempt.max_score || 1))} — {test.title}
        </p>
      </div>
      {test.questions.map((question, index) => {
        const grade = byId[question.id] || {};
        const good = (grade.score || 0) >= 0.7;
        const partial = (grade.score || 0) >= 0.4 && !good;
        return (
          <div
            key={question.id}
            className={`rounded-lg border border-line bg-panel border-l-4 p-4 ${
              good ? "border-l-[#1baf7a]" : partial ? "border-l-[#eda100]" : "border-l-rose"
            }`}
          >
            <p className="text-sm font-semibold text-slate-100">
              Q{index + 1}. {question.question_text}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              <span className="font-semibold text-slate-500">Your answer: </span>
              {question.question_type === "mcq"
                ? question.options?.[Number(grade.answer)] ?? "Not answered"
                : grade.answer || "Not answered"}
            </p>
            {question.question_type === "mcq" && question.correct_answer !== undefined && (
              <p className="mt-1 text-sm text-[#0c7a53]">
                <span className="font-semibold">Correct: </span>
                {question.options?.[Number(question.correct_answer)]}
              </p>
            )}
            {question.question_type !== "mcq" && question.correct_answer && (
              <p className="mt-1 text-sm text-[#0c7a53]">
                <span className="font-semibold">Model answer: </span>{question.correct_answer}
              </p>
            )}
            {grade.feedback && (
              <p className="mt-2 rounded-lg bg-panel2/70 px-3 py-2 text-xs text-slate-400">
                {grade.feedback}
              </p>
            )}
            <p className="mt-2 text-xs font-bold text-slate-500">
              {Math.round((grade.score || 0) * Number(question.points || 1) * 100) / 100}/{question.points} points
            </p>
          </div>
        );
      })}
      <Link
        to={`/institution/classrooms/${classroomId}?tab=tests`}
        className="inline-block text-sm font-semibold text-mint"
      >
        ← Back to tests
      </Link>
    </div>
  );
}

export default function TestTakingPage() {
  const { classroomId, testId } = useParams();
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    fetchTest(classroomId, testId)
      .then((data) => {
        setTest(data);
        if (data.my_attempt) {
          setAttempt(data.my_attempt);
          const saved = {};
          (data.my_attempt.answers_json || []).forEach((a) => {
            saved[a.question_id] = a.answer;
          });
          setAnswers(saved);
        }
      })
      .catch((err) => setError(err.message));
  }, [classroomId, testId]);

  const toAnswerList = useCallback(
    (map) => Object.entries(map).map(([question_id, answer]) => ({ question_id, answer })),
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await saveAttemptAnswers(attempt.id, toAnswerList(answersRef.current));
      const graded = await submitAttempt(attempt.id);
      setAttempt(graded);
      trackEvent("test_completed", { classroomId, payload: { test_id: testId } });
      const refreshed = await fetchTest(classroomId, testId);
      setTest(refreshed);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }, [attempt, submitting, classroomId, testId, toAnswerList]);

  // Countdown timer once an attempt is running.
  useEffect(() => {
    if (!attempt || attempt.status !== "in_progress" || !test) return undefined;
    const startedAt = new Date(attempt.started_at).getTime();
    const deadline = startedAt + test.duration_minutes * 60 * 1000;
    const tick = () => {
      const left = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) handleSubmit();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [attempt, test, handleSubmit]);

  // Autosave every 15 seconds while in progress.
  useEffect(() => {
    if (!attempt || attempt.status !== "in_progress") return undefined;
    const interval = setInterval(() => {
      saveAttemptAnswers(attempt.id, toAnswerList(answersRef.current)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [attempt, toAnswerList]);

  async function handleStart() {
    setError("");
    try {
      const started = await startAttempt(classroomId, testId);
      setAttempt(started);
      trackEvent("test_started", { classroomId, payload: { test_id: testId } });
      const refreshed = await fetchTest(classroomId, testId);
      setTest(refreshed);
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !test) return <p className="pt-10 text-center text-sm text-rose">{error}</p>;
  if (!test) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <LoadingSpinner label="Loading test" />
      </div>
    );
  }

  if (attempt?.status === "graded") {
    return (
      <div className="mx-auto max-w-3xl pb-12">
        <ResultView test={test} attempt={attempt} classroomId={classroomId} />
      </div>
    );
  }

  const answeredCount = Object.values(answers).filter((v) => String(v).trim()).length;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24">
      <Link
        to={`/institution/classrooms/${classroomId}?tab=tests`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-mint hover:text-[#6d28d9]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tests
      </Link>

      <div className="rounded-lg border border-line bg-panel p-6">
        <h1 className="text-2xl font-bold text-slate-100">{test.title}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {test.topic} · {test.question_count} questions · {test.duration_minutes} minutes
        </p>
        {test.instructions && <p className="mt-2 text-sm text-slate-300">{test.instructions}</p>}
        {!attempt && (
          <div className="mt-4">
            {(test.effective_status || test.status) === "live" ? (
              <Button onClick={handleStart}>Start Test</Button>
            ) : (
              <p className="text-sm font-semibold text-slate-500">
                {test.effective_status === "scheduled" || test.status === "scheduled"
                  ? `This test opens ${test.scheduled_start ? new Date(test.scheduled_start).toLocaleString() : "soon"}.`
                  : "This test is closed."}
              </p>
            )}
          </div>
        )}
        {error && <p className="mt-3 text-sm text-rose">{error}</p>}
      </div>

      {attempt?.status === "in_progress" && (
        <>
          <div className="sticky top-2 z-10 flex items-center justify-between rounded-lg border border-line bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur">
            <span className="text-sm font-semibold text-slate-400">
              {answeredCount}/{test.questions.length} answered · autosaves
            </span>
            <span
              className={`flex items-center gap-1.5 font-mono text-sm font-bold ${
                secondsLeft !== null && secondsLeft < 120 ? "text-rose" : "text-slate-100"
              }`}
            >
              <Clock className="h-4 w-4" />
              {secondsLeft !== null ? formatSeconds(secondsLeft) : "--:--"}
            </span>
          </div>

          {test.questions.map((question, index) => (
            <div key={question.id} className="rounded-lg border border-line bg-panel p-5">
              <p className="text-sm font-semibold text-slate-100">
                <span className="text-slate-500">Q{index + 1}.</span> {question.question_text}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  ({question.points} pt · {question.difficulty})
                </span>
              </p>
              {question.question_type === "mcq" ? (
                <div className="mt-3 space-y-2">
                  {question.options.map((option, i) => (
                    <label
                      key={i}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                        String(answers[question.id]) === String(i)
                          ? "border-mint bg-mint/5 font-semibold text-slate-100"
                          : "border-line text-slate-300 hover:border-slate-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        checked={String(answers[question.id]) === String(i)}
                        onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: String(i) }))}
                      />
                      {String.fromCharCode(65 + i)}. {option}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answers[question.id] || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                  rows={question.question_type === "conceptual" ? 4 : 2}
                  placeholder="Write your answer…"
                  className="mt-3 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-100 focus:border-mint focus:outline-none"
                />
              )}
            </div>
          ))}

          <div className="fixed inset-x-0 bottom-0 border-t border-line bg-white/95 p-3 backdrop-blur">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
              <span className="text-sm text-slate-400">
                {answeredCount}/{test.questions.length} answered
              </span>
              <Button onClick={handleSubmit} disabled={submitting}>
                <Send className="h-4 w-4" />
                {submitting ? "Grading…" : "Submit Test"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
