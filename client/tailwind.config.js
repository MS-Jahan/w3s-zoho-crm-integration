/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-right': 'slide-in-right 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    // Single dark-first "studio" theme per the redesign spec (zinc-950 base)
    themes: [
      {
        studio: {
          primary: '#818cf8',        // indigo-400
          'primary-content': '#1c1c22',
          secondary: '#a78bfa',      // violet-400
          'secondary-content': '#1c1c22',
          accent: '#34d399',         // emerald-400
          'accent-content': '#1c1c22',
          neutral: '#27272a',        // zinc-800
          'neutral-content': '#d4d4d8',
          'base-100': '#18181b',     // zinc-900 (cards)
          'base-200': '#101013',     // between zinc-900 and 950
          'base-300': '#09090b',     // zinc-950 (page bg)
          'base-content': '#e4e4e7', // zinc-200
          info: '#38bdf8',
          success: '#34d399',
          warning: '#fbbf24',
          error: '#fb7185',          // rose-400
          '--rounded-box': '0.75rem',
          '--rounded-btn': '0.5rem',
        },
      },
    ],
    darkTheme: 'studio',
  },
};
