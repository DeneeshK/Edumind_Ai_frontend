import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

// Validated palette (light surface): CVD-safe ordering, worst adjacent ΔE 37.7.
// Aqua/yellow sit under 3:1 on white, so charts using them always carry direct
// value labels (the relief rule).
export const SERIES = {
  blue: "#2a78d6",
  aqua: "#1baf7a",
  yellow: "#eda100",
  red: "#e34948"
};

// Sequential blue ramp (100→700) for magnitude encoding (heatmap).
const SEQ_BLUE = [
  "#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"
];

const AXIS_TICK = { fill: "#52514e", fontSize: 12 };
const GRID_STROKE = "rgba(17,17,17,0.08)";

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-md">
      <div className="font-semibold text-slate-100">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="mt-1 flex items-center gap-2 text-slate-400">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: entry.color || entry.fill }}
          />
          <span>{formatter ? formatter(entry.value) : entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function pct(value) {
  if (value === null || value === undefined) return "—";
  return `${Math.round(Number(value) * 100)}%`;
}

// ── KPI stat tile ─────────────────────────────────────────────────────────────

export function KpiTile({ label, value, hint, icon: Icon }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-50">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

// ── Weekly score trend (single series → no legend; title names it) ───────────

export function ScoreTrendChart({ data }) {
  if (!data?.length) {
    return <p className="py-8 text-center text-sm text-slate-400">No graded tests yet.</p>;
  }
  const rows = data.map((d) => ({ ...d, score_pct: Math.round(d.avg_score * 100) }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={rows} margin={{ top: 12, right: 16, bottom: 0, left: -18 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="week" tick={AXIS_TICK} tickLine={false} axisLine={false} />
        <YAxis
          domain={[0, 100]}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<ChartTooltip formatter={(v) => `${v}% avg score`} />} />
        <Line
          type="monotone"
          dataKey="score_pct"
          stroke={SERIES.blue}
          strokeWidth={2}
          dot={{ r: 4, fill: SERIES.blue, strokeWidth: 2, stroke: "#ffffff" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Doubt hotspots (single-hue horizontal bars with direct labels) ────────────

export function DoubtBarChart({ data }) {
  if (!data?.length) {
    return <p className="py-8 text-center text-sm text-slate-400">No doubts recorded yet.</p>;
  }
  const rows = data.slice(0, 8);
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 34)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 34, bottom: 0, left: 8 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="concept"
          width={150}
          tick={{ ...AXIS_TICK, width: 145 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(17,17,17,0.04)" }}
          content={<ChartTooltip formatter={(v) => `${v} doubts`} />}
        />
        <Bar dataKey="count" fill={SERIES.blue} radius={[0, 4, 4, 0]} barSize={14}>
          <LabelList dataKey="count" position="right" style={{ fill: "#52514e", fontSize: 12 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Progress distribution (single hue, direct labels) ─────────────────────────

export function ProgressBarChart({ students }) {
  if (!students?.length) {
    return <p className="py-8 text-center text-sm text-slate-400">No students yet.</p>;
  }
  const rows = students.slice(0, 12).map((s) => ({
    name: s.name.length > 14 ? `${s.name.slice(0, 13)}…` : s.name,
    progress: Math.round((s.avg_progress || 0) * 100)
  }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 30)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 8 }}>
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(17,17,17,0.04)" }}
          content={<ChartTooltip formatter={(v) => `${v}% course progress`} />}
        />
        <Bar dataKey="progress" fill={SERIES.aqua} radius={[0, 4, 4, 0]} barSize={12}>
          <LabelList
            dataKey="progress"
            position="right"
            formatter={(v) => `${v}%`}
            style={{ fill: "#52514e", fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Concept mastery heatmap (sequential blue, hover titles, legend ramp) ──────

function heatColor(value) {
  if (value === null || value === undefined) return null;
  const idx = Math.min(SEQ_BLUE.length - 1, Math.floor(Number(value) * SEQ_BLUE.length));
  return SEQ_BLUE[idx];
}

export function ConceptHeatmap({ heatmap }) {
  const concepts = heatmap?.concepts || [];
  const students = heatmap?.students || [];
  if (!concepts.length || !students.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        Mastery data appears once students complete evaluations or tests.
      </p>
    );
  }
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th className="sticky left-0 bg-white pr-2 text-left text-xs font-semibold text-slate-500">
                Student
              </th>
              {concepts.map((concept) => (
                <th key={concept} className="px-1 pb-1 align-bottom">
                  <div
                    className="mx-auto max-h-24 overflow-hidden text-xs font-medium text-slate-500"
                    style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                    title={concept}
                  >
                    {concept.length > 22 ? `${concept.slice(0, 21)}…` : concept}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.student_id}>
                <td className="sticky left-0 max-w-[140px] truncate bg-white pr-2 text-xs font-medium text-slate-100">
                  {student.name}
                </td>
                {student.scores.map((score, i) => (
                  <td key={concepts[i]}>
                    <div
                      className="h-7 w-9 rounded"
                      style={{
                        background: heatColor(score) || "transparent",
                        border: score === null || score === undefined
                          ? "1px dashed rgba(17,17,17,0.15)"
                          : "none"
                      }}
                      title={`${student.name} — ${concepts[i]}: ${score === null || score === undefined ? "no data" : pct(score)}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
            {heatmap.class_avg && (
              <tr>
                <td className="sticky left-0 bg-white pr-2 pt-1 text-xs font-bold text-slate-100">
                  Class avg
                </td>
                {heatmap.class_avg.map((score, i) => (
                  <td key={concepts[i]} className="pt-1 text-center">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {score === null ? "—" : pct(score)}
                    </span>
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <span>Low mastery</span>
        {SEQ_BLUE.map((color) => (
          <span key={color} className="h-3 w-5 rounded-sm" style={{ background: color }} />
        ))}
        <span>High mastery</span>
      </div>
    </div>
  );
}

// ── Score distribution for one test ───────────────────────────────────────────

export function ScoreDistributionChart({ attempts }) {
  const graded = (attempts || []).filter((a) => a.status === "graded" && a.max_score);
  if (!graded.length) {
    return <p className="py-8 text-center text-sm text-slate-400">No graded attempts yet.</p>;
  }
  const buckets = [
    { range: "0–40%", min: 0, max: 0.4, count: 0 },
    { range: "40–60%", min: 0.4, max: 0.6, count: 0 },
    { range: "60–80%", min: 0.6, max: 0.8, count: 0 },
    { range: "80–100%", min: 0.8, max: 1.01, count: 0 }
  ];
  graded.forEach((a) => {
    const ratio = a.score / a.max_score;
    const bucket = buckets.find((b) => ratio >= b.min && ratio < b.max);
    if (bucket) bucket.count += 1;
  });
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={buckets} margin={{ top: 16, right: 8, bottom: 0, left: -28 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="range" tick={AXIS_TICK} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: "rgba(17,17,17,0.04)" }}
          content={<ChartTooltip formatter={(v) => `${v} students`} />}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36}>
          <LabelList dataKey="count" position="top" style={{ fill: "#52514e", fontSize: 12 }} />
          {buckets.map((b) => (
            <Cell key={b.range} fill={SERIES.blue} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
