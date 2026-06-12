import { useEffect, useMemo, useState } from 'react';
import { atualizarAssinaturaAdmin, listarAssinaturasAdmin } from '../api/adminAssinaturasApi';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/retentionInsights';

const statusOptions = ['AGUARDANDO_APROVACAO', 'TRIAL', 'ATIVA', 'PENDENTE', 'ATRASADA', 'BLOQUEADA', 'CANCELADA'];

const statusLabel = {
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  TRIAL: 'Trial',
  ATIVA: 'Ativa',
  PENDENTE: 'Pendente',
  ATRASADA: 'Atrasada',
  BLOQUEADA: 'Bloqueada',
  CANCELADA: 'Cancelada',
};

const statusClass = {
  AGUARDANDO_APROVACAO: 'border-violet-500/25 bg-violet-500/10 text-violet-200',
  TRIAL: 'border-blue-500/25 bg-blue-500/10 text-blue-200',
  ATIVA: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
  PENDENTE: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
  ATRASADA: 'border-orange-500/25 bg-orange-500/10 text-orange-200',
  BLOQUEADA: 'border-red-500/25 bg-red-500/10 text-red-200',
  CANCELADA: 'border-slate-500/25 bg-slate-500/10 text-slate-200',
};

function toDateInput(value) {
  return value ? value.slice(0, 10) : '';
}

export default function AdminAssinaturas() {
  const [assinaturas, setAssinaturas] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      setAssinaturas(await listarAssinaturasAdmin());
    } catch (err) {
      setError('Não foi possível carregar as assinaturas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return assinaturas;
    return assinaturas.filter((item) =>
      [item.nomeComercial, item.cnpj, item.plano, item.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [assinaturas, query]);

  async function updateLocal(empresaId, field, value) {
    setAssinaturas((current) =>
      current.map((item) => (item.empresaId === empresaId ? { ...item, [field]: value } : item))
    );
  }

  async function save(item, changes = {}) {
    setSavingId(item.empresaId);
    setError('');
    setSuccess('');
    try {
      const saved = await atualizarAssinaturaAdmin(item.empresaId, {
        status: item.status,
        plano: item.plano,
        valorMensal: item.valorMensal,
        vencimentoAtual: item.vencimentoAtual,
        gateway: item.gateway,
        observacao: item.observacao,
        ...changes,
      });
      setAssinaturas((current) =>
        current.map((assinatura) => (assinatura.empresaId === saved.empresaId ? saved : assinatura))
      );
      setSuccess('Assinatura atualizada.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Não foi possível atualizar a assinatura.');
    } finally {
      setSavingId('');
    }
  }

  if (loading) return <LoadingSpinner label="Carregando assinaturas..." />;

  return (
    <div className="space-y-6">
      <section className="chm-surface-strong p-6">
        <p className="chm-kicker">Administração da plataforma</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-chm-text">Assinaturas das academias</h2>
            <p className="mt-2 max-w-2xl text-sm text-chm-muted">
              Gerencie status, vencimento e bloqueio de acesso sem entrar na conta do gestor.
            </p>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="chm-field lg:w-80"
            placeholder="Buscar academia, CNPJ ou status"
          />
        </div>
      </section>

      {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
      {success && <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{success}</div>}

      <section className="chm-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-chm-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Academia</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Plano</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium">Observação</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-chm-muted">
                    Nenhuma assinatura encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.empresaId} className="border-t border-slate-800">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-chm-text">{item.nomeComercial}</p>
                      <p className="text-xs text-chm-muted">{item.cnpj}</p>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={item.status}
                        onChange={(event) => {
                          updateLocal(item.empresaId, 'status', event.target.value);
                          save(item, { status: event.target.value });
                        }}
                        className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold outline-none ${statusClass[item.status] || statusClass.TRIAL}`}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        value={item.plano || ''}
                        onChange={(event) => updateLocal(item.empresaId, 'plano', event.target.value)}
                        onBlur={() => save(item)}
                        className="chm-field w-32 py-1.5 text-xs"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.valorMensal ?? ''}
                        onChange={(event) => updateLocal(item.empresaId, 'valorMensal', event.target.value)}
                        onBlur={() => save(item)}
                        className="chm-field w-28 py-1.5 text-xs"
                        placeholder="0,00"
                      />
                      <p className="mt-1 text-xs text-chm-muted">{formatCurrency(item.valorMensal || 0)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="date"
                        value={toDateInput(item.vencimentoAtual)}
                        onChange={(event) => {
                          updateLocal(item.empresaId, 'vencimentoAtual', event.target.value);
                          save(item, { vencimentoAtual: event.target.value });
                        }}
                        className="chm-field w-36 py-1.5 text-xs"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        value={item.observacao || ''}
                        onChange={(event) => updateLocal(item.empresaId, 'observacao', event.target.value)}
                        onBlur={() => save(item)}
                        className="chm-field w-56 py-1.5 text-xs"
                        placeholder="Nota interna"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => save(item)}
                        disabled={savingId === item.empresaId}
                        className="chm-action px-3 py-2 text-xs"
                      >
                        {savingId === item.empresaId ? 'Salvando...' : 'Salvar'}
                      </button>
                      {item.status === 'AGUARDANDO_APROVACAO' && (
                        <button
                          type="button"
                          onClick={() =>
                            save(item, {
                              status: 'ATIVA',
                              plano: item.plano === 'Aguardando aprovação' ? 'Plano inicial' : item.plano,
                            })
                          }
                          disabled={savingId === item.empresaId}
                          className="mt-2 block rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                        >
                          Aprovar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
