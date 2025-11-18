/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'oet-blue': '#0066CC', // OET blauwe kleur
        'oet-blue-dark': '#0052A5',
        'oet-blue-light': '#E6F2FF',
      },
    },
  },
  plugins: [],
}

