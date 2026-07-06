import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Gauge,
  GraduationCap,
  Loader2,
  Pencil,
  Sparkles,
  Target
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createCourseIntent } from "../api/coursesApi";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { useSSE } from "../hooks/useSSE";

const progressSteps = [
  ["understanding_started", "Understanding your goal"],
  ["history_checked", "Checking your learning history"],
  ["research_started", "Finding relevant sources"],
  ["curriculum_started", "Designing your module path"],
  ["roadmap_started", "Creating your roadmap"],
  ["first_module_prepared", "Preparing first module outline"],
  ["saved", "Saving course"],
  ["course_ready", "Course ready"]
];

const setupSteps = [
  { key: "topic", label: "Topic", title: "What do you want to learn?", required: true },
  { key: "goal", label: "Goal", title: "Why do you want to learn this?" },
  { key: "level", label: "Level", title: "What is your current level?", required: true },
  { key: "time", label: "Time", title: "How much time can you spend?" },
  { key: "pace", label: "Pace", title: "What learning pace do you want?", required: true },
  { key: "review", label: "Review", title: "Review and create your course" }
];

const levelOptions = [
  { value: "complete_beginner", label: "Complete beginner", detail: "Start from zero and explain first principles." },
  { value: "basic", label: "Some basic knowledge", detail: "Review foundations, then move into structured practice." },
  { value: "intermediate", label: "Intermediate", detail: "Focus on gaps, application, and harder examples." },
  { value: "advanced", label: "Advanced", detail: "Go rigorous, compact basics, and emphasize mastery." },
  { value: "not_sure", label: "Not sure", detail: "Begin with a gentle baseline and adapt as you go." }
];

const paceOptions = [
  { value: "fast", label: "Fast", detail: "Quick overview and practical path.", icon: Gauge },
  { value: "medium", label: "Medium", detail: "Balanced learning with practice.", icon: Clock3 },
  { value: "deep", label: "Deep", detail: "Detailed, rigorous, concept-heavy learning.", icon: BookOpen }
];

const durationUnits = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" }
];

const initialSetup = {
  topic: "",
  goal_description: "",
  current_level: "",
  prior_experience: "",
  duration_value: "",
  duration_unit: "weeks",
  hours_per_day: "",
  known_concepts: "",
  weak_concepts: "",
  must_include: "",
  do_not_include: "",
  deadline: "",
  pace: "",
  web_search_enabled: false
};

function optionClasses(selected) {
  return `group flex h-full w-full items-start gap-3 rounded-md border p-4 text-left transition ${
    selected
      ? "border-mint bg-mint/10 text-slate-50 shadow-glow"
      : "border-line bg-ink/70 text-slate-200 hover:border-slate-500 hover:bg-panel2"
  }`;
}

function fieldValue(value, fallback = "Not set") {
  return value?.trim() || fallback;
}

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOptionalInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseOptionalFloat(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function durationUnitLabel(unit, value) {
  const base = {
    days: "day",
    weeks: "week",
    months: "month"
  }[unit] || unit;
  return Number(value) === 1 ? base : `${base}s`;
}

function timeCommitmentText(setup) {
  const durationValue = setup.duration_value.trim();
  const hoursPerDay = setup.hours_per_day.trim();
  const deadline = setup.deadline.trim();
  const parts = [];

  if (durationValue) {
    parts.push(`${durationValue} ${durationUnitLabel(setup.duration_unit, durationValue)}`);
  }
  if (hoursPerDay) {
    parts.push(`${hoursPerDay} ${Number(hoursPerDay) === 1 ? "hour" : "hours"} per day`);
  }

  const commitment = parts.join(", ");
  if (deadline) {
    return commitment ? `${commitment}, target by ${deadline}` : `Target by ${deadline}`;
  }
  return commitment;
}

function ReviewRow({ icon: Icon, label, value, onEdit }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-line bg-ink/70 p-4">
      <div className="flex min-w-0 gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-panel2 text-mint">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
          <div className="mt-1 break-words text-sm text-slate-100">{value}</div>
        </div>
      </div>
      <Button type="button" variant="ghost" className="shrink-0 px-2" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
    </div>
  );
}

