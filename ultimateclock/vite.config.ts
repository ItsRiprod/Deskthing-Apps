import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./shared"),
      "@src": path.resolve(__dirname, "./src"),
    },
  },
  publicDir: 'public', // Change this if you want a custom directory
})
