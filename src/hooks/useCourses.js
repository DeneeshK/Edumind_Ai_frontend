import { useCallback, useEffect, useState } from "react";
import { listCourses } from "../api/coursesApi";
import { sortCoursesNewestFirst } from "../utils/coursePresentation";

export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listCourses();
      setCourses(sortCoursesNewestFirst(result.courses || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { courses, loading, error, refresh };
}
