import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          50: '#faf9f7',
          100: '#f5f3f0',
          200: '#eae7e1',
          300: '#ddd9d1',
          700: '#3d3a35',
          800: '#2f2d29',
          900: '#25231f',
          950: '#1a1917',
        },
        ink: {
          50: '#f5f4f3',
          100: '#d8d6d3',
          200: '#b5b1ac',
          300: '#918c85',
          400: '#706b63',
          500: '#565148',
          600: '#443f38',
          700: '#35312b',
          800: '#2d2b28',
          900: '#1f1e1b',
        },
        pastel: {
          blue: '#93b5e1',
          indigo: '#a5a5e0',
          violet: '#bfa5e0',
          rose: '#e0a5b8',
          amber: '#e0c9a5',
          green: '#a5d4b8',
          teal: '#a5d4d4',
        },
        primary: {
          50: '#f0f4fa',
          100: '#dce5f4',
          200: '#b8cce9',
          300: '#93b5e1',
          400: '#6e9ad5',
          500: '#4a7fc9',
          600: '#3b66a1',
          700: '#2c4c79',
          800: '#1e3351',
          900: '#0f1928',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        nepali: ['"Noto Sans Devanagari"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
