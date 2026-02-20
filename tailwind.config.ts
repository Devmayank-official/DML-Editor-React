import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--dml-bg) / <alpha-value>)',
        panel: 'rgb(var(--dml-panel) / <alpha-value>)',
        accent: 'rgb(var(--dml-accent) / <alpha-value>)',
      },
    },
  },
  darkMode: 'class',
} satisfies Config;
