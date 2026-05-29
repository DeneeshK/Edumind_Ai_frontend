const options = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "deep", label: "Deep" }
];

export default function DepthToggle({ value, onChange, disabled = false }) {
  return (
    <div className="inline-flex rounded-full border border-line bg-panel2 p-1" aria-label="Note depth">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            value === option.value
              ? "bg-mint text-white shadow-sm"
              : "text-slate-500 hover:bg-panel hover:text-slate-100"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
