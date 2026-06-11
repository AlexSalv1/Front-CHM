import { useEffect, useMemo, useState } from 'react';
import { buscarMetricas, listarClientes } from '../api/clientesApi';
import LoadingSpinner from '../components/LoadingSpinner';
import MetricCard from '../components/MetricCard';
import useAppContext from '../hooks/useAppContext';
import { formatCurrency, getCancellationPatterns } from '../utils/retentionInsights';

export default function Executivo() {
  const { session, canManageTeam, maskValue } = useAppContext();
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
        setError('Nao foi possivel carregar o dashboard executivo.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const patterns = useMemo(() => getCancellationPatterns(clientes).slice(0, 3), [clientes]);
  const cancelamentosEvitados = useMemo(
    () => clientes.filter((cliente) => cliente.healthScore > 60 && cliente.statusContrato === 'ATIVO').length,
    [clientes]
  );

  if (loading) return <LoadingSpinner label="Carregando dashboard executivo..." />;
  if (error) return <p className="text-center text-red-400">{error}</p>;
  if (session && !canManageTeam) {
    return (
      <div className="rounded-md border border-slate-800 bg-chm-card p-6 text-sm text-chm-muted">
        Seu usuario nao tem acesso ao dashboard executivo.
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="rounded-md border border-slate-800/80 bg-slate-950/75 p-6 shadow-xl shadow-black/10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-chm-accent">
          Dashboard executivo
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Retencao em numeros de negocio</h2>
        <p className="mt-2 max-w-2xl text-sm text-chm-muted">
          Uma visao direta para entender risco, receita protegida e prioridade de acao.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Clientes em risco"
          value={metricas.clientesEmRisco}
          subtitle={`${metricas.clientesCriticos} em nivel critico`}
          accent="text-red-300"
        />
        <MetricCard
          title="Receita protegida"
          value={maskValue(formatCurrency(metricas.receitaProtegidaEstimada))}
          subtitle="Estimativa com recuperacao de 35%"
          accent="text-emerald-300"
        />
        <MetricCard
          title="Risco este mes"
          value={maskValue(formatCurrency(metricas.receitaMensalEmRisco))}
          subtitle="Mensalidade em clientes frageis"
          accent="text-amber-300"
        />
        <MetricCard
          title="Score medio"
          value={metricas.healthScoreMedio}
          subtitle="Saude media da base"
          accent="text-chm-accent"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-md border border-slate-800 bg-chm-card p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md bg-slate-950/65 p-5">
              <p className="text-sm text-chm-muted">Impacto anual se nada for feito</p>
              <p className="mt-3 text-3xl font-bold text-red-200">
                {maskValue(formatCurrency(metricas.impactoAnualEmRisco))}
              </p>
            </div>
            <div className="rounded-md bg-slate-950/65 p-5">
              <p className="text-sm text-chm-muted">Cancelamentos evitados potenciais</p>
              <p className="mt-3 text-3xl font-bold text-emerald-200">{cancelamentosEvitados}</p>
            </div>
            <div className="rounded-md bg-slate-950/65 p-5">
              <p className="text-sm text-chm-muted">Carteira ativa monitorada</p>
              <p className="mt-3 text-3xl font-bold text-white">{metricas.clientesAtivos}</p>
            </div>
          </div>

          <div className="mt-5 rounded-md border border-slate-800 bg-slate-950/45 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Prioridade da semana</h3>
                <p className="mt-1 text-sm text-chm-muted">
                  Recuperar clientes com score ate 60 protege receita antes de virar churn.
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-amber-200">{metricas.clientesEmRisco}</p>
                <p className="text-xs text-chm-muted">contatos</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-md border border-slate-800 bg-chm-card p-5">
          <h3 className="text-lg font-semibold">Causas provaveis</h3>
          <p className="text-sm text-chm-muted">Onde corrigir a operacao primeiro.</p>
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
      </div>
    </div>
  );
}
