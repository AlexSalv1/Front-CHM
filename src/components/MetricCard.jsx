// Arquivo: frontend/src/components/MetricCard.jsx
export default function MetricCard({ title, value, subtitle, accent = 'text-white' }) {
  return (
    <div className="rounded-md border border-slate-800/80 bg-chm-card/95 p-5 shadow-lg shadow-black/10">
      <p className="text-xs font-semibold uppercase tracking-wide text-chm-muted">{title}</p>
      <p className={`mt-3 text-3xl font-bold tracking-tight ${accent}`}>{value}</p>
      {subtitle && <p className="mt-2 text-xs text-chm-muted">{subtitle}</p>}
    </div>
  );
}
