/** @type {import('tailwindcss').Config} */
// Arquivo: frontend/tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        chm: {
          bg: '#101418',
          card: '#18212b',
          accent: '#4f8cff',
          muted: '#8a98a8',
          whatsapp: '#25D366',
        },
      },
    },
  },
  plugins: [],
};
