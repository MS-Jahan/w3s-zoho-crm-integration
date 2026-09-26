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
    // 'studio' = dark zinc design-system theme; 'studio-light' keeps identical
    // component styling on a light surface so the theme toggle works.
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
          'base-200': '#101013',
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
      {
        'studio-light': {
          primary: '#6366f1',        // indigo-500
          'primary-content': '#ffffff',
          secondary: '#8b5cf6',      // violet-500
          'secondary-content': '#ffffff',
          accent: '#10b981',         // emerald-500
          'accent-content': '#ffffff',
          neutral: '#e4e4e7',        // zinc-200
          'neutral-content': '#3f3f46',
          'base-100': '#ffffff',     // cards
          'base-200': '#f4f4f5',     // zinc-100
          'base-300': '#e4e4e7',     // zinc-200 (page bg)
          'base-content': '#27272a', // zinc-800
          info: '#0ea5e9',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#f43f5e',          // rose-500
          '--rounded-box': '0.75rem',
          '--rounded-btn': '0.5rem',
        },
      },
    ],
    darkTheme: 'studio',
  },
};
