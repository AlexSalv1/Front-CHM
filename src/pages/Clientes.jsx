import { useEffect, useMemo, useState } from 'react';
import {
  atualizarCliente,
  criarCliente,
  excluirCliente,
  listarClientes,
} from '../api/clientesApi';
import HealthScoreBadge, { getHealthScoreStyle } from '../components/HealthScoreBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import useAppContext from '../hooks/useAppContext';
import {
  buildHealthHistory,
  buildSuggestedMessage,
  buildWhatsAppUrl,
  formatCurrency,
  getRecommendedAction,
  getRiskReasons,
  riskBucket,
} from '../utils/retentionInsights';

const emptyForm = {
  idExternoSistema: '',
  nome: '',
  telefone: '',
  healthScore: 50,
  statusContrato: 'ATIVO',
  valorMensalidade: '',
};

function parseApiError(err) {
  const data = err?.response?.data;
  const details = Array.isArray(data?.details) ? data.details : [];
  return [data?.message, ...details].filter(Boolean).join(' ') || 'Não foi possível salvar o cliente.';
}

function HealthHistory({ cliente }) {
  const history = buildHealthHistory(cliente);

  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/65 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-chm-muted">Historico do health score</p>
      <div className="mt-3 flex h-24 items-end gap-3">
        {history.map((point) => (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-16 w-full items-end rounded-md bg-slate-900">
              <div
                className="w-full rounded-md bg-chm-accent"
                style={{ height: `${Math.max(10, point.value)}%` }}
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold">{point.value}</p>
              <p className="text-[10px] text-chm-muted">{point.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Clientes() {
  const { canManageTeam, maskValue } = useAppContext();
  const [clientes, setClientes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [riskFilter, setRiskFilter] = useState('todos');
  const [formMode, setFormMode] = useState('create');
  const [form, setForm] = useState(emptyForm);

  async function loadClientes() {
    setLoading(true);
    setError('');
    try {
      const data = await listarClientes();
      setClientes(data);
      setSelectedId((current) => current || data[0]?.id || null);
    } catch (err) {
      setError('Não foi possível carregar a carteira de clientes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClientes();
  }, []);

  const selectedCliente = useMemo(
    () => clientes.find((cliente) => cliente.id === selectedId) || null,
    [clientes, selectedId]
  );

  const filteredClientes = useMemo(() => {
    const search = query.trim().toLowerCase();
    return clientes.filter((cliente) => {
      const matchesSearch =
        !search ||
        cliente.nome.toLowerCase().includes(search) ||
        cliente.idExternoSistema.toLowerCase().includes(search) ||
        (cliente.telefone || '').includes(search);
      const matchesStatus = statusFilter === 'TODOS' || cliente.statusContrato === statusFilter;
      const matchesRisk = riskFilter === 'todos' || riskBucket(cliente.healthScore) === riskFilter;
      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [clientes, query, statusFilter, riskFilter]);

  const stats = useMemo(() => {
    const ativos = clientes.filter((cliente) => cliente.statusContrato === 'ATIVO');
    const risco = clientes.filter((cliente) => cliente.healthScore <= 60);
    const receita = ativos.reduce((total, cliente) => total + Number(cliente.valorMensalidade || 0), 0);
    const media =
      clientes.length === 0
        ? 0
        : Math.round(clientes.reduce((total, cliente) => total + cliente.healthScore, 0) / clientes.length);
    return { ativos: ativos.length, risco: risco.length, receita, media };
  }, [clientes]);

  function startCreate() {
    setFormMode('create');
    setForm(emptyForm);
    setError('');
  }

  function startEdit(cliente) {
    setFormMode('edit');
    setForm({
      idExternoSistema: cliente.idExternoSistema,
      nome: cliente.nome,
      telefone: cliente.telefone || '',
      healthScore: cliente.healthScore,
      statusContrato: cliente.statusContrato,
      valorMensalidade: String(cliente.valorMensalidade),
    });
    setSelectedId(cliente.id);
    setError('');
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      ...form,
      healthScore: Number(form.healthScore),
      valorMensalidade: Number(form.valorMensalidade),
      telefone: form.telefone.trim(),
    };

    try {
      let saved;
      if (formMode === 'edit' && selectedCliente) {
        const { idExternoSistema, ...updatePayload } = payload;
        saved = await atualizarCliente(selectedCliente.id, updatePayload);
      } else {
        saved = await criarCliente(payload);
      }

      await loadClientes();
      setSelectedId(saved.id);
      setFormMode('create');
      setForm(emptyForm);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cliente) {
    const confirmed = window.confirm(`Excluir ${cliente.nome} da carteira?`);
    if (!confirmed) return;

    try {
      await excluirCliente(cliente.id);
      setClientes((current) => current.filter((item) => item.id !== cliente.id));
      if (selectedId === cliente.id) setSelectedId(null);
    } catch (err) {
      setError('Não foi possível excluir o cliente.');
    }
  }

  if (loading) return <LoadingSpinner label="Carregando CRM..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-chm-accent">Clientes</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Pessoas que você acompanha</h2>
          <p className="mt-1 text-sm text-chm-muted">Cadastre, atualize e encontre quem precisa de atenção.</p>
        </div>
        {canManageTeam && (
          <button
            type="button"
            onClick={startCreate}
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Adicionar cliente
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Ativos</p>
          <p className="mt-1 text-2xl font-bold">{stats.ativos}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Pedem atenção</p>
          <p className="mt-1 text-2xl font-bold text-red-300">{stats.risco}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Saúde média</p>
          <p className="mt-1 text-2xl font-bold text-chm-accent">{stats.media}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Receita ativa</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{maskValue(formatCurrency(stats.receita))}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="rounded-md border border-slate-800/80 bg-chm-card/95 shadow-xl shadow-black/10">
          <div className="grid gap-3 border-b border-slate-800 p-4 lg:grid-cols-[minmax(0,1fr)_170px_170px]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-chm-accent"
            placeholder="Buscar cliente, ID ou telefone"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-chm-accent"
            >
              <option value="TODOS">Todos os status</option>
              <option value="ATIVO">Ativo</option>
              <option value="PAUSADO">Pausado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
            <select
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-chm-accent"
            >
              <option value="todos">Todas as situações</option>
              <option value="risco">Precisa de atenção</option>
              <option value="atencao">Atenção</option>
              <option value="saudavel">Saudável</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-chm-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Health</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Mensalidade</th>
                  <th className="px-4 py-3 font-medium">Próximo passo</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-chm-muted">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredClientes.map((cliente) => {
                    const style = getHealthScoreStyle(cliente.healthScore);
                    const isSelected = cliente.id === selectedId;
                    return (
                      <tr
                        key={cliente.id}
                        className={`border-t border-slate-800 transition ${style.row} ${
                          isSelected ? 'outline outline-1 outline-chm-accent/60' : ''
                        }`}
                      >
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedId(cliente.id)}
                            className="text-left"
                          >
                            <span className="block font-semibold text-white">{cliente.nome}</span>
                            <span className="text-xs text-chm-muted">{cliente.idExternoSistema}</span>
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <HealthScoreBadge score={cliente.healthScore} />
                        </td>
                        <td className="px-4 py-4 text-chm-muted">{cliente.statusContrato}</td>
                        <td className="px-4 py-4">{maskValue(formatCurrency(cliente.valorMensalidade))}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {canManageTeam ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEdit(cliente)}
                                  className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(cliente)}
                                  className="rounded-md border border-red-500/40 px-2.5 py-1.5 text-xs text-red-200 hover:bg-red-500/10"
                                >
                                  Excluir
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-chm-muted">Contato e acompanhamento</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6">
          {canManageTeam && (
          <section className="rounded-md border border-slate-800/80 bg-chm-card/95 p-5 shadow-xl shadow-black/10">
                  <h3 className="text-lg font-semibold">{formMode === 'edit' ? 'Atualizar cliente' : 'Adicionar cliente'}</h3>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {formMode === 'create' && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="idExternoSistema">
                    Código interno
                  </label>
                  <input
                    id="idExternoSistema"
                    value={form.idExternoSistema}
                    onChange={(event) => updateForm('idExternoSistema', event.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                    placeholder="CRM-001"
                    required
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="nome">
                  Nome
                </label>
                <input
                  id="nome"
                  value={form.nome}
                  onChange={(event) => updateForm('nome', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="telefone">
                  Telefone
                </label>
                <input
                  id="telefone"
                  value={form.telefone}
                  onChange={(event) => updateForm('telefone', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                  placeholder="5511999998888"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="healthScore">
                    Health score
                  </label>
                  <input
                    id="healthScore"
                    type="number"
                    min="0"
                    max="100"
                    value={form.healthScore}
                    onChange={(event) => updateForm('healthScore', event.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="valorMensalidade">
                    Mensalidade
                  </label>
                  <input
                    id="valorMensalidade"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.valorMensalidade}
                    onChange={(event) => updateForm('valorMensalidade', event.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="statusContrato">
                  Status
                </label>
                <select
                  id="statusContrato"
                  value={form.statusContrato}
                  onChange={(event) => updateForm('statusContrato', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="PAUSADO">Pausado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-md bg-chm-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Salvando...' : formMode === 'edit' ? 'Salvar alterações' : 'Adicionar cliente'}
              </button>
            </form>
          </section>
          )}

          <section className="rounded-md border border-slate-800/80 bg-chm-card/95 p-5 shadow-xl shadow-black/10">
            <h3 className="text-lg font-semibold">Resumo do cliente</h3>
            {selectedCliente ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xl font-bold">{selectedCliente.nome}</p>
                  <p className="text-sm text-chm-muted">{selectedCliente.telefone || 'Telefone não informado'}</p>
                </div>
                <HealthScoreBadge score={selectedCliente.healthScore} />
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-md bg-slate-950/70 p-3">
                    <p className="text-xs text-chm-muted">Status</p>
                    <p className="mt-1 font-semibold">{selectedCliente.statusContrato}</p>
                  </div>
                  <div className="rounded-md bg-slate-950/70 p-3">
                    <p className="text-xs text-chm-muted">Mensalidade</p>
                    <p className="mt-1 font-semibold">{maskValue(formatCurrency(selectedCliente.valorMensalidade))}</p>
                  </div>
                </div>
                <HealthHistory cliente={selectedCliente} />
                <div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Acao recomendada</p>
                  <p className="mt-1 text-sm text-slate-200">{getRecommendedAction(selectedCliente)}</p>
                </div>
                <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-100">Motivo do risco</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {getRiskReasons(selectedCliente).map((reason) => (
                      <span key={reason} className="rounded-full bg-slate-950/60 px-2.5 py-1 text-xs text-amber-50">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/65 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-chm-muted">Mensagem sugerida</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">{buildSuggestedMessage(selectedCliente)}</p>
                </div>
                <div className="flex gap-2">
                  {canManageTeam && (
                    <button
                      type="button"
                      onClick={() => startEdit(selectedCliente)}
                      className="flex-1 rounded-md border border-slate-700 px-3 py-2 text-sm font-medium hover:bg-slate-800"
                    >
                      Editar
                    </button>
                  )}
                  <a
                    href={buildWhatsAppUrl(selectedCliente.telefone, buildSuggestedMessage(selectedCliente))}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 rounded-md bg-chm-whatsapp px-3 py-2 text-center text-sm font-semibold text-white hover:bg-green-600"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-chm-muted">Selecione alguém da lista para ver o resumo.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
