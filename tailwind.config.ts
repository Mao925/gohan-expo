import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand)',
        'brand-strong': 'var(--brand-strong)',
        border: 'var(--border)',
        card: 'var(--card)',
        'card-muted': 'var(--card-muted)',
        text: {
          strong: 'var(--text-strong)',
          muted: 'var(--text-muted)'
        }
      },
      borderRadius: {
        xl: '1.5rem',
        card: '16px',
        pill: '9999px'
      },
      boxShadow: {
        card: '0 10px 30px rgba(0,0,0,0.04)'
      }
    }
  },
  plugins: []
};

export default config;
