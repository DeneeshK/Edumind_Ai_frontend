import { CheckCircle2, Loader2, Search, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Button from "../common/Button";

const decisionCopy = {
  ADVANCE: {
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    text: "Great work - moving to the next module!"
  },
  ADVANCE_WITH_LIGHT_REVIEW: {
    className: "border-sky-200 bg-sky-50 text-sky-700",
    text: "Good job! A quick review note has been added."
  },
  RETEACH_WEAK_CONCEPTS: {
    className: "border-amber/30 bg-amber/10 text-amber",
    text: "Some concepts need more attention before moving on."
  },
  REPEAT_MODULE: {
    className: "border-mint/30 bg-mint/10 text-mint",
    text: "We recommend revisiting this module before continuing."
  }
};

function ConfidenceSelector({ value, onChange, disabled }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-slate-100">How confident are you?</label>
        <span className="text-sm text-slate-500">{value} / 5</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((item) => (
          <button
            key={item}
            type="button"
            disabled={disabled}
            onClick={() => onChange(item)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              value === item
                ? "border-mint bg-mint text-white"
                : "border-line bg-panel2 text-slate-500 hover:border-mint/40 hover:text-slate-100"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>Not sure</span>
        <span>Somewhat confident</span>
        <span>Very confident</span>
      </div>
    </div>
  );
}

function MasteryBar({ score = 0 }) {
  const percent = Math.round(Math.max(0, Math.min(1, Number(score) || 0)) * 100);
  const color = percent >= 75 ? "bg-emerald-500" : percent >= 50 ? "bg-amber" : "bg-rose";

  return (
    <div className="rounded-lg border border-line bg-panel2 p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-100">Understanding score</span>
        <span className="font-semibold text-slate-100">{percent}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ReportScreen({ report, onContinue }) {
  const finalReport = report?.final_report || report || {};
  const decision = finalReport.decision || report?.decision || "ADVANCE";
  const banner = decisionCopy[decision] || decisionCopy.ADVANCE;
  const motivationalFeedback = report?.motivational_feedback || finalReport.motivational_feedback;
  const transitionFeedback = report?.transition_feedback || finalReport.transition_feedback;

  return (
    <div className="space-y-5">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-mint/10 px-3 py-1 text-sm font-semibold text-mint">
          <CheckCircle2 className="h-4 w-4" />
          Module Complete
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-50">Progress Report</h2>
        {motivationalFeedback && (
          <p className="mt-3 text-base leading-relaxed text-slate-300">{motivationalFeedback}</p>
        )}
        {transitionFeedback && (
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{transitionFeedback}</p>
        )}
      </div>

      <div className={`rounded-lg border p-4 text-sm font-semibold ${banner.className}`}>
        {banner.text}
      </div>

      <MasteryBar score={finalReport.mastery_score} />

      {Boolean(finalReport.strengths?.length) && (
        <section className="rounded-lg border border-line bg-panel2 p-4">
          <h3 className="font-semibold text-slate-100">What you got right</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-400">
            {finalReport.strengths.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      )}

      {Boolean(finalReport.weak_concepts?.length) && (
        <section className="rounded-lg border border-line bg-panel2 p-4">
          <h3 className="font-semibold text-slate-100">Worth revisiting</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-400">
            {finalReport.weak_concepts.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      )}

      <div className="flex justify-end border-t border-line pt-4">
        <Button onClick={onContinue}>
          Continue to next module
        </Button>
      </div>
    </div>
  );
}

export default function EvaluationQuiz({
  sessionData,
  currentQuestion,
  questionNumber,
  totalQuestions,
  probeReason,
  finalReport,
  onSubmitAnswer,
  onSkip,
  isSubmitting,
  submitError
}) {
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState(3);

  useEffect(() => {
    setAnswer("");
    setConfidence(3);
  }, [currentQuestion?.id]);

  const questionType = useMemo(() => (
    currentQuestion?.type ? currentQuestion.type.replaceAll("_", " ") : ""
  ), [currentQuestion?.type]);

  async function submit(event) {
    event.preventDefault();
    if (!answer.trim() || isSubmitting) return;
    try {
      await onSubmitAnswer(answer, confidence);
    } catch {
      // The parent keeps the current question and provides the inline error.
    }
  }

  if (finalReport) {
    return <ReportScreen report={finalReport} onContinue={onSkip} />;
  }

  if (!currentQuestion) return null;

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-wide text-mint">
          {sessionData?.module_title || "Module evaluation"}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-50">
            Question {questionNumber} of {totalQuestions || sessionData?.total_questions || "?"}
          </h2>
          {questionType && (
            <span className="rounded-full border border-line bg-panel2 px-3 py-1 text-xs capitalize text-slate-500">
              {questionType}
            </span>
          )}
        </div>
      </div>

      {probeReason && (
        <div className="rounded-lg border border-mint/25 bg-mint/10 p-3 text-sm leading-relaxed text-mint">
          <Search className="mr-2 inline h-4 w-4" />
          Follow-up: {probeReason}
        </div>
      )}

      <div className="rounded-xl border border-line bg-panel2 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-lg font-semibold leading-relaxed text-slate-100">
            {currentQuestion.question_text}
          </p>
          {currentQuestion.is_bonus && (
            <span className="shrink-0 rounded-full border border-amber/30 bg-amber/10 px-3 py-1 text-xs font-semibold text-amber">
              <Trophy className="mr-1 inline h-3.5 w-3.5" />
              Bonus question - won't affect your score
            </span>
          )}
        </div>
      </div>

      <textarea
        className="min-h-[120px] w-full resize-y rounded-lg border border-line bg-panel p-3 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-mint"
        placeholder="Type your answer here..."
        value={answer}
        onChange={(event) => event.target.value !== answer && setAnswer(event.target.value)}
        disabled={isSubmitting}
        rows={4}
      />

      <ConfidenceSelector value={confidence} onChange={setConfidence} disabled={isSubmitting} />

      {submitError && (
        <div className="rounded-lg border border-rose/30 bg-rose/10 p-3 text-sm text-rose">
          {submitError}
        </div>
      )}

      <div className="flex flex-col-reverse justify-between gap-3 border-t border-line pt-4 sm:flex-row sm:items-center">
        <Button type="button" variant="ghost" onClick={onSkip} disabled={isSubmitting}>
          Skip to next module
        </Button>
        <Button type="submit" disabled={!answer.trim() || isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Submitting..." : "Submit Answer"}
        </Button>
      </div>
    </form>
  );
}
