import { useEffect, useMemo, useState } from 'react';
import { buscarRelatorioContratos } from '../api/relatoriosApi';
import LoadingSpinner from '../components/LoadingSpinner';
import MetricCard from '../components/MetricCard';
import useAppContext from '../hooks/useAppContext';

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${value}T12:00:00`));
}

function formatValue(value) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export default function Contratos() {
  const { session, canManageTeam } = useAppContext();
  const [periodo, setPeriodo] = useState(30);
  const [relatorio, setRelatorio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return undefined;
    if (!canManageTeam) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const relatorioData = await buscarRelatorioContratos(periodo);
        if (active) setRelatorio(relatorioData);
      } catch (err) {
        if (active) setError('Não foi possível carregar o relatório de contratos.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [periodo, session?.id, canManageTeam]);

  const maxValue = useMemo(() => {
    if (!relatorio?.serie?.length) return 1;
    return Math.max(
      1,
      ...relatorio.serie.map((item) =>
        Math.max(item.clientesNovos, item.contratosMantidos, item.contratosCancelados)
      )
    );
  }, [relatorio]);

  const chartTicks = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, index) => {
      const ratio = 1 - index / steps;
      return {
        value: Math.round(maxValue * ratio),
        top: `${ratio * 100}%`,
      };
    });
  }, [maxValue]);

  if (session && !canManageTeam) {
    return (
      <div className="rounded-md border border-slate-800 bg-chm-card p-6 text-sm text-chm-muted">
        Seu usuário não tem acesso ao relatório de contratos.
      </div>
    );
  }

  if (loading) return <LoadingSpinner label="Carregando contratos..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-chm-accent">Contratos</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Novos, mantidos e cancelados</h2>
          <p className="mt-1 text-sm text-chm-muted">
            Dados consolidados do CRM e das integrações de catracas, financeiro e sistemas externos.
          </p>
        </div>
        <div className="flex rounded-md border border-slate-800 bg-slate-950/80 p-1">
          {[7, 30, 90].map((dias) => (
            <button
              key={dias}
              type="button"
              onClick={() => setPeriodo(dias)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                periodo === dias ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {dias} dias
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {relatorio && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              title="Clientes novos"
              value={relatorio.resumo.clientesNovos}
              subtitle={`Últimos ${relatorio.resumo.dias} dias`}
              accent="text-chm-accent"
            />
            <MetricCard
              title="Contratos mantidos"
              value={relatorio.resumo.contratosMantidos}
              subtitle="Eventos de renovação e nota"
              accent="text-emerald-300"
            />
            <MetricCard
              title="Cancelados"
              value={relatorio.resumo.contratosCancelados}
              subtitle="Eventos de cancelamento"
              accent="text-red-300"
            />
            <MetricCard
              title="Ativos hoje"
              value={relatorio.resumo.contratosAtivosHoje}
              subtitle="Status atual da carteira"
            />
            <MetricCard
              title="Cancelados hoje"
              value={relatorio.resumo.contratosCanceladosHoje}
              subtitle="Status atual da carteira"
              accent="text-amber-200"
            />
          </div>

          <section className="rounded-md border border-slate-800/80 bg-chm-card/95 p-5 shadow-xl shadow-black/10">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Movimento diário</h3>
                <p className="text-sm text-chm-muted">
                  Um painel mais limpo para comparar entrada, manutenção e cancelamento por dia.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-1.5 text-chm-muted">
                  <span className="h-2.5 w-2.5 rounded-full bg-chm-accent shadow-[0_0_16px_rgba(79,140,255,0.5)]" />
                  Novos
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-1.5 text-chm-muted">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.4)]" />
                  Mantidos
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-1.5 text-chm-muted">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_16px_rgba(248,113,113,0.4)]" />
                  Cancelados
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[620px] rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 sm:min-w-[780px]">
                <div className="relative flex h-64 gap-3">
                  <div className="relative w-12 shrink-0 text-[11px] text-chm-muted">
                    {chartTicks.map((tick) => (
                      <div
                        key={`${tick.value}-${tick.top}`}
                        className="absolute left-0 right-0 -translate-y-1/2"
                        style={{ top: tick.top }}
                      >
                        {formatValue(tick.value)}
                      </div>
                    ))}
                  </div>

                  <div className="relative flex-1">
                    {chartTicks.map((tick) => (
                      <div
                        key={`grid-${tick.value}-${tick.top}`}
                        className="absolute left-0 right-0 border-t border-dashed border-slate-700/70"
                        style={{ top: tick.top }}
                      />
                    ))}

                    <div className="absolute inset-0 flex items-end gap-2">
                      {relatorio.serie.map((item) => (
                        <div key={item.data} className="flex flex-1 flex-col justify-end gap-2">
                          <div className="flex h-full items-end justify-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-950/45 px-1.5 pb-2 pt-4">
                            <div
                              className="w-3 rounded-full bg-gradient-to-t from-blue-600 to-blue-400 shadow-[0_8px_18px_rgba(59,130,246,0.35)]"
                              style={{ height: `${Math.max(10, (item.clientesNovos / maxValue) * 100)}%` }}
                              title={`${item.clientesNovos} clientes novos`}
                            />
                            <div
                              className="w-3 rounded-full bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_8px_18px_rgba(16,185,129,0.28)]"
                              style={{ height: `${Math.max(10, (item.contratosMantidos / maxValue) * 100)}%` }}
                              title={`${item.contratosMantidos} contratos mantidos`}
                            />
                            <div
                              className="w-3 rounded-full bg-gradient-to-t from-red-600 to-red-400 shadow-[0_8px_18px_rgba(239,68,68,0.28)]"
                              style={{ height: `${Math.max(10, (item.contratosCancelados / maxValue) * 100)}%` }}
                              title={`${item.contratosCancelados} contratos cancelados`}
                            />
                          </div>
                          <div className="space-y-1 text-center">
                            <span className="block text-[11px] font-medium text-slate-200">{formatDate(item.data)}</span>
                            <span className="block text-[10px] text-chm-muted">
                              {item.clientesNovos + item.contratosMantidos + item.contratosCancelados} mov.
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-800/80 pt-4 text-xs sm:max-w-md">
                  <div className="rounded-xl bg-blue-500/10 px-3 py-2">
                    <p className="text-blue-200">Novos</p>
                    <p className="mt-1 text-lg font-semibold text-white">{relatorio.resumo.clientesNovos}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/10 px-3 py-2">
                    <p className="text-emerald-200">Mantidos</p>
                    <p className="mt-1 text-lg font-semibold text-white">{relatorio.resumo.contratosMantidos}</p>
                  </div>
                  <div className="rounded-xl bg-red-500/10 px-3 py-2">
                    <p className="text-red-200">Cancelados</p>
                    <p className="mt-1 text-lg font-semibold text-white">{relatorio.resumo.contratosCancelados}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-slate-800/80 bg-chm-card/95 shadow-xl shadow-black/10">
            <div className="border-b border-slate-800 p-5">
              <h3 className="text-lg font-semibold">Tabela do período</h3>
              <p className="text-sm text-chm-muted">Os mesmos dados em formato auditável.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-chm-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Data</th>
                    <th className="px-5 py-3 font-medium">Clientes novos</th>
                    <th className="px-5 py-3 font-medium">Contratos mantidos</th>
                    <th className="px-5 py-3 font-medium">Cancelados</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.serie.map((item) => (
                    <tr key={item.data} className="border-t border-slate-800">
                      <td className="px-5 py-3 font-medium">{formatDate(item.data)}</td>
                      <td className="px-5 py-3 text-chm-accent">{item.clientesNovos}</td>
                      <td className="px-5 py-3 text-emerald-300">{item.contratosMantidos}</td>
                      <td className="px-5 py-3 text-red-300">{item.contratosCancelados}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
