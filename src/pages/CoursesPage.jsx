import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { deleteCourse } from "../api/coursesApi";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import CourseCard from "../components/course/CourseCard";
import { useCourses } from "../hooks/useCourses";
import { getCourseTitle } from "../utils/coursePresentation";

export default function CoursesPage() {
  const { courses, loading, error, refresh } = useCourses();
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function confirmDelete() {
    if (!courseToDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteCourse(courseToDelete.id);
      setCourseToDelete(null);
      await refresh();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-line bg-panel/60 p-5 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-wide text-mint">Courses</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-50">Your Courses</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Newest courses appear first so the latest learning path is always easy to resume.
          </p>
        </div>
        <Link to="/courses/new">
          <Button>
            <PlusCircle className="h-4 w-4" />
            New Course
          </Button>
        </Link>
      </div>
      {loading && <LoadingSpinner label="Loading courses" />}
      {error && <p className="text-sm text-rose">{error}</p>}
      {!loading && courses.length === 0 && (
        <EmptyState
          title="Nothing here yet"
          description="Courses you create will be saved here with modules, progress, doubts, and lesson content."
          action={<Link to="/courses/new"><Button>Start New Course</Button></Link>}
        />
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onDelete={(selectedCourse) => {
              setDeleteError("");
              setCourseToDelete(selectedCourse);
            }}
          />
        ))}
      </div>

      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-course-title"
            className="w-full max-w-md rounded-lg border border-line bg-panel p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-course-title" className="text-lg font-semibold text-slate-50">
              Delete this course?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              This cannot be undone. {getCourseTitle(courseToDelete)} and its saved modules will be removed.
            </p>
            {deleteError && (
              <p className="mt-4 rounded-md border border-rose/30 bg-rose/10 p-3 text-sm text-rose">
                {deleteError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCourseToDelete(null);
                  setDeleteError("");
                }}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
