// Arquivo: frontend/src/pages/Tarefas.jsx
import { useEffect, useState } from 'react';
import { executarTarefa, listarTarefasPendentes } from '../api/tarefasApi';
import LoadingSpinner from '../components/LoadingSpinner';

function buildWhatsAppUrl(telefone, mensagem) {
  const phone = (telefone || '').replace(/\D/g, '');
  const base = 'https://api.whatsapp.com/send';
  const params = new URLSearchParams({
    phone,
    text: mensagem,
  });
  return `${base}?${params.toString()}`;
}

export default function Tarefas() {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadTarefas() {
    setLoading(true);
    setError('');
    try {
      const data = await listarTarefasPendentes();
      setTarefas(data);
    } catch (err) {
      setError('Não foi possível carregar as tarefas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTarefas();
  }, []);

  async function handleExecutar(tarefa) {
    const phone = (tarefa.clienteTelefone || '').replace(/\D/g, '');
    if (!phone) {
      alert('Telefone do cliente não informado.');
      return;
    }

    window.open(buildWhatsAppUrl(tarefa.clienteTelefone, tarefa.mensagemSugerida), '_blank', 'noopener,noreferrer');

    try {
      await executarTarefa(tarefa.id);
      setTarefas((prev) => prev.filter((item) => item.id !== tarefa.id));
    } catch (err) {
      console.error('Erro ao marcar tarefa como executada:', err);
    }
  }

  if (loading) return <LoadingSpinner label="Carregando tarefas..." />;
  if (error) return <p className="text-center text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Missões Ativas</h2>
        <p className="text-sm text-chm-muted">Copiloto de retenção via WhatsApp</p>
      </div>

      {tarefas.length === 0 ? (
        <div className="rounded-xl border border-slate-700/50 bg-chm-card p-12 text-center text-chm-muted">
          Nenhuma tarefa pendente no momento.
        </div>
      ) : (
        <div className="space-y-4">
          {tarefas.map((tarefa) => (
            <article
              key={tarefa.id}
              className="rounded-xl border border-slate-700/50 bg-chm-card p-6"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{tarefa.clienteNome}</h3>
                  <p className="text-sm text-chm-muted">
                    {tarefa.clienteTelefone || 'Telefone não informado'}
                  </p>
                </div>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300">
                  {tarefa.statusTarefa}
                </span>
              </div>

              <p className="mb-5 text-sm leading-relaxed text-slate-300">{tarefa.mensagemSugerida}</p>

              <button
                type="button"
                onClick={() => handleExecutar(tarefa)}
                className="inline-flex items-center gap-2 rounded-lg bg-chm-whatsapp px-5 py-3 text-sm font-medium text-white transition hover:bg-green-600"
              >
                Executar via WhatsApp
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
