import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { buscarMetricas, listarClientes } from '../api/clientesApi';
import HealthScoreBadge from '../components/HealthScoreBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import MetricCard from '../components/MetricCard';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function bucketClientes(clientes) {
  return {
    risco: clientes.filter((cliente) => cliente.healthScore < 40),
    atencao: clientes.filter((cliente) => cliente.healthScore >= 40 && cliente.healthScore <= 60),
    saudavel: clientes.filter((cliente) => cliente.healthScore > 60),
  };
}

export default function Dashboard() {
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
        setError('Não foi possível carregar o dashboard.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const buckets = useMemo(() => bucketClientes(clientes), [clientes]);
  const clientesPrioritarios = useMemo(
    () => [...clientes].sort((a, b) => a.healthScore - b.healthScore).slice(0, 5),
    [clientes]
  );

  if (loading) return <LoadingSpinner label="Carregando dashboard..." />;
  if (error) return <p className="text-center text-red-400">{error}</p>;

  return (
    <div className="space-y-7">
      <section className="rounded-md border border-slate-800/80 bg-slate-950/75 p-6 shadow-xl shadow-black/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-chm-accent">
              Bom ter você por aqui
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Como está sua carteira hoje</h2>
            <p className="mt-2 max-w-2xl text-sm text-chm-muted">
              Um resumo simples dos clientes que estão bem, dos que pedem atenção e de quem vale chamar agora.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/clientes"
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Ver clientes
            </Link>
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
          title="Receita ativa"
          value={formatCurrency(metricas.receitaMensalTotal)}
          subtitle="Contratos ativos"
          accent="text-emerald-300"
        />
        <MetricCard
          title="Clientes ativos"
          value={metricas.clientesAtivos}
          subtitle={`de ${metricas.totalClientes} cadastrados`}
        />
        <MetricCard
          title="Pedem atenção"
          value={metricas.clientesEmRisco}
          subtitle="Health score ate 60"
          accent="text-red-300"
        />
        <MetricCard
          title="Saúde média"
          value={metricas.healthScoreMedio}
          subtitle="Média geral da carteira"
          accent="text-chm-accent"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-md border border-slate-800 bg-chm-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Mapa da carteira</h3>
              <p className="text-sm text-chm-muted">Uma leitura rápida de quem precisa de presença.</p>
            </div>
            <span className="text-sm text-chm-muted">{clientes.length} clientes</span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-200">Risco</p>
              <p className="mt-3 text-3xl font-bold text-red-200">{buckets.risco.length}</p>
              <p className="mt-1 text-xs text-red-100/70">Vale chamar hoje</p>
            </div>
            <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Atenção</p>
              <p className="mt-3 text-3xl font-bold text-amber-200">{buckets.atencao.length}</p>
              <p className="mt-1 text-xs text-amber-100/70">Acompanhar de perto</p>
            </div>
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Saudável</p>
              <p className="mt-3 text-3xl font-bold text-emerald-200">{buckets.saudavel.length}</p>
              <p className="mt-1 text-xs text-emerald-100/70">Bom momento para fortalecer</p>
            </div>
          </div>
        </section>

        <section className="rounded-md border border-slate-800 bg-chm-card p-5">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Quem merece um toque</h3>
            <p className="text-sm text-chm-muted">Clientes com sinais mais frágeis agora.</p>
          </div>

          <div className="space-y-3">
            {clientesPrioritarios.length === 0 ? (
              <p className="rounded-md bg-slate-950/70 p-4 text-sm text-chm-muted">
                Nenhum cliente cadastrado.
              </p>
            ) : (
              clientesPrioritarios.map((cliente) => (
                <Link
                  key={cliente.id}
                  to="/clientes"
                  className="block rounded-md border border-slate-800 bg-slate-950/60 p-3 transition hover:border-chm-accent/70"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{cliente.nome}</p>
                      <p className="text-xs text-chm-muted">{cliente.telefone || 'Telefone não informado'}</p>
                    </div>
                    <HealthScoreBadge score={cliente.healthScore} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
