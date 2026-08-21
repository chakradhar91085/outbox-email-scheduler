/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      colors: {
        background: '#090a0d',
        surface: {
          DEFAULT: '#101319',
          elevated: '#171b24',
          highlight: '#202633',
        },
        border: 'rgba(255, 255, 255, 0.08)',
        muted: {
          DEFAULT: '#161922',
          foreground: '#8b949e',
        },
        primary: {
          DEFAULT: '#6366f1',
          foreground: '#ffffff',
          dark: '#4f46e5',
        },
        accent: {
          DEFAULT: '#10b981',
          foreground: '#ffffff',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
