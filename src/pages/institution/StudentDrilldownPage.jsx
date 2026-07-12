import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchStudentDrilldown,
  generateRecommendations
} from "../../api/institutionApi";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { KpiTile, pct } from "../../components/institution/charts";

export default function StudentDrilldownPage() {
  const { classroomId, studentId } = useParams();
  const [detail, setDetail] = useState(null);
  const [recs, setRecs] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchStudentDrilldown(classroomId, studentId)
      .then(setDetail)
      .catch((err) => setError(err.message));
  }, [classroomId, studentId]);

  async function refreshRecs() {
    setBusy(true);
    try {
      setRecs(await generateRecommendations(classroomId, studentId));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !detail) return <p className="pt-10 text-center text-sm text-rose">{error}</p>;
  if (!detail) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <LoadingSpinner label="Loading student profile" />
      </div>
    );
  }

  const summary = detail.summary || {};
  const recData = recs?.content_json;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <Link
        to={`/institution/classrooms/${classroomId}?tab=analytics`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-mint hover:text-[#6d28d9]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to analytics
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{detail.name}</h1>
          <p className="text-sm text-slate-400">
            Rank #{summary.rank || "—"} · risk:{" "}
            <span className={summary.risk === "high" ? "font-semibold text-rose" : summary.risk === "medium" ? "font-semibold text-[#9a6a00]" : "font-semibold text-[#0c7a53]"}>
              {summary.risk || "unknown"}
            </span>
          </p>
        </div>
        <Button variant="secondary" onClick={refreshRecs} disabled={busy}>
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
          {busy ? "Generating…" : "AI recommendations"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Mastery" value={pct(summary.avg_mastery)} />
        <KpiTile label="Progress" value={pct(summary.avg_progress)} />
        <KpiTile
          label="Test avg"
          value={summary.avg_test_score === null || summary.avg_test_score === undefined ? "—" : pct(summary.avg_test_score)}
          hint={`${summary.tests_taken || 0} tests`}
        />
        <KpiTile label="Doubts (60d)" value={summary.doubt_count ?? 0} hint={`${summary.active_days_30 ?? 0} active days/30d`} />
      </div>

      {recData && (
        <section className="glass-panel rounded-xl border-l-4 border-l-mint p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <Sparkles className="h-4 w-4 text-mint" />
            Recommended for {detail.name}
          </h3>
          {recData.next_step && <p className="mt-2 text-sm font-semibold text-slate-100">🎯 {recData.next_step}</p>}
          {recData.revise?.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {recData.revise.map((item) => (
                <li key={item.concept}>
                  <span className="font-semibold text-slate-100">{item.concept}</span>
                  {item.reason && <span className="text-slate-400"> — {item.reason}</span>}
                </li>
              ))}
            </ul>
          )}
          {recData.practice?.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-slate-400">
              {recData.practice.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          )}
        </section>
      )}
      {error && <p className="text-sm text-rose">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass-panel rounded-xl p-5">
          <h3 className="mb-3 text-sm font-bold text-slate-100">Weakest concepts</h3>
          {detail.weak_concepts.length === 0 ? (
            <p className="text-sm text-slate-400">No mastery data yet.</p>
          ) : (
            <ul className="space-y-2">
              {detail.weak_concepts.map((c) => (
                <li key={c.concept} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-slate-300">{c.concept}</span>
                  <span className="font-semibold text-rose">{pct(c.mastery_score)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="glass-panel rounded-xl p-5">
          <h3 className="mb-3 text-sm font-bold text-slate-100">Misconceptions detected</h3>
          {detail.misconceptions.length === 0 ? (
            <p className="text-sm text-slate-400">No recorded misconceptions.</p>
          ) : (
            <ul className="space-y-2">
              {detail.misconceptions.map((m, i) => (
                <li key={i} className="rounded-lg bg-panel2/70 p-3 text-sm">
                  <span className="rounded-full bg-[#eda100]/15 px-2 py-0.5 text-xs font-semibold text-[#9a6a00]">
                    {m.type}
                  </span>
                  <span className="ml-2 text-slate-300">{m.concept}</span>
                  {m.detail && <p className="mt-1 text-xs text-slate-400">{m.detail}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="glass-panel rounded-xl p-5">
        <h3 className="mb-3 text-sm font-bold text-slate-100">Assigned courses</h3>
        {detail.assignments.length === 0 ? (
          <p className="text-sm text-slate-400">No courses assigned.</p>
        ) : (
          <div className="space-y-2">
            {detail.assignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between rounded-lg bg-panel2/70 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">
                    {assignment.classroom_course_title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {assignment.completed_modules}/{assignment.module_count} modules
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-100">{pct(assignment.progress)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {detail.test_history.length > 0 && (
        <section className="glass-panel rounded-xl p-5">
          <h3 className="mb-3 text-sm font-bold text-slate-100">Test history</h3>
          <div className="space-y-2">
            {detail.test_history.map((t, i) => (
              <div key={`${t.test_id}-${i}`} className="flex items-center justify-between rounded-lg bg-panel2/70 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{t.title}</p>
                  <p className="text-xs text-slate-500">
                    {t.graded_at ? new Date(t.graded_at).toLocaleDateString() : ""}
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-100">{t.score}/{t.max_score}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
