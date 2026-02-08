/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Amiga Brand Colors
        beige: {
          50: '#faf8f5',
          100: '#f5f1ea',
          200: '#ebe3d5',
          300: '#e0d4bf',
          400: '#d6c6aa',
          500: '#cbb895', // Base beige - trust/confidence
          600: '#b8a078',
          700: '#9a865f',
          800: '#7c6c4d',
          900: '#5e523a',
        },
        primary: {
          50: '#fef5f1',
          100: '#fde8e0',
          200: '#fbd1c1',
          300: '#f7b49a',
          400: '#f39273',
          500: '#e8744e', // Base orange - fertility (primary brand color)
          600: '#d85b36',
          700: '#b9462a',
          800: '#963725',
          900: '#782d20',
        },
        purple: {
          50: '#f7f5f6',
          100: '#eee9ec',
          200: '#dcd3d9',
          300: '#c0b0b8',
          400: '#9d8593',
          500: '#7a5f71', // Base purple - femininity/empowerment
          600: '#634854',
          700: '#503a44',
          800: '#3f2e35',
          900: '#2f2228',
        },
      },
      fontFamily: {
        serif: ['var(--font-libre-baskerville)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
