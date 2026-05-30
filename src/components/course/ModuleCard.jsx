import { ArrowRight, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../common/Card";

const statusIcon = {
  completed: CheckCircle2,
  in_progress: Sparkles,
  not_started: Circle
};

export default function ModuleCard({ courseId, module }) {
  const navigate = useNavigate();
  const Icon = statusIcon[module.status] || Circle;
  const modulePath = `/courses/${courseId}/modules/${module.id}`;

  function openModule() {
    navigate(modulePath);
  }

  return (
    <Card
      role="link"
      tabIndex={0}
      onClick={openModule}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openModule();
        }
      }}
      className={`cursor-pointer p-5 outline-none transition duration-200 hover:-translate-y-0.5 hover:border-mint/40 hover:shadow-glow focus-visible:border-mint focus-visible:ring-2 focus-visible:ring-mint/30 ${module.recommended ? "border-mint/50 shadow-glow" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-panel2 text-sm font-semibold text-mint">
            {module.module_index + 1}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-50">{module.title}</h3>
              {module.recommended && (
                <span className="rounded-md bg-mint/10 px-2 py-1 text-xs text-mint">Recommended</span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-400">{module.concept}</p>
          </div>
        </div>
        <Icon className={`h-5 w-5 shrink-0 ${module.status === "completed" ? "text-green-600" : "text-mint"}`} />
      </div>
      <p className="mt-4 line-clamp-3 text-sm text-slate-400">{module.description}</p>
      {module.status === "completed" && module.latest_mastery_score != null && (
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Mastery</span>
            <span className="font-semibold text-slate-700">{Math.round(module.latest_mastery_score * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-mint" style={{ width: `${Math.round(module.latest_mastery_score * 100)}%` }} />
          </div>
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>{module.estimated_minutes} min</span>
        <span>{module.content_exists ? "Saved lesson" : "Generates on open"}</span>
        {module.has_eval_report && (
          <Link
            to={`/courses/${courseId}/modules/${module.id}?showReport=true`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-semibold text-mint hover:underline"
          >
            Progress Report
          </Link>
        )}
        <Link
          to={modulePath}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-mint transition hover:bg-mint/10 hover:text-[#6d28d9]"
        >
          Open <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
