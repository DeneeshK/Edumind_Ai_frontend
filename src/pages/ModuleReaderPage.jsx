import { ArrowLeft, CheckCircle2, GripVertical, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  getModule,
  completeModule,
  startEvaluation,
  submitEvaluationAnswer,
  getNextModule,
  getLatestEvaluationReport
} from "../api/modulesApi";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ChatPanel from "../components/chat/ChatPanel";
import LessonViewer from "../components/lesson/LessonViewer";
import EvaluationModal from "../components/lesson/EvaluationModal";
import VideoResources from "../components/lesson/VideoResources";
import { useModuleChat } from "../hooks/useModuleChat";
import { useSSE } from "../hooks/useSSE";
import { getLessonVideos } from "../utils/videos";

const CHAT_WIDTH_STORAGE_KEY = "edumind.moduleAssistantWidth.v2";
const MIN_CHAT_WIDTH = 360;
const MAX_CHAT_WIDTH = 520;
const DEFAULT_CHAT_WIDTH = 420;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeEvaluationReport(source) {
  if (!source) return null;

  const session = source.session || source;
  const finalReport = session.final_report || source.final_report || source.report || source;
  const hasReport = Boolean(
    finalReport?.mastery_score !== undefined ||
    finalReport?.strengths?.length ||
    finalReport?.weak_concepts?.length ||
    session?.decision ||
    session?.motivational_feedback ||
    session?.transition_feedback
  );

  if (!hasReport) return null;

  return {
    finalReport,
    decision: session.decision || finalReport.decision || "",
    motivationalFeedback: session.motivational_feedback || finalReport.motivational_feedback || "",
    transitionFeedback: session.transition_feedback || finalReport.transition_feedback || ""
  };
}

