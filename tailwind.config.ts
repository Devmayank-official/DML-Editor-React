import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0f1a',
        panel: '#131a2b',
        accent: '#5eead4'
      }
    }
  },
  darkMode: 'class'
} satisfies Config;
