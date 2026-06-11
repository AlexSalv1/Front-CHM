import { useEffect, useMemo, useState } from 'react';
import { atualizarInsumo, criarInsumo, excluirInsumo, listarInsumos } from '../api/insumosApi';
import LoadingSpinner from '../components/LoadingSpinner';
import useAppContext from '../hooks/useAppContext';
import { formatCurrency } from '../utils/retentionInsights';

const emptyForm = {
  nome: '',
  tipo: 'MATERIAL',
  categoria: '',
  status: 'OK',
  quantidadeAtual: 0,
  estoqueMinimo: 0,
  unidade: 'un',
  fornecedor: '',
  custoUnitario: '',
  dataProximaCompra: '',
  responsavel: '',
  observacoes: '',
};

const priorityOrder = { ALTA: 0, MEDIA: 1, BAIXA: 2, NORMAL: 3 };

function parseApiError(err) {
  const data = err?.response?.data;
  const details = Array.isArray(data?.details) ? data.details : [];
  return [data?.message, ...details].filter(Boolean).join(' ') || 'Nao foi possivel salvar insumo.';
}

function buildPayload(form) {
  return {
    ...form,
    quantidadeAtual: Number(form.quantidadeAtual || 0),
    estoqueMinimo: Number(form.estoqueMinimo || 0),
    custoUnitario: form.custoUnitario === '' ? null : Number(form.custoUnitario),
    dataProximaCompra: form.dataProximaCompra || null,
  };
}

