import { useEffect, useMemo, useState } from 'react';
import {
  atualizarCampanhaFeedback,
  criarCampanhaFeedback,
  dispararCampanhaFeedback,
  exportarFeedbackCsv,
  listarCampanhasFeedback,
  listarRespostasFeedback,
} from '../api/feedbackApi';
import LoadingSpinner from '../components/LoadingSpinner';
import useAppContext from '../hooks/useAppContext';

const emptyForm = {
  nome: 'Pesquisa de satisfação',
  intervaloDias: 30,
  ativa: true,
  assunto: 'Queremos ouvir sua opinião',
  perguntaSatisfacao: 'De 1 a 10, qual sua satisfação com a academia?',
  perguntaMelhoria: 'O que poderia melhorar na sua experiência?',
  perguntaLivre: 'Quer deixar mais algum comentário?',
  proximoEnvioEm: '',
};

function toInputDateTime(value) {
  if (!value) return '';
  return value.slice(0, 16);
}

function toPayloadDateTime(value) {
  return value ? `${value}:00` : null;
}

function formatDateTime(value) {
  if (!value) return 'Não programado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function parseApiError(err) {
  const data = err?.response?.data;
  const details = Array.isArray(data?.details) ? data.details : [];
  return [data?.message, ...details].filter(Boolean).join(' ') || 'Não foi possível concluir a ação.';
}

