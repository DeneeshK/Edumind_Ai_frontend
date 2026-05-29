import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { evaluateAnswer } from "../../api/modulesApi";
import Button from "../common/Button";

export default function QuestionCard({ courseId, moduleId, question }) {
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const response = await evaluateAnswer(courseId, moduleId, {
        question_id: question.id,
        answer,
        confidence
      });
      setResult(response);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-1 h-5 w-5 text-mint" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-100">{question.question_text}</p>
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            rows={3}
            className="mt-3 w-full resize-y rounded-md border border-line bg-ink px-3 py-2 text-sm text-slate-100 outline-none focus:border-mint"
            placeholder="Answer from the lesson"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-400">
              Confidence
              <input
                type="range"
                min="1"
                max="5"
                value={confidence}
                onChange={(event) => setConfidence(Number(event.target.value))}
              />
              {confidence}
            </label>
            <Button onClick={submit} disabled={loading || !answer.trim()}>
              Check
            </Button>
          </div>
          {result && (
            <div className="mt-3 rounded-md border border-line bg-panel2 p-3 text-sm text-slate-300">
              <div className="font-semibold text-slate-100">
                Mastery {Math.round(result.mastery_score * 100)}%
              </div>
              <p className="mt-1">{result.feedback}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
