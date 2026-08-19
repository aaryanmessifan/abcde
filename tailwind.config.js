/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#08090C',
          900: '#0C0E12',
          800: '#13161C',
          700: '#1A1E26',
          600: '#22272F',
          500: '#2D333D',
        },
        ember: {
          50: '#FFF6ED',
          100: '#FFEAD4',
          200: '#FFD3A8',
          300: '#FFB370',
          400: '#FF8A3D',
          500: '#FF6B1A',
          600: '#F45706',
          700: '#CC4406',
          800: '#A5380B',
          900: '#842F0C',
        },
        frost: {
          50: '#EDFBFF',
          100: '#D3F4FF',
          200: '#ADE9FF',
          300: '#75D8FF',
          400: '#38C3FF',
          500: '#0EA8E8',
          600: '#0885C2',
          700: '#0B6A9C',
          800: '#105A7E',
          900: '#144B66',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'blink': 'blink 1s steps(2) infinite',
        'glow': 'glow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        blink: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 107, 26, 0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 107, 26, 0.3)' },
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        'radial-ember': 'radial-gradient(circle at 50% 0%, rgba(255, 107, 26, 0.12), transparent 60%)',
        'radial-frost': 'radial-gradient(circle at 50% 0%, rgba(14, 168, 232, 0.1), transparent 60%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'ember': '0 0 24px rgba(255, 107, 26, 0.3)',
        'frost': '0 0 24px rgba(14, 168, 232, 0.2)',
      },
    },
  },
  plugins: [],
};
