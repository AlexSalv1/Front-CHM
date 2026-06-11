import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../api/authApi';
import { verificarSessao } from '../api/authSessionApi';
import { buscarBrandingEmpresa } from '../api/empresaApi';

const navClass = ({ isActive }) =>
  `shrink-0 rounded-md px-3 py-2 text-sm font-medium transition ${
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

  const canManageTeam = session?.papel === 'GESTOR';
  const canManageInsumos = Boolean(session?.podeGerenciarInsumos);
  const canManageManutencao = Boolean(session?.podeGerenciarManutencao);
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

  function maskValue(value) {
    if (!canViewFinancials || valuesHidden) return 'Oculto';
    return value;
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <nav className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
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
          <div className="-mx-3 flex items-center gap-2 overflow-x-auto px-3 pb-1 sm:-mx-5 sm:px-5 lg:mx-0 lg:px-0 lg:pb-0">
            <NavLink to="/dashboard" className={navClass}>
              Inicio
            </NavLink>
            {canManageTeam && (
              <NavLink to="/executivo" className={navClass}>
                Executivo
              </NavLink>
            )}
            <NavLink to="/clientes" className={navClass}>
              Clientes
            </NavLink>
            {canManageTeam && (
              <NavLink to="/contratos" className={navClass}>
                Contratos
              </NavLink>
            )}
            <NavLink to="/tarefas" className={navClass}>
              Contatos
            </NavLink>
            {canManageTeam && (
              <NavLink to="/equipe" className={navClass}>
                Equipe
              </NavLink>
            )}
            {canManageTeam && (
              <NavLink to="/funcionarios" className={navClass}>
                Funcionarios
              </NavLink>
            )}
            {canManageInsumos && (
              <NavLink to="/insumos" className={navClass}>
                Insumos
              </NavLink>
            )}
            {canManageManutencao && (
              <NavLink to="/manutencao" className={navClass}>
                Manutencao
              </NavLink>
            )}
            {canManageTeam && (
              <NavLink to="/configuracoes" className={navClass}>
                Marca
              </NavLink>
            )}
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
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <Outlet context={{ session, canManageTeam, canManageInsumos, canManageManutencao, canViewFinancials, valuesHidden, maskValue }} />
      </main>
    </div>
  );
}
