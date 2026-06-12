import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../api/authApi';
import { verificarSessao } from '../api/authSessionApi';
import { buscarBrandingEmpresa } from '../api/empresaApi';

const navClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
    isActive ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
  }`;

export default function Layout() {
  const navigate = useNavigate();
  const [branding, setBranding] = useState({
    nomeComercial: 'CHM',
    logoUrl: '',
    corPrimaria: '#4f8cff',
  });
  const [session, setSession] = useState(null);
  const [valuesHidden, setValuesHidden] = useState(
    () => window.localStorage.getItem('chm_values_hidden') === 'true'
  );
  const [hotbarOpen, setHotbarOpen] = useState(
    () => window.localStorage.getItem('chm_hotbar_open') !== 'false'
  );

  const canManageTeam = session?.papel === 'GESTOR';
  const canManageInsumos = canManageTeam || Boolean(session?.podeGerenciarInsumos);
  const canManageManutencao = canManageTeam || Boolean(session?.podeGerenciarManutencao);
  const canViewFinancials = Boolean(session?.podeVerFinanceiro);

  useEffect(() => {
    let active = true;

    verificarSessao()
      .then((data) => {
        if (active) setSession(data);
      })
      .catch(() => {
        if (active) setSession(null);
      });

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

    window.addEventListener('chm:branding-updated', handleBrandingUpdated);
    return () => {
      active = false;
      window.removeEventListener('chm:branding-updated', handleBrandingUpdated);
    };
  }, []);

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

  function maskValue(value) {
    if (!canViewFinancials || valuesHidden) return 'Oculto';
    return value;
  }

  const navItems = [
    { to: '/dashboard', label: 'Inicio', mark: 'IN', allowed: true },
    { to: '/executivo', label: 'Executivo', mark: 'EX', allowed: canManageTeam },
    { to: '/clientes', label: 'Clientes', mark: 'CL', allowed: true },
    { to: '/contratos', label: 'Contratos', mark: 'CT', allowed: canManageTeam },
    { to: '/tarefas', label: 'Contatos', mark: 'CO', allowed: true },
    { to: '/equipe', label: 'Equipe', mark: 'EQ', allowed: canManageTeam },
    { to: '/funcionarios', label: 'Funcionarios', mark: 'FN', allowed: canManageTeam },
    { to: '/insumos', label: 'Insumos', mark: 'IS', allowed: canManageInsumos },
    { to: '/manutencao', label: 'Manutencao', mark: 'MT', allowed: canManageManutencao },
    { to: '/feedback', label: 'Feedback', mark: 'FB', allowed: canManageTeam },
    { to: '/configuracoes', label: 'Marca', mark: 'MA', allowed: canManageTeam },
  ].filter((item) => item.allowed);

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <nav className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={toggleHotbar}
              title={hotbarOpen ? 'Ocultar hotbar' : 'Abrir hotbar'}
              aria-label={hotbarOpen ? 'Ocultar hotbar' : 'Abrir hotbar'}
              className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-md border border-slate-700 px-3 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white sm:h-10"
            >
              {hotbarOpen ? 'X' : 'Menu'}
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
              <h1 className="max-w-[180px] truncate text-base font-bold tracking-tight sm:max-w-[260px] sm:text-lg">
                {branding.nomeComercial || 'CHM'}
              </h1>
              <p className="truncate text-xs text-chm-muted">Acompanhe clientes com mais cuidado</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
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
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900 text-[11px] font-black">
                    {item.mark}
                  </span>
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </aside>
        </>
      )}

      <main className={`mx-auto max-w-7xl px-3 py-4 transition-[padding] sm:px-5 sm:py-6 lg:px-8 ${hotbarOpen ? 'lg:pl-72' : ''}`}>
        <Outlet context={{ session, canManageTeam, canManageInsumos, canManageManutencao, canViewFinancials, valuesHidden, maskValue }} />
      </main>
    </div>
  );
}
