import { useState } from "react";
import { apiRequest } from "../api/client";
import Button from "../components/common/Button";
import Card from "../components/common/Card";

export default function DebugPanel() {
  const [courseId, setCourseId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setResult(null);
    try {
      const data = await apiRequest(`/api/debug/courses/${courseId}/decision-log`);
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <p className="text-sm uppercase tracking-wide text-mint">Debug</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-50">Decision log</h1>
      </div>
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            placeholder="course-1"
            className="flex-1 rounded-md border border-line bg-ink px-4 py-3 text-sm text-slate-100 outline-none focus:border-mint"
          />
          <Button onClick={load} disabled={!courseId.trim()}>Load</Button>
        </div>
        {error && <p className="mt-4 text-sm text-rose">{error}</p>}
        {result && (
          <pre className="mt-5 max-h-[620px] overflow-auto rounded-md border border-line bg-ink p-4 text-xs text-slate-400">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </Card>
    </div>
  );
}
