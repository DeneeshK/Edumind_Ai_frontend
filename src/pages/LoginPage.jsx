import { Chrome, GraduationCap } from "lucide-react";
import { useState } from "react";
import { API_BASE_URL } from "../api/client";
import Button from "../components/common/Button";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleLogin() {
    setLoading(true);
    setError("");
    try {
      window.location.href = `${API_BASE_URL}/auth/google/login`;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-mint/30 bg-mint/10">
            <GraduationCap className="h-7 w-7 text-mint" />
          </div>
        </div>
        <div className="glass-panel rounded-lg p-8">
          <p className="text-sm uppercase tracking-wide text-mint">EduMind</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-50">
            Your adaptive AI learning workspace
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Sign in to continue your courses, reopen saved modules, and ask grounded doubts while you study.
          </p>
          <Button
            className="mt-7 w-full"
            variant="secondary"
            onClick={handleLogin}
            disabled={loading}
          >
            <Chrome className="h-4 w-4" />
            {loading ? "Signing in" : "Continue with Google"}
          </Button>
          {error && <p className="mt-4 text-sm text-rose">{error}</p>}
        </div>
      </div>
    </div>
  );
}
