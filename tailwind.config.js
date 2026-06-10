/** @type {import('tailwindcss').Config} */
// Arquivo: frontend/tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        chm: {
          bg: '#0f1419',
          card: '#1a2332',
          accent: '#3b82f6',
          muted: '#64748b',
          whatsapp: '#25D366',
        },
      },
    },
  },
  plugins: [],
};