function EvaluationReportPanel({ report }) {
  if (!report?.finalReport) return null;

  const { finalReport, decision, motivationalFeedback, transitionFeedback } = report;
  const masteryScore = Math.round(clamp(Number(finalReport.mastery_score) || 0, 0, 1) * 100);

  return (
    <details open className="mt-8 rounded-lg border border-line bg-panel2 p-5">
      <summary className="cursor-pointer text-base font-semibold text-slate-100">
        Your Progress Report
      </summary>
      <div className="mt-5 space-y-4 text-sm text-slate-300">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="font-semibold text-slate-100">Mastery Score</span>
            <span className="font-semibold text-slate-100">{masteryScore}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-mint" style={{ width: `${masteryScore}%` }} />
          </div>
        </div>

        {Boolean(finalReport.strengths?.length) && (
          <section>
            <h3 className="font-semibold text-slate-100">What you got right</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-400">
              {finalReport.strengths.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {Boolean(finalReport.weak_concepts?.length) && (
          <section>
            <h3 className="font-semibold text-slate-100">Areas to revisit</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-400">
              {finalReport.weak_concepts.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {motivationalFeedback && (
          <p className="leading-relaxed text-slate-300">{motivationalFeedback}</p>
        )}

        {transitionFeedback && (
          <p className="leading-relaxed text-slate-400">{transitionFeedback}</p>
        )}

        {decision && (
          <div className="rounded-md border border-mint/30 bg-mint/10 px-3 py-2 font-semibold text-mint">
            Decision: {decision}
          </div>
        )}
      </div>
    </details>
  );
}

export default function ModuleReaderPage() {
  const { courseId, moduleId } = useParams();
  const [module, setModule] = useState(null);
  const [content, setContent] = useState("");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(() => (
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  ));
  const [chatWidth, setChatWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_CHAT_WIDTH;
    const stored = Number(window.localStorage.getItem(CHAT_WIDTH_STORAGE_KEY));
    return Number.isFinite(stored) ? clamp(stored, MIN_CHAT_WIDTH, MAX_CHAT_WIDTH) : DEFAULT_CHAT_WIDTH;
  });
  const [resizing, setResizing] = useState(false);
  const [error, setError] = useState("");
  const { start, status, error: streamError } = useSSE();
  const chat = useModuleChat(courseId, moduleId);
  const layoutRef = useRef(null);
  
  const navigate = useNavigate();
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evalSession, setEvalSession] = useState(null);
  const [evalQuestion, setEvalQuestion] = useState(null);
  const [evalQuestionNumber, setEvalQuestionNumber] = useState(1);
  const [evalTotalQuestions, setEvalTotalQuestions] = useState(0);
  const [evalProbeReason, setEvalProbeReason] = useState("");
  const [evalReport, setEvalReport] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalSubmitting, setEvalSubmitting] = useState(false);
  const [evalSubmitError, setEvalSubmitError] = useState("");
  const [evalToast, setEvalToast] = useState("");
  const [latestEvaluationReport, setLatestEvaluationReport] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CHAT_WIDTH_STORAGE_KEY, String(chatWidth));
    }
  }, [chatWidth]);

  useEffect(() => {
    if (!resizing) return undefined;

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function handlePointerMove(event) {
      const rect = layoutRef.current?.getBoundingClientRect();
      if (!rect) return;
      setChatWidth(clamp(rect.right - event.clientX, MIN_CHAT_WIDTH, MAX_CHAT_WIDTH));
    }

    function stopResize() {
      setResizing(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
    };
  }, [resizing]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        setLatestEvaluationReport(null);
        const result = await getModule(courseId, moduleId);
        if (!active) return;
        setModule(result.module);
        setContent(result.module.content_markdown || "");
        setVideos(getLessonVideos(result.module));
        if (!result.module.content_markdown) {
          start(`/api/stream/courses/${courseId}/modules/${moduleId}/generate`, {
            chunk: (chunk) => setContent((prev) => prev + chunk),
            done: (updated) => {
              setModule(updated);
              setContent(updated.content_markdown || "");
              setVideos(getLessonVideos(updated));
            }
          });
        }
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
  }, [courseId, moduleId, start]);

  useEffect(() => {
    const loadedModuleId = module?.id ?? module?.module_id;
    if (
      !module ||
      String(loadedModuleId) !== String(moduleId) ||
      !content ||
      status === "connecting" ||
      status === "streaming"
    ) {
      return undefined;
    }

    let active = true;
    async function loadExistingReport() {
      try {
        const data = await getLatestEvaluationReport(courseId, moduleId);
        if (!active) return;
        if (data.has_report && data.session) {
          setLatestEvaluationReport(normalizeEvaluationReport(data.session));
        } else {
          setLatestEvaluationReport(null);
        }
      } catch (err) {
        if (active) setLatestEvaluationReport(null);
      }
    }

    loadExistingReport();
    return () => {
      active = false;
    };
  }, [content, courseId, module, moduleId, status]);

  async function markComplete() {
    const result = await completeModule(courseId, moduleId);
    setModule(result.module);
  }

  function handleNextClick() {
    setEvalSession(null);
    setEvalQuestion(null);
    setEvalQuestionNumber(1);
    setEvalTotalQuestions(0);
    setEvalProbeReason("");
    setEvalReport(null);
    setEvalSubmitError("");
    setEvalModalOpen(true);
  }

  function showEvalToast(message) {
    setEvalToast(message);
    window.setTimeout(() => setEvalToast(""), 3500);
  }

  async function handleEvalStart() {
    setEvalLoading(true);
    setEvalSubmitError("");
    try {
      const res = await startEvaluation(courseId, moduleId);
      setEvalSession(res);
      setEvalQuestion(res.questions?.[0] || res.next_question || null);
      setEvalQuestionNumber(1);
      setEvalTotalQuestions(res.total_questions || res.questions?.length || 0);
      setEvalProbeReason("");
      setEvalReport(null);
    } catch (err) {
      console.error(err);
      showEvalToast("Could not start evaluation. Try again.");
      await handleSkipOrContinue();
    } finally {
      setEvalLoading(false);
    }
  }

  async function handleEvalSubmit(answerText, confidence) {
    if (!evalSession) return;
    setEvalSubmitting(true);
    setEvalSubmitError("");
    try {
      const res = await submitEvaluationAnswer(courseId, moduleId, evalSession.session_id, {
        question_id: evalQuestion.id,
        answer_text: answerText,
        confidence
      });
      if (res.session_complete) {
        setEvalReport(res);
        setLatestEvaluationReport(normalizeEvaluationReport(res));
        setEvalQuestion(null);
        setEvalProbeReason("");
      } else {
        setEvalQuestion(res.next_question);
        setEvalQuestionNumber(Math.min(
          Number(res.questions_asked || evalQuestionNumber) + 1,
          evalTotalQuestions || Number(res.questions_asked || evalQuestionNumber) + 1
        ));
        setEvalProbeReason(res.is_probe && res.probe_reason ? res.probe_reason : "");
      }
    } catch (err) {
      console.error(err);
      setEvalSubmitError("Something went wrong submitting your answer. Try again.");
      throw err;
    } finally {
      setEvalSubmitting(false);
    }
  }

  async function handleSkipOrContinue() {
    setEvalModalOpen(false);
    try {
      const nextRes = await getNextModule(courseId, moduleId);
      if (nextRes.has_next && nextRes.module) {
        navigate(`/courses/${courseId}/modules/${nextRes.module.id}`);
      } else {
        navigate(`/courses/${courseId}`);
      }
    } catch (err) {
      console.error(err);
      navigate(`/courses/${courseId}`);
    }
  }

  if (loading) return <LoadingSpinner label="Opening module" />;
  if (error) return <p className="text-rose">{error}</p>;

  return (
    <div className="flex w-full max-w-none flex-col gap-4 lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
      {evalToast && (
        <div className="fixed right-5 top-24 z-[60] rounded-lg border border-rose/30 bg-panel px-4 py-3 text-sm font-semibold text-rose shadow-2xl">
          {evalToast}
        </div>
      )}
      <div className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={`/courses/${courseId}`}>
          <Button variant="ghost" className="px-0 text-slate-400">
            <ArrowLeft className="h-4 w-4" />
            Course
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
            Assistant
          </Button>
          <Button onClick={markComplete} disabled={module?.status === "completed"}>
            <CheckCircle2 className="h-4 w-4" />
            {module?.status === "completed" ? "Completed" : "Complete Module"}
          </Button>
        </div>
      </div>
      </div>

      <div ref={layoutRef} className="flex min-w-0 flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:items-stretch lg:gap-0 lg:overflow-hidden">
        <main className="glass-panel scrollbar-thin min-w-0 flex-1 rounded-lg p-5 lg:min-h-0 lg:overflow-y-auto lg:p-6 xl:p-7">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 border-b border-line pb-5">
              <p className="text-sm uppercase tracking-wide text-mint">Module {Number(module?.module_index || 0) + 1}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-50">{module?.title}</h1>
              <p className="mt-2 text-slate-400">{module?.concept}</p>
            </div>
            {status === "streaming" && (
              <div className="mb-5 rounded-lg border border-line bg-panel p-4">
                <LoadingSpinner label="Generating and saving lesson" />
              </div>
            )}
            {streamError && <p className="mb-4 text-sm text-rose">{streamError}</p>}
            <LessonViewer content={content || "Preparing lesson..."} />
            <VideoResources videos={videos} />
            <EvaluationReportPanel report={latestEvaluationReport} />
            <div className="mt-8 flex justify-end border-t border-line pt-4">
              <Button onClick={handleNextClick} variant="primary">Next Module</Button>
            </div>
          </div>
        </main>
        {!collapsed && (
          <button
            type="button"
            aria-label="Resize assistant panel"
            title="Resize assistant"
            onPointerDown={(event) => {
              event.preventDefault();
              setResizing(true);
            }}
            className={`hidden w-4 shrink-0 cursor-col-resize items-center justify-center self-stretch text-slate-600 transition hover:text-mint lg:flex ${resizing ? "text-mint" : ""}`}
          >
            <span className="flex h-16 w-2 items-center justify-center rounded-full border border-line bg-panel/80">
              <GripVertical className="h-4 w-4" />
            </span>
          </button>
        )}
        <ChatPanel
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
          messages={chat.messages}
          sending={chat.sending}
          error={chat.error}
          onSend={chat.send}
          width={chatWidth}
        />
      </div>
      <EvaluationModal
        isOpen={evalModalOpen}
        onClose={() => setEvalModalOpen(false)}
        onSkip={handleSkipOrContinue}
        onStart={handleEvalStart}
        onSubmitAnswer={handleEvalSubmit}
        sessionData={evalSession}
        currentQuestion={evalQuestion}
        questionNumber={evalQuestionNumber}
        totalQuestions={evalTotalQuestions}
        probeReason={evalProbeReason}
        finalReport={evalReport}
        isSubmitting={evalSubmitting}
        isLoading={evalLoading}
        submitError={evalSubmitError}
      />
    </div>
  );
}
