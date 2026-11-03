/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        main: 'var(--foreground)',
        ink: '#0b1120',
        panel: '#111827',
        card: '#172033',
        violet: '#8b5cf6',
        mint: '#10b981',
        rose: '#f43f5e',
        amber: '#f59e0b',
      },
    },
  },
  plugins: [],
};
