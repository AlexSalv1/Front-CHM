import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../api/authApi';
import { verificarSessao } from '../api/authSessionApi';
import { buscarBrandingEmpresa } from '../api/empresaApi';

const assistantTopics = [
  {
    label: 'Clientes em risco',
    path: '/clientes',
    keywords: ['cliente', 'clientes', 'risco', 'health', 'score', 'saude', 'carteira', 'mensalidade'],
    reply:
      'Para analisar clientes em risco, abra Clientes. Lá você vê health score, motivo do risco, histórico e mensagem sugerida.',
  },
  {
    label: 'Contatos',
    path: '/tarefas',
    keywords: ['contato', 'contatos', 'whatsapp', 'mensagem', 'tarefa', 'ligar', 'retencao'],
    reply:
      'Para acompanhar abordagens e mensagens, vá para Contatos. Essa área ajuda a organizar quem precisa ser chamado primeiro.',
  },
  {
    label: 'Equipe',
    path: '/equipe',
    requires: 'team',
    keywords: ['equipe', 'usuario', 'usuarios', 'permissao', 'permissoes', 'funcionario', 'funcionarios', 'atendente', 'acesso'],
    reply:
      'Para criar usuários, ajustar permissões ou gerenciar funcionários, use Equipe. Essa tela centraliza acessos e quadro operacional.',
  },
  {
    label: 'Executivo',
    path: '/executivo',
    requires: 'team',
    keywords: ['executivo', 'dono', 'gestor', 'receita', 'financeiro', 'indicador', 'indicadores', 'perda', 'impacto'],
    reply:
      'Para uma visão rápida de indicadores do dono ou gestor, vá para Executivo. Ali ficam números principais e impacto financeiro.',
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
    reply: 'Para controlar compras, estoque e itens importantes da operação, vá para Insumos.',
  },
  {
    label: 'Manutenção',
    path: '/manutencao',
    requires: 'manutencao',
    keywords: ['manutencao', 'equipamento', 'equipamentos', 'defeito', 'quebrado', 'reparo', 'tecnico'],
    reply: 'Para registrar equipamentos com defeito e acompanhar reparos, vá para Manutenção.',
  },
  {
    label: 'Feedback',
    path: '/feedback',
    requires: 'team',
    keywords: ['feedback', 'pesquisa', 'pesquisas', 'satisfacao', 'email', 'anonimo', 'anonima'],
    reply: 'Para configurar pesquisas por e-mail e acompanhar respostas anônimas, abra Feedback.',
  },
  {
    label: 'Marca',
    path: '/configuracoes',
    requires: 'team',
    keywords: ['marca', 'logo', 'academia', 'nome', 'cor', 'branding', 'visual', 'tema'],
    reply: 'Para alterar nome, logo e cor da academia, vá para Marca.',
  },
];

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const navClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'border-chm-accent/35 bg-chm-accent/12 text-white shadow-lg shadow-black/10'
      : 'border-transparent text-slate-300 hover:border-slate-700 hover:bg-white/5 hover:text-white'
  }`;

const hotbarMotionClass =
  'transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]';

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
  const location = useLocation();
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
      text: 'Oi, eu sou o assistente CHM. Se tiver dúvida, eu te levo para a tela certa.',
    },
  ]);
  const [valuesHidden, setValuesHidden] = useState(
    () => window.localStorage.getItem('chm_values_hidden') === 'true'
  );
  const [hotbarOpen, setHotbarOpen] = useState(
    () => window.localStorage.getItem('chm_hotbar_open') !== 'false'
  );

  const canManageTeam = session?.papel === 'GESTOR';
  const isSuperAdmin = Boolean(session?.superAdmin);
  const canManageInsumos = Boolean(session?.podeGerenciarInsumos);
  const canManageManutencao = Boolean(session?.podeGerenciarManutencao);
  const canViewFinancials = Boolean(session?.podeVerFinanceiro);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === 'light' ? 'light' : 'dark';
    window.localStorage.setItem('chm_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (session?.superAdmin && !location.pathname.startsWith('/admin')) {
      navigate('/admin/assinaturas', { replace: true });
    }
  }, [location.pathname, navigate, session?.superAdmin]);

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
          'Ainda não encontrei uma página exata para essa dúvida. Tente citar clientes, equipe, insumos, manutenção, feedback, contratos ou marca.',
      };
    }

    if (!canOpenTopic(topic)) {
      return {
        text: `Essa área existe em ${topic.label}, mas seu acesso atual não libera essa página. Peça para um gestor habilitar essa permissão em Equipe.`,
      };
    }

    return {
      text: `${topic.reply} Vou abrir essa página agora.`,
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

  const navItems = (
    isSuperAdmin
      ? [
          { to: '/admin/assinaturas', label: 'Assinaturas', icon: 'contratos', allowed: true },
        ]
      : [
          { to: '/dashboard', label: 'Início', icon: 'dashboard', allowed: true },
          { to: '/executivo', label: 'Executivo', icon: 'executivo', allowed: canManageTeam },
          { to: '/clientes', label: 'Clientes', icon: 'clientes', allowed: true },
          { to: '/contratos', label: 'Contratos', icon: 'contratos', allowed: canManageTeam },
          { to: '/tarefas', label: 'Contatos', icon: 'contatos', allowed: true },
          { to: '/equipe', label: 'Equipe', icon: 'equipe', allowed: canManageTeam },
          { to: '/insumos', label: 'Insumos', icon: 'insumos', allowed: canManageInsumos },
          { to: '/manutencao', label: 'Manutenção', icon: 'manutencao', allowed: canManageManutencao },
          { to: '/feedback', label: 'Feedback', icon: 'feedback', allowed: canManageTeam },
          { to: '/configuracoes', label: 'Marca', icon: 'marca', allowed: canManageTeam },
        ]
  ).filter((item) => item.allowed);

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <nav className="sticky top-0 z-30 border-b border-white/8 bg-slate-950/88 backdrop-blur-xl lg:fixed lg:inset-x-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`${hotbarMotionClass} ${
                hotbarOpen
                  ? 'pointer-events-none w-0 -translate-x-3 opacity-0'
                  : 'pointer-events-auto w-9 translate-x-0 opacity-100 sm:w-[78px]'
              } overflow-hidden`}
            >
              <button
                type="button"
                onClick={toggleHotbar}
                title="Abrir hotbar"
                aria-label="Abrir hotbar"
                className="chm-action h-9 w-9 shrink-0 px-0 sm:h-10 sm:w-auto sm:px-3"
              >
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
              </button>
            </div>
            <div
              className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm font-black text-white shadow-lg shadow-black/20 ${hotbarMotionClass} ${
                hotbarOpen ? 'h-10 w-10 translate-x-0 sm:h-11 sm:w-11' : 'h-9 w-9 sm:h-10 sm:w-10'
              }`}
              style={{ backgroundColor: branding.corPrimaria || '#4f8cff' }}
            >
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                (branding.nomeComercial || 'CH').slice(0, 2).toUpperCase()
              )}
            </div>
            <div className={`min-w-0 ${hotbarMotionClass} ${hotbarOpen ? 'sm:pl-1' : ''}`}>
              <h1
                className={`truncate text-base font-bold tracking-tight text-white ${hotbarMotionClass} sm:text-lg ${
                  hotbarOpen ? 'max-w-[180px] sm:max-w-[320px]' : 'max-w-[140px] sm:max-w-[260px]'
                }`}
              >
                {branding.nomeComercial || 'CHM'}
              </h1>
              <p className="hidden truncate text-xs text-chm-muted min-[420px]:block">
                Acompanhe clientes com mais cuidado
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              className="chm-action h-9 w-9 p-0"
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
                className="chm-action h-9 w-9 p-0 text-xs font-bold"
              >
                {valuesHidden ? '--' : 'R$'}
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="chm-action shrink-0 px-3 py-2 text-sm font-medium"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      <>
        <button
          type="button"
          aria-label="Fechar hotbar"
          onClick={toggleHotbar}
          className={`fixed inset-0 z-30 bg-black/45 backdrop-blur-[1px] lg:hidden ${hotbarMotionClass} ${
            hotbarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />
        <aside
          className={`fixed left-0 top-[65px] z-40 flex max-h-[calc(100vh-65px)] w-72 flex-col border-r border-white/8 bg-slate-950/96 p-3 shadow-2xl shadow-black/30 sm:top-[73px] sm:max-h-[calc(100vh-73px)] lg:top-[73px] lg:z-20 lg:h-[calc(100vh-73px)] lg:max-h-none lg:w-64 lg:bg-slate-950/88 lg:shadow-none ${hotbarMotionClass} ${
            hotbarOpen
              ? 'pointer-events-auto translate-x-0 opacity-100'
              : 'pointer-events-none -translate-x-full opacity-0 lg:-translate-x-6'
          }`}
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-chm-muted">Hotbar</p>
            <button
              type="button"
              onClick={toggleHotbar}
              title="Ocultar hotbar"
              aria-label="Ocultar hotbar"
              className="chm-action h-8 w-8 p-0 text-sm font-bold"
            >
              X
            </button>
          </div>
          <div className={`space-y-1 overflow-y-auto pr-1 ${hotbarMotionClass} ${hotbarOpen ? 'opacity-100 delay-75' : 'opacity-0'}`}>
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
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/5">
                  <HotbarIcon name={item.icon} />
                </span>
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </aside>
      </>

      <main className={`mx-auto max-w-7xl px-3 py-4 ${hotbarMotionClass} sm:px-5 sm:py-6 lg:px-8 lg:pt-[97px] ${hotbarOpen ? 'lg:pl-72' : ''}`}>
        {session?.assinaturaBloqueada && !isSuperAdmin ? (
          <section className="chm-surface-strong mx-auto max-w-2xl p-6 text-center">
            <p className="chm-kicker">Assinatura bloqueada</p>
            <h2 className="mt-3 text-2xl font-bold text-chm-text">Acesso temporariamente indisponível</h2>
            <p className="mt-3 text-sm leading-6 text-chm-muted">
              A assinatura da empresa está bloqueada. Regularize o pagamento para liberar novamente o dashboard,
              clientes, equipe e relatórios.
            </p>
            <button type="button" onClick={handleLogout} className="chm-action-primary mt-6 px-5 py-2.5">
              Sair
            </button>
          </section>
        ) : (
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
        )}
      </main>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        {assistantOpen && (
          <section className="chm-surface w-[min(calc(100vw-2rem),390px)]">
            <div className="flex items-start justify-between gap-3 border-b border-white/8 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src="/assistant-bot.svg"
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-lg object-cover shadow-lg shadow-black/20"
                />
                <div className="min-w-0">
                  <h3 className="font-semibold text-chm-text">Assistente CHM</h3>
                  <p className="truncate text-xs text-chm-muted">Posso te ajudar com o sistema.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssistantOpen(false)}
                aria-label="Fechar assistente"
                className="chm-action h-8 w-8 shrink-0 p-0 text-sm font-bold"
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
                      : 'border border-blue-500/20 bg-blue-500/10 text-chm-text'
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>

            <div className="border-t border-white/8 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {['Ver clientes em risco', 'Criar usuário', 'Configurar feedback'].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => askAssistant(prompt)}
                    className="chm-action rounded-md px-2.5 py-1.5 text-xs font-semibold"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <form onSubmit={handleAssistantSubmit} className="flex gap-2">
                <input
                  value={assistantInput}
                  onChange={(event) => setAssistantInput(event.target.value)}
                  className="chm-field min-w-0 flex-1"
                  placeholder="Digite sua dúvida"
                />
                <button
                  type="submit"
                  className="chm-action-primary px-3 py-2"
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
            className="group flex items-center gap-3 rounded-full border border-white/8 bg-slate-950/90 px-3 py-2 shadow-2xl shadow-black/25 transition hover:-translate-y-0.5 hover:border-chm-accent"
            aria-label="Abrir assistente CHM"
          >
            <span
              className={`hidden overflow-hidden whitespace-nowrap text-left text-xs font-medium text-slate-200 transition-all duration-500 sm:block ${
                assistantHintVisible ? 'max-w-[180px] opacity-100' : 'max-w-0 opacity-0'
              }`}
            >
              Alguma dúvida?
            </span>
            <img
              src="/assistant-bot.svg"
              alt=""
              className="h-12 w-12 rounded-full object-cover shadow-lg shadow-black/20"
            />
          </button>
        )}
      </div>
    </div>
  );
}
