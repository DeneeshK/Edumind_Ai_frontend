import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { generateSchedule, getSchedule, updateModuleCompletion } from "../api/scheduleApi";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import LoadingSpinner from "../components/common/LoadingSpinner";

const durationUnits = ["days", "weeks", "months"];
const studySlotOptions = ["morning", "afternoon", "evening", "night"];

const initialForm = {
  duration_value: "3",
  duration_unit: "weeks",
  hours_per_day: "2",
  study_slots: ["morning"],
  start_date: "",
};

const fieldClass =
  "mt-2 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-mint focus:ring-2 focus:ring-mint/20";

function normalizeSchedule(payload) {
  return payload?.schedule || payload || null;
}

function values(items) {
  return Array.isArray(items) ? items.filter(Boolean) : [];
}

function isMissingScheduleError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("404") || message.includes("not found") || message.includes("no schedule");
}

function formatDate(value) {
  if (!value) return "Date pending";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatSlot(slot) {
  return slot ? slot.charAt(0).toUpperCase() + slot.slice(1) : "Study";
}

function validateForm(form) {
  const durationValue = Number.parseInt(form.duration_value, 10);
  const hoursPerDay = Number.parseFloat(form.hours_per_day);

  if (!Number.isInteger(durationValue) || durationValue < 1 || durationValue > 365) {
    return "Duration must be a whole number from 1 to 365.";
  }

  if (!Number.isFinite(hoursPerDay) || hoursPerDay < 0.5 || hoursPerDay > 16) {
    return "Hours per day must be between 0.5 and 16.";
  }

  if (!values(form.study_slots).length) {
    return "Choose at least one study slot.";
  }

  return "";
}

function buildPayload(form) {
  return {
    duration_value: Number.parseInt(form.duration_value, 10),
    duration_unit: form.duration_unit,
    hours_per_day: Number.parseFloat(form.hours_per_day),
    study_slots: values(form.study_slots),
    ...(form.start_date ? { start_date: form.start_date } : {}),
  };
}

function ScheduleSummary({ schedule }) {
  const totalMinutes = values(schedule.days).reduce(
    (total, day) => total + Number(day.total_study_minutes || 0),
    0
  );

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <div className="rounded-md border border-line bg-ink p-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Duration</p>
        <p className="mt-1 text-sm font-semibold text-slate-100">{schedule.total_days || 0} days</p>
      </div>
      <div className="rounded-md border border-line bg-ink p-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Daily Time</p>
        <p className="mt-1 text-sm font-semibold text-slate-100">{schedule.hours_per_day || 0} hrs/day</p>
      </div>
      <div className="rounded-md border border-line bg-ink p-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Study Slots</p>
        <p className="mt-1 text-sm font-semibold text-slate-100">
          {values(schedule.study_slots).map(formatSlot).join(", ") || "Flexible"}
        </p>
      </div>
      <div className="rounded-md border border-line bg-ink p-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Planned Work</p>
        <p className="mt-1 text-sm font-semibold text-slate-100">{totalMinutes} min</p>
      </div>
    </div>
  );
}

function MilestoneChips({ milestones }) {
  const items = values(milestones);
  if (!items.length) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
      {items.map((milestone, index) => (
        <span
          key={`${milestone}-${index}`}
          className="shrink-0 rounded-md border border-mint/25 bg-mint/10 px-3 py-2 text-sm font-medium text-mint"
        >
          Week {index + 1}: {milestone}
        </span>
      ))}
    </div>
  );
}

