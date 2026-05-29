import { ArrowRight, CalendarDays, Clock, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../common/Card";
import CourseProgress from "./CourseProgress";
import { getCourseDateLabel, getCoursePaceLabel, getCourseTitle } from "../../utils/coursePresentation";

export default function CourseCard({ course, onDelete }) {
  const navigate = useNavigate();
  const title = getCourseTitle(course);
  const coursePath = `/courses/${course.id}`;

  function stopCardOpen(event) {
    event.stopPropagation();
  }

  return (
    <Card
      role="link"
      tabIndex={0}
      onClick={() => course.id && navigate(coursePath)}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && course.id) {
          event.preventDefault();
          navigate(coursePath);
        }
      }}
      className="group flex min-h-[260px] cursor-pointer flex-col p-5 outline-none transition duration-200 hover:-translate-y-0.5 hover:border-mint/30 hover:shadow-glow focus-visible:border-mint focus-visible:ring-2 focus-visible:ring-mint/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-mint">{getCoursePaceLabel(course)}</p>
          <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-slate-50 transition group-hover:text-slate-100">
            {title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-slate-400">{course.goal}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-md border border-line bg-panel2 px-2 py-1 text-xs text-slate-400">
            {course.status || "saved"}
          </span>
          {onDelete && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(course);
              }}
              className="rounded-md border border-line bg-panel2 p-2 text-slate-500 transition hover:border-rose/50 hover:bg-rose/10 hover:text-rose focus:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
              title="Delete course"
              aria-label={`Delete ${title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="mt-5">
        <CourseProgress progress={course.progress} />
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5 text-xs text-slate-500">
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {course.module_count || 0} modules
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {getCourseDateLabel(course)}
          </span>
        </div>
        <Link
          to={coursePath}
          onClick={stopCardOpen}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-mint transition hover:bg-mint/10 hover:text-[#6d28d9]"
        >
          Open <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
