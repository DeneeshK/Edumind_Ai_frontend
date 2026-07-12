import {
  AlertOctagon,
  AlertTriangle,
  CalendarClock,
  Info,
  Lightbulb,
  Megaphone,
  RefreshCw,
  Users2
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  createPost,
  fetchLatestArtifact,
  generateClusters,
  generateInsights,
  generateRevisionPlan
} from "../../api/institutionApi";
import Button from "../common/Button";

const SEVERITY = {
  info: { icon: Info, className: "border-l-[#2a78d6] bg-[#2a78d6]/5", iconClass: "text-[#2a78d6]" },
  warning: { icon: AlertTriangle, className: "border-l-[#eda100] bg-[#eda100]/5", iconClass: "text-[#9a6a00]" },
  critical: { icon: AlertOctagon, className: "border-l-rose bg-rose/5", iconClass: "text-rose" }
};

function SectionShell({ icon: Icon, title, subtitle, artifact, busy, onGenerate, generateLabel, children }) {
  return (
    <section className="glass-panel rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-100">
            <Icon className="h-5 w-5 text-mint" />
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {artifact?.created_at && (
            <span className={`text-xs ${artifact.stale ? "text-[#9a6a00]" : "text-slate-500"}`}>
              {artifact.stale ? "Outdated · " : ""}
              {new Date(artifact.created_at).toLocaleString()}
            </span>
          )}
          <Button onClick={onGenerate} disabled={busy} variant={artifact?.content_json ? "secondary" : "primary"}>
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
            {busy ? "Thinking…" : generateLabel}
          </Button>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function AiStudioTab({ classroomId }) {
  const [insights, setInsights] = useState(null);
  const [clusters, setClusters] = useState(null);
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [planDays, setPlanDays] = useState(7);
  const [publishNote, setPublishNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchLatestArtifact(classroomId, "insights").catch(() => null),
      fetchLatestArtifact(classroomId, "clusters").catch(() => null),
      fetchLatestArtifact(classroomId, "revision_plan").catch(() => null)
    ]).then(([i, c, p]) => {
      if (cancelled) return;
      if (i?.content_json) setInsights(i);
      if (c?.content_json) setClusters(c);
      if (p?.content_json) setPlan(p);
    });
    return () => { cancelled = true; };
  }, [classroomId]);

  async function run(kind) {
    setBusy(kind);
    setError("");
    try {
      if (kind === "insights") setInsights(await generateInsights(classroomId));
      if (kind === "clusters") setClusters(await generateClusters(classroomId));
      if (kind === "plan") setPlan(await generateRevisionPlan(classroomId, planDays, false));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function publishPlan() {
    if (!plan?.content_json) return;
    setBusy("publish");
    try {
      await generateRevisionPlan(classroomId, plan.content_json.days || planDays, true);
      setPublishNote("Revision plan published to the class stream.");
      setTimeout(() => setPublishNote(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function assignClusterTask(cluster) {
    setBusy(`task:${cluster.label}`);
    try {
      await createPost(classroomId, {
        post_type: "task",
        title: `Task for: ${cluster.label}`,
        body_markdown: cluster.recommended_task,
        student_ids: cluster.student_ids
      });
      setPublishNote(`Task assigned to "${cluster.label}" (${cluster.student_ids.length} students).`);
      setTimeout(() => setPublishNote(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  const insightData = insights?.content_json;
  const clusterData = clusters?.content_json;
  const planData = plan?.content_json;

  return (
    <div className="space-y-6">
      {error && <p className="rounded-lg bg-rose/10 px-4 py-2 text-sm text-rose">{error}</p>}
      {publishNote && (
        <p className="rounded-lg bg-mint/10 px-4 py-2 text-sm font-medium text-mint">{publishNote}</p>
      )}

      <SectionShell
        icon={Lightbulb}
        title="AI Insights"
        subtitle="The charts, explained — what's working, what needs attention, what to do next."
        artifact={insights}
        busy={busy === "insights"}
        onGenerate={() => run("insights")}
        generateLabel={insightData ? "Refresh insights" : "Generate insights"}
      >
        {!insightData ? (
          <p className="text-sm text-slate-400">
            No insights yet — generate them once your class has some activity.
          </p>
        ) : (
          <div className="space-y-3">
            {insightData.summary && (
              <p className="text-sm leading-relaxed text-slate-300">{insightData.summary}</p>
            )}
            {insightData.insights.map((insight, i) => {
              const sev = SEVERITY[insight.severity] || SEVERITY.info;
              const Icon = sev.icon;
              return (
                <div key={i} className={`rounded-lg border-l-4 p-4 ${sev.className}`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${sev.iconClass}`} />
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{insight.title}</h4>
                      <p className="mt-1 text-sm text-slate-300">{insight.detail}</p>
                      {insight.suggested_action && (
                        <p className="mt-2 text-xs font-semibold text-slate-100">
                          → {insight.suggested_action}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionShell>

      <SectionShell
        icon={Users2}
        title="Student Clusters"
        subtitle="AI groups students by learning behaviour so you can assign different tasks to different groups."
        artifact={clusters}
        busy={busy === "clusters"}
        onGenerate={() => run("clusters")}
        generateLabel={clusterData ? "Re-cluster" : "Cluster students"}
      >
        {!clusterData ? (
          <p className="text-sm text-slate-400">
            No clusters yet — needs at least 2 students with learning data.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {clusterData.clusters.map((cluster) => (
              <div key={cluster.label} className="rounded-lg border border-line bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-100">{cluster.label}</h4>
                  <span className="rounded-full bg-mint/10 px-2 py-0.5 text-xs font-semibold text-mint">
                    {cluster.students.length}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{cluster.rationale}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {cluster.students.map((s) => (
                    <span key={s.student_id} className="rounded-full bg-panel2 px-2 py-0.5 text-xs text-slate-300">
                      {s.name}
                    </span>
                  ))}
                </div>
                {cluster.recommended_task && (
                  <div className="mt-3 border-t border-line pt-3">
                    <p className="text-xs text-slate-300">
                      <span className="font-semibold text-slate-100">Suggested task:</span>{" "}
                      {cluster.recommended_task}
                    </p>
                    <Button
                      variant="secondary"
                      className="mt-2 !px-3 !py-1.5 text-xs"
                      disabled={busy === `task:${cluster.label}`}
                      onClick={() => assignClusterTask(cluster)}
                    >
                      <Megaphone className="h-3.5 w-3.5" />
                      Assign to this group
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionShell>

      <SectionShell
        icon={CalendarClock}
        title="Revision Planner"
        subtitle="AI analyses every student and prepares a day-by-day revision plan for the class."
        artifact={plan}
        busy={busy === "plan"}
        onGenerate={() => run("plan")}
        generateLabel={planData ? "Regenerate plan" : "Generate revision plan"}
      >
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
          Plan length:
          <select
            value={planDays}
            onChange={(e) => setPlanDays(Number(e.target.value))}
            className="rounded-lg border border-line bg-white px-2 py-1 text-sm text-slate-100 focus:border-mint focus:outline-none"
          >
            <option value={5}>5 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
          </select>
        </div>
        {!planData ? (
          <p className="text-sm text-slate-400">No revision plan yet.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-100">{planData.title}</h4>
              <Button onClick={publishPlan} disabled={busy === "publish"} className="!px-3 !py-1.5">
                <Megaphone className="h-4 w-4" />
                Publish to class stream
              </Button>
            </div>
            {planData.pace_advice && (
              <p className="rounded-lg bg-panel2/80 p-3 text-sm italic text-slate-300">
                {planData.pace_advice}
              </p>
            )}
            {planData.priority_concepts?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {planData.priority_concepts.map((concept) => (
                  <span key={concept} className="rounded-full bg-mint/10 px-2.5 py-0.5 text-xs font-semibold text-mint">
                    {concept}
                  </span>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {planData.daily_plan.map((day) => (
                <div key={day.day} className="flex gap-3 rounded-lg border border-line bg-white p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mint/10 text-sm font-bold text-mint">
                    {day.day}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100">
                      {day.focus}
                      {day.target_group && day.target_group !== "everyone" && (
                        <span className="ml-2 rounded-full bg-[#eda100]/15 px-2 py-0.5 text-xs font-semibold text-[#9a6a00]">
                          {day.target_group}
                        </span>
                      )}
                    </p>
                    <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
                      {day.activities.map((activity, i) => <li key={i}>{activity}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            {planData.recommended_tests?.length > 0 && (
              <p className="text-xs text-slate-400">
                <span className="font-semibold text-slate-100">Recommended tests:</span>{" "}
                {planData.recommended_tests.join(" · ")}
              </p>
            )}
          </div>
        )}
      </SectionShell>
    </div>
  );
}
