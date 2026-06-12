import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const assistantTopics = [
  {
    label: 'Clientes em risco',
    path: '/clientes',
    keywords: ['cliente', 'clientes', 'risco', 'health', 'score', 'saude', 'carteira', 'mensalidade'],
    reply:
      'Para analisar clientes em risco, abra Clientes. La voce ve health score, motivo do risco, historico e mensagem sugerida.',
  },
  {
    label: 'Contatos',
    path: '/tarefas',
    keywords: ['contato', 'contatos', 'whatsapp', 'mensagem', 'tarefa', 'ligar', 'retencao'],
    reply:
      'Para acompanhar abordagens e mensagens, va para Contatos. Essa area ajuda a organizar quem precisa ser chamado primeiro.',
  },
  {
    label: 'Equipe',
    path: '/equipe',
    requires: 'team',
    keywords: ['equipe', 'usuario', 'usuarios', 'permissao', 'permissoes', 'funcionario', 'funcionarios', 'atendente', 'acesso'],
    reply:
      'Para criar usuarios, ajustar permissoes ou gerenciar funcionarios, use Equipe. Essa tela centraliza acessos e quadro operacional.',
  },
  {
    label: 'Executivo',
    path: '/executivo',
    requires: 'team',
    keywords: ['executivo', 'dono', 'gestor', 'receita', 'financeiro', 'indicador', 'indicadores', 'perda', 'impacto'],
    reply:
      'Para uma visao rapida de indicadores do dono ou gestor, va para Executivo. Ali ficam numeros principais e impacto financeiro.',
  },
  {
    label: 'Contratos',
    path: '/contratos',
    requires: 'team',
    keywords: ['contrato', 'contratos', 'cancelamento', 'cancelados', 'renovacao', 'renovacoes'],
    reply:
      'Para ver contratos novos, mantidos e cancelados, abra Contratos. Essa tela ajuda a enxergar movimento da carteira.',
  },
  {
    label: 'Insumos',
    path: '/insumos',
    requires: 'insumos',
    keywords: ['insumo', 'insumos', 'compra', 'compras', 'estoque', 'material', 'materiais', 'fornecedor'],
    reply:
      'Para controlar compras, estoque e itens importantes da operacao, va para Insumos.',
  },
  {
    label: 'Manutencao',
    path: '/manutencao',
    requires: 'manutencao',
    keywords: ['manutencao', 'equipamento', 'equipamentos', 'defeito', 'quebrado', 'reparo', 'tecnico'],
    reply:
      'Para registrar equipamentos com defeito e acompanhar reparos, va para Manutencao.',
  },
  {
    label: 'Feedback',
    path: '/feedback',
    requires: 'team',
    keywords: ['feedback', 'pesquisa', 'pesquisas', 'satisfacao', 'email', 'anonimo', 'anonima'],
    reply:
      'Para configurar pesquisas por e-mail e acompanhar respostas anonimas, abra Feedback.',
  },
  {
    label: 'Marca',
    path: '/configuracoes',
    requires: 'team',
    keywords: ['marca', 'logo', 'academia', 'nome', 'cor', 'branding', 'visual', 'tema'],
    reply:
      'Para alterar nome, logo e cor da academia, va para Marca.',
  },
];

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { canManageTeam, canManageInsumos, canManageManutencao, maskValue } = useAppContext();
  const [clientes, setClientes] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState([
    {
      role: 'assistant',
      text: 'Me pergunte onde encontrar algo ou como usar o CHM. Eu posso te levar direto para a area certa.',
    },
  ]);
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

  function canOpenTopic(topic) {
    if (topic.requires === 'team') return canManageTeam;
    if (topic.requires === 'insumos') return canManageInsumos;
    if (topic.requires === 'manutencao') return canManageManutencao;
    return true;
  }

  function answerAssistant(rawQuestion) {
    const question = normalizeText(rawQuestion);
    const topic = assistantTopics.find((item) =>
      item.keywords.some((keyword) => question.includes(keyword))
    );

    if (!topic) {
      return {
        text:
          'Ainda nao encontrei uma pagina exata para essa duvida. Posso ajudar melhor se voce citar clientes, equipe, insumos, manutencao, feedback, contratos ou marca.',
      };
    }

    if (!canOpenTopic(topic)) {
      return {
        text: `Essa area existe em ${topic.label}, mas seu acesso atual nao libera essa pagina. Peca para um gestor habilitar essa permissao em Equipe.`,
      };
    }

    return {
      text: `${topic.reply} Vou abrir essa pagina agora.`,
      path: topic.path,
    };
  }

  function handleAssistantSubmit(event) {
    event.preventDefault();
    const question = assistantInput.trim();
    if (!question) return;

    const answer = answerAssistant(question);
    setAssistantMessages((current) => [
      ...current,
      { role: 'user', text: question },
      { role: 'assistant', text: answer.text },
    ]);
    setAssistantInput('');

    if (answer.path) {
      window.setTimeout(() => navigate(answer.path), 650);
    }
  }

  function askAssistant(question) {
    const answer = answerAssistant(question);
    setAssistantMessages((current) => [
      ...current,
      { role: 'user', text: question },
      { role: 'assistant', text: answer.text },
    ]);

    if (answer.path) {
      window.setTimeout(() => navigate(answer.path), 650);
    }
  }

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
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Quem precisa de cuidado agora</h2>
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

      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        {assistantOpen && (
          <section className="w-[min(calc(100vw-2rem),390px)] rounded-md border border-slate-800 bg-chm-card shadow-2xl shadow-black/30">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-chm-accent text-lg font-black text-white">
                  IA
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold">Assistente CHM</h3>
                  <p className="truncate text-xs text-chm-muted">Posso te levar para a tela certa.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssistantOpen(false)}
                aria-label="Fechar assistente"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-700 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                X
              </button>
            </div>

            <div className="max-h-72 space-y-3 overflow-y-auto p-4">
              {assistantMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[92%] rounded-md px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'ml-auto bg-chm-accent text-white'
                      : 'border border-blue-500/20 bg-blue-500/10 text-slate-200'
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {['Ver clientes em risco', 'Criar usuario', 'Configurar feedback'].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => askAssistant(prompt)}
                    className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <form onSubmit={handleAssistantSubmit} className="flex gap-2">
                <input
                  value={assistantInput}
                  onChange={(event) => setAssistantInput(event.target.value)}
                  className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                  placeholder="Digite sua duvida"
                />
                <button
                  type="submit"
                  className="rounded-md bg-chm-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                >
                  Enviar
                </button>
              </form>
            </div>
          </section>
        )}

        {!assistantOpen && (
          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            className="group flex items-center gap-3 rounded-full border border-slate-800 bg-chm-card px-3 py-2 shadow-2xl shadow-black/25 transition hover:-translate-y-0.5 hover:border-chm-accent"
            aria-label="Abrir assistente CHM"
          >
            <span className="hidden max-w-[180px] text-left text-xs font-medium text-slate-200 sm:block">
              Precisa de ajuda?
            </span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-chm-accent text-sm font-black text-white">
              IA
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
