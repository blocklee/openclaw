/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        cream: '#faf9f7',
        brown: { light: '#d4c5b0', DEFAULT: '#8b7a6b', dark: '#6b5f56' },
        accent: '#c8a96e',
      },
    },
  },
  plugins: [],
};