export default function Insumos() {
  const { session, canManageInsumos, maskValue } = useAppContext();
  const [insumos, setInsumos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadInsumos() {
    setLoading(true);
    setError('');
    try {
      setInsumos(await listarInsumos());
    } catch (err) {
      setError('Nao foi possivel carregar insumos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInsumos();
  }, []);

  const filteredInsumos = useMemo(() => {
    const search = query.trim().toLowerCase();
    return insumos
      .filter((insumo) => {
        const matchesSearch =
          !search ||
          [insumo.nome, insumo.categoria, insumo.fornecedor, insumo.responsavel, insumo.acaoSugerida]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(search));
        const matchesType = typeFilter === 'TODOS' || insumo.tipo === typeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => (priorityOrder[a.prioridade] ?? 9) - (priorityOrder[b.prioridade] ?? 9));
  }, [insumos, query, typeFilter]);

  const stats = useMemo(() => {
    const urgentes = insumos.filter((insumo) => insumo.prioridade === 'ALTA').length;
    const baixoEstoque = insumos.filter((insumo) => insumo.status === 'BAIXO_ESTOQUE').length;
    const equipamentos = insumos.filter((insumo) => insumo.tipo === 'EQUIPAMENTO').length;
    const valorEstoque = insumos.reduce((total, insumo) => total + Number(insumo.valorEstimado || 0), 0);
    return { urgentes, baixoEstoque, equipamentos, valorEstoque };
  }, [insumos]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  function startEdit(insumo) {
    setEditingId(insumo.id);
    setForm({
      nome: insumo.nome || '',
      tipo: insumo.tipo || 'MATERIAL',
      categoria: insumo.categoria || '',
      status: insumo.status || 'OK',
      quantidadeAtual: insumo.quantidadeAtual ?? 0,
      estoqueMinimo: insumo.estoqueMinimo ?? 0,
      unidade: insumo.unidade || 'un',
      fornecedor: insumo.fornecedor || '',
      custoUnitario: insumo.custoUnitario ?? '',
      dataProximaCompra: insumo.dataProximaCompra || '',
      responsavel: insumo.responsavel || '',
      observacoes: insumo.observacoes || '',
    });
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await atualizarInsumo(editingId, buildPayload(form));
      } else {
        await criarInsumo(buildPayload(form));
      }
      startCreate();
      await loadInsumos();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(insumo) {
    const confirmed = window.confirm(`Excluir ${insumo.nome} do controle de insumos?`);
    if (!confirmed) return;
    try {
      await excluirInsumo(insumo.id);
      await loadInsumos();
      if (editingId === insumo.id) startCreate();
    } catch (err) {
      setError('Nao foi possivel excluir insumo.');
    }
  }

  if (session && !canManageInsumos) {
    return (
      <div className="rounded-md border border-slate-800 bg-chm-card p-6 text-sm text-chm-muted">
        Seu usuario nao tem acesso ao gerenciamento de insumos e compras.
      </div>
    );
  }

  if (loading) return <LoadingSpinner label="Carregando insumos..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-chm-accent">Insumos</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Compras, materiais e equipamentos</h2>
          <p className="mt-1 text-sm text-chm-muted">
            Controle estoque, fornecedores, custos e prioridades de compra da academia.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          Novo item
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Prioridade alta</p>
          <p className="mt-1 text-2xl font-bold text-red-300">{stats.urgentes}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Baixo estoque</p>
          <p className="mt-1 text-2xl font-bold text-amber-300">{stats.baixoEstoque}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Equipamentos</p>
          <p className="mt-1 text-2xl font-bold text-chm-accent">{stats.equipamentos}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs text-chm-muted">Valor estimado</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{maskValue(formatCurrency(stats.valorEstoque))}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="rounded-md border border-slate-800/80 bg-chm-card/95 shadow-xl shadow-black/10">
          <div className="grid gap-3 border-b border-slate-800 p-4 lg:grid-cols-[minmax(0,1fr)_170px]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-chm-accent"
              placeholder="Buscar item, categoria, fornecedor ou acao"
            />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-chm-accent"
            >
              <option value="TODOS">Todos os tipos</option>
              <option value="MATERIAL">Material</option>
              <option value="EQUIPAMENTO">Equipamento</option>
              <option value="SERVICO">Servico</option>
            </select>
          </div>

          <div className="divide-y divide-slate-800">
            {filteredInsumos.length === 0 ? (
              <div className="p-12 text-center text-chm-muted">Nenhum item encontrado.</div>
            ) : (
              filteredInsumos.map((insumo) => (
                <article key={insumo.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_180px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white">{insumo.nome}</h3>
                      <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
                        {insumo.tipo}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        insumo.prioridade === 'ALTA'
                          ? 'bg-red-500/15 text-red-200'
                          : insumo.prioridade === 'MEDIA'
                            ? 'bg-amber-500/15 text-amber-200'
                            : 'bg-slate-800 text-slate-300'
                      }`}>
                        {insumo.prioridade}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-chm-muted">{insumo.categoria} · {insumo.status}</p>
                    <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                      <div className="rounded-md bg-slate-950/65 p-3">
                        <p className="text-xs text-chm-muted">Estoque</p>
                        <p className="mt-1 font-semibold">
                          {insumo.quantidadeAtual} {insumo.unidade}
                        </p>
                        <p className="text-xs text-chm-muted">min. {insumo.estoqueMinimo}</p>
                      </div>
                      <div className="rounded-md bg-slate-950/65 p-3">
                        <p className="text-xs text-chm-muted">Fornecedor</p>
                        <p className="mt-1 font-semibold">{insumo.fornecedor || 'Nao informado'}</p>
                      </div>
                      <div className="rounded-md bg-slate-950/65 p-3">
                        <p className="text-xs text-chm-muted">Valor estimado</p>
                        <p className="mt-1 font-semibold">{maskValue(formatCurrency(insumo.valorEstimado))}</p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-md border border-blue-500/20 bg-blue-500/10 p-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Acao sugerida</p>
                      <p className="mt-1 text-slate-200">{insumo.acaoSugerida}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 lg:items-end">
                    <p className="text-sm text-chm-muted">
                      {insumo.dataProximaCompra ? `Compra: ${insumo.dataProximaCompra}` : 'Sem data planejada'}
                    </p>
                    <p className="text-xs text-chm-muted">{insumo.responsavel || 'Sem responsavel'}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(insumo)}
                        className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(insumo)}
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
          <h3 className="text-lg font-semibold">{editingId ? 'Editar item' : 'Novo item'}</h3>
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="tipo">
                  Tipo
                </label>
                <select
                  id="tipo"
                  value={form.tipo}
                  onChange={(event) => updateForm('tipo', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                >
                  <option value="MATERIAL">Material</option>
                  <option value="EQUIPAMENTO">Equipamento</option>
                  <option value="SERVICO">Servico</option>
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
                  <option value="OK">OK</option>
                  <option value="BAIXO_ESTOQUE">Baixo estoque</option>
                  <option value="COMPRA_PLANEJADA">Compra planejada</option>
                  <option value="COMPRADO">Comprado</option>
                  <option value="MANUTENCAO">Manutencao</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="categoria">
                Categoria
              </label>
              <input
                id="categoria"
                value={form.categoria}
                onChange={(event) => updateForm('categoria', event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                placeholder="Limpeza, musculacao, manutencao"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="quantidadeAtual">
                  Atual
                </label>
                <input
                  id="quantidadeAtual"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.quantidadeAtual}
                  onChange={(event) => updateForm('quantidadeAtual', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="estoqueMinimo">
                  Minimo
                </label>
                <input
                  id="estoqueMinimo"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.estoqueMinimo}
                  onChange={(event) => updateForm('estoqueMinimo', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="unidade">
                  Unidade
                </label>
                <input
                  id="unidade"
                  value={form.unidade}
                  onChange={(event) => updateForm('unidade', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="fornecedor">
                  Fornecedor
                </label>
                <input
                  id="fornecedor"
                  value={form.fornecedor}
                  onChange={(event) => updateForm('fornecedor', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="custoUnitario">
                  Custo unit.
                </label>
                <input
                  id="custoUnitario"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.custoUnitario}
                  onChange={(event) => updateForm('custoUnitario', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="dataProximaCompra">
                  Proxima compra
                </label>
                <input
                  id="dataProximaCompra"
                  type="date"
                  value={form.dataProximaCompra}
                  onChange={(event) => updateForm('dataProximaCompra', event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                />
              </div>
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
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="observacoes">
                Observacoes
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
