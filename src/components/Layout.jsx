import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../api/authApi';
import { verificarSessao } from '../api/authSessionApi';
import { buscarBrandingEmpresa } from '../api/empresaApi';

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
    reply: 'Para controlar compras, estoque e itens importantes da operacao, va para Insumos.',
  },
  {
    label: 'Manutencao',
    path: '/manutencao',
    requires: 'manutencao',
    keywords: ['manutencao', 'equipamento', 'equipamentos', 'defeito', 'quebrado', 'reparo', 'tecnico'],
    reply: 'Para registrar equipamentos com defeito e acompanhar reparos, va para Manutencao.',
  },
  {
    label: 'Feedback',
    path: '/feedback',
    requires: 'team',
    keywords: ['feedback', 'pesquisa', 'pesquisas', 'satisfacao', 'email', 'anonimo', 'anonima'],
    reply: 'Para configurar pesquisas por e-mail e acompanhar respostas anonimas, abra Feedback.',
  },
  {
    label: 'Marca',
    path: '/configuracoes',
    requires: 'team',
    keywords: ['marca', 'logo', 'academia', 'nome', 'cor', 'branding', 'visual', 'tema'],
    reply: 'Para alterar nome, logo e cor da academia, va para Marca.',
  },
];

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const navClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
    isActive ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
  }`;

function HotbarIcon({ name }) {
  const common = {
    className: 'h-4 w-4',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  };

  const icons = {
    dashboard: (
      <svg {...common}>
        <path d="M4 13h6V4H4z" />
        <path d="M14 20h6V4h-6z" />
        <path d="M4 20h6v-3H4z" />
      </svg>
    ),
    executivo: (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 4-4 3 3 5-7" />
      </svg>
    ),
    clientes: (
      <svg {...common}>
        <path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4" />
        <path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M19 18c0-1.4-.8-2.6-2-3.2" />
        <path d="M17 7.2a2.5 2.5 0 0 1 0 4.6" />
      </svg>
    ),
    contratos: (
      <svg {...common}>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h5" />
        <path d="M10 13h6" />
        <path d="M10 17h4" />
      </svg>
    ),
    contatos: (
      <svg {...common}>
        <path d="M5 6h14v10H8l-3 3z" />
        <path d="M8 10h8" />
        <path d="M8 13h5" />
      </svg>
    ),
    equipe: (
      <svg {...common}>
        <path d="M8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M16 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M3 20c0-2.5 2.2-4.5 5-4.5" />
        <path d="M21 20c0-2.5-2.2-4.5-5-4.5" />
      </svg>
    ),
    funcionarios: (
      <svg {...common}>
        <path d="M9 7a3 3 0 1 0 6 0 3 3 0 0 0-6 0z" />
        <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
        <path d="M9 15h6" />
      </svg>
    ),
    insumos: (
      <svg {...common}>
        <path d="M4 8h16l-2 12H6z" />
        <path d="M8 8a4 4 0 0 1 8 0" />
        <path d="M9 13h6" />
      </svg>
    ),
    manutencao: (
      <svg {...common}>
        <path d="m14 7 3-3 3 3-3 3z" />
        <path d="M14 7 5 16l-1 4 4-1 9-9" />
        <path d="M12 9 9 6" />
      </svg>
    ),
    feedback: (
      <svg {...common}>
        <path d="M5 5h14v10H8l-3 4z" />
        <path d="M9 9h6" />
        <path d="M9 12h4" />
      </svg>
    ),
    marca: (
      <svg {...common}>
        <path d="M12 3 4 7v10l8 4 8-4V7z" />
        <path d="M12 3v18" />
        <path d="m4 7 8 4 8-4" />
      </svg>
    ),
  };

  return icons[name] || icons.dashboard;
}

export default function Layout() {
  const navigate = useNavigate();
  const [branding, setBranding] = useState({
    nomeComercial: 'CHM',
    logoUrl: '',
    corPrimaria: '#4f8cff',
  });
  const [session, setSession] = useState(null);
  const [theme, setTheme] = useState(
    () => window.localStorage.getItem('chm_theme') || 'dark'
  );
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantHintVisible, setAssistantHintVisible] = useState(true);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantMessages, setAssistantMessages] = useState([
    {
      role: 'assistant',
      text: 'Oi, eu sou o assistente CHM. Se tiver duvida, eu te levo para a tela certa.',
    },
  ]);
  const [valuesHidden, setValuesHidden] = useState(
    () => window.localStorage.getItem('chm_values_hidden') === 'true'
  );
  const [hotbarOpen, setHotbarOpen] = useState(
    () => window.localStorage.getItem('chm_hotbar_open') !== 'false'
  );

  const canManageTeam = session?.papel === 'GESTOR';
  const canManageInsumos = Boolean(session?.podeGerenciarInsumos);
  const canManageManutencao = Boolean(session?.podeGerenciarManutencao);
  const canViewFinancials = Boolean(session?.podeVerFinanceiro);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === 'light' ? 'light' : 'dark';
    window.localStorage.setItem('chm_theme', theme);
  }, [theme]);

  useEffect(() => {
    const hintTimer = window.setTimeout(() => {
      setAssistantHintVisible(false);
    }, 6500);

    return () => window.clearTimeout(hintTimer);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSession(redirectOnFailure = true) {
      try {
        const data = await verificarSessao();
        if (active) setSession(data);
        return data;
      } catch (err) {
        if (active) {
          setSession(null);
          if (redirectOnFailure) navigate('/login', { replace: true });
        }
        return null;
      }
    }

    loadSession(false);

    buscarBrandingEmpresa()
      .then((data) => {
        if (active) setBranding(data);
      })
      .catch(() => {
        if (active) {
          setBranding({
            nomeComercial: 'CHM',
            logoUrl: '',
            corPrimaria: '#4f8cff',
          });
        }
      });

    function handleBrandingUpdated(event) {
      setBranding(event.detail);
    }

    function refreshWhenVisible() {
      if (!document.hidden) loadSession();
    }

    const sessionInterval = window.setInterval(() => {
      loadSession();
    }, 30000);

    window.addEventListener('chm:branding-updated', handleBrandingUpdated);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(sessionInterval);
      window.removeEventListener('chm:branding-updated', handleBrandingUpdated);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [navigate]);

  async function refreshSession() {
    try {
      const data = await verificarSessao();
      setSession(data);
      return data;
    } catch (err) {
      setSession(null);
      navigate('/login', { replace: true });
      return null;
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  }

  function toggleValuesHidden() {
    setValuesHidden((current) => {
      const next = !current;
      window.localStorage.setItem('chm_values_hidden', String(next));
      return next;
    });
  }

  function toggleHotbar() {
    setHotbarOpen((current) => {
      const next = !current;
      window.localStorage.setItem('chm_hotbar_open', String(next));
      return next;
    });
  }

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  function maskValue(value) {
    if (!canViewFinancials || valuesHidden) return 'Oculto';
    return value;
  }

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
          'Ainda nao encontrei uma pagina exata para essa duvida. Tente citar clientes, equipe, insumos, manutencao, feedback, contratos ou marca.',
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

  function askAssistant(question) {
    const answer = answerAssistant(question);
    setAssistantOpen(true);
    setAssistantHintVisible(false);
    setAssistantMessages((current) => [
      ...current,
      { role: 'user', text: question },
      { role: 'assistant', text: answer.text },
    ]);

    if (answer.path) {
      window.setTimeout(() => navigate(answer.path), 650);
    }
  }

  function handleAssistantSubmit(event) {
    event.preventDefault();
    const question = assistantInput.trim();
    if (!question) return;

    askAssistant(question);
    setAssistantInput('');
  }

  const navItems = [
    { to: '/dashboard', label: 'Inicio', icon: 'dashboard', allowed: true },
    { to: '/executivo', label: 'Executivo', icon: 'executivo', allowed: canManageTeam },
    { to: '/clientes', label: 'Clientes', icon: 'clientes', allowed: true },
    { to: '/contratos', label: 'Contratos', icon: 'contratos', allowed: canManageTeam },
    { to: '/tarefas', label: 'Contatos', icon: 'contatos', allowed: true },
    { to: '/equipe', label: 'Equipe', icon: 'equipe', allowed: canManageTeam },
    { to: '/insumos', label: 'Insumos', icon: 'insumos', allowed: canManageInsumos },
    { to: '/manutencao', label: 'Manutencao', icon: 'manutencao', allowed: canManageManutencao },
    { to: '/feedback', label: 'Feedback', icon: 'feedback', allowed: canManageTeam },
    { to: '/configuracoes', label: 'Marca', icon: 'marca', allowed: canManageTeam },
  ].filter((item) => item.allowed);

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <nav className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/92 backdrop-blur lg:fixed lg:inset-x-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={toggleHotbar}
              title={hotbarOpen ? 'Ocultar hotbar' : 'Abrir hotbar'}
              aria-label={hotbarOpen ? 'Ocultar hotbar' : 'Abrir hotbar'}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-700 text-slate-300 transition hover:bg-slate-800 hover:text-white sm:h-10 sm:w-auto sm:px-3"
            >
              {hotbarOpen ? (
                <span className="font-bold">X</span>
              ) : (
                <>
                  <svg
                    className="h-4 w-4 sm:mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h16" />
                  </svg>
                  <span className="hidden font-bold sm:inline">Menu</span>
                </>
              )}
            </button>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md text-sm font-black text-white sm:h-10 sm:w-10"
              style={{ backgroundColor: branding.corPrimaria || '#4f8cff' }}
            >
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                (branding.nomeComercial || 'CH').slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <h1 className="max-w-[120px] truncate text-base font-bold tracking-tight sm:max-w-[260px] sm:text-lg">
                {branding.nomeComercial || 'CHM'}
              </h1>
              <p className="hidden truncate text-xs text-chm-muted min-[420px]:block">Acompanhe clientes com mais cuidado</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              {theme === 'dark' ? (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3v2" />
                  <path d="M12 19v2" />
                  <path d="M5 5l1.5 1.5" />
                  <path d="M17.5 17.5 19 19" />
                  <path d="M3 12h2" />
                  <path d="M19 12h2" />
                  <path d="M5 19l1.5-1.5" />
                  <path d="M17.5 6.5 19 5" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z" />
                </svg>
              )}
            </button>
            {canViewFinancials && (
              <button
                type="button"
                onClick={toggleValuesHidden}
                title={valuesHidden ? 'Mostrar valores' : 'Ocultar valores'}
                aria-label={valuesHidden ? 'Mostrar valores' : 'Ocultar valores'}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                {valuesHidden ? '--' : 'R$'}
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      {hotbarOpen && (
        <>
          <button
            type="button"
            aria-label="Fechar hotbar"
            onClick={toggleHotbar}
            className="fixed inset-0 z-30 bg-black/45 lg:hidden"
          />
          <aside className="fixed left-0 top-[65px] z-40 flex max-h-[calc(100vh-65px)] w-72 flex-col border-r border-slate-800 bg-slate-950/98 p-3 shadow-2xl shadow-black/40 sm:top-[73px] sm:max-h-[calc(100vh-73px)] lg:top-[73px] lg:z-20 lg:h-[calc(100vh-73px)] lg:max-h-none lg:w-64 lg:bg-slate-950/92 lg:shadow-none">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-chm-muted">Hotbar</p>
              <button
                type="button"
                onClick={toggleHotbar}
                title="Ocultar hotbar"
                aria-label="Ocultar hotbar"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                X
              </button>
            </div>
            <div className="space-y-1 overflow-y-auto pr-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={navClass}
                  onClick={() => {
                    if (window.innerWidth < 1024) setHotbarOpen(false);
                  }}
                  title={item.label}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900">
                    <HotbarIcon name={item.icon} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </aside>
        </>
      )}

      <main className={`mx-auto max-w-7xl px-3 py-4 transition-[padding] sm:px-5 sm:py-6 lg:px-8 lg:pt-[97px] ${hotbarOpen ? 'lg:pl-72' : ''}`}>
        <Outlet
          context={{
            session,
            theme,
            setTheme,
            canManageTeam,
            canManageInsumos,
            canManageManutencao,
            canViewFinancials,
            valuesHidden,
            maskValue,
            refreshSession,
          }}
        />
      </main>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        {assistantOpen && (
          <section className="w-[min(calc(100vw-2rem),390px)] rounded-md border border-slate-800 bg-chm-card shadow-2xl shadow-black/30">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src="/assistant-bot.svg"
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0">
                  <h3 className="font-semibold">Assistente CHM</h3>
                  <p className="truncate text-xs text-chm-muted">Posso te ajudar com o sistema.</p>
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
            onClick={() => {
              setAssistantOpen(true);
              setAssistantHintVisible(false);
            }}
            className="group flex items-center gap-3 rounded-full border border-slate-800 bg-chm-card px-3 py-2 shadow-2xl shadow-black/25 transition hover:-translate-y-0.5 hover:border-chm-accent"
            aria-label="Abrir assistente CHM"
          >
            <span
              className={`hidden overflow-hidden whitespace-nowrap text-left text-xs font-medium text-slate-200 transition-all duration-500 sm:block ${
                assistantHintVisible ? 'max-w-[180px] opacity-100' : 'max-w-0 opacity-0'
              }`}
            >
              Alguma duvida?
            </span>
            <img
              src="/assistant-bot.svg"
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
          </button>
        )}
      </div>
    </div>
  );
}
