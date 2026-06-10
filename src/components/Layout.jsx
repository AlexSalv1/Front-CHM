// Arquivo: frontend/src/components/Layout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../api/authApi';

const navClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
  }`;

export default function Layout() {
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <nav className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/88 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-chm-accent text-sm font-black text-white">
              CH
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">CHM</h1>
              <p className="text-xs text-chm-muted">Acompanhe clientes com mais cuidado</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NavLink to="/dashboard" className={navClass}>
              Início
            </NavLink>
            <NavLink to="/clientes" className={navClass}>
              Clientes
            </NavLink>
            <NavLink to="/contratos" className={navClass}>
              Contratos
            </NavLink>
            <NavLink to="/tarefas" className={navClass}>
              Contatos
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
