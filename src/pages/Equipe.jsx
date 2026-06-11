import { useEffect, useMemo, useState } from 'react';
import { atualizarUsuarioEquipe, criarUsuarioEquipe, listarEquipe } from '../api/equipeApi';
import LoadingSpinner from '../components/LoadingSpinner';
import useAppContext from '../hooks/useAppContext';

const emptyForm = {
  nome: '',
  email: '',
  senha: '',
  papel: 'ATENDENTE',
  podeVerFinanceiro: false,
};

function parseApiError(err) {
  const data = err?.response?.data;
  const details = Array.isArray(data?.details) ? data.details : [];
  return [data?.message, ...details].filter(Boolean).join(' ') || 'Nao foi possivel salvar usuario.';
}

export default function Equipe() {
  const { session, canManageTeam } = useAppContext();
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadEquipe() {
    setLoading(true);
    setError('');
    try {
      setUsuarios(await listarEquipe());
    } catch (err) {
      setError('Nao foi possivel carregar a equipe.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEquipe();
  }, []);

  const atendentes = useMemo(
    () => usuarios.filter((usuario) => usuario.papel === 'ATENDENTE').length,
    [usuarios]
  );

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await criarUsuarioEquipe({
        ...form,
        nome: form.nome.trim(),
        email: form.email.trim(),
        podeVerFinanceiro: form.papel === 'GESTOR' && form.podeVerFinanceiro,
      });
      setForm(emptyForm);
      await loadEquipe();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(usuario) {
    try {
      await atualizarUsuarioEquipe(usuario.id, { ativo: !usuario.ativo });
      await loadEquipe();
    } catch (err) {
      setError(parseApiError(err));
    }
  }

  async function toggleFinanceiro(usuario) {
    try {
      await atualizarUsuarioEquipe(usuario.id, { podeVerFinanceiro: !usuario.podeVerFinanceiro });
      await loadEquipe();
    } catch (err) {
      setError(parseApiError(err));
    }
  }

  if (session && !canManageTeam) {
    return (
      <div className="rounded-md border border-slate-800 bg-chm-card p-6 text-sm text-chm-muted">
        Seu usuario nao tem acesso a gestao da equipe.
      </div>
    );
  }
  if (loading) return <LoadingSpinner label="Carregando equipe..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-chm-accent">Equipe</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Usuarios da academia</h2>
          <p className="mt-1 text-sm text-chm-muted">
            Crie acessos de atendente para acompanhar riscos e enviar mensagens sem expor valores.
          </p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-chm-muted">
          {usuarios.length} usuarios, {atendentes} atendentes
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-md border border-slate-800/80 bg-chm-card/95 shadow-xl shadow-black/10">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-chm-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Papel</th>
                  <th className="px-4 py-3 font-medium">Financeiro</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-md border border-slate-800/80 bg-chm-card/95 p-5 shadow-xl shadow-black/10">
          <h3 className="text-lg font-semibold">Novo usuario</h3>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => updateForm('email', event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="senha">
                Senha inicial
              </label>
              <input
                id="senha"
                type="password"
                minLength={8}
                value={form.senha}
                onChange={(event) => updateForm('senha', event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="papel">
                Papel
              </label>
              <select
                id="papel"
                value={form.papel}
                onChange={(event) => updateForm('papel', event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
              >
                <option value="ATENDENTE">Atendente</option>
                <option value="GESTOR">Gestor</option>
              </select>
            </div>
            {form.papel === 'GESTOR' && (
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.podeVerFinanceiro}
                  onChange={(event) => updateForm('podeVerFinanceiro', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                />
                Permitir acesso financeiro
              </label>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-chm-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Criando...' : 'Criar usuario'}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
