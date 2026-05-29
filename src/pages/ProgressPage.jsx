import { useEffect, useState } from "react";
import Card from "../components/common/Card";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getDashboard, getDoubts, getSkills } from "../api/progressApi";

export default function ProgressPage() {
  const [dashboard, setDashboard] = useState(null);
  const [skills, setSkills] = useState(null);
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [dash, skillResult, doubtResult] = await Promise.all([
          getDashboard(),
          getSkills(),
          getDoubts()
        ]);
        if (!active) return;
        setDashboard(dash);
        setSkills(skillResult);
        setDoubts(doubtResult.doubts || []);
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
  }, []);

  if (loading) return <LoadingSpinner label="Loading progress" />;
  if (error) return <p className="text-rose">{error}</p>;

  const summary = dashboard?.summary || {};

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-mint">Progress</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-50">Learning profile</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Courses", summary.courses_created || 0],
          ["Completed modules", summary.completed_modules || 0],
          ["Mastered concepts", summary.mastered_concepts || 0],
          ["Weak concepts", summary.weak_concepts || 0]
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
            <div className="text-2xl font-semibold text-slate-50">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-100">Skill list</h2>
          <div className="mt-4 space-y-3">
            {(skills?.nodes || []).slice(0, 12).map((node, index) => (
              <div key={`${node.concept}-${index}`} className="rounded-md border border-line bg-ink p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-100">{node.concept}</span>
                  <span className="text-xs text-slate-500">{node.status}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full bg-mint" style={{ width: `${Math.round((node.mastery_score || 0) * 100)}%` }} />
                </div>
              </div>
            ))}
            {(skills?.nodes || []).length === 0 && <p className="text-sm text-slate-500">No evaluated skills yet.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-slate-100">Doubt history</h2>
          <div className="mt-4 space-y-3">
            {doubts.slice(0, 12).map((doubt) => (
              <div key={doubt.id} className="rounded-md border border-line bg-ink p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-100">{doubt.concept}</span>
                  <span className="text-xs text-mint">{doubt.doubt_type}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{doubt.doubt_text || "Doubt recorded from session flow"}</p>
              </div>
            ))}
            {doubts.length === 0 && <p className="text-sm text-slate-500">No doubts logged yet.</p>}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-slate-100">Metacognition</h2>
        <pre className="mt-4 overflow-x-auto rounded-md border border-line bg-ink p-4 text-xs text-slate-400">
          {JSON.stringify(dashboard?.metacognition || {}, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
