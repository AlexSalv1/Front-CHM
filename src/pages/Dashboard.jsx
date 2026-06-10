// Arquivo: frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { buscarMetricas, listarClientes } from '../api/clientesApi';
import HealthScoreBadge, { getHealthScoreStyle } from '../components/HealthScoreBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import MetricCard from '../components/MetricCard';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
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

  if (loading) return <LoadingSpinner label="Carregando dashboard..." />;
  if (error) return <p className="text-center text-red-400">{error}</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-chm-muted">Visão financeira e saúde dos clientes</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Receita Mensal (Ativos)"
          value={formatCurrency(metricas.receitaMensalTotal)}
          subtitle="Soma das mensalidades ativas"
          accent="text-emerald-400"
        />
        <MetricCard
          title="Clientes Ativos"
          value={metricas.clientesAtivos}
          subtitle={`de ${metricas.totalClientes} cadastrados`}
        />
        <MetricCard
          title="Clientes em Risco"
          value={metricas.clientesEmRisco}
          subtitle="Health Score abaixo de 40"
          accent="text-red-400"
        />
        <MetricCard
          title="Health Score Médio"
          value={metricas.healthScoreMedio}
          subtitle="Média geral da carteira"
          accent="text-chm-accent"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-chm-card">
        <div className="border-b border-slate-700/50 px-6 py-4">
          <h3 className="font-semibold">Clientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-900/50 text-chm-muted">
              <tr>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Health Score</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Mensalidade</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-chm-muted">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => {
                  const style = getHealthScoreStyle(cliente.healthScore);
                  return (
                    <tr key={cliente.id} className={`border-t border-slate-700/40 ${style.row}`}>
                      <td className="px-6 py-4 font-medium">{cliente.nome}</td>
                      <td className="px-6 py-4">
                        <HealthScoreBadge score={cliente.healthScore} />
                      </td>
                      <td className="px-6 py-4 text-chm-muted">{cliente.statusContrato}</td>
                      <td className="px-6 py-4">{formatCurrency(cliente.valorMensalidade)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
