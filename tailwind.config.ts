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
        brand: {
          DEFAULT: '#ff6b4a',
          foreground: '#ffffff'
        }
      },
      borderRadius: {
        xl: '1.5rem'
      }
    }
  },
  plugins: []
};

export default config;
