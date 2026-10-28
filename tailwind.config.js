/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        impact: ['Anton', '"Space Grotesk"', 'sans-serif'],
        script: ['Caveat', 'cursive'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        coral: {
          DEFAULT: 'rgb(var(--coral-rgb) / <alpha-value>)',
          dark: 'rgb(var(--coral-dark-rgb) / <alpha-value>)',
          light: 'rgb(var(--coral-light-rgb) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink-rgb) / <alpha-value>)',
          soft: '#2a2826',
        },
        cream: {
          DEFAULT: '#fcede7',
          soft: '#fff6f2',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border: 'hsl(var(--border))',
      },
      boxShadow: {
        hard: '6px 6px 0 rgba(22, 21, 20, 1)',
        'hard-coral': '6px 6px 0 rgb(var(--coral-dark-rgb))',
        sticker: '0 4px 0 rgba(22, 21, 20, 0.1)',
        soft: '0 1px 2px rgba(16, 16, 24, 0.04), 0 8px 24px -12px rgba(16, 16, 24, 0.12)',
        float: '0 2px 4px rgba(16, 16, 24, 0.04), 0 24px 48px -16px rgba(16, 16, 24, 0.2)',
        'glow-sm': '0 12px 34px -12px rgba(249, 76, 58, 0.45)',
      },
    },
  },
  plugins: [],
};
