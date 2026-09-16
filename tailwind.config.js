/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clinical: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#38a6f6',
          500: '#0e8ce8',
          600: '#026fc7',
          700: '#0358a1',
          800: '#074b84',
          900: '#0c3f6e',
          950: '#082849',
        },
        slate: {
          850: '#151e2e',
        },
        accept: {
          light: '#ecfdf5',
          border: '#a7f3d0',
          text: '#065f46',
          badge: '#059669',
          dark: '#064e3b'
        },
        uncertain: {
          light: '#fffbeb',
          border: '#fde68a',
          text: '#92400e',
          badge: '#d97706',
          dark: '#78350f'
        },
        abstain: {
          light: '#fef2f2',
          border: '#fecaca',
          text: '#991b1b',
          badge: '#dc2626',
          dark: '#7f1d1d'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'Consolas',
          'Monaco',
          'monospace',
        ],
      },
      boxShadow: {
        'soft-sm': '0 1px 2px 0 rgba(16, 24, 40, 0.04)',
        'soft-md': '0 4px 12px -2px rgba(16, 24, 40, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.04)',
        'soft-lg': '0 12px 24px -4px rgba(16, 24, 40, 0.08), 0 4px 8px -2px rgba(16, 24, 40, 0.03)',
        'soft-xl': '0 20px 32px -6px rgba(16, 24, 40, 0.1), 0 8px 16px -4px rgba(16, 24, 40, 0.04)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        },
        pulseSlow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        }
      },
      animation: {
        'pulse-slow': 'pulseSlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
