import { ArrowLeft, Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCourseRoadmap } from "../api/coursesApi";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import CourseRoadmap from "../components/course/CourseRoadmap";

export default function RoadmapPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await getCourseRoadmap(courseId);
        if (!active) return;
        setCourse(result.course);
        setRoadmap(result.roadmap);
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
        <Link to={`/courses/${courseId}#modules`}>
          <Button variant="secondary">
            <Layers className="h-4 w-4" />
            View Modules
          </Button>
        </Link>
      </div>
      <CourseRoadmap course={course} roadmap={roadmap} />
    </div>
  );
}