export default function Feedback() {
  const { session, canManageTeam } = useAppContext();
  const [campanhas, setCampanhas] = useState([]);
  const [respostas, setRespostas] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [campanhasData, respostasData] = await Promise.all([
        listarCampanhasFeedback(),
        listarRespostasFeedback(),
      ]);
      setCampanhas(campanhasData);
      setRespostas(respostasData);
    } catch (err) {
      setError('Não foi possível carregar Feedback.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const resumo = useMemo(() => {
    if (respostas.length === 0) return { media: 0, total: 0, criticas: 0 };
    const total = respostas.length;
    const media = respostas.reduce((sum, item) => sum + Number(item.satisfacao || 0), 0) / total;
    const criticas = respostas.filter((item) => Number(item.satisfacao) <= 6).length;
    return { media: media.toFixed(1), total, criticas };
  }, [respostas]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  function startEdit(campanha) {
    setEditingId(campanha.id);
    setForm({
      nome: campanha.nome,
      intervaloDias: campanha.intervaloDias,
      ativa: Boolean(campanha.ativa),
      assunto: campanha.assunto,
      perguntaSatisfacao: campanha.perguntaSatisfacao,
      perguntaMelhoria: campanha.perguntaMelhoria,
      perguntaLivre: campanha.perguntaLivre,
      proximoEnvioEm: toInputDateTime(campanha.proximoEnvioEm),
    });
    setSuccess('');
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      ...form,
      intervaloDias: Number(form.intervaloDias),
      proximoEnvioEm: toPayloadDateTime(form.proximoEnvioEm),
    };

    try {
      if (editingId) {
        await atualizarCampanhaFeedback(editingId, payload);
        setSuccess('Campanha atualizada.');
      } else {
        await criarCampanhaFeedback(payload);
        setSuccess('Campanha criada.');
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDisparar(campanha) {
    const confirmed = window.confirm(`Enviar a pesquisa "${campanha.nome}" agora para clientes ativos com e-mail?`);
    if (!confirmed) return;
    setError('');
    setSuccess('');
    try {
      await dispararCampanhaFeedback(campanha.id);
      setSuccess('Envio iniciado. Clientes sem e-mail foram ignorados.');
      await loadData();
    } catch (err) {
      setError(parseApiError(err));
    }
  }

  async function handleExport() {
    setError('');
    try {
      const blob = await exportarFeedbackCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'feedback-respostas.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Não foi possível exportar as respostas.');
    }
  }

  if (session && !canManageTeam) {
    return (
      <div className="rounded-md border border-slate-800 bg-chm-card p-6 text-sm text-chm-muted">
        Esta área é exclusiva do gestor.
      </div>
    );
  }

  if (loading) return <LoadingSpinner label="Carregando feedback..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-chm-accent">Feedback</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Pesquisas inteligentes</h2>
          <p className="mt-1 text-sm text-chm-muted">Envie pesquisas por e-mail e acompanhe respostas anônimas.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
        >
          Exportar CSV
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Respostas</p>
          <p className="mt-1 text-2xl font-bold">{resumo.total}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Satisfação média</p>
          <p className="mt-1 text-2xl font-bold text-chm-accent">{resumo.media}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Notas críticas</p>
          <p className="mt-1 text-2xl font-bold text-red-300">{resumo.criticas}</p>
        </div>
      </div>

      {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
      {success && <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{success}</div>}

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-md border border-slate-800/80 bg-chm-card/95 p-5 shadow-xl shadow-black/10">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">{editingId ? 'Editar campanha' : 'Nova campanha'}</h3>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-xs font-semibold text-chm-accent">
                Nova
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="nome">Nome</label>
              <input id="nome" value={form.nome} onChange={(event) => updateForm('nome', event.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="intervaloDias">Intervalo</label>
                <input id="intervaloDias" type="number" min="1" max="365" value={form.intervaloDias} onChange={(event) => updateForm('intervaloDias', event.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent" required />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="proximoEnvioEm">Próximo envio</label>
                <input id="proximoEnvioEm" type="datetime-local" value={form.proximoEnvioEm} onChange={(event) => updateForm('proximoEnvioEm', event.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent" />
              </div>
            </div>
            <label className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-200">
              <input type="checkbox" checked={form.ativa} onChange={(event) => updateForm('ativa', event.target.checked)} />
              Ativa
            </label>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="assunto">Assunto do e-mail</label>
              <input id="assunto" value={form.assunto} onChange={(event) => updateForm('assunto', event.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent" required />
            </div>
            {[
              ['perguntaSatisfacao', 'Pergunta de satisfação'],
              ['perguntaMelhoria', 'Pergunta anônima de melhoria'],
              ['perguntaLivre', 'Pergunta anônima livre'],
            ].map(([field, label]) => (
              <div key={field}>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor={field}>{label}</label>
                <textarea id={field} rows="2" value={form[field]} onChange={(event) => updateForm(field, event.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent" required />
              </div>
            ))}
            <button type="submit" disabled={saving} className="w-full rounded-md bg-chm-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? 'Salvando...' : editingId ? 'Salvar campanha' : 'Criar campanha'}
            </button>
          </form>
        </section>

        <div className="space-y-6">
          <section className="rounded-md border border-slate-800/80 bg-chm-card/95 shadow-xl shadow-black/10">
            <div className="border-b border-slate-800 p-4">
              <h3 className="text-lg font-semibold">Campanhas</h3>
            </div>
            <div className="divide-y divide-slate-800">
              {campanhas.length === 0 ? (
                <p className="p-5 text-sm text-chm-muted">Nenhuma campanha criada.</p>
              ) : (
                campanhas.map((campanha) => (
                  <div key={campanha.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-white">{campanha.nome}</p>
                      <p className="mt-1 text-sm text-chm-muted">
                        A cada {campanha.intervaloDias} dias | {campanha.ativa ? 'Ativa' : 'Pausada'} | Próximo: {formatDateTime(campanha.proximoEnvioEm)}
                      </p>
                      <p className="mt-1 text-xs text-chm-muted">Último envio: {formatDateTime(campanha.ultimoEnvioEm)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => startEdit(campanha)} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800">Editar</button>
                      <button type="button" onClick={() => handleDisparar(campanha)} className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-slate-200">Enviar agora</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-md border border-slate-800/80 bg-chm-card/95 shadow-xl shadow-black/10">
            <div className="border-b border-slate-800 p-4">
              <h3 className="text-lg font-semibold">Respostas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-chm-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Satisfação</th>
                    <th className="px-4 py-3 font-medium">Melhoria anônima</th>
                    <th className="px-4 py-3 font-medium">Comentário anônimo</th>
                  </tr>
                </thead>
                <tbody>
                  {respostas.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-chm-muted">Nenhuma resposta recebida.</td>
                    </tr>
                  ) : (
                    respostas.map((resposta) => (
                      <tr key={resposta.id} className="border-t border-slate-800">
                        <td className="px-4 py-4 text-chm-muted">{formatDateTime(resposta.respondidoEm)}</td>
                        <td className="px-4 py-4">
                          <span className="font-semibold text-white">{resposta.satisfacao}/10</span>
                          <span className="block text-xs text-chm-muted">{resposta.clienteNomeSatisfacao || 'Cliente'}</span>
                          {resposta.comentarioSatisfacao && <span className="mt-1 block text-xs text-slate-300">{resposta.comentarioSatisfacao}</span>}
                        </td>
                        <td className="px-4 py-4 text-slate-300">{resposta.respostaMelhoriaAnonima || '-'}</td>
                        <td className="px-4 py-4 text-slate-300">{resposta.respostaLivreAnonima || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
