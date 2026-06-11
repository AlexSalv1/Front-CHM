import { useEffect, useMemo, useState } from 'react';
import {
  atualizarManutencao,
  criarManutencao,
  excluirManutencao,
  listarManutencoes,
} from '../api/manutencoesApi';
import LoadingSpinner from '../components/LoadingSpinner';
import useAppContext from '../hooks/useAppContext';
import { formatCurrency } from '../utils/retentionInsights';

const emptyForm = {
  equipamento: '',
  localizacao: '',
  problema: '',
  prioridade: 'MEDIA',
  status: 'ABERTA',
  responsavel: '',
  tecnicoFornecedor: '',
  custoEstimado: '',
  dataAbertura: '',
  dataAgendada: '',
  dataConclusao: '',
  observacoes: '',
};

const priorityOrder = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 };

function parseApiError(err) {
  const data = err?.response?.data;
  const details = Array.isArray(data?.details) ? data.details : [];
  return [data?.message, ...details].filter(Boolean).join(' ') || 'Nao foi possivel salvar manutencao.';
}

function buildPayload(form) {
  return {
    ...form,
    custoEstimado: form.custoEstimado === '' ? null : Number(form.custoEstimado),
    dataAbertura: form.dataAbertura || null,
    dataAgendada: form.dataAgendada || null,
    dataConclusao: form.dataConclusao || null,
  };
}

