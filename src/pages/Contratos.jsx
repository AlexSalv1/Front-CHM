import { useEffect, useMemo, useState } from 'react';
import { buscarConfigIntegracao } from '../api/integracoesApi';
import { buscarRelatorioContratos } from '../api/relatoriosApi';
import LoadingSpinner from '../components/LoadingSpinner';
import MetricCard from '../components/MetricCard';

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${value}T12:00:00`));
}

export default function Contratos() {
  const [periodo, setPeriodo] = useState(30);
  const [relatorio, setRelatorio] = useState(null);
  const [integracao, setIntegracao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadIntegracao() {
      try {
        const integracaoData = await buscarConfigIntegracao();
        if (active) setIntegracao(integracaoData);
      } catch {
        if (active) setIntegracao(null);
      }
    }

    loadIntegracao();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
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
  }, [periodo]);

  const maxValue = useMemo(() => {
    if (!relatorio?.serie?.length) return 1;
    return Math.max(
      1,
      ...relatorio.serie.map((item) =>
        Math.max(item.clientesNovos, item.contratosMantidos, item.contratosCancelados)
      )
    );
  }, [relatorio]);

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
              subtitle="Eventos de renovação/nota"
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
            <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Movimento diário</h3>
                <p className="text-sm text-chm-muted">Barras por dia, comparando entrada, manutenção e cancelamento.</p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-chm-muted">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-chm-accent" /> Novos
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Mantidos
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Cancelados
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="flex min-w-[760px] items-end gap-2 border-b border-slate-800 pb-4">
                {relatorio.serie.map((item) => (
                  <div key={item.data} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-44 w-full items-end justify-center gap-1 rounded-sm bg-slate-950/45 px-1 pb-1">
                      <div
                        className="w-2 rounded-t bg-chm-accent"
                        style={{ height: `${Math.max(3, (item.clientesNovos / maxValue) * 100)}%` }}
                        title={`${item.clientesNovos} clientes novos`}
                      />
                      <div
                        className="w-2 rounded-t bg-emerald-400"
                        style={{ height: `${Math.max(3, (item.contratosMantidos / maxValue) * 100)}%` }}
                        title={`${item.contratosMantidos} contratos mantidos`}
                      />
                      <div
                        className="w-2 rounded-t bg-red-400"
                        style={{ height: `${Math.max(3, (item.contratosCancelados / maxValue) * 100)}%` }}
                        title={`${item.contratosCancelados} contratos cancelados`}
                      />
                    </div>
                    <span className="text-[11px] text-chm-muted">{formatDate(item.data)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {integracao && (
            <section className="rounded-md border border-slate-800/80 bg-chm-card/95 p-5 shadow-xl shadow-black/10">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Dados para conectar sistemas externos</h3>
                <p className="text-sm text-chm-muted">
                  Use estes dados no sistema da catraca, financeiro ou outro app que envia eventos.
                </p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-md bg-slate-950/70 p-3">
                  <p className="text-xs text-chm-muted">Webhook</p>
                  <p className="mt-1 break-all text-sm font-medium">{integracao.webhookUrl}</p>
                </div>
                <div className="rounded-md bg-slate-950/70 p-3">
                  <p className="text-xs text-chm-muted">Tenant ID</p>
                  <p className="mt-1 break-all text-sm font-medium">{integracao.tenantId}</p>
                </div>
                <div className="rounded-md bg-slate-950/70 p-3">
                  <p className="text-xs text-chm-muted">Header de assinatura</p>
                  <p className="mt-1 text-sm font-medium">{integracao.signatureHeader}</p>
                </div>
                <div className="rounded-md bg-slate-950/70 p-3">
                  <p className="text-xs text-chm-muted">Header da empresa</p>
                  <p className="mt-1 text-sm font-medium">{integracao.tenantHeader}</p>
                </div>
              </div>
              <div className="mt-3 rounded-md bg-slate-950/70 p-3">
                <p className="text-xs text-chm-muted">Eventos aceitos</p>
                <p className="mt-1 text-sm font-medium">{integracao.tiposEvento.join(', ')}</p>
              </div>
            </section>
          )}

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
