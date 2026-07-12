import { Award, BookOpenCheck, RefreshCw, Sparkles, Target, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchLatestArtifact,
  fetchStudentDrilldown,
  generateRecommendations
} from "../../api/institutionApi";
import LoadingSpinner from "../common/LoadingSpinner";
import Button from "../common/Button";
import { KpiTile, pct } from "./charts";

export default function MyProgressTab({ classroomId, studentId }) {
  const [detail, setDetail] = useState(null);
  const [recs, setRecs] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchStudentDrilldown(classroomId, studentId),
      fetchLatestArtifact(classroomId, "recommendations", studentId).catch(() => null)
    ])
      .then(([d, r]) => {
        if (cancelled) return;
        setDetail(d);
        if (r?.content_json) setRecs(r);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => { cancelled = true; };
  }, [classroomId, studentId]);

  async function refreshRecs() {
    setBusy(true);
    setError("");
    try {
      setRecs(await generateRecommendations(classroomId, studentId));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !detail) return <p className="text-sm text-rose">{error}</p>;
  if (!detail) return <LoadingSpinner label="Loading your progress" />;

  const summary = detail.summary || {};
  const recData = recs?.content_json;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiTile label="My mastery" value={pct(summary.avg_mastery)} icon={Award} />
        <KpiTile label="Course progress" value={pct(summary.avg_progress)} icon={BookOpenCheck} />
        <KpiTile
          label="Test average"
          value={summary.avg_test_score === null || summary.avg_test_score === undefined
            ? "—" : pct(summary.avg_test_score)}
          hint={`${summary.tests_taken || 0} tests taken`}
          icon={Target}
        />
      </div>

      <section className="glass-panel rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <Sparkles className="h-4 w-4 text-mint" />
            My AI recommendations
          </h3>
          <Button variant="secondary" onClick={refreshRecs} disabled={busy} className="!px-3 !py-1.5">
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
            {recData ? "Refresh" : "Get recommendations"}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-rose">{error}</p>}
        {!recData ? (
          <p className="mt-3 text-sm text-slate-400">
            Get a personal study plan based on your quizzes, doubts, and progress.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {recData.next_step && (
              <p className="rounded-lg bg-mint/5 p-3 text-sm font-semibold text-slate-100">
                🎯 {recData.next_step}
              </p>
            )}
            {recData.revise?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Revise</p>
                <ul className="mt-1 space-y-1">
                  {recData.revise.map((item) => (
                    <li key={item.concept} className="text-sm text-slate-300">
                      <span className="font-semibold text-slate-100">{item.concept}</span>
                      {item.reason && <span className="text-slate-400"> — {item.reason}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {recData.practice?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Practice</p>
                <ul className="mt-1 list-inside list-disc text-sm text-slate-300">
                  {recData.practice.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
            {recData.focus_tip && (
              <p className="text-sm italic text-slate-400">💡 {recData.focus_tip}</p>
            )}
            {recData.encouragement && (
              <p className="text-sm font-medium text-mint">{recData.encouragement}</p>
            )}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass-panel rounded-xl p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-100">
            <TrendingDown className="h-4 w-4 text-rose" />
            Concepts to strengthen
          </h3>
          {detail.weak_concepts.length === 0 ? (
            <p className="text-sm text-slate-400">No weak concepts detected yet.</p>
          ) : (
            <ul className="space-y-2">
              {detail.weak_concepts.map((c) => (
                <li key={c.concept} className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-slate-300">{c.concept}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-panel2">
                      <div
                        className="h-full rounded-full bg-rose"
                        style={{ width: `${Math.round((c.mastery_score || 0) * 100)}%` }}
                      />
                    </div>
                    <span className="w-9 text-right text-xs font-semibold text-slate-400">
                      {pct(c.mastery_score)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass-panel rounded-xl p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-100">
            <Award className="h-4 w-4 text-mint" />
            My strengths
          </h3>
          {detail.strong_concepts.length === 0 ? (
            <p className="text-sm text-slate-400">Complete evaluations to build your strengths list.</p>
          ) : (
            <ul className="space-y-2">
              {detail.strong_concepts.map((c) => (
                <li key={c.concept} className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-slate-300">{c.concept}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-panel2">
                      <div
                        className="h-full rounded-full bg-[#1baf7a]"
                        style={{ width: `${Math.round((c.mastery_score || 0) * 100)}%` }}
                      />
                    </div>
                    <span className="w-9 text-right text-xs font-semibold text-slate-400">
                      {pct(c.mastery_score)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {detail.test_history.length > 0 && (
        <section className="glass-panel rounded-xl p-5">
          <h3 className="mb-3 text-sm font-bold text-slate-100">My test history</h3>
          <div className="space-y-2">
            {detail.test_history.map((t) => (
              <div key={`${t.test_id}`} className="flex items-center justify-between rounded-lg bg-panel2/70 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{t.title}</p>
                  <p className="text-xs text-slate-500">
                    {t.graded_at ? new Date(t.graded_at).toLocaleDateString() : ""}
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-100">
                  {t.score}/{t.max_score}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
