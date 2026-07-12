import {
  Activity,
  AlertTriangle,
  Award,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAnalyticsOverview,
  fetchConceptHeatmap,
  fetchDoubtAnalytics,
  fetchStudentTable
} from "../../api/institutionApi";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  ConceptHeatmap,
  DoubtBarChart,
  KpiTile,
  ProgressBarChart,
  ScoreTrendChart,
  pct
} from "./charts";

const RISK_STYLES = {
  high: "bg-rose/10 text-rose",
  medium: "bg-[#eda100]/15 text-[#9a6a00]",
  low: "bg-[#1baf7a]/15 text-[#0c7a53]"
};

function StudentsTable({ classroomId, students }) {
  if (!students.length) {
    return <p className="py-6 text-center text-sm text-slate-400">No student data yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-3">#</th>
            <th className="py-2 pr-3">Student</th>
            <th className="py-2 pr-3">Mastery</th>
            <th className="py-2 pr-3">Progress</th>
            <th className="py-2 pr-3">Tests</th>
            <th className="py-2 pr-3">Doubts</th>
            <th className="py-2 pr-3">Active days (30d)</th>
            <th className="py-2">Risk</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.student_id} className="border-b border-line/60 hover:bg-panel2/60">
              <td className="py-2 pr-3 text-slate-500">{s.rank}</td>
              <td className="py-2 pr-3">
                <Link
                  to={`/institution/classrooms/${classroomId}/students/${s.student_id}`}
                  className="font-medium text-slate-100 hover:text-mint"
                >
                  {s.name}
                </Link>
              </td>
              <td className="py-2 pr-3 text-slate-400">{pct(s.avg_mastery)}</td>
              <td className="py-2 pr-3 text-slate-400">{pct(s.avg_progress)}</td>
              <td className="py-2 pr-3 text-slate-400">
                {s.avg_test_score === null ? "—" : `${pct(s.avg_test_score)} (${s.tests_taken})`}
              </td>
              <td className="py-2 pr-3 text-slate-400">{s.doubt_count}</td>
              <td className="py-2 pr-3 text-slate-400">{s.active_days_30}</td>
              <td className="py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RISK_STYLES[s.risk]}`}>
                  {s.risk}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AnalyticsTab({ classroomId }) {
  const [overview, setOverview] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [students, setStudents] = useState([]);
  const [doubts, setDoubts] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [ov, hm, st, db] = await Promise.all([
          fetchAnalyticsOverview(classroomId),
          fetchConceptHeatmap(classroomId),
          fetchStudentTable(classroomId),
          fetchDoubtAnalytics(classroomId)
        ]);
        if (cancelled) return;
        setOverview(ov);
        setHeatmap(hm);
        setStudents(st.students || []);
        setDoubts(db);
        setError("");
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [classroomId]);

  if (loading) return <LoadingSpinner label="Crunching classroom analytics" />;
  if (error) return <p className="text-sm text-rose">{error}</p>;

  const atRisk = students.filter((s) => s.risk === "high");
  const topPerformers = students.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Class mastery"
          value={pct(overview.avg_mastery)}
          hint="Average concept mastery"
          icon={Award}
        />
        <KpiTile
          label="Avg test score"
          value={overview.avg_test_score ? pct(overview.avg_test_score) : "—"}
          hint={`${overview.attempts} graded attempts`}
          icon={TrendingUp}
        />
        <KpiTile
          label="Course completion"
          value={pct(overview.avg_progress)}
          hint={`${overview.completed_courses}/${overview.assigned_courses} courses finished`}
          icon={BookOpen}
        />
        <KpiTile
          label="Active this week"
          value={`${overview.active_last_7_days}/${overview.active_members}`}
          hint="Students with activity in 7 days"
          icon={Activity}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass-panel rounded-xl p-5">
          <h3 className="mb-2 text-sm font-bold text-slate-100">
            Weekly average test score
          </h3>
          <ScoreTrendChart data={overview.score_trend} />
        </section>
        <section className="glass-panel rounded-xl p-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-100">
            <HelpCircle className="h-4 w-4 text-mint" />
            Most-asked doubt concepts
          </h3>
          <DoubtBarChart data={doubts?.by_concept} />
        </section>
      </div>

      <section className="glass-panel rounded-xl p-5">
        <h3 className="mb-2 text-sm font-bold text-slate-100">Concept mastery heatmap</h3>
        <p className="mb-3 text-xs text-slate-400">
          Darker = higher mastery. Hover a cell for the exact value. Dashed cells have no data yet.
        </p>
        <ConceptHeatmap heatmap={heatmap} />
      </section>

      {atRisk.length > 0 && (
        <section className="glass-panel rounded-xl border-l-4 border-l-rose p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-100">
            <AlertTriangle className="h-4 w-4 text-rose" />
            Students at risk ({atRisk.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {atRisk.map((s) => (
              <Link
                key={s.student_id}
                to={`/institution/classrooms/${classroomId}/students/${s.student_id}`}
                className="rounded-lg border border-rose/30 bg-rose/5 px-3 py-1.5 text-sm font-semibold text-rose hover:bg-rose/10"
              >
                {s.name} · {pct(s.avg_mastery)} mastery
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass-panel rounded-xl p-5">
          <h3 className="mb-2 text-sm font-bold text-slate-100">Course progress by student</h3>
          <ProgressBarChart students={students} />
        </section>
        <section className="glass-panel rounded-xl p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-100">
            <Award className="h-4 w-4 text-mint" />
            Top performers
          </h3>
          {topPerformers.length === 0 ? (
            <p className="text-sm text-slate-400">No data yet.</p>
          ) : (
            <ol className="space-y-2">
              {topPerformers.map((s, i) => (
                <li key={s.student_id} className="flex items-center gap-3 rounded-lg bg-panel2/70 p-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mint/10 text-sm font-bold text-mint">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100">{s.name}</p>
                    <p className="text-xs text-slate-400">
                      {pct(s.composite_score)} composite · {pct(s.avg_mastery)} mastery
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="glass-panel rounded-xl p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-100">
          <Users className="h-4 w-4 text-mint" />
          Student ranking
        </h3>
        <StudentsTable classroomId={classroomId} students={students} />
      </section>
    </div>
  );
}
