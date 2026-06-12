// Arquivo: frontend/src/pages/Designs.jsx
import { useOutletContext } from 'react-router-dom';

const designs = [
  {
    id: 'meridian',
    nome: 'Meridian',
    descricao:
      'Indigo com acento esmeralda sobre navy profundo. Tipografia Manrope, geometrica e arredondada. Foco em leitura confortavel de muitos dados.',
    fonte: 'Manrope',
    tokens: {
      bg: '#0b1020',
      card: '#141b30',
      accent: '#6366f1',
      muted: '#8b94b3',
      whatsapp: '#34d399',
    },
  },
  {
    id: 'graphite',
    nome: 'Graphite',
    descricao:
      'Grafite neutro com acento teal. Tipografia IBM Plex Sans, tecnica e densa. Visual de painel operacional para muita informacao por tela.',
    fonte: 'IBM Plex Sans',
    tokens: {
      bg: '#131517',
      card: '#1c1f23',
      accent: '#2dd4bf',
      muted: '#9aa3ad',
      whatsapp: '#25d366',
    },
  },
  {
    id: 'ember',
    nome: 'Ember',
    descricao:
      'Laranja quente sobre grafite amadeirado. Tipografia Inter, limpa e versatil. Acento energico para destacar acoes e alertas.',
    fonte: 'Inter',
    tokens: {
      bg: '#15110e',
      card: '#211a14',
      accent: '#f97316',
      muted: '#b39d8a',
      whatsapp: '#25d366',
    },
  },
];

function Swatch({ color, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="h-8 w-8 rounded-md border border-white/15"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="text-[10px] uppercase tracking-wide text-chm-muted">{label}</span>
    </div>
  );
}

function PreviewCard({ tokens, fonte }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        backgroundColor: tokens.bg,
        borderColor: 'rgba(255,255,255,0.08)',
        fontFamily: `'${fonte}', sans-serif`,
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: tokens.muted }}>
          Dashboard
        </span>
        <span
          className="rounded-md px-2 py-1 text-[11px] font-semibold text-white"
          style={{ backgroundColor: tokens.accent }}
        >
          Novo contato
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {['Clientes', 'Em risco', 'Contatos'].map((k, i) => (
          <div
            key={k}
            className="rounded-lg p-2.5"
            style={{ backgroundColor: tokens.card }}
          >
            <p className="text-[10px]" style={{ color: tokens.muted }}>
              {k}
            </p>
            <p className="text-lg font-extrabold text-white">{[248, 17, 32][i]}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-lg p-2.5" style={{ backgroundColor: tokens.card }}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white">Ana Souza</span>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
            style={{ backgroundColor: tokens.whatsapp }}
          >
            WhatsApp
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: tokens.bg }}>
          <div className="h-full rounded-full" style={{ width: '70%', backgroundColor: tokens.accent }} />
        </div>
      </div>
    </div>
  );
}

export default function Designs() {
  const { design, setDesign } = useOutletContext();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Designs do projeto</h1>
        <p className="text-sm text-chm-muted">
          Tres variacoes de cores e tipografia, todas com foco produtivo. Selecione uma para aplicar em todo o
          sistema. A escolha fica salva neste navegador.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {designs.map((d) => {
          const ativo = design === d.id;
          return (
            <article
              key={d.id}
              className={`flex flex-col gap-4 rounded-2xl border p-5 transition ${
                ativo ? 'border-chm-accent ring-2 ring-chm-accent/40' : 'border-slate-800'
              } bg-chm-card`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold">{d.nome}</h2>
                  <p className="text-xs text-chm-muted">Fonte: {d.fonte}</p>
                </div>
                {ativo && (
                  <span className="rounded-full bg-chm-accent px-2.5 py-1 text-[11px] font-semibold text-white">
                    Ativo
                  </span>
                )}
              </div>

              <PreviewCard tokens={d.tokens} fonte={d.fonte} />

              <p className="text-sm leading-relaxed text-slate-300">{d.descricao}</p>

              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  <Swatch color={d.tokens.accent} label="Acento" />
                  <Swatch color={d.tokens.bg} label="Fundo" />
                  <Swatch color={d.tokens.card} label="Card" />
                </div>
                <button
                  type="button"
                  onClick={() => setDesign(d.id)}
                  disabled={ativo}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    ativo
                      ? 'cursor-default border border-slate-700 text-chm-muted'
                      : 'bg-chm-accent text-white hover:opacity-90'
                  }`}
                >
                  {ativo ? 'Aplicado' : 'Aplicar'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-xs text-chm-muted">
        Dica: depois de aplicar, navegue pelas telas (Inicio, Clientes, Contatos) para comparar cada design em uso
        real.
      </p>
    </div>
  );
}
