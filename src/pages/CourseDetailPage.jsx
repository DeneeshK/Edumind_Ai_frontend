import { ArrowLeft, Award, BarChart3, BookOpen, CalendarDays, Map, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getCourse } from "../api/coursesApi";
import { getSchedule } from "../api/scheduleApi";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ModuleCard from "../components/course/ModuleCard";
import CourseProgress from "../components/course/CourseProgress";
import CourseRoadmap from "../components/course/CourseRoadmap";
import { getCoursePaceLabel } from "../utils/coursePresentation";

const tabs = [
  ["roadmap", "Roadmap", Map],
  ["modules", "Modules", BookOpen],
  ["progress", "Progress", BarChart3],
];

function normalizeSchedule(payload) {
  return payload?.schedule || payload || null;
}

function values(items) {
  return Array.isArray(items) ? items.filter(Boolean) : [];
}

function formatDate(value) {
  if (!value) return "Date pending";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function SchedulePreview({ courseId, schedule }) {
  if (!schedule) return null;

  const days = values(schedule.days).slice(0, 3);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-mint">
          <CalendarDays className="h-4 w-4" />
          <h2 className="font-semibold text-slate-50">Your Learning Schedule</h2>
        </div>
        <Link to={`/courses/${courseId}/schedule`}>
          <Button variant="ghost">
            View Full Schedule
          </Button>
        </Link>
      </div>

      {schedule.overall_advice && (
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{schedule.overall_advice}</p>
      )}

      {values(schedule.weekly_milestones).length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {values(schedule.weekly_milestones).map((milestone, index) => (
            <span
              key={`${milestone}-${index}`}
              className="shrink-0 rounded-full border border-line px-3 py-1 text-xs text-slate-400"
            >
              {milestone}
            </span>
          ))}
        </div>
      )}

      {days.length > 0 && (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {days.map((day) => {
            const items = values(day.timetable_items);
            const completedCount = items.filter((item) => item.completed).length;
            const allDone = items.length > 0 && completedCount === items.length;

            return (
              <div key={`${day.day_number}-${day.date}`} className="rounded-md border border-line bg-ink p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-50">
                      {day.day_theme || `Day ${day.day_number}`}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(day.date)}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold ${allDone ? "text-green-500" : "text-slate-400"}`}>
                    {completedCount} / {items.length} done
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span>{items.length} {items.length === 1 ? "module" : "modules"}</span>
                  <span>{day.total_study_minutes || 0} min</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link
        to={`/courses/${courseId}/schedule`}
        className="mt-4 inline-flex text-sm font-semibold text-mint hover:text-[#6d28d9]"
      >
        View Full Schedule -&gt;
      </Link>
    </Card>
  );
}

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const location = useLocation();
  const [course, setCourse] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(
    typeof window !== "undefined" && window.location.hash === "#modules" ? "modules" : "roadmap"
  );

  useEffect(() => {
    if (location.hash === "#modules") {
      setActiveTab("modules");
    }
  }, [location.hash]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const result = await getCourse(courseId);
        if (active) setCourse(result.course);
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

  useEffect(() => {
    let active = true;
    async function loadSchedule() {
      try {
        const result = await getSchedule(courseId);
        if (active) setSchedule(normalizeSchedule(result));
      } catch {
        if (active) setSchedule(null);
      }
    }
    loadSchedule();
    return () => {
      active = false;
    };
  }, [courseId]);

  if (loading) return <LoadingSpinner label="Loading course" />;
  if (error) return <p className="text-rose">{error}</p>;
  if (!course) return null;

  const modules = (course.modules || [])
    .map((module, index) => ({ module, index }))
    .sort((a, b) => {
      const aIndex = Number(a.module.module_index);
      const bIndex = Number(b.module.module_index);
      if (Number.isFinite(aIndex) && Number.isFinite(bIndex) && aIndex !== bIndex) {
        return aIndex - bIndex;
      }
      return a.index - b.index;
    })
    .map(({ module }) => module);
  const moduleProgressMap = Object.fromEntries((course.modules || []).map((module) => [module.id, module]));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link to="/courses">
        <Button variant="ghost" className="px-0 text-slate-400">
          <ArrowLeft className="h-4 w-4" />
          Courses
        </Button>
      </Link>
      <section className="glass-panel rounded-lg p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p className="text-sm uppercase tracking-wide text-mint">{getCoursePaceLabel(course.pace)}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-50">
              {course.title || course.topic}
            </h1>
            <p className="mt-3 max-w-3xl text-slate-400">{course.goal}</p>
            {course.roadmap?.course_intention && (
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-300">
                {course.roadmap.course_intention}
              </p>
            )}
          </div>
          <CourseProgress progress={course.progress} />
        </div>
      </section>

      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        {tabs.map(([id, label, Icon]) => (
          <Button
            key={id}
            type="button"
            variant={activeTab === id ? "primary" : "ghost"}
            onClick={() => setActiveTab(id)}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
        {course.has_completion_report && (
          <Link to={`/courses/${courseId}/report`}>
            <Button variant="ghost">
              <Award className="h-4 w-4" />
              Final Report
            </Button>
          </Link>
        )}
      </div>

      {activeTab === "roadmap" && (
        <section className="space-y-4">
          <div className="flex justify-end">
            <Link to={`/courses/${courseId}/schedule`}>
              <Button variant="primary">
                <CalendarDays className="h-4 w-4" />
                Learning Schedule
              </Button>
            </Link>
          </div>
          <CourseRoadmap
            course={course}
            roadmap={course.roadmap}
            moduleProgressMap={moduleProgressMap}
            compact
          />
          <SchedulePreview courseId={courseId} schedule={schedule} />
        </section>
      )}

      {activeTab === "modules" && (
        <section id="modules" className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-mint">Course Path</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-50">Roadmap and modules</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card className="p-5 transition hover:border-mint/40 hover:shadow-glow">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line bg-panel2 text-mint">
                  <Map className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-50">Roadmap / Study Plan</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Reopen the personalized plan, schedule, skipped topics, and focus areas.
                  </p>
                </div>
              </div>
              <Link to={`/courses/${course.id}/roadmap`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-mint hover:text-[#6d28d9]">
                Open roadmap <Sparkles className="h-4 w-4" />
              </Link>
            </Card>
            {modules.map((module) => (
              <ModuleCard key={module.id} courseId={course.id} module={module} />
            ))}
          </div>
        </section>
      )}

      {activeTab === "progress" && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-50">Progress</h2>
          <div className="mt-5 max-w-md">
            <CourseProgress progress={course.progress} />
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Completed modules: {course.completed_modules || 0} of {course.module_count || 0}
          </p>
        </Card>
      )}
    </div>
  );
}
