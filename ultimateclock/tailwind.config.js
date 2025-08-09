
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'drop-in': 'drop-in 0.3s ease-in-out forwards',
        'pop-in': 'pop-in 0.3s ease-in-out forwards',
      },
      fontFamily: {
        geist: ['Geist', 'sans-serif'],
      },
      keyframes: {
        'drop-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'pop-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0)',
          },
          '50%': {
            opacity: '1',
          },
          '80%': {
            transform: 'scale(1.1)',
          },
          '100%': {
            transform: 'scale(1)',
          },
        },
      },
    },
  },
  plugins: [],
}
