export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'drop-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0)' },
          '50%': { opacity: '1' },
          '80%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' }
        }
      },
      animation: {
        'dropIn': 'drop-in 0.3s ease-in-out forwards',
        'popIn': 'pop-in 0.3s ease-in-out forwards'
      }
    },
  },
  plugins: [],
}

