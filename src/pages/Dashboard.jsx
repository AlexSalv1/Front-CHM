import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { buscarMetricas, listarClientes } from '../api/clientesApi';
import HealthScoreBadge from '../components/HealthScoreBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import MetricCard from '../components/MetricCard';
import useAppContext from '../hooks/useAppContext';
import {
  buildHealthHistory,
  buildSuggestedMessage,
  buildWhatsAppUrl,
  formatCurrency,
  getCancellationPatterns,
  getRecommendedAction,
  getRiskReasons,
} from '../utils/retentionInsights';

function bucketClientes(clientes) {
  return {
    risco: clientes.filter((cliente) => cliente.healthScore < 40),
    atencao: clientes.filter((cliente) => cliente.healthScore >= 40 && cliente.healthScore <= 60),
    saudavel: clientes.filter((cliente) => cliente.healthScore > 60),
  };
}

function MiniTrend({ cliente }) {
  const history = buildHealthHistory(cliente);
  return (
    <div className="flex h-16 items-end gap-1.5">
      {history.map((point) => (
        <div key={point.label} className="flex w-7 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-chm-accent/80"
            style={{ height: `${Math.max(8, point.value * 0.48)}px` }}
            title={`${point.label}: ${point.value}`}
          />
          <span className="text-[10px] text-chm-muted">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { canManageTeam, maskValue } = useAppContext();
  const [clientes, setClientes] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [clientesData, metricasData] = await Promise.all([
          listarClientes(),
          buscarMetricas(),
        ]);
        setClientes(clientesData);
        setMetricas(metricasData);
      } catch (err) {
        setError('Nao foi possivel carregar o dashboard.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const buckets = useMemo(() => bucketClientes(clientes), [clientes]);
  const clientesPrioritarios = useMemo(
    () =>
      [...clientes]
        .filter((cliente) => cliente.healthScore <= 60 || cliente.statusContrato !== 'ATIVO')
        .sort((a, b) => {
          const valueDiff = Number(b.valorMensalidade || 0) - Number(a.valorMensalidade || 0);
          return a.healthScore === b.healthScore ? valueDiff : a.healthScore - b.healthScore;
        })
        .slice(0, 6),
    [clientes]
  );
  const patterns = useMemo(() => getCancellationPatterns(clientes), [clientes]);

  if (loading) return <LoadingSpinner label="Carregando dashboard..." />;
  if (error) return <p className="text-center text-red-400">{error}</p>;

  return (
    <div className="space-y-7">
      <section className="rounded-md border border-slate-800/80 bg-slate-950/75 p-6 shadow-xl shadow-black/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-chm-accent">
              Central de retencao
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Quem precisa de cuidado agora</h2>
            <p className="mt-2 max-w-2xl text-sm text-chm-muted">
              Score historico, motivos de risco, proxima acao e impacto financeiro em uma leitura operacional.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManageTeam && (
              <Link
                to="/executivo"
                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Dashboard executivo
              </Link>
            )}
            <Link
              to="/tarefas"
              className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Ver contatos
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Risco de perda mensal"
          value={maskValue(formatCurrency(metricas.receitaMensalEmRisco))}
          subtitle="Receita ativa em clientes ate 60"
          accent="text-red-300"
        />
        <MetricCard
          title="Impacto anual"
          value={maskValue(formatCurrency(metricas.impactoAnualEmRisco))}
          subtitle="Se o risco virar cancelamento"
          accent="text-amber-300"
        />
        <MetricCard
          title="Clientes criticos"
          value={metricas.clientesCriticos}
          subtitle="Health score ate 40"
          accent="text-red-300"
        />
        <MetricCard
          title="Saude media"
          value={metricas.healthScoreMedio}
          subtitle="Media geral da carteira"
          accent="text-chm-accent"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-md border border-slate-800 bg-chm-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Ranking de clientes em risco</h3>
              <p className="text-sm text-chm-muted">Prioridade calculada por score, status e valor financeiro.</p>
            </div>
            <span className="text-sm text-chm-muted">{clientesPrioritarios.length} prioridades</span>
          </div>

          <div className="space-y-3">
            {clientesPrioritarios.length === 0 ? (
              <p className="rounded-md bg-slate-950/70 p-4 text-sm text-chm-muted">
                Nenhum cliente em risco no momento.
              </p>
            ) : (
              clientesPrioritarios.map((cliente, index) => {
                const message = buildSuggestedMessage(cliente);
                return (
                  <article
                    key={cliente.id}
                    className="grid gap-4 rounded-md border border-slate-800 bg-slate-950/55 p-4 lg:grid-cols-[36px_minmax(0,1fr)_120px]"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-800 text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-white">{cliente.nome}</h4>
                        <HealthScoreBadge score={cliente.healthScore} />
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{getRecommendedAction(cliente)}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {getRiskReasons(cliente).slice(0, 3).map((reason) => (
                          <span
                            key={reason}
                            className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-100"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-chm-muted">
                        <span>{maskValue(formatCurrency(cliente.valorMensalidade))} / mes</span>
                        <a
                          href={buildWhatsAppUrl(cliente.telefone, message)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md bg-chm-whatsapp px-2.5 py-1.5 font-semibold text-white hover:bg-green-600"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>
                    <MiniTrend cliente={cliente} />
                  </article>
                );
              })
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-md border border-slate-800 bg-chm-card p-5">
            <h3 className="text-lg font-semibold">Mapa da carteira</h3>
            <p className="text-sm text-chm-muted">Distribuicao por nivel de saude.</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-md border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-200">Risco</p>
                <p className="mt-2 text-3xl font-bold text-red-200">{buckets.risco.length}</p>
              </div>
              <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Atencao</p>
                <p className="mt-2 text-3xl font-bold text-amber-200">{buckets.atencao.length}</p>
              </div>
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Saudavel</p>
                <p className="mt-2 text-3xl font-bold text-emerald-200">{buckets.saudavel.length}</p>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-slate-800 bg-chm-card p-5">
            <h3 className="text-lg font-semibold">Motivos de cancelamento</h3>
            <p className="text-sm text-chm-muted">Padroes que merecem correcao na operacao.</p>
            <div className="mt-4 space-y-3">
              {patterns.map((pattern) => (
                <div key={pattern.title} className="rounded-md bg-slate-950/65 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{pattern.title}</p>
                    <span className="text-sm text-chm-accent">{pattern.count}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-chm-muted">{pattern.description}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
