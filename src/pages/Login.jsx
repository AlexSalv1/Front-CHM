import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/authApi';

function parseApiError(err) {
  const data = err?.response?.data;
  const details = Array.isArray(data?.details) ? data.details : [];

  return {
    message:
      data?.message ||
      data?.error ||
      (err?.response?.status
        ? `Falha na requisição (${err.response.status}). Verifique os dados informados.`
        : 'Falha na autenticação. Verifique os dados informados.'),
    details,
    status: err?.response?.status || null,
  };
}

function normalizeFieldName(field) {
  return field?.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [ramoAtividade, setRamoAtividade] = useState('ACADEMIA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setErrorDetails([]);
    setFieldErrors({});

    try {
      if (mode === 'register') {
        await register({
          nome: nome.trim(),
          email: email.trim(),
          senha,
          nomeEmpresa: nomeEmpresa.trim(),
          cnpj: cnpj.replace(/\D/g, ''),
          ramoAtividade,
        });
      } else {
        await login(email.trim(), senha);
      }
      navigate('/dashboard');
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message);
      setErrorDetails(parsed.details);

      const nextFieldErrors = {};
      for (const detail of parsed.details) {
        const [field, ...rest] = String(detail).split(':');
        if (field && rest.length > 0) {
          nextFieldErrors[normalizeFieldName(field)] = rest.join(':').trim();
        }
      }
      setFieldErrors(nextFieldErrors);
    } finally {
      setLoading(false);
    }
  }

  function inputClass(name) {
    const hasError = Boolean(fieldErrors[normalizeFieldName(name)]);
    return `w-full rounded-lg border bg-slate-900/80 px-4 py-3 text-white placeholder-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-chm-accent ${
      hasError ? 'border-red-500/70 ring-1 ring-red-500/30' : 'border-slate-600'
    }`;
  }

  function fieldError(name) {
    return fieldErrors[normalizeFieldName(name)];
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-chm-bg p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">CHM</h1>
          <p className="mt-2 text-sm text-chm-muted">Customer Health Management</p>
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-chm-card p-8 shadow-2xl">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              {mode === 'login' ? 'Acesso do Gestor' : 'Criar conta'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setError('');
                setMode(mode === 'login' ? 'register' : 'login');
              }}
              className="text-sm font-medium text-chm-accent hover:underline"
            >
              {mode === 'login' ? 'Quero me cadastrar' : 'Já tenho conta'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="nome" className="mb-2 block text-sm font-medium text-slate-300">
                    Seu nome
                  </label>
                  <input
                    id="nome"
                    type="text"
                    required
                    maxLength={150}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className={inputClass('nome')}
                    placeholder="Nome do gestor"
                  />
                  {fieldError('nome') && <p className="mt-2 text-xs text-red-300">{fieldError('nome')}</p>}
                </div>

                <div>
                  <label htmlFor="nomeEmpresa" className="mb-2 block text-sm font-medium text-slate-300">
                    Nome da empresa
                  </label>
                  <input
                    id="nomeEmpresa"
                    type="text"
                    required
                    maxLength={200}
                    value={nomeEmpresa}
                    onChange={(e) => setNomeEmpresa(e.target.value)}
                    className={inputClass('nomeEmpresa')}
                    placeholder="Empresa Exemplo LTDA"
                  />
                  {fieldError('nomeEmpresa') && (
                    <p className="mt-2 text-xs text-red-300">{fieldError('nomeEmpresa')}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="cnpj" className="mb-2 block text-sm font-medium text-slate-300">
                    CNPJ
                  </label>
                  <input
                    id="cnpj"
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={18}
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className={inputClass('cnpj')}
                    placeholder="00.000.000/0000-00"
                  />
                  {fieldError('cnpj') && <p className="mt-2 text-xs text-red-300">{fieldError('cnpj')}</p>}
                </div>

                <div>
                  <label htmlFor="ramoAtividade" className="mb-2 block text-sm font-medium text-slate-300">
                    Ramo de atividade
                  </label>
                  <select
                    id="ramoAtividade"
                    value={ramoAtividade}
                    onChange={(e) => setRamoAtividade(e.target.value)}
                    className={inputClass('ramoAtividade')}
                  >
                    <option value="ACADEMIA">Academia</option>
                    <option value="CONTABILIDADE">Contabilidade</option>
                  </select>
                  {fieldError('ramoAtividade') && (
                    <p className="mt-2 text-xs text-red-300">{fieldError('ramoAtividade')}</p>
                  )}
                </div>
              </>
            )}

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
                className={inputClass('email')}
                placeholder="gestor@empresa.com"
              />
              {fieldError('email') && <p className="mt-2 text-xs text-red-300">{fieldError('email')}</p>}
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
                className={inputClass('senha')}
                placeholder="********"
              />
              {fieldError('senha') && <p className="mt-2 text-xs text-red-300">{fieldError('senha')}</p>}
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                <p className="font-medium">{error}</p>
                {errorDetails.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-red-200/90">
                    {errorDetails.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-chm-accent px-4 py-3 font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (mode === 'login' ? 'Entrando...' : 'Criando conta...') : (mode === 'login' ? 'Entrar' : 'Criar conta')}
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