function GenerateScheduleForm({ form, formError, generating, onChange, onToggleSlot, onSubmit }) {
  return (
    <Card className="p-5 lg:p-6">
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <div className="flex items-center gap-2 text-mint">
            <Sparkles className="h-4 w-4" />
            <p className="text-sm uppercase tracking-wide">Learning Schedule</p>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-50">
            Create your timetable
          </h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-semibold text-slate-100">Duration</span>
            <input
              type="number"
              min="1"
              max="365"
              step="1"
              value={form.duration_value}
              onChange={(event) => onChange("duration_value", event.target.value)}
              className={fieldClass}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-100">Duration unit</span>
            <select
              value={form.duration_unit}
              onChange={(event) => onChange("duration_unit", event.target.value)}
              className={fieldClass}
            >
              {durationUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-100">Hours per day</span>
            <input
              type="number"
              min="0.5"
              max="16"
              step="0.5"
              value={form.hours_per_day}
              onChange={(event) => onChange("hours_per_day", event.target.value)}
              className={fieldClass}
              required
            />
          </label>
        </div>

        <div>
          <span className="text-sm font-semibold text-slate-100">Study slots</span>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {studySlotOptions.map((slot) => {
              const selected = form.study_slots.includes(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onToggleSlot(slot)}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-semibold transition ${
                    selected
                      ? "border-mint bg-mint/10 text-mint shadow-glow"
                      : "border-line bg-ink text-slate-300 hover:border-slate-400 hover:bg-panel2"
                  }`}
                >
                  <span>{formatSlot(slot)}</span>
                  {selected ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full border border-line" />}
                </button>
              );
            })}
          </div>
        </div>

        <label className="block max-w-sm">
          <span className="text-sm font-semibold text-slate-100">Start date (optional)</span>
          <input
            type="date"
            value={form.start_date}
            onChange={(event) => onChange("start_date", event.target.value)}
            className={fieldClass}
          />
        </label>

        {formError && (
          <div className="flex items-start gap-2 rounded-md border border-rose/25 bg-rose/10 p-3 text-sm text-rose">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <Button type="submit" disabled={generating}>
          {generating ? (
            <LoadingSpinner label="Generating" />
          ) : (
            <>
              <CalendarDays className="h-4 w-4" />
              Generate My Schedule
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}

function TimetableItem({ item, updating, onToggle }) {
  const completed = Boolean(item.completed);

  return (
    <div
      className={`grid gap-3 rounded-md border p-4 transition md:grid-cols-[130px_minmax(0,1fr)_auto] md:items-center ${
        completed
          ? "border-green-200 bg-green-50/90"
          : "border-line bg-ink/80 hover:border-mint/30 hover:bg-panel2"
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <Clock3 className="h-4 w-4 text-mint" />
        <span>
          {item.start_time || "--:--"} - {item.end_time || "--:--"}
        </span>
      </div>

      <div className={`min-w-0 border-l-4 pl-3 ${completed ? "border-green-500" : "border-mint/40"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`break-words text-base font-semibold ${
              completed ? "text-slate-500 line-through" : "text-slate-50"
            }`}
          >
            {item.module_title || "Untitled module"}
          </h3>
          <span className="rounded-md border border-line bg-white px-2 py-1 text-xs font-medium text-slate-500">
            {formatSlot(item.slot)}
          </span>
        </div>
        <p className={`mt-1 text-sm ${completed ? "text-slate-500" : "text-slate-400"}`}>
          {item.concept || "Concept focus pending"}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-md border border-line bg-white px-2 py-1">
            {item.estimated_minutes || 0} min
          </span>
          <span className="rounded-md border border-line bg-white px-2 py-1">
            {item.difficulty || "adaptive"}
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant={completed ? "secondary" : "ghost"}
        className={`h-10 w-10 shrink-0 px-0 ${completed ? "border-green-200 text-green-700" : ""}`}
        onClick={() => onToggle(item, !completed)}
        disabled={updating}
        aria-label={completed ? "Mark module incomplete" : "Mark module complete"}
        title={completed ? "Mark incomplete" : "Mark complete"}
      >
        {updating ? <LoadingSpinner label="" /> : completed ? <Check className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full border border-current" />}
      </Button>
    </div>
  );
}

function DayCard({ day, updatingIds, onToggleCompletion }) {
  const items = values(day.timetable_items);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-mint px-2.5 py-1 text-sm font-semibold text-white">
              Day {day.day_number}
            </span>
            <span className="text-sm text-slate-500">{formatDate(day.date)}</span>
          </div>
          <h2 className="mt-3 text-xl font-semibold text-slate-50">
            {day.day_theme || "Study Day"}
          </h2>
          {day.study_tip && (
            <p className="mt-2 text-sm italic leading-relaxed text-slate-400">{day.study_tip}</p>
          )}
        </div>
        {items.length ? (
          <span className="rounded-md border border-line bg-ink px-2 py-1 text-xs font-semibold text-slate-500">
            {day.total_study_minutes || 0} min
          </span>
        ) : (
          <span className="rounded-md border border-green-200 bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
            Rest Day 🌿
          </span>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <TimetableItem
              key={`${day.day_number}-${item.module_id || index}-${item.start_time || index}`}
              item={item}
              updating={updatingIds.has(item.module_id)}
              onToggle={onToggleCompletion}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function TimetableView({ schedule, updatingIds, onRegenerate, onToggleCompletion }) {
  const days = values(schedule.days);

  return (
    <div className="space-y-5">
      <section className="glass-panel rounded-lg p-5 lg:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-mint">
              <CalendarDays className="h-4 w-4" />
              <p className="text-sm uppercase tracking-wide">Learning Timetable</p>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-50">
              {formatDate(schedule.start_date)} to {formatDate(schedule.end_date)}
            </h1>
          </div>
          <Button type="button" variant="secondary" onClick={onRegenerate}>
            <RefreshCcw className="h-4 w-4" />
            Regenerate Schedule
          </Button>
        </div>

        <div className="mt-5">
          <ScheduleSummary schedule={schedule} />
        </div>

        {schedule.overall_advice && (
          <div className="mt-5 rounded-md border border-mint/25 bg-mint/10 p-4 text-sm leading-relaxed text-slate-300">
            {schedule.overall_advice}
          </div>
        )}

        <div className="mt-5">
          <MilestoneChips milestones={schedule.weekly_milestones} />
        </div>
      </section>

      <section className="space-y-4">
        {days.map((day) => (
          <DayCard
            key={`${day.day_number}-${day.date}`}
            day={day}
            updatingIds={updatingIds}
            onToggleCompletion={onToggleCompletion}
          />
        ))}
      </section>
    </div>
  );
}

export default function SchedulePage() {
  const { courseId } = useParams();
  const [schedule, setSchedule] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [updatingIds, setUpdatingIds] = useState(() => new Set());
  const [loadAttempt, setLoadAttempt] = useState(0);

  const hasSchedule = useMemo(() => Boolean(schedule && !showForm), [schedule, showForm]);
  const loadBlocked = Boolean(error && !schedule && !showForm);

  useEffect(() => {
    let active = true;

    async function loadSchedule() {
      setLoading(true);
      setError("");
      try {
        const result = await getSchedule(courseId);
        if (!active) return;
        const nextSchedule = normalizeSchedule(result);
        setSchedule(nextSchedule);
        setShowForm(!nextSchedule);
      } catch (err) {
        if (!active) return;
        if (isMissingScheduleError(err)) {
          setSchedule(null);
          setShowForm(true);
          setError("");
        } else {
          setSchedule(null);
          setShowForm(false);
          setError(err.message || "Unable to load schedule.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSchedule();

    return () => {
      active = false;
    };
  }, [courseId, loadAttempt]);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError("");
    setError("");
  }

  function toggleSlot(slot) {
    setForm((prev) => {
      const selected = prev.study_slots.includes(slot);
      const nextSlots = selected
        ? prev.study_slots.filter((item) => item !== slot)
        : [...prev.study_slots, slot];
      return { ...prev, study_slots: nextSlots };
    });
    setFormError("");
  }

  async function submitSchedule(event) {
    event.preventDefault();
    const validationMessage = validateForm(form);
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setGenerating(true);
    setFormError("");
    setError("");
    try {
      const result = await generateSchedule(courseId, buildPayload(form));
      setSchedule(normalizeSchedule(result));
      setShowForm(false);
    } catch (err) {
      setFormError(err.message || "Unable to generate schedule.");
    } finally {
      setGenerating(false);
    }
  }

  async function toggleModuleCompletion(item, completed) {
    if (!item.module_id) return;

    setUpdatingIds((prev) => new Set(prev).add(item.module_id));
    setError("");
    try {
      const result = await updateModuleCompletion(courseId, item.module_id, completed);
      const nextSchedule = normalizeSchedule(result);
      if (nextSchedule) setSchedule(nextSchedule);
    } catch (err) {
      setError(err.message || "Unable to update progress.");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.module_id);
        return next;
      });
    }
  }

  if (loading) return <LoadingSpinner label="Loading schedule" />;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={`/courses/${courseId}/roadmap`}>
          <Button variant="ghost" className="px-0 text-slate-400">
            <ArrowLeft className="h-4 w-4" />
            Roadmap
          </Button>
        </Link>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-rose/25 bg-rose/10 p-4">
          <div className="flex items-start gap-2 text-sm text-rose">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          {!hasSchedule && (
            <Button type="button" variant="secondary" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
              Retry
            </Button>
          )}
        </div>
      )}

      {loadBlocked ? null : hasSchedule ? (
        <TimetableView
          schedule={schedule}
          updatingIds={updatingIds}
          onRegenerate={() => {
            setShowForm(true);
            setError("");
            setFormError("");
          }}
          onToggleCompletion={toggleModuleCompletion}
        />
      ) : (
        <GenerateScheduleForm
          form={form}
          formError={formError}
          generating={generating}
          onChange={updateForm}
          onToggleSlot={toggleSlot}
          onSubmit={submitSchedule}
        />
      )}
    </div>
  );
}
