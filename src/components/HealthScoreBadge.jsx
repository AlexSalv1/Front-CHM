// Arquivo: frontend/src/components/HealthScoreBadge.jsx
export function getHealthScoreStyle(score) {
  if (score > 60) {
    return {
      badge: 'border-emerald-500/25 bg-emerald-500/12 text-emerald-300',
      row: 'border-emerald-500/25 bg-emerald-500/5',
      label: 'Saudável',
    };
  }
  if (score >= 40) {
    return {
      badge: 'border-amber-500/25 bg-amber-500/12 text-amber-300',
      row: 'border-amber-500/25 bg-amber-500/5',
      label: 'Atenção',
    };
  }
  return {
    badge: 'border-red-500/25 bg-red-500/12 text-red-300',
    row: 'border-red-500/25 bg-red-500/5',
    label: 'Risco',
  };
}

export default function HealthScoreBadge({ score }) {
  const style = getHealthScoreStyle(score);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.badge}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {style.label} · {score}
    </span>
  );
}
