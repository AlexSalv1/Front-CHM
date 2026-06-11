// Arquivo: frontend/src/components/MetricCard.jsx
export default function MetricCard({ title, value, subtitle, accent = 'text-white' }) {
  return (
    <div className="rounded-md border border-slate-800/80 bg-chm-card/95 p-4 shadow-lg shadow-black/10 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-chm-muted">{title}</p>
      <p className={`mt-3 break-words text-2xl font-bold tracking-tight sm:text-3xl ${accent}`}>{value}</p>
      {subtitle && <p className="mt-2 text-xs text-chm-muted">{subtitle}</p>}
    </div>
  );
}
