import { useEffect, useMemo, useState } from 'react';
import {
  atualizarFuncionario,
  criarFuncionario,
  excluirFuncionario,
  listarFuncionarios,
} from '../api/funcionariosApi';
import LoadingSpinner from '../components/LoadingSpinner';
import useAppContext from '../hooks/useAppContext';
import { formatCurrency } from '../utils/retentionInsights';

const emptyForm = {
  nome: '',
  email: '',
  telefone: '',
  cargo: '',
  funcao: '',
  tipoContrato: 'CLT',
  status: 'ATIVO',
  horarioInicio: '',
  horarioFim: '',
  diasTrabalho: 'Segunda a sexta',
  dataAdmissao: '',
  salario: '',
  documento: '',
  observacoes: '',
};

function parseApiError(err) {
  const data = err?.response?.data;
  const details = Array.isArray(data?.details) ? data.details : [];
  return [data?.message, ...details].filter(Boolean).join(' ') || 'Nao foi possivel salvar funcionario.';
}

function buildPayload(form) {
  return {
    ...form,
    horarioInicio: form.horarioInicio || null,
    horarioFim: form.horarioFim || null,
    dataAdmissao: form.dataAdmissao || null,
    salario: form.salario === '' ? null : Number(form.salario),
  };
}

export default function Funcionarios() {
  const { session, canManageTeam, maskValue } = useAppContext();
  const [funcionarios, setFuncionarios] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadFuncionarios() {
    setLoading(true);
    setError('');
    try {
      setFuncionarios(await listarFuncionarios());
    } catch (err) {
      setError('Nao foi possivel carregar funcionarios.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFuncionarios();
  }, []);

  const filteredFuncionarios = useMemo(() => {
    const search = query.trim().toLowerCase();
    return funcionarios.filter((funcionario) => {
      const matchesSearch =
        !search ||
        [funcionario.nome, funcionario.email, funcionario.telefone, funcionario.cargo, funcionario.funcao]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(search));
      const matchesStatus = statusFilter === 'TODOS' || funcionario.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [funcionarios, query, statusFilter]);

  const stats = useMemo(() => {
    const ativos = funcionarios.filter((funcionario) => funcionario.status === 'ATIVO').length;
    const folha = funcionarios.reduce((total, funcionario) => total + Number(funcionario.salario || 0), 0);
    const cargos = new Set(funcionarios.map((funcionario) => funcionario.cargo).filter(Boolean)).size;
    return { ativos, folha, cargos };
  }, [funcionarios]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  function startEdit(funcionario) {
    setEditingId(funcionario.id);
    setForm({
      nome: funcionario.nome || '',
      email: funcionario.email || '',
      telefone: funcionario.telefone || '',
      cargo: funcionario.cargo || '',
      funcao: funcionario.funcao || '',
      tipoContrato: funcionario.tipoContrato || 'CLT',
      status: funcionario.status || 'ATIVO',
      horarioInicio: funcionario.horarioInicio || '',
      horarioFim: funcionario.horarioFim || '',
      diasTrabalho: funcionario.diasTrabalho || '',
      dataAdmissao: funcionario.dataAdmissao || '',
      salario: funcionario.salario ?? '',
      documento: funcionario.documento || '',
      observacoes: funcionario.observacoes || '',
    });
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await atualizarFuncionario(editingId, buildPayload(form));
      } else {
        await criarFuncionario(buildPayload(form));
      }
      startCreate();
      await loadFuncionarios();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(funcionario) {
    const confirmed = window.confirm(`Excluir ${funcionario.nome} do quadro de funcionarios?`);
    if (!confirmed) return;
    try {
      await excluirFuncionario(funcionario.id);
      await loadFuncionarios();
      if (editingId === funcionario.id) startCreate();
    } catch (err) {
      setError('Nao foi possivel excluir funcionario.');
    }
  }

  if (session && !canManageTeam) {
    return (
      <div className="rounded-md border border-slate-800 bg-chm-card p-6 text-sm text-chm-muted">
        Seu usuario nao tem acesso a gestao de funcionarios.
      </div>
    );
  }

  if (loading) return <LoadingSpinner label="Carregando funcionarios..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-chm-accent">Funcionarios</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Equipe operacional e burocratica</h2>
          <p className="mt-1 text-sm text-chm-muted">
            Gerencie cargos, funcoes, horarios, contratos, status e informacoes de folha.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          Novo funcionario
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Ativos</p>
          <p className="mt-1 text-2xl font-bold">{stats.ativos}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Cargos</p>
          <p className="mt-1 text-2xl font-bold text-chm-accent">{stats.cargos}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Folha estimada</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{maskValue(formatCurrency(stats.folha))}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Total</p>
          <p className="mt-1 text-2xl font-bold">{funcionarios.length}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-md border border-slate-800/80 bg-chm-card/95 shadow-xl shadow-black/10">
          <div className="grid gap-3 border-b border-slate-800 p-4 lg:grid-cols-[minmax(0,1fr)_170px]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-chm-accent"
              placeholder="Buscar nome, cargo, funcao ou contato"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-chm-accent"
            >
              <option value="TODOS">Todos</option>
              <option value="ATIVO">Ativo</option>
              <option value="AFASTADO">Afastado</option>
              <option value="FERIAS">Ferias</option>
              <option value="DESLIGADO">Desligado</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-chm-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Funcionario</th>
                  <th className="px-4 py-3 font-medium">Cargo/funcao</th>
                  <th className="px-4 py-3 font-medium">Horario</th>
                  <th className="px-4 py-3 font-medium">Contrato</th>
                  <th className="px-4 py-3 font-medium">Folha</th>
                  <th className="px-4 py-3 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredFuncionarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-chm-muted">
                      Nenhum funcionario encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredFuncionarios.map((funcionario) => (
                    <tr key={funcionario.id} className="border-t border-slate-800">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-white">{funcionario.nome}</p>
                        <p className="text-xs text-chm-muted">{funcionario.email || funcionario.telefone || 'Sem contato'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p>{funcionario.cargo}</p>
                        <p className="text-xs text-chm-muted">{funcionario.funcao || 'Funcao nao detalhada'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p>{funcionario.horarioInicio && funcionario.horarioFim ? `${funcionario.horarioInicio} - ${funcionario.horarioFim}` : 'Nao informado'}</p>
                        <p className="text-xs text-chm-muted">{funcionario.diasTrabalho || 'Dias nao informados'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p>{funcionario.tipoContrato}</p>
                        <p className="text-xs text-chm-muted">{funcionario.status}</p>
                      </td>
                      <td className="px-4 py-4">{maskValue(formatCurrency(funcionario.salario))}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(funcionario)}
                            className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(funcionario)}
                            className="rounded-md border border-red-500/40 px-2.5 py-1.5 text-xs text-red-200 hover:bg-red-500/10"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-md border border-slate-800/80 bg-chm-card/95 p-5 shadow-xl shadow-black/10">
          <h3 className="text-lg font-semibold">{editingId ? 'Editar funcionario' : 'Novo funcionario'}</h3>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
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
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="cargo">
                  Cargo
                </label>
                <input
                  id="cargo"
                  value={form.cargo}
                  onChange={(event) => updateForm('cargo', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                  placeholder="Recepcionista"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="funcao">
                  Funcao
                </label>
                <input
                  id="funcao"
                  value={form.funcao}
                  onChange={(event) => updateForm('funcao', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                  placeholder="Atendimento e retencao"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="email">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm('email', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
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
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="horarioInicio">
                  Inicio
                </label>
                <input
                  id="horarioInicio"
                  type="time"
                  value={form.horarioInicio}
                  onChange={(event) => updateForm('horarioInicio', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="horarioFim">
                  Fim
                </label>
                <input
                  id="horarioFim"
                  type="time"
                  value={form.horarioFim}
                  onChange={(event) => updateForm('horarioFim', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="diasTrabalho">
                Dias de trabalho
              </label>
              <input
                id="diasTrabalho"
                value={form.diasTrabalho}
                onChange={(event) => updateForm('diasTrabalho', event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="tipoContrato">
                  Contrato
                </label>
                <select
                  id="tipoContrato"
                  value={form.tipoContrato}
                  onChange={(event) => updateForm('tipoContrato', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                >
                  <option value="CLT">CLT</option>
                  <option value="PJ">PJ</option>
                  <option value="ESTAGIO">Estagio</option>
                  <option value="FREELANCER">Freelancer</option>
                  <option value="OUTRO">Outro</option>
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
                  <option value="ATIVO">Ativo</option>
                  <option value="AFASTADO">Afastado</option>
                  <option value="FERIAS">Ferias</option>
                  <option value="DESLIGADO">Desligado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="dataAdmissao">
                  Admissao
                </label>
                <input
                  id="dataAdmissao"
                  type="date"
                  value={form.dataAdmissao}
                  onChange={(event) => updateForm('dataAdmissao', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="salario">
                  Salario
                </label>
                <input
                  id="salario"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.salario}
                  onChange={(event) => updateForm('salario', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="documento">
                Documento
              </label>
              <input
                id="documento"
                value={form.documento}
                onChange={(event) => updateForm('documento', event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                placeholder="CPF, matricula ou registro"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="observacoes">
                Observacoes burocraticas
              </label>
              <textarea
                id="observacoes"
                rows={4}
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
