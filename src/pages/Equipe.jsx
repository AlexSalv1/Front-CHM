import { useEffect, useMemo, useState } from 'react';
import { atualizarUsuarioEquipe, criarUsuarioEquipe, listarEquipe } from '../api/equipeApi';
import {
  atualizarFuncionario,
  criarFuncionario,
  excluirFuncionario,
  listarFuncionarios,
} from '../api/funcionariosApi';
import LoadingSpinner from '../components/LoadingSpinner';
import useAppContext from '../hooks/useAppContext';
import { formatCurrency } from '../utils/retentionInsights';

const emptyUsuarioForm = {
  nome: '',
  email: '',
  senha: '',
  papel: 'ATENDENTE',
  podeVerFinanceiro: false,
  podeGerenciarInsumos: false,
  podeGerenciarManutencao: false,
};

const emptyFuncionarioForm = {
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

function parseApiError(err, fallback) {
  const data = err?.response?.data;
  const details = Array.isArray(data?.details) ? data.details : [];
  return [data?.message, ...details].filter(Boolean).join(' ') || fallback;
}

function buildFuncionarioPayload(form) {
  return {
    ...form,
    horarioInicio: form.horarioInicio || null,
    horarioFim: form.horarioFim || null,
    dataAdmissao: form.dataAdmissao || null,
    salario: form.salario === '' ? null : Number(form.salario),
  };
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 sm:items-center">
      <div className="w-full max-w-3xl rounded-md border border-slate-800 bg-slate-950 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-4 py-4 sm:px-5">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-chm-muted">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
            aria-label="Fechar modal"
          >
            X
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
      </div>
    </div>
  );
}

