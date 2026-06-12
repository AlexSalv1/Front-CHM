import { useEffect, useState } from 'react';
import { atualizarBrandingEmpresa, buscarBrandingEmpresa } from '../api/empresaApi';
import LoadingSpinner from '../components/LoadingSpinner';
import useAppContext from '../hooks/useAppContext';

const defaultForm = {
  nomeComercial: '',
  logoUrl: '',
  corPrimaria: '#4f8cff',
};

function parseApiError(err) {
  const data = err?.response?.data;
  const details = Array.isArray(data?.details) ? data.details : [];
  return [data?.message, ...details].filter(Boolean).join(' ') || 'Não foi possível salvar a marca.';
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Configuracoes() {
  const { session, canManageTeam } = useAppContext();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const branding = await buscarBrandingEmpresa();
        setForm({
          nomeComercial: branding.nomeComercial || '',
          logoUrl: branding.logoUrl || '',
          corPrimaria: branding.corPrimaria || '#4f8cff',
        });
      } catch (err) {
        setError('Não foi possível carregar as configurações.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setSuccess('');
  }

  async function handleLogoFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem.');
      return;
    }

    if (file.size > 500 * 1024) {
      setError('Use uma imagem de até 500 KB para o logo.');
      return;
    }

    try {
      const dataUrl = await readImageAsDataUrl(file);
      updateForm('logoUrl', dataUrl);
      setError('');
    } catch (err) {
      setError('Não foi possível ler a imagem selecionada.');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const saved = await atualizarBrandingEmpresa({
        nomeComercial: form.nomeComercial.trim(),
        logoUrl: form.logoUrl.trim() || null,
        corPrimaria: form.corPrimaria || '#4f8cff',
      });
      setForm({
        nomeComercial: saved.nomeComercial || '',
        logoUrl: saved.logoUrl || '',
        corPrimaria: saved.corPrimaria || '#4f8cff',
      });
      window.dispatchEvent(new CustomEvent('chm:branding-updated', { detail: saved }));
      setSuccess('Marca atualizada com sucesso.');
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  if (session && !canManageTeam) {
    return (
      <div className="rounded-md border border-slate-800 bg-chm-card p-6 text-sm text-chm-muted">
        Seu usuário não tem acesso às configurações da marca.
      </div>
    );
  }
  if (loading) return <LoadingSpinner label="Carregando configurações..." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-chm-accent">Configurações</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Marca da academia</h2>
        <p className="mt-1 text-sm text-chm-muted">
          Personalize o nome, logo e cor que aparecem apenas para sua empresa.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-md border border-slate-800/80 bg-chm-card/95 p-5 shadow-xl shadow-black/10">
          {error && (
            <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="nomeComercial">
                Nome exibido
              </label>
              <input
                id="nomeComercial"
                value={form.nomeComercial}
                onChange={(event) => updateForm('nomeComercial', event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                placeholder="Nome da academia"
                required
                maxLength={200}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="logoFile">
                Logo
              </label>
              <input
                id="logoFile"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogoFile}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-950"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="logoUrl">
                URL do logo
              </label>
              <input
                id="logoUrl"
                value={form.logoUrl}
                onChange={(event) => updateForm('logoUrl', event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                placeholder="https://sua-academia.com/logo.png"
              />
              <p className="mt-1 text-xs text-chm-muted">Você pode enviar arquivo ou colar uma URL.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="corPrimaria">
                Cor principal
              </label>
              <div className="flex gap-3">
                <input
                  id="corPrimaria"
                  type="color"
                  value={form.corPrimaria}
                  onChange={(event) => updateForm('corPrimaria', event.target.value)}
                  className="h-10 w-14 rounded-md border border-slate-700 bg-slate-950 p-1"
                />
                <input
                  value={form.corPrimaria}
                  onChange={(event) => updateForm('corPrimaria', event.target.value)}
                  className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-chm-accent"
                  placeholder="#4f8cff"
                  pattern="^#[0-9a-fA-F]{6}$"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: form.corPrimaria || '#4f8cff' }}
            >
              {saving ? 'Salvando...' : 'Salvar marca'}
            </button>
          </form>
        </section>

        <aside className="rounded-md border border-slate-800/80 bg-chm-card/95 p-5 shadow-xl shadow-black/10">
          <h3 className="text-lg font-semibold">Prévia</h3>
          <div className="mt-5 rounded-md border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md text-sm font-black text-white"
                style={{ backgroundColor: form.corPrimaria || '#4f8cff' }}
              >
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  (form.nomeComercial || 'CH').slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold">{form.nomeComercial || 'Sua academia'}</p>
                <p className="text-xs text-chm-muted">Ambiente privado da empresa</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
