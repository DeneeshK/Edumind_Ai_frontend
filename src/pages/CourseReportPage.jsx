import { ArrowLeft, Award, BookOpen, TrendingUp, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../api/client";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import LoadingSpinner from "../components/common/LoadingSpinner";

function ScoreBar({ score }) {
  const pct = Math.round((score || 0) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-mint transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-semibold text-slate-700">{pct}%</span>
    </div>
  );
}

export default function CourseReportPage() {
  const { courseId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await apiRequest(`/api/courses/${courseId}/report`);
        if (active) setReport(result.report);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [courseId]);

  if (loading) return <LoadingSpinner label="Generating your course report" />;
  if (error) return <p className="p-6 text-rose">{error}</p>;
  if (!report) return null;

  const badgeColors = {
    "Completed with distinction": "bg-green-100 text-green-700",
    Completed: "bg-mint/10 text-mint",
    "Needs review": "bg-amber-100 text-amber-700",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex items-center justify-between gap-3">
        <Link to={`/courses/${courseId}`}>
          <Button variant="ghost" className="px-0 text-slate-400">
            <ArrowLeft className="h-4 w-4" /> Course
          </Button>
        </Link>
      </div>

      <section className="glass-panel rounded-lg p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-mint">Final Report</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-50">Course Performance</h1>
          </div>
          {report.completion_badge && (
            <span className={`rounded-lg px-4 py-2 text-sm font-semibold ${badgeColors[report.completion_badge] || badgeColors.Completed}`}>
              {report.completion_badge}
            </span>
          )}
        </div>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-300">
          {report.overall_summary}
        </p>
        {report.personality_insight && (
          <p className="mt-3 text-sm italic text-slate-400">{report.personality_insight}</p>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-mint">
            <TrendingUp className="h-4 w-4" />
            <h2 className="font-semibold text-slate-100">What you learned well</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{report.strengths_narrative}</p>
          {(report.mastered_skills || []).length > 0 && (
            <ul className="mt-3 space-y-1">
              {report.mastered_skills.map((skill, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
                  {skill}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <h2 className="font-semibold text-slate-100">Areas to revisit</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{report.growth_areas_narrative}</p>
          {(report.weak_skills || []).length > 0 && (
            <ul className="mt-3 space-y-1">
              {report.weak_skills.map((skill, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {skill}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {(report.skill_verdicts || []).length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 text-mint">
            <BookOpen className="h-4 w-4" />
            <h2 className="font-semibold text-slate-100">Skill breakdown</h2>
          </div>
          <div className="mt-4 space-y-4">
            {report.skill_verdicts.map((v, i) => (
              <div key={i} className="rounded-md border border-line bg-ink p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-slate-100">{v.concept}</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    v.status === "mastered" ? "bg-green-100 text-green-700"
                      : v.status === "weak" ? "bg-red-100 text-red-600"
                        : "bg-slate-100 text-slate-600"
                  }`}>{v.status}</span>
                </div>
                <ScoreBar score={v.mastery_score} />
                <p className="mt-2 text-xs text-slate-500">{v.reason}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(report.next_steps || []).length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 text-mint">
            <Award className="h-4 w-4" />
            <h2 className="font-semibold text-slate-100">What to do next</h2>
          </div>
          <ol className="mt-4 space-y-3">
            {report.next_steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-300">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-line text-xs text-mint">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
