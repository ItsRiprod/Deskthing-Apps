import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy';
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(),
            legacy({
            targets: ['Chrome 69'], // To support the Car Thing
        }),],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './shared'),
      '@src': path.resolve(__dirname, './src'),
    }
  }
  
})
