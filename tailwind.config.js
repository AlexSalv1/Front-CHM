/** @type {import('tailwindcss').Config} */
// Arquivo: frontend/tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        chm: {
          bg: 'var(--chm-bg, #101418)',
          card: 'var(--chm-card, #18212b)',
          accent: 'var(--chm-accent, #4f8cff)',
          muted: 'var(--chm-muted, #8a98a8)',
          whatsapp: 'var(--chm-whatsapp, #25D366)',
        },
      },
      fontFamily: {
        sans: ['var(--chm-font, "Inter")', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
