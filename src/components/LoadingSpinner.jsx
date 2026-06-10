// Arquivo: frontend/src/components/LoadingSpinner.jsx
export default function LoadingSpinner({ label = 'Carregando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-chm-muted">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-chm-accent border-t-transparent" />
      <p className="mt-4 text-sm">{label}</p>
    </div>
  );
}
