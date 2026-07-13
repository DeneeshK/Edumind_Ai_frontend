import { useCallback, useEffect, useState } from "react";
import { fetchClassroom, fetchInstitutionHome } from "../api/institutionApi";

export function useInstitutionHome() {
  const [data, setData] = useState({ teaching: [], joined: [], invitations: [], student_id: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await fetchInstitutionHome();
      // Normalise so the UI never sees undefined arrays (e.g. an older backend
      // response that predates the invitations field).
      setData({
        teaching: result.teaching || [],
        joined: result.joined || [],
        invitations: result.invitations || [],
        student_id: result.student_id || ""
      });
    } catch (err) {
      setError(err.message || "Failed to load classrooms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...data, loading, error, reload };
}

export function useClassroom(classroomId) {
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!classroomId) return;
    try {
      setLoading(true);
      setError("");
      setClassroom(await fetchClassroom(classroomId));
    } catch (err) {
      setError(err.message || "Failed to load classroom");
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { classroom, loading, error, reload };
}