export default function Equipe() {
  const { session, canManageTeam, refreshSession, maskValue } = useAppContext();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [modalMode, setModalMode] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [usuarioForm, setUsuarioForm] = useState(emptyUsuarioForm);
  const [funcionarioForm, setFuncionarioForm] = useState(emptyFuncionarioForm);
  const [editingFuncionarioId, setEditingFuncionarioId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');

    const [usuariosResult, funcionariosResult] = await Promise.allSettled([
      listarEquipe(),
      listarFuncionarios(),
    ]);

    const errors = [];
    if (usuariosResult.status === 'fulfilled') {
      setUsuarios(usuariosResult.value);
    } else {
      errors.push('Nao foi possivel carregar os usuarios da equipe.');
    }

    if (funcionariosResult.status === 'fulfilled') {
      setFuncionarios(funcionariosResult.value);
    } else {
      errors.push('Nao foi possivel carregar os funcionarios.');
    }

    setError(errors.join(' '));
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const usuariosAtivos = usuarios.filter((usuario) => usuario.ativo).length;
    const atendentes = usuarios.filter((usuario) => usuario.papel === 'ATENDENTE').length;
    const funcionariosAtivos = funcionarios.filter((funcionario) => funcionario.status === 'ATIVO').length;
    const folha = funcionarios.reduce((total, funcionario) => total + Number(funcionario.salario || 0), 0);
    return { usuariosAtivos, atendentes, funcionariosAtivos, folha };
  }, [usuarios, funcionarios]);

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

  function updateUsuarioForm(field, value) {
    setUsuarioForm((current) => ({ ...current, [field]: value }));
  }

  function updateFuncionarioForm(field, value) {
    setFuncionarioForm((current) => ({ ...current, [field]: value }));
  }

  function openUsuarioModal() {
    setUsuarioForm(emptyUsuarioForm);
    setError('');
    setModalMode('usuario');
  }

  function openFuncionarioModal() {
    setFuncionarioForm(emptyFuncionarioForm);
    setEditingFuncionarioId(null);
    setError('');
    setModalMode('funcionario');
  }

  function startEditFuncionario(funcionario) {
    setEditingFuncionarioId(funcionario.id);
    setFuncionarioForm({
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
    setModalMode('funcionario');
    setActiveTab('funcionarios');
  }

  function closeModal() {
    setModalMode(null);
    setSaving(false);
  }

  async function handleUsuarioSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await criarUsuarioEquipe({
        ...usuarioForm,
        nome: usuarioForm.nome.trim(),
        email: usuarioForm.email.trim(),
        podeVerFinanceiro: usuarioForm.papel === 'GESTOR' && usuarioForm.podeVerFinanceiro,
        podeGerenciarInsumos: usuarioForm.podeGerenciarInsumos,
        podeGerenciarManutencao: usuarioForm.podeGerenciarManutencao,
      });
      closeModal();
      await loadData();
      await refreshSession();
    } catch (err) {
      setError(parseApiError(err, 'Nao foi possivel salvar usuario.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleFuncionarioSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingFuncionarioId) {
        await atualizarFuncionario(editingFuncionarioId, buildFuncionarioPayload(funcionarioForm));
      } else {
        await criarFuncionario(buildFuncionarioPayload(funcionarioForm));
      }
      closeModal();
      await loadData();
    } catch (err) {
      setError(parseApiError(err, 'Nao foi possivel salvar funcionario.'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(usuario) {
    try {
      await atualizarUsuarioEquipe(usuario.id, { ativo: !usuario.ativo });
      await loadData();
      await refreshSession();
    } catch (err) {
      setError(parseApiError(err, 'Nao foi possivel atualizar o acesso.'));
    }
  }

  async function toggleFinanceiro(usuario) {
    try {
      await atualizarUsuarioEquipe(usuario.id, { podeVerFinanceiro: !usuario.podeVerFinanceiro });
      await loadData();
      await refreshSession();
    } catch (err) {
      setError(parseApiError(err, 'Nao foi possivel atualizar o acesso financeiro.'));
    }
  }

  async function toggleInsumos(usuario) {
    try {
      await atualizarUsuarioEquipe(usuario.id, { podeGerenciarInsumos: !usuario.podeGerenciarInsumos });
      await loadData();
      await refreshSession();
    } catch (err) {
      setError(parseApiError(err, 'Nao foi possivel atualizar o acesso aos insumos.'));
    }
  }

  async function toggleManutencao(usuario) {
    try {
      await atualizarUsuarioEquipe(usuario.id, { podeGerenciarManutencao: !usuario.podeGerenciarManutencao });
      await loadData();
      await refreshSession();
    } catch (err) {
      setError(parseApiError(err, 'Nao foi possivel atualizar o acesso a manutencao.'));
    }
  }

  async function handleDeleteFuncionario(funcionario) {
    const confirmed = window.confirm(`Excluir ${funcionario.nome} do quadro de funcionarios?`);
    if (!confirmed) return;

    try {
      await excluirFuncionario(funcionario.id);
      await loadData();
      if (editingFuncionarioId === funcionario.id) {
        closeModal();
      }
    } catch (err) {
      setError('Nao foi possivel excluir funcionario.');
    }
  }

  if (session && !canManageTeam) {
    return (
      <div className="rounded-md border border-slate-800 bg-chm-card p-6 text-sm text-chm-muted">
        Seu usuario nao tem acesso a gestao de equipe.
      </div>
    );
  }

  if (loading) return <LoadingSpinner label="Carregando gestao da equipe..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-chm-accent">Equipe</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Gestao de acessos e funcionarios</h2>
          <p className="mt-1 text-sm text-chm-muted">
            Controle usuarios, permissao de acesso, quadro operacional, horarios e informacoes burocraticas em uma unica tela.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openUsuarioModal}
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Novo usuario
          </button>
          <button
            type="button"
            onClick={openFuncionarioModal}
            className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Adicionar membro
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Usuarios de acesso</p>
          <p className="mt-1 text-2xl font-bold">{usuarios.length}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Atendentes</p>
          <p className="mt-1 text-2xl font-bold text-chm-accent">{stats.atendentes}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Funcionarios ativos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{stats.funcionariosAtivos}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Folha estimada</p>
          <p className="mt-1 text-2xl font-bold">{maskValue(formatCurrency(stats.folha))}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex overflow-x-auto rounded-md border border-slate-800 bg-slate-950/70 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('usuarios')}
          className={`rounded px-4 py-2 text-sm font-medium transition ${
            activeTab === 'usuarios' ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Acessos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('funcionarios')}
          className={`rounded px-4 py-2 text-sm font-medium transition ${
            activeTab === 'funcionarios' ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Funcionarios
        </button>
      </div>

      {activeTab === 'usuarios' ? (
        <section className="rounded-md border border-slate-800/80 bg-chm-card/95 shadow-xl shadow-black/10">
          <div className="border-b border-slate-800 px-4 py-4">
            <h3 className="text-lg font-semibold">Usuarios da academia</h3>
            <p className="mt-1 text-sm text-chm-muted">
              Crie acessos para atendentes e gestores, com permissoes separadas para cada rotina.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-chm-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Papel</th>
                  <th className="px-4 py-3 font-medium">Financeiro</th>
                  <th className="px-4 py-3 font-medium">Insumos</th>
                  <th className="px-4 py-3 font-medium">Manutencao</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-chm-muted">
                      Nenhum usuario cadastrado.
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-t border-slate-800">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-white">{usuario.nome}</p>
                        <p className="text-xs text-chm-muted">{usuario.email}</p>
                      </td>
                      <td className="px-4 py-4">{usuario.papel}</td>
                      <td className="px-4 py-4">
                        {usuario.papel === 'GESTOR' ? (
                          <button
                            type="button"
                            onClick={() => toggleFinanceiro(usuario)}
                            className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs hover:bg-slate-800"
                          >
                            {usuario.podeVerFinanceiro ? 'Pode ver' : 'Oculto'}
                          </button>
                        ) : (
                          <span className="text-chm-muted">Oculto</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => toggleInsumos(usuario)}
                          className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs hover:bg-slate-800"
                        >
                          {usuario.podeGerenciarInsumos ? 'Liberado' : 'Bloqueado'}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => toggleManutencao(usuario)}
                          className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs hover:bg-slate-800"
                        >
                          {usuario.podeGerenciarManutencao ? 'Liberado' : 'Bloqueado'}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <span className={usuario.ativo ? 'text-emerald-300' : 'text-red-300'}>
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => toggleAtivo(usuario)}
                          className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs hover:bg-slate-800"
                        >
                          {usuario.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="flex flex-col gap-3 rounded-md border border-slate-800/80 bg-chm-card/95 p-4 shadow-xl shadow-black/10 lg:grid lg:grid-cols-[minmax(0,1fr)_170px] lg:items-center">
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

          <section className="rounded-md border border-slate-800/80 bg-chm-card/95 shadow-xl shadow-black/10">
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
                          <p>
                            {funcionario.horarioInicio && funcionario.horarioFim
                              ? `${funcionario.horarioInicio} - ${funcionario.horarioFim}`
                              : 'Nao informado'}
                          </p>
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
                              onClick={() => startEditFuncionario(funcionario)}
                              className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFuncionario(funcionario)}
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
        </section>
      )}

      {modalMode === 'usuario' && (
        <ModalShell
          title="Novo usuario"
          subtitle="Crie um acesso para atendente ou gestor sem expor dados desnecessarios."
          onClose={closeModal}
        >
          <form onSubmit={handleUsuarioSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="usuario-nome">
                Nome
              </label>
              <input
                id="usuario-nome"
                value={usuarioForm.nome}
                onChange={(event) => updateUsuarioForm('nome', event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="usuario-email">
                E-mail
              </label>
              <input
                id="usuario-email"
                type="email"
                value={usuarioForm.email}
                onChange={(event) => updateUsuarioForm('email', event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="usuario-senha">
                Senha inicial
              </label>
              <input
                id="usuario-senha"
                type="password"
                minLength={8}
                value={usuarioForm.senha}
                onChange={(event) => updateUsuarioForm('senha', event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="usuario-papel">
                Papel
              </label>
              <select
                id="usuario-papel"
                value={usuarioForm.papel}
                onChange={(event) => updateUsuarioForm('papel', event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
              >
                <option value="ATENDENTE">Atendente</option>
                <option value="GESTOR">Gestor</option>
              </select>
            </div>
            {usuarioForm.papel === 'GESTOR' && (
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={usuarioForm.podeVerFinanceiro}
                  onChange={(event) => updateUsuarioForm('podeVerFinanceiro', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900"
                />
                Permitir acesso financeiro
              </label>
            )}
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={usuarioForm.podeGerenciarInsumos}
                onChange={(event) => updateUsuarioForm('podeGerenciarInsumos', event.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900"
              />
              Permitir gerenciar insumos e compras
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={usuarioForm.podeGerenciarManutencao}
                onChange={(event) => updateUsuarioForm('podeGerenciarManutencao', event.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900"
              />
              Permitir gerenciar manutencao
            </label>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-chm-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Criar usuario'}
            </button>
          </form>
        </ModalShell>
      )}

      {modalMode === 'funcionario' && (
        <ModalShell
          title={editingFuncionarioId ? 'Editar funcionario' : 'Novo funcionario'}
          subtitle="Organize horarios, cargos e informacoes burocraticas em um formulario simples."
          onClose={closeModal}
        >
          <form onSubmit={handleFuncionarioSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="func-nome">
                  Nome
                </label>
                <input
                  id="func-nome"
                  value={funcionarioForm.nome}
                  onChange={(event) => updateFuncionarioForm('nome', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="func-cargo">
                  Cargo
                </label>
                <input
                  id="func-cargo"
                  value={funcionarioForm.cargo}
                  onChange={(event) => updateFuncionarioForm('cargo', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                  placeholder="Recepcionista"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="func-funcao">
                  Funcao
                </label>
                <input
                  id="func-funcao"
                  value={funcionarioForm.funcao}
                  onChange={(event) => updateFuncionarioForm('funcao', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                  placeholder="Atendimento e retencao"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="func-email">
                  E-mail
                </label>
                <input
                  id="func-email"
                  type="email"
                  value={funcionarioForm.email}
                  onChange={(event) => updateFuncionarioForm('email', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="func-telefone">
                  Telefone
                </label>
                <input
                  id="func-telefone"
                  value={funcionarioForm.telefone}
                  onChange={(event) => updateFuncionarioForm('telefone', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="func-horarioInicio">
                  Inicio
                </label>
                <input
                  id="func-horarioInicio"
                  type="time"
                  value={funcionarioForm.horarioInicio}
                  onChange={(event) => updateFuncionarioForm('horarioInicio', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="func-horarioFim">
                  Fim
                </label>
                <input
                  id="func-horarioFim"
                  type="time"
                  value={funcionarioForm.horarioFim}
                  onChange={(event) => updateFuncionarioForm('horarioFim', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="func-diasTrabalho">
                Dias de trabalho
              </label>
              <input
                id="func-diasTrabalho"
                value={funcionarioForm.diasTrabalho}
                onChange={(event) => updateFuncionarioForm('diasTrabalho', event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="func-contrato">
                  Contrato
                </label>
                <select
                  id="func-contrato"
                  value={funcionarioForm.tipoContrato}
                  onChange={(event) => updateFuncionarioForm('tipoContrato', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                >
                  <option value="CLT">CLT</option>
                  <option value="PJ">PJ</option>
                  <option value="ESTAGIO">Estagio</option>
                  <option value="FREELANCER">Freelancer</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="func-status">
                  Status
                </label>
                <select
                  id="func-status"
                  value={funcionarioForm.status}
                  onChange={(event) => updateFuncionarioForm('status', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="AFASTADO">Afastado</option>
                  <option value="FERIAS">Ferias</option>
                  <option value="DESLIGADO">Desligado</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="func-admissao">
                  Admissao
                </label>
                <input
                  id="func-admissao"
                  type="date"
                  value={funcionarioForm.dataAdmissao}
                  onChange={(event) => updateFuncionarioForm('dataAdmissao', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="func-salario">
                  Salario
                </label>
                <input
                  id="func-salario"
                  type="number"
                  min="0"
                  step="0.01"
                  value={funcionarioForm.salario}
                  onChange={(event) => updateFuncionarioForm('salario', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="func-documento">
                Documento
              </label>
              <input
                id="func-documento"
                value={funcionarioForm.documento}
                onChange={(event) => updateFuncionarioForm('documento', event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                placeholder="CPF, matricula ou registro"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="func-observacoes">
                Observacoes burocraticas
              </label>
              <textarea
                id="func-observacoes"
                rows={4}
                value={funcionarioForm.observacoes}
                onChange={(event) => updateFuncionarioForm('observacoes', event.target.value)}
                className="w-full resize-none rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-chm-accent"
              />
            </div>

            <div className="flex gap-2">
              {editingFuncionarioId && (
                <button
                  type="button"
                  onClick={closeModal}
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
                {saving ? 'Salvando...' : editingFuncionarioId ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
}
