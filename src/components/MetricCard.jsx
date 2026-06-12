// Arquivo: frontend/src/components/MetricCard.jsx
export default function MetricCard({ title, value, subtitle, accent = 'text-white' }) {
  return (
    <div className="chm-surface-soft p-4 sm:p-5">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-chm-muted">{title}</p>
      <p className={`mt-3 break-words text-2xl font-semibold tracking-tight sm:text-3xl ${accent}`}>{value}</p>
      {subtitle && <p className="mt-2 text-xs leading-relaxed text-chm-muted">{subtitle}</p>}
    </div>
  );
}
