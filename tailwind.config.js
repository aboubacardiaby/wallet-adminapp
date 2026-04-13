/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        sidebar: { bg: '#0f172a', hover: '#1e293b', active: '#1e3a5f' },
      },
    },
  },
  plugins: [],
}
