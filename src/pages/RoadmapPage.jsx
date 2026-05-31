import { ArrowLeft, CalendarDays, Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCourse } from "../api/coursesApi";
import { getSchedule } from "../api/scheduleApi";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import LoadingSpinner from "../components/common/LoadingSpinner";
import CourseRoadmap from "../components/course/CourseRoadmap";

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

export default function RoadmapPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await getCourse(courseId);
        if (!active) return;
        setCourse(result.course);
        setRoadmap(result.course?.roadmap);
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

  if (loading) return <LoadingSpinner label="Loading roadmap" />;

  if (error) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <p className="text-rose">{error}</p>
        <Link to={`/courses/${courseId}`}>
          <Button variant="secondary">
            <Layers className="h-4 w-4" />
            Open Course
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={`/courses/${courseId}`}>
          <Button variant="ghost" className="px-0 text-slate-400">
            <ArrowLeft className="h-4 w-4" />
            Course
          </Button>
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link to={`/courses/${courseId}/schedule`}>
            <Button variant="primary">
              <CalendarDays className="h-4 w-4" />
              Learning Schedule
            </Button>
          </Link>
          <Link to={`/courses/${courseId}#modules`}>
            <Button variant="secondary">
              <Layers className="h-4 w-4" />
              View Modules
            </Button>
          </Link>
        </div>
      </div>
      <SchedulePreview courseId={courseId} schedule={schedule} />
      <CourseRoadmap
        course={course}
        roadmap={roadmap}
        moduleProgressMap={Object.fromEntries((course?.modules || []).map((module) => [module.id, module]))}
      />
    </div>
  );
}
