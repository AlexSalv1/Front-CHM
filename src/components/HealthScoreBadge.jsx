// Arquivo: frontend/src/components/HealthScoreBadge.jsx
export function getHealthScoreStyle(score) {
  if (score > 60) {
    return {
      badge: 'bg-emerald-500/20 text-emerald-300',
      row: 'border-emerald-500/30 bg-emerald-500/5',
      label: 'Saudável',
    };
  }
  if (score >= 40) {
    return {
      badge: 'bg-amber-500/20 text-amber-300',
      row: 'border-amber-500/30 bg-amber-500/5',
      label: 'Atenção',
    };
  }
  return {
    badge: 'bg-red-500/20 text-red-300',
    row: 'border-red-500/30 bg-red-500/5',
    label: 'Risco',
  };
}

export default function HealthScoreBadge({ score }) {
  const style = getHealthScoreStyle(score);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${style.badge}`}>
      {style.label} · {score}
    </span>
  );
}
