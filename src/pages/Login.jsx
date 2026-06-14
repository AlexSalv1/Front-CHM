import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/authApi';
import { verificarSessao } from '../api/authSessionApi';

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

function InputField({ label, name, error, children, hint }) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-chm-text">
        {label}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs text-chm-muted">{hint}</p>}
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
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
  const [success, setSuccess] = useState('');
  const [errorDetails, setErrorDetails] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setErrorDetails([]);
    setFieldErrors({});

    try {
      if (mode === 'register') {
        const result = await register({
          nome: nome.trim(),
          email: email.trim(),
          senha,
          nomeEmpresa: nomeEmpresa.trim(),
          cnpj: cnpj.replace(/\D/g, ''),
          ramoAtividade,
        });
        setSuccess(result?.message || 'Cadastro recebido. Aguarde a aprovação do administrador.');
        setMode('login');
        setSenha('');
        return;
      } else {
        await login(email.trim(), senha);
      }
      const session = await verificarSessao();
      navigate(session?.superAdmin ? '/admin/assinaturas' : '/dashboard');
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
    return `chm-field ${hasError ? 'border-red-500/70 ring-1 ring-red-500/20' : ''}`;
  }

  function fieldError(name) {
    return fieldErrors[normalizeFieldName(name)];
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-center gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-10">
        <section className="hidden chm-surface-strong p-8 lg:block">
          <p className="chm-kicker">CHM | Gestão de Retenção</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-chm-text xl:text-5xl">
            Centralize retenção, operação e acesso em uma única plataforma.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-chm-muted xl:text-base">
            Acompanhe clientes em risco, equipe, insumos, manutenção e feedback em um ambiente claro, organizado
            e pronto para a rotina operacional.
          </p>

          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {[
              ['Retenção', 'Priorize clientes em risco e próximos passos'],
              ['Operação', 'Equipe, insumos e manutenção em um só lugar'],
              ['Acesso', 'Controle permissões por perfil e unidade'],
            ].map(([title, copy]) => (
              <div key={title} className="chm-surface-soft p-4">
                <p className="text-sm font-semibold text-chm-text">{title}</p>
                <p className="mt-2 text-xs leading-relaxed text-chm-muted">{copy}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {['Visão executiva', 'Fluxos operacionais', 'Assistente contextual', 'Tema claro e escuro'].map((item) => (
              <span key={item} className="chm-chip">
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="chm-surface-strong p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="chm-kicker">Área do Gestor</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-chm-text">
                {mode === 'login' ? 'Entrar na plataforma' : 'Criar nova conta'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setError('');
                setMode(mode === 'login' ? 'register' : 'login');
              }}
              className="text-sm font-semibold text-chm-accent hover:underline"
            >
              {mode === 'login' ? 'Quero me cadastrar' : 'Já tenho conta'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <>
                <InputField
                  label="Seu nome"
                  name="nome"
                  error={fieldError('nome')}
                  hint="Vai aparecer como responsável da conta."
                >
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
                </InputField>

                <InputField
                  label="Nome da empresa"
                  name="nomeEmpresa"
                  error={fieldError('nomeEmpresa')}
                  hint="Use o nome comercial da empresa."
                >
                  <input
                    id="nomeEmpresa"
                    type="text"
                    required
                    maxLength={200}
                    value={nomeEmpresa}
                    onChange={(e) => setNomeEmpresa(e.target.value)}
                    className={inputClass('nomeEmpresa')}
                    placeholder="Academia Exemplo"
                  />
                </InputField>

                <InputField label="CNPJ" name="cnpj" error={fieldError('cnpj')}>
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
                </InputField>

                <InputField label="Ramo de atividade" name="ramoAtividade" error={fieldError('ramoAtividade')}>
                  <select
                    id="ramoAtividade"
                    value={ramoAtividade}
                    onChange={(e) => setRamoAtividade(e.target.value)}
                    className={inputClass('ramoAtividade')}
                  >
                    <option value="ACADEMIA">Academia</option>
                    <option value="CONTABILIDADE">Contabilidade</option>
                  </select>
                </InputField>
              </>
            )}

            <InputField label="E-mail" name="email" error={fieldError('email')}>
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
            </InputField>

            <InputField label="Senha" name="senha" error={fieldError('senha')}>
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
            </InputField>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                <p className="font-semibold">{error}</p>
                {errorDetails.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-red-200/90">
                    {errorDetails.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-100">
                {success}
              </div>
            )}

            <button type="submit" disabled={loading} className="chm-action-primary w-full py-3">
              {loading
                ? mode === 'login'
                  ? 'Entrando...'
                  : 'Criando conta...'
                : mode === 'login'
                  ? 'Entrar'
                  : 'Criar conta'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-chm-muted">
            Autenticação segura via Cookie HttpOnly (withCredentials)
          </p>
        </section>
      </div>
    </div>
  );
}
