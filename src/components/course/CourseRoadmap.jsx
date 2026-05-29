import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock,
  Flame,
  Layers,
  Map,
  Play,
  Scissors
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../common/Button";
import Card from "../common/Card";

function formatMinutes(minutes = 0) {
  if (!minutes) return "Estimate pending";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins} min`;
  if (!mins) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

function values(items) {
  return Array.isArray(items) ? items.filter(Boolean) : [];
}

function SummaryItem({ label, value }) {
  const display = Array.isArray(value) ? values(value).join(", ") : value;
  return (
    <div className="rounded-md border border-line bg-ink p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-100">{display || "Not specified"}</p>
    </div>
  );
}

function InsightCard({ icon: Icon, title, items, tone = "mint" }) {
  const colors = {
    mint: "text-mint border-mint/25",
    amber: "text-amber border-amber/25",
    rose: "text-rose border-rose/25",
  };
  return (
    <Card className={`p-5 ${colors[tone] || colors.mint}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <h3 className="font-semibold text-slate-100">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-slate-300">
        {values(items).map((item, index) => (
          <li key={`${title}-${index}`} className="leading-relaxed">{item}</li>
        ))}
      </ul>
    </Card>
  );
}

export default function CourseRoadmap({ course, roadmap, compact = false }) {
  const navigate = useNavigate();

  if (!roadmap) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-slate-300">
          <Map className="h-5 w-5 text-mint" />
          <span>Roadmap is not available yet.</span>
        </div>
      </Card>
    );
  }

  const modules = roadmap.module_timeline || [];
  const firstModule = modules[0];
  const summary = roadmap.personalization_summary || {};
  const validation = roadmap.validation_result || {};
  const courseId = course?.id || roadmap.course_id;
  const roadmapSteps = values(roadmap.roadmap_steps);

  function openRoadmapModule(moduleId) {
    navigate(`/courses/${courseId}/modules/${moduleId}`);
  }

  if (validation.passed === false) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-amber">
          <BadgeCheck className="h-5 w-5" />
          <h2 className="font-semibold">EduMind could not create a high-quality roadmap.</h2>
        </div>
        <p className="mt-3 text-sm text-slate-300">Please try again or adjust the request.</p>
        {values(validation.issues).length > 0 && (
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            {validation.issues.map((issue, index) => <li key={`quality-${index}`}>{issue}</li>)}
          </ul>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-lg p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
          <div>
            <div className="flex items-center gap-2 text-mint">
              <Map className="h-4 w-4" />
              <p className="text-sm uppercase tracking-wide">Personalized Roadmap</p>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-50 lg:text-4xl">
              {roadmap.title || course?.title || course?.topic}
            </h1>
            <p className="mt-4 max-w-4xl text-base leading-relaxed text-slate-300">
              {roadmap.course_intention}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {firstModule && (
                <Link to={`/courses/${courseId}/modules/${firstModule.module_id}`}>
                  <Button>
                    <Play className="h-4 w-4" />
                    Start Course
                  </Button>
                </Link>
              )}
              {firstModule && (
                <Link to={`/courses/${courseId}/modules/${firstModule.module_id}`}>
                  <Button variant="secondary">
                    Go to Module 1
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link to={`/courses/${courseId}#modules`}>
                <Button variant="ghost">
                  <Layers className="h-4 w-4" />
                  View Modules
                </Button>
              </Link>
            </div>
          </div>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-mint">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-semibold">Estimated total time</span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-50">
              {formatMinutes(roadmap.estimated_total_time_minutes)}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Includes module work, practice, and short breaks.
            </p>
          </Card>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryItem label="Topic" value={summary.topic || course?.topic} />
        <SummaryItem label="Goal / Context" value={summary.goal_context || course?.goal} />
        <SummaryItem label="Pace" value={summary.pace || course?.pace} />
        <SummaryItem label="Depth" value={summary.depth_preference} />
      </section>

      {!compact && (
        <section className="grid gap-4 lg:grid-cols-3">
          <InsightCard icon={BadgeCheck} title="What You Already Know" items={roadmap.already_known} />
          <InsightCard icon={Scissors} title="Skipped Or Reduced" items={roadmap.skipped_or_reduced} tone="amber" />
          <InsightCard icon={Flame} title="What Gets Emphasized" items={roadmap.emphasized_topics} />
        </section>
      )}

      {!compact && (
        <section>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-mint">
              <Map className="h-4 w-4" />
              <h2 className="font-semibold text-slate-100">Step-By-Step Roadmap</h2>
            </div>
            <ol className="mt-4 space-y-3 text-sm text-slate-300">
              {roadmapSteps.map((step, index) => (
                <li key={`roadmap-step-${index}`} className="flex gap-3 leading-relaxed">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line text-xs text-mint">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        </section>
      )}

      <section>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-mint">
            <CalendarDays className="h-4 w-4" />
            <h2 className="font-semibold text-slate-100">Recommended Schedule</h2>
          </div>
          <div className="mt-4 space-y-4">
            {values(roadmap.recommended_schedule).map((day) => (
              <div key={day.day} className="rounded-md border border-line bg-ink p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-100">Day {day.day}</h3>
                  <span className="text-xs text-slate-500">{day.title}</span>
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  {values(day.items).map((item) => (
                    <div key={`${day.day}-${item.module_id}`} className="flex items-start justify-between gap-3">
                      <span>{item.module_title}</span>
                      <span className="shrink-0 text-slate-500">{item.estimated_minutes} min</span>
                    </div>
                  ))}
                  {(day.review_minutes || day.practice_minutes || day.break_minutes) > 0 && (
                    <div className="border-t border-line pt-2 text-xs text-slate-500">
                      Review {day.review_minutes || 0} min · Practice {day.practice_minutes || 0} min · Break {day.break_minutes || 0} min
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section id="roadmap-modules" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-mint">Module Timeline</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-50">Your learning path</h2>
          </div>
        </div>
        <div className="space-y-3">
          {modules.map((module) => (
            <Card
              key={module.module_id}
              role="link"
              tabIndex={0}
              onClick={() => openRoadmapModule(module.module_id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openRoadmapModule(module.module_id);
                }
              }}
              className={`cursor-pointer p-5 outline-none transition duration-200 hover:-translate-y-0.5 hover:border-mint/40 hover:shadow-glow focus-visible:border-mint focus-visible:ring-2 focus-visible:ring-mint/30 ${module.recommended_next ? "border-mint/50 shadow-glow" : ""}`}
            >
              <div className="grid gap-4 lg:grid-cols-[72px_minmax(0,1fr)_180px] lg:items-start">
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-line bg-panel2 text-lg font-semibold text-mint">
                  {module.module_number}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-50">{module.title}</h3>
                    {module.recommended_next && (
                      <span className="rounded-md bg-mint/10 px-2 py-1 text-xs text-mint">Recommended next</span>
                    )}
                    <span className="rounded-md border border-line px-2 py-1 text-xs text-slate-400">{module.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{module.concept}</p>
                  {values(module.concepts_taught).length > 0 && (
                    <p className="mt-2 text-xs text-slate-500">
                      Teaches: {module.concepts_taught.join(", ")}
                    </p>
                  )}
                  {module.why_now && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{module.why_now}</p>
                  )}
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{module.why_this_module_matters}</p>
                  {values(module.prerequisites).length > 0 && (
                    <p className="mt-3 text-xs text-slate-500">
                      Prerequisites: {module.prerequisites.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 lg:justify-end">
                  <span className="rounded-md border border-line px-2 py-1">{module.estimated_minutes} min</span>
                  <span className="rounded-md border border-line px-2 py-1">{module.difficulty}</span>
                  <Link
                    to={`/courses/${courseId}/modules/${module.module_id}`}
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-md bg-mint px-3 py-1.5 font-semibold text-white hover:bg-[#6d28d9]"
                  >
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
