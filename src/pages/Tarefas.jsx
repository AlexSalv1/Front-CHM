import { useEffect, useMemo, useState } from 'react';
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
  const [query, setQuery] = useState('');

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

  const filteredTarefas = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return tarefas;
    return tarefas.filter((tarefa) =>
      [tarefa.clienteNome, tarefa.clienteTelefone, tarefa.mensagemSugerida]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search))
    );
  }, [query, tarefas]);

  async function handleExecutar(tarefa) {
    const phone = (tarefa.clienteTelefone || '').replace(/\D/g, '');
    if (!phone) {
      setError('Telefone do cliente não informado.');
      return;
    }

    window.open(buildWhatsAppUrl(tarefa.clienteTelefone, tarefa.mensagemSugerida), '_blank', 'noopener,noreferrer');

    try {
      await executarTarefa(tarefa.id);
      setTarefas((prev) => prev.filter((item) => item.id !== tarefa.id));
    } catch (err) {
      setError('A mensagem foi aberta, mas não foi possível marcar a tarefa como executada.');
    }
  }

  if (loading) return <LoadingSpinner label="Carregando tarefas..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-chm-accent">Contatos</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Conversas que valem acontecer</h2>
          <p className="mt-1 text-sm text-chm-muted">Mensagens prontas para retomar contato com quem precisa de cuidado.</p>
        </div>
        <button
          type="button"
          onClick={loadTarefas}
          className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
        >
          Atualizar lista
        </button>
      </div>

      <section className="rounded-md border border-slate-800/80 bg-chm-card/95 shadow-xl shadow-black/10">
        <div className="grid gap-3 border-b border-slate-800 p-4 lg:grid-cols-[minmax(0,1fr)_160px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-chm-accent"
            placeholder="Buscar cliente, telefone ou mensagem"
          />
          <div className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-chm-muted">
            {filteredTarefas.length} para fazer
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {filteredTarefas.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg font-semibold">Tudo em dia por aqui</p>
            <p className="mt-2 text-sm text-chm-muted">Nenhum contato pendente para os filtros atuais.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredTarefas.map((tarefa) => (
              <article key={tarefa.id} className="grid gap-4 p-5 lg:grid-cols-[220px_minmax(0,1fr)_180px]">
                <div>
                  <h3 className="font-semibold">{tarefa.clienteNome}</h3>
                  <p className="mt-1 text-sm text-chm-muted">
                    {tarefa.clienteTelefone || 'Telefone não informado'}
                  </p>
                  <span className="mt-3 inline-flex rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-200">
                    {tarefa.statusTarefa}
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-slate-300">{tarefa.mensagemSugerida}</p>

                <div className="flex items-start justify-end">
                  <button
                    type="button"
                    onClick={() => handleExecutar(tarefa)}
                    className="w-full rounded-md bg-chm-whatsapp px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 lg:w-auto"
                  >
                    Enviar WhatsApp
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
