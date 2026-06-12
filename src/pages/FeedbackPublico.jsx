import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { buscarFormularioFeedback, responderFormularioFeedback } from '../api/feedbackApi';
import LoadingSpinner from '../components/LoadingSpinner';

const emptyForm = {
  satisfacao: 8,
  comentarioSatisfacao: '',
  respostaMelhoria: '',
  respostaLivre: '',
};

function parseApiError(err) {
  const data = err?.response?.data;
  const details = Array.isArray(data?.details) ? data.details : [];
  return [data?.message, ...details].filter(Boolean).join(' ') || 'Não foi possível enviar sua resposta.';
}

export default function FeedbackPublico() {
  const { token } = useParams();
  const [formulario, setFormulario] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    buscarFormularioFeedback(token)
      .then((data) => {
        if (active) setFormulario(data);
      })
      .catch(() => {
        if (active) setError('Pesquisa não encontrada ou indisponível.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await responderFormularioFeedback(token, {
        ...form,
        satisfacao: Number(form.satisfacao),
      });
      setSent(true);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner label="Carregando pesquisa..." />;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <main className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <p className="text-sm text-chm-muted">{formulario?.academia || 'Academia'}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{formulario?.campanha || 'Pesquisa de feedback'}</h1>
        </div>

        <section className="rounded-md border border-slate-800 bg-chm-card p-5 shadow-xl shadow-black/20">
          {sent ? (
            <div className="py-10 text-center">
              <p className="text-xl font-bold text-white">Resposta enviada.</p>
              <p className="mt-2 text-sm text-chm-muted">Obrigado por ajudar a melhorar sua experiência.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="satisfacao">
                  {formulario?.perguntaSatisfacao || 'Qual sua satisfação?'}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    id="satisfacao"
                    type="range"
                    min="1"
                    max="10"
                    value={form.satisfacao}
                    onChange={(event) => updateForm('satisfacao', event.target.value)}
                    className="w-full"
                  />
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-chm-accent text-lg font-bold text-white">
                    {form.satisfacao}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="comentarioSatisfacao">
                  Comentário sobre sua nota
                </label>
                <textarea
                  id="comentarioSatisfacao"
                  rows="3"
                  value={form.comentarioSatisfacao}
                  onChange={(event) => updateForm('comentarioSatisfacao', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="respostaMelhoria">
                  {formulario?.perguntaMelhoria || 'O que poderia melhorar?'}
                </label>
                <textarea
                  id="respostaMelhoria"
                  rows="4"
                  value={form.respostaMelhoria}
                  onChange={(event) => updateForm('respostaMelhoria', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
                <p className="mt-1 text-xs text-chm-muted">Esta resposta aparece anônima para o gestor.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="respostaLivre">
                  {formulario?.perguntaLivre || 'Quer comentar algo mais?'}
                </label>
                <textarea
                  id="respostaLivre"
                  rows="4"
                  value={form.respostaLivre}
                  onChange={(event) => updateForm('respostaLivre', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
                <p className="mt-1 text-xs text-chm-muted">Esta resposta também aparece anônima para o gestor.</p>
              </div>

              <button
                type="submit"
                disabled={saving || !formulario}
                className="w-full rounded-md bg-chm-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Enviando...' : 'Enviar resposta'}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
