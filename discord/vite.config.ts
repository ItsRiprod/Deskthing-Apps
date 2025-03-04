import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy';
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(),
            tailwindcss(),
            legacy({
            targets: ['Chrome 69'], // To support the Car Thing
        }),],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './shared')
    }
  }
  
})
