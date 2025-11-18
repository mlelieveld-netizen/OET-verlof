/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'oet-blue': '#2C3E50', // Antraciet kleur
        'oet-blue-dark': '#1A252F',
        'oet-blue-light': '#ECF0F1',
      },
    },
  },
  plugins: [],
}