export default function NewCoursePage() {
  const navigate = useNavigate();
  const { events, status, error, start } = useSSE();
  const [stepIndex, setStepIndex] = useState(0);
  const [setup, setSetup] = useState(initialSetup);
  const [formError, setFormError] = useState("");
  const [creationError, setCreationError] = useState("");
  const [streamingCourse, setStreamingCourse] = useState(null);
  const [creationStarted, setCreationStarted] = useState(false);
  const creationStartedRef = useRef(false);

  const activeStep = setupSteps[stepIndex];
  const completedEvents = new Set(events.map((item) => item.event));
  const isCreating = creationStarted || status === "streaming" || status === "connecting";
  const selectedLevel = levelOptions.find((item) => item.value === setup.current_level);
  const selectedPace = paceOptions.find((item) => item.value === setup.pace);

  const reviewItems = useMemo(() => ([
    {
      icon: Target,
      label: "Course focus",
      value: fieldValue(setup.topic),
      step: 0
    },
    {
      icon: Sparkles,
      label: "Goal or motive",
      value: fieldValue(setup.goal_description, "Use the topic as the main goal"),
      step: 1
    },
    {
      icon: GraduationCap,
      label: "Current level",
      value: selectedLevel?.label || "Not set",
      step: 2
    },
    {
      icon: BookOpen,
      label: "Prior experience",
      value: fieldValue(setup.prior_experience, "No extra prior experience added"),
      step: 2
    },
    {
      icon: BookOpen,
      label: "Known concepts",
      value: fieldValue(parseList(setup.known_concepts).join(", "), "No known concepts added"),
      step: 2
    },
    {
      icon: Target,
      label: "Needs reinforcement",
      value: fieldValue(parseList(setup.weak_concepts).join(", "), "No difficult concepts added"),
      step: 2
    },
    {
      icon: CalendarDays,
      label: "Available time",
      value: timeCommitmentText(setup) || "Use general scheduling assumptions",
      step: 3
    },
    {
      icon: Gauge,
      label: "Learning pace",
      value: selectedPace ? `${selectedPace.label}: ${selectedPace.detail}` : "Not set",
      step: 4
    }
  ]), [selectedLevel, selectedPace, setup]);

  const canContinue = useMemo(() => {
    if (stepIndex === 0) return Boolean(setup.topic.trim());
    if (stepIndex === 2) return Boolean(setup.current_level);
    if (stepIndex === 4) return Boolean(setup.pace);
    return true;
  }, [setup, stepIndex]);

  function updateSetup(field, value) {
    setSetup((prev) => ({ ...prev, [field]: value }));
    setFormError("");
    setCreationError("");
  }

  function goNext() {
    if (!canContinue) {
      const message = stepIndex === 0
        ? "Add a topic before continuing."
        : stepIndex === 2
          ? "Choose your current level before continuing."
          : "Choose a learning pace before continuing.";
      setFormError(message);
      return;
    }
    setStepIndex((index) => Math.min(index + 1, setupSteps.length - 1));
  }

  function goBack() {
    setFormError("");
    setStepIndex((index) => Math.max(index - 1, 0));
  }

  const buildPayload = useCallback(() => {
    const topic = setup.topic.trim();
    const goalDescription = setup.goal_description.trim();
    const priorExperience = setup.prior_experience.trim();
    const durationValue = parseOptionalInteger(setup.duration_value);
    const hoursPerDay = parseOptionalFloat(setup.hours_per_day);
    const knownConcepts = parseList(setup.known_concepts);
    const weakConcepts = parseList(setup.weak_concepts);
    const mustInclude = parseList(setup.must_include);
    const doNotInclude = parseList(setup.do_not_include);
    const timeCommitment = {
      value: durationValue,
      unit: setup.duration_unit,
      hours_per_day: hoursPerDay
    };
    const timeConstraint = timeCommitmentText(setup);
    const levelLabel = selectedLevel?.label || "Not sure";
    const paceDetail = selectedPace?.detail || "Balanced learning with practice.";
    const goal = goalDescription || `Learn ${topic}`;
    const priorKnowledge = [
      `Current level: ${levelLabel}.`,
      priorExperience ? `Prior experience: ${priorExperience}.` : "",
      knownConcepts.length ? `Already knows: ${knownConcepts.join(", ")}.` : "",
      weakConcepts.length ? `Finds difficult: ${weakConcepts.join(", ")}.` : ""
    ].filter(Boolean).join(" ");

    return {
      topic,
      goal,
      goal_description: goalDescription,
      current_level: setup.current_level,
      prior_experience: priorExperience,
      time_commitment: timeCommitment,
      duration_value: durationValue,
      duration_unit: setup.duration_unit,
      hours_per_day: hoursPerDay,
      known_concepts: knownConcepts,
      weak_concepts: weakConcepts,
      must_include: mustInclude,
      do_not_include: doNotInclude,
      deadline: setup.deadline,
      pace: setup.pace || "medium",
      web_search_enabled: !!setup.web_search_enabled,
      prior_knowledge: priorKnowledge,
      profile: {
        topic,
        exact_subject: topic,
        learning_goal: goal,
        goal_description: goalDescription,
        target_context: goalDescription || "general learning",
        current_level: setup.current_level,
        learner_level: levelLabel.toLowerCase(),
        pace: setup.pace || "medium",
        depth_preference: paceDetail,
        time_commitment: timeCommitment,
        time_constraint: timeConstraint,
        duration_value: durationValue,
        duration_unit: setup.duration_unit,
        hours_per_day: hoursPerDay,
        deadline: setup.deadline,
        prior_experience: priorExperience,
        known_concepts: knownConcepts,
        weak_concepts: weakConcepts,
        must_include: mustInclude,
        do_not_include: doNotInclude,
        prior_knowledge_summary: priorKnowledge,
        expected_outcome: goal,
        setup_source: "guided_course_setup"
      }
    };
  }, [selectedLevel, selectedPace, setup]);

  const startCreation = useCallback(async () => {
    if (creationStartedRef.current || isCreating) return;
    if (!setup.topic.trim()) {
      setStepIndex(0);
      setFormError("Add a topic before creating the course.");
      return;
    }
    if (!setup.current_level) {
      setStepIndex(2);
      setFormError("Choose your current level before creating the course.");
      return;
    }
    if (!setup.pace) {
      setStepIndex(4);
      setFormError("Choose a learning pace before creating the course.");
      return;
    }

    creationStartedRef.current = true;
    setCreationStarted(true);
    setCreationError("");

    try {
      const intent = await createCourseIntent(buildPayload());
      start(intent.stream_url, {
        done: (course) => {
          setStreamingCourse(course);
          navigate(course.redirect_url || `/courses/${course.id}/roadmap`);
        },
        onError: () => {
          creationStartedRef.current = false;
          setCreationStarted(false);
        }
      });
    } catch (err) {
      creationStartedRef.current = false;
      setCreationStarted(false);
      setCreationError(err.message || "Course creation could not start.");
    }
  }, [buildPayload, isCreating, navigate, setup.current_level, setup.pace, setup.topic, start]);

  function renderStep() {
    if (stepIndex === 0) {
      return (
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Course topic</span>
            <input
              value={setup.topic}
              onChange={(event) => updateSetup("topic", event.target.value)}
              placeholder="Python, Thermodynamics, World History, Linear Algebra"
              className="mt-3 w-full rounded-md border border-line bg-ink px-4 py-4 text-lg text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-mint"
              autoFocus
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Biology", "Public Speaking", "Machine Learning", "World History"].map((topic) => (
              <button
                key={topic}
                type="button"
                className="rounded-md border border-line bg-ink/70 px-3 py-2 text-left text-sm text-slate-300 transition hover:border-mint hover:text-slate-50"
                onClick={() => updateSetup("topic", topic)}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (stepIndex === 1) {
      return (
        <label className="block">
          <span className="text-sm font-medium text-slate-200">Goal or motive</span>
          <textarea
            value={setup.goal_description}
            onChange={(event) => updateSetup("goal_description", event.target.value)}
            placeholder="I want to understand thermodynamics for my exam, learn history for general knowledge, or prepare for an interview."
            rows={7}
            className="mt-3 w-full resize-none rounded-md border border-line bg-ink px-4 py-4 text-base leading-relaxed text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-mint"
          />
        </label>
      );
    }

    if (stepIndex === 2) {
      return (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            {levelOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={optionClasses(setup.current_level === option.value)}
                onClick={() => updateSetup("current_level", option.value)}
              >
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  setup.current_level === option.value ? "border-mint bg-mint text-white" : "border-line"
                }`}>
                  {setup.current_level === option.value && <Check className="h-3.5 w-3.5" />}
                </span>
                <span>
                  <span className="block font-semibold">{option.label}</span>
                  <span className="mt-1 block text-sm text-slate-400">{option.detail}</span>
                </span>
              </button>
            ))}
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Prior experience</span>
            <textarea
              value={setup.prior_experience}
              onChange={(event) => updateSetup("prior_experience", event.target.value)}
              placeholder="I studied this before but forgot most of it, or I know basic Python syntax."
              rows={4}
              className="mt-3 w-full resize-none rounded-md border border-line bg-ink px-4 py-3 text-sm leading-relaxed text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-mint"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-200">What do you already know? (optional)</span>
              <input
                type="text"
                value={setup.known_concepts}
                onChange={(event) => updateSetup("known_concepts", event.target.value)}
                placeholder="Basic algebra, Variables in Python, HTML"
                className="mt-3 w-full rounded-md border border-line bg-ink px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-mint"
              />
              <p className="mt-2 text-xs text-slate-500">
                Separate topics with commas. These can be skipped or treated as background.
              </p>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-200">What do you find difficult? (optional)</span>
              <input
                type="text"
                value={setup.weak_concepts}
                onChange={(event) => updateSetup("weak_concepts", event.target.value)}
                placeholder="Recursion, Pointers, Calculus derivatives"
                className="mt-3 w-full rounded-md border border-line bg-ink px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-mint"
              />
              <p className="mt-2 text-xs text-slate-500">
                Separate topics with commas. These will get extra reinforcement.
              </p>
            </label>
          </div>
        </div>
      );
    }

    if (stepIndex === 3) {
      return (
        <div className="space-y-5">
          <div>
            <span className="text-sm font-medium text-slate-200">How much time do you have?</span>
            <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)]">
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-slate-500">Total time</span>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={setup.duration_value}
                  onChange={(event) => updateSetup("duration_value", event.target.value)}
                  placeholder="e.g. 3"
                  className="mt-2 w-full rounded-md border border-line bg-ink px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-mint"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-slate-500">Unit</span>
                <select
                  value={setup.duration_unit}
                  onChange={(event) => updateSetup("duration_unit", event.target.value)}
                  className="mt-2 w-full rounded-md border border-line bg-ink px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-mint"
                >
                  {durationUnits.map((unit) => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-slate-500">Hours per day</span>
                <input
                  type="number"
                  min={0.5}
                  max={12}
                  step={0.5}
                  value={setup.hours_per_day}
                  onChange={(event) => updateSetup("hours_per_day", event.target.value)}
                  placeholder="e.g. 2"
                  className="mt-2 w-full rounded-md border border-line bg-ink px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-mint"
                />
              </label>
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Target deadline</span>
            <input
              type="date"
              value={setup.deadline}
              onChange={(event) => updateSetup("deadline", event.target.value)}
              className="mt-3 w-full rounded-md border border-line bg-ink px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-mint"
            />
          </label>
        </div>
      );
    }

    if (stepIndex === 4) {
      return (
        <div className="grid gap-4 md:grid-cols-3">
          {paceOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                className={optionClasses(setup.pace === option.value)}
                onClick={() => updateSetup("pace", option.value)}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                  setup.pace === option.value ? "border-mint bg-mint text-white" : "border-line bg-panel2 text-mint"
                }`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold">{option.label}</span>
                  <span className="mt-2 block text-sm text-slate-400">{option.detail}</span>
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="grid gap-3">
        {reviewItems.map((item) => (
          <ReviewRow
            key={item.label}
            icon={item.icon}
            label={item.label}
            value={item.value}
            onEdit={() => setStepIndex(item.step)}
          />
        ))}

        <div className="mt-2 flex items-start justify-between gap-4 rounded-md border border-line bg-ink/70 p-4">
          <div>
            <p className="font-semibold text-slate-100">Web search</p>
            <p className="mt-1 text-sm text-slate-400">
              Let the AI search the web for up-to-date sources when it meets a concept it
              doesn&apos;t know — while building this course and answering your doubts.
              Off by default.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={setup.web_search_enabled}
            aria-label="Toggle web search for this course"
            onClick={() => updateSetup("web_search_enabled", !setup.web_search_enabled)}
            className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition ${
              setup.web_search_enabled ? "bg-mint" : "bg-slate-600"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                setup.web_search_enabled ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1.35fr)_400px]">
      <Card className="overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-wide text-mint">New Course</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-50">
                Course setup
              </h1>
            </div>
            <div className="rounded-md border border-line bg-ink px-3 py-2 text-sm text-slate-300">
              Step {stepIndex + 1} of {setupSteps.length}
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-6">
            {setupSteps.map((step, index) => {
              const active = index === stepIndex;
              const complete = index < stepIndex;
              return (
                <button
                  key={step.key}
                  type="button"
                  className={`rounded-md border px-3 py-2 text-left text-xs font-semibold transition ${
                    active
                      ? "border-mint bg-mint/10 text-mint"
                      : complete
                        ? "border-line bg-panel2 text-slate-200"
                        : "border-line bg-ink/60 text-slate-500"
                  }`}
                  onClick={() => {
                    if (index <= stepIndex || (index === stepIndex + 1 && canContinue)) {
                      setStepIndex(index);
                      setFormError("");
                    }
                  }}
                >
                  <span className="block text-[11px] uppercase tracking-wide text-slate-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-1 block">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-[460px] p-5 sm:p-7">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-mint">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-semibold">
                {activeStep.required ? "Required" : "Optional"}
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-50">
              {activeStep.title}
            </h2>
            <div className="mt-7">{renderStep()}</div>
            {formError && <p className="mt-4 text-sm text-rose">{formError}</p>}
            {creationError && <p className="mt-4 text-sm text-rose">{creationError}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="secondary" disabled={stepIndex === 0 || isCreating} onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            {stepIndex < setupSteps.length - 1 ? (
              <Button type="button" disabled={isCreating} onClick={goNext}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" disabled={isCreating} onClick={startCreation}>
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Create Course
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-mint">
            <Target className="h-4 w-4" />
            <span className="text-sm font-semibold">Setup Summary</span>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Topic</dt>
              <dd className="mt-1 text-slate-100">{fieldValue(setup.topic)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Goal</dt>
              <dd className="mt-1 text-slate-100">{fieldValue(setup.goal_description, "Topic-led course")}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Level</dt>
              <dd className="mt-1 text-slate-100">{selectedLevel?.label || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Time</dt>
              <dd className="mt-1 text-slate-100">{timeCommitmentText(setup) || "Flexible"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Pace</dt>
              <dd className="mt-1 text-slate-100">{selectedPace?.label || "Not set"}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-slate-100">Creation progress</h2>
          <div className="mt-4 space-y-2 text-sm">
            {progressSteps.map(([eventName, label]) => {
              const done = completedEvents.has(eventName) || (eventName === "course_ready" && status === "done");
              const active = isCreating && !done;
              return (
                <div key={eventName} className="flex items-center gap-3 rounded-md border border-line bg-ink px-3 py-2 text-slate-300">
                  <span className={`h-2.5 w-2.5 rounded-full ${done ? "bg-mint" : active ? "bg-amber" : "bg-slate-200"}`} />
                  <span>{label}</span>
                </div>
              );
            })}
            {events.length === 0 && !isCreating && <p className="text-slate-500">Waiting for course creation</p>}
            {error && <p className="text-rose">{error}</p>}
            {streamingCourse && (
              <div className="rounded-md border border-mint/30 bg-mint/10 p-3 text-sm text-mint">
                Course ready. Opening roadmap.
                <Link className="ml-2 font-semibold underline" to={streamingCourse.redirect_url || `/courses/${streamingCourse.id}/roadmap`}>
                  Open Course
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
