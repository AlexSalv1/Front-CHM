// Arquivo: frontend/src/components/LoadingSpinner.jsx
export default function LoadingSpinner({ label = 'Carregando...' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 py-16">
      <div className="chm-surface-soft flex flex-col items-center gap-4 px-6 py-5 text-chm-muted">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-chm-accent border-t-transparent" />
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}
