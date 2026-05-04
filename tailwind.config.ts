import type { Config } from 'tailwindcss';

// StunpreX visual identity — Blueprint v2.1 §7. Locked.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        orange: {
          DEFAULT: '#FA961C', // primary — CTAs, key highlights, brand accents
          50: '#FEF6E9',
          100: '#FDEAC9',
          500: '#FA961C',
          600: '#D87C0A',
          700: '#A55D08',
        },
        deepblue: {
          DEFAULT: '#107099', // secondary — headings, structural elements, navigation
          50: '#E6F2F8',
          100: '#BFDDEC',
          500: '#107099',
          600: '#0C5878',
          700: '#093F55',
        },
        brown: {
          DEFAULT: '#472B08', // body text
          500: '#472B08',
          400: '#6B4C2C',
          300: '#8E6F50',
        },
        mint: {
          DEFAULT: '#F5FAF5', // background
        },
      },
      fontFamily: {
        // Mate — headings; Play — body; Dosis — menu/CTA/technical; Noto Sans — forum/long form
        heading: ['var(--font-mate)', 'serif'],
        body: ['var(--font-play)', 'sans-serif'],
        ui: ['var(--font-dosis)', 'sans-serif'],
        forum: ['var(--font-noto-sans)', 'sans-serif'],
      },
      maxWidth: {
        prose: '68ch',
        site: '1200px',
      },
      letterSpacing: {
        ui: '0.04em',
      },
    },
  },
  plugins: [],
};

export default config;
