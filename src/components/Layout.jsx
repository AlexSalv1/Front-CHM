// Arquivo: frontend/src/components/Layout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../api/authApi';

const navClass = ({ isActive }) =>
  `rounded-lg px-4 py-2 text-sm transition ${
    isActive ? 'bg-chm-accent text-white' : 'text-slate-300 hover:bg-slate-800'
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
    <div className="min-h-screen bg-chm-bg">
      <nav className="border-b border-slate-700/50 bg-chm-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-bold">CHM</h1>
            <p className="text-xs text-chm-muted">Customer Health Management</p>
          </div>
          <div className="flex items-center gap-2">
            <NavLink to="/dashboard" className={navClass}>
              Dashboard
            </NavLink>
            <NavLink to="/tarefas" className={navClass}>
              Tarefas
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
