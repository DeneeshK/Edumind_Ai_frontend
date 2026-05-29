export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white p-8 text-center shadow-sm">
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      {description && <p className="mt-2 text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
