import { CalendarClock, Clock, FileCheck2, GraduationCap } from "lucide-react";

const FEATURES = [
  { icon: CalendarClock, title: "Scheduled by the tutor", text: "Set a start time and window for each exam." },
  { icon: Clock, title: "Timed with a countdown", text: "Students see the timer and remaining time while attempting." },
  { icon: FileCheck2, title: "Submit & auto-record", text: "Answers are submitted and results are stored automatically." }
];

export default function ExamsTab({ isTeacher }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-lg border border-dashed border-line bg-panel/60 p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-mint/10 text-mint">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-slate-50">Exams</h2>
        <span className="mt-2 inline-block rounded-md border border-line bg-panel2 px-2.5 py-0.5 text-xs font-medium text-slate-500">
          Coming soon
        </span>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
          {isTeacher
            ? "A dedicated exam window is on the way. You'll be able to schedule formal exams for your class here — with a start time, a countdown, and automatic submission."
            : "Your tutor will schedule exams here. When an exam is set, you'll see it with its time and a countdown, and can submit your answers before the deadline."}
        </p>

        <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-lg border border-line bg-panel p-4">
              <Icon className="h-5 w-5 text-slate-400" />
              <p className="mt-2.5 text-sm font-semibold text-slate-100">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