export default function Manutencao() {
  const { session, canManageManutencao, maskValue } = useAppContext();
  const [manutencoes, setManutencoes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadManutencoes() {
    setLoading(true);
    setError('');
    try {
      setManutencoes(await listarManutencoes());
    } catch (err) {
      setError('Nao foi possivel carregar manutencoes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadManutencoes();
  }, []);

  const filteredManutencoes = useMemo(() => {
    const search = query.trim().toLowerCase();
    return manutencoes
      .filter((item) => {
        const matchesSearch =
          !search ||
          [item.equipamento, item.localizacao, item.problema, item.responsavel, item.tecnicoFornecedor, item.acaoSugerida]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(search));
        const matchesStatus = statusFilter === 'TODOS' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const priorityDiff = (priorityOrder[a.prioridade] ?? 9) - (priorityOrder[b.prioridade] ?? 9);
        return priorityDiff || b.diasEmAberto - a.diasEmAberto;
      });
  }, [manutencoes, query, statusFilter]);

  const stats = useMemo(() => {
    const abertas = manutencoes.filter((item) => !['CONCLUIDA', 'CANCELADA'].includes(item.status)).length;
    const criticas = manutencoes.filter((item) => item.prioridade === 'CRITICA').length;
    const atrasadas = manutencoes.filter((item) => item.dataAgendada && item.status !== 'CONCLUIDA' && item.dataAgendada < new Date().toISOString().slice(0, 10)).length;
    const custo = manutencoes.reduce((total, item) => total + Number(item.custoEstimado || 0), 0);
    return { abertas, criticas, atrasadas, custo };
  }, [manutencoes]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      equipamento: item.equipamento || '',
      localizacao: item.localizacao || '',
      problema: item.problema || '',
      prioridade: item.prioridade || 'MEDIA',
      status: item.status || 'ABERTA',
      responsavel: item.responsavel || '',
      tecnicoFornecedor: item.tecnicoFornecedor || '',
      custoEstimado: item.custoEstimado ?? '',
      dataAbertura: item.dataAbertura || '',
      dataAgendada: item.dataAgendada || '',
      dataConclusao: item.dataConclusao || '',
      observacoes: item.observacoes || '',
    });
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await atualizarManutencao(editingId, buildPayload(form));
      } else {
        await criarManutencao(buildPayload(form));
      }
      startCreate();
      await loadManutencoes();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(`Excluir manutencao de ${item.equipamento}?`);
    if (!confirmed) return;
    try {
      await excluirManutencao(item.id);
      await loadManutencoes();
      if (editingId === item.id) startCreate();
    } catch (err) {
      setError('Nao foi possivel excluir manutencao.');
    }
  }

  if (session && !canManageManutencao) {
    return (
      <div className="rounded-md border border-slate-800 bg-chm-card p-6 text-sm text-chm-muted">
        Seu usuario nao tem acesso ao gerenciamento de manutencao.
      </div>
    );
  }

  if (loading) return <LoadingSpinner label="Carregando manutencoes..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-chm-accent">Manutencao</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Equipamentos com defeito e pendencias</h2>
          <p className="mt-1 text-sm text-chm-muted">
            Controle falhas, prioridade, tecnico, custo e prazo de retorno dos equipamentos.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          Nova manutencao
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Abertas</p>
          <p className="mt-1 text-2xl font-bold">{stats.abertas}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Criticas</p>
          <p className="mt-1 text-2xl font-bold text-red-300">{stats.criticas}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Agendadas vencidas</p>
          <p className="mt-1 text-2xl font-bold text-amber-300">{stats.atrasadas}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Custo estimado</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{maskValue(formatCurrency(stats.custo))}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="rounded-md border border-slate-800/80 bg-chm-card/95 shadow-xl shadow-black/10">
          <div className="grid gap-3 border-b border-slate-800 p-4 lg:grid-cols-[minmax(0,1fr)_190px]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-chm-accent"
              placeholder="Buscar equipamento, problema, responsavel ou tecnico"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-chm-accent"
            >
              <option value="TODOS">Todos os status</option>
              <option value="ABERTA">Aberta</option>
              <option value="AGENDADA">Agendada</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="AGUARDANDO_PECA">Aguardando peca</option>
              <option value="CONCLUIDA">Concluida</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          <div className="divide-y divide-slate-800">
            {filteredManutencoes.length === 0 ? (
              <div className="p-12 text-center text-chm-muted">Nenhuma manutencao encontrada.</div>
            ) : (
              filteredManutencoes.map((item) => (
                <article key={item.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_185px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white">{item.equipamento}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.prioridade === 'CRITICA'
                          ? 'bg-red-500/20 text-red-100'
                          : item.prioridade === 'ALTA'
                            ? 'bg-amber-500/20 text-amber-100'
                            : 'bg-slate-800 text-slate-300'
                      }`}>
                        {item.prioridade}
                      </span>
                      <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-chm-muted">{item.localizacao || 'Local nao informado'}</p>
                    <p className="mt-3 text-sm text-slate-300">{item.problema}</p>
                    <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                      <div className="rounded-md bg-slate-950/65 p-3">
                        <p className="text-xs text-chm-muted">Aberta ha</p>
                        <p className="mt-1 font-semibold">{item.diasEmAberto} dias</p>
                      </div>
                      <div className="rounded-md bg-slate-950/65 p-3">
                        <p className="text-xs text-chm-muted">Tecnico</p>
                        <p className="mt-1 font-semibold">{item.tecnicoFornecedor || 'Nao informado'}</p>
                      </div>
                      <div className="rounded-md bg-slate-950/65 p-3">
                        <p className="text-xs text-chm-muted">Custo</p>
                        <p className="mt-1 font-semibold">{maskValue(formatCurrency(item.custoEstimado))}</p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-md border border-blue-500/20 bg-blue-500/10 p-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Acao sugerida</p>
                      <p className="mt-1 text-slate-200">{item.acaoSugerida}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 lg:items-end">
                    <p className="text-sm text-chm-muted">
                      {item.dataAgendada ? `Agendada: ${item.dataAgendada}` : 'Sem data agendada'}
                    </p>
                    <p className="text-xs text-chm-muted">{item.responsavel || 'Sem responsavel'}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="rounded-md border border-red-500/40 px-2.5 py-1.5 text-xs text-red-200 hover:bg-red-500/10"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <aside className="rounded-md border border-slate-800/80 bg-chm-card/95 p-5 shadow-xl shadow-black/10">
          <h3 className="text-lg font-semibold">{editingId ? 'Editar manutencao' : 'Nova manutencao'}</h3>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="equipamento">
                Equipamento
              </label>
              <input
                id="equipamento"
                value={form.equipamento}
                onChange={(event) => updateForm('equipamento', event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="localizacao">
                Localizacao
              </label>
              <input
                id="localizacao"
                value={form.localizacao}
                onChange={(event) => updateForm('localizacao', event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="problema">
                Problema
              </label>
              <textarea
                id="problema"
                rows={3}
                value={form.problema}
                onChange={(event) => updateForm('problema', event.target.value)}
                className="w-full resize-none rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="prioridade">
                  Prioridade
                </label>
                <select
                  id="prioridade"
                  value={form.prioridade}
                  onChange={(event) => updateForm('prioridade', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                  <option value="CRITICA">Critica</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(event) => updateForm('status', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                >
                  <option value="ABERTA">Aberta</option>
                  <option value="AGENDADA">Agendada</option>
                  <option value="EM_ANDAMENTO">Em andamento</option>
                  <option value="AGUARDANDO_PECA">Aguardando peca</option>
                  <option value="CONCLUIDA">Concluida</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="responsavel">
                  Responsavel
                </label>
                <input
                  id="responsavel"
                  value={form.responsavel}
                  onChange={(event) => updateForm('responsavel', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="tecnicoFornecedor">
                  Tecnico
                </label>
                <input
                  id="tecnicoFornecedor"
                  value={form.tecnicoFornecedor}
                  onChange={(event) => updateForm('tecnicoFornecedor', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="dataAbertura">
                  Abertura
                </label>
                <input
                  id="dataAbertura"
                  type="date"
                  value={form.dataAbertura}
                  onChange={(event) => updateForm('dataAbertura', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="dataAgendada">
                  Agendada
                </label>
                <input
                  id="dataAgendada"
                  type="date"
                  value={form.dataAgendada}
                  onChange={(event) => updateForm('dataAgendada', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="dataConclusao">
                  Conclusao
                </label>
                <input
                  id="dataConclusao"
                  type="date"
                  value={form.dataConclusao}
                  onChange={(event) => updateForm('dataConclusao', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="custoEstimado">
                  Custo estimado
                </label>
                <input
                  id="custoEstimado"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.custoEstimado}
                  onChange={(event) => updateForm('custoEstimado', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="observacoes">
                Observacoes
              </label>
              <textarea
                id="observacoes"
                rows={3}
                value={form.observacoes}
                onChange={(event) => updateForm('observacoes', event.target.value)}
                className="w-full resize-none rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
              />
            </div>
            <div className="flex gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="flex-1 rounded-md border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-md bg-chm-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
