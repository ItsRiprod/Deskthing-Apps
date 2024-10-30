/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        geist: ['Geist', 'sans-serif'],
        HelveticaNeue: ['HelveticaNeue', 'sans-serif'],
        interstate: ['Interstate', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],  // <- Added Montserrat here
      },
    },
  },
  plugins: [],
}
