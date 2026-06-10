// Arquivo: frontend/src/components/MetricCard.jsx
export default function MetricCard({ title, value, subtitle, accent = 'text-white' }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-chm-card p-5 shadow-lg">
      <p className="text-sm text-chm-muted">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
      {subtitle && <p className="mt-1 text-xs text-chm-muted">{subtitle}</p>}
    </div>
  );
}
