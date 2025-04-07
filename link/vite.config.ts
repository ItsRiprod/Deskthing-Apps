import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "./shared"),
      "@src": resolve(__dirname, "./src"),
    },
  }
})
