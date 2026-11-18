import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

export default {
  // theme tokens live in globals.css (CSS variables); `dark:` follows the data-theme attribute
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'), surface: v('surface'), fg: v('fg'),
        brand: { DEFAULT: v('brand'), fg: v('brand-fg') },
        accent: { DEFAULT: v('accent'), fg: v('accent-fg') },
        success: v('success'), danger: v('danger'), warning: v('warning'), info: v('info'), violet: v('violet'),
        // the neutral scale is re-mapped per theme, so every existing `neutral-*` class is theme-aware
        neutral: Object.fromEntries(scale.map((n) => [n, v(`n-${n}`)])),
      },
      borderColor: { DEFAULT: v('n-200') },
      // radii and shadows differ per theme (sharp editorial vs. soft premium)
      borderRadius: { lg: 'var(--r-md)', xl: 'var(--r-lg)', '2xl': 'var(--r-xl)', '3xl': 'var(--r-2xl)' },
      boxShadow: { DEFAULT: 'var(--shadow-sm)', md: 'var(--shadow-md)', lg: 'var(--shadow-lg)' },
      fontFamily: {
        sans: ['var(--f-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--f-display)', 'var(--f-sans)', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
