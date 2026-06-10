// Arquivo: frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email.trim(), senha);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-chm-bg p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">CHM</h1>
          <p className="mt-2 text-sm text-chm-muted">Customer Health Management</p>
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-chm-card p-8 shadow-2xl">
          <h2 className="mb-6 text-xl font-semibold">Acesso do Gestor</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                maxLength={150}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-3 text-white placeholder-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-chm-accent"
                placeholder="gestor@empresa.com"
              />
            </div>

            <div>
              <label htmlFor="senha" className="mb-2 block text-sm font-medium text-slate-300">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                required
                minLength={8}
                maxLength={128}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-3 text-white placeholder-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-chm-accent"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-chm-accent px-4 py-3 font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-chm-muted">
          Autenticação segura via Cookie HttpOnly (withCredentials)
        </p>
      </div>
    </div>
  );
}
