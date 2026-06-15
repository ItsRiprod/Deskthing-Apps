import { webcrypto } from 'node:crypto'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";

// Ensure a Web Crypto implementation with getRandomValues exists for Vite's build pipeline
if (!globalThis.crypto?.getRandomValues) {
  // @ts-expect-error - assigning Web Crypto to the global crypto reference for Node builds
  globalThis.crypto = webcrypto as unknown as Crypto
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./shared"),
      "@src": path.resolve(__dirname, "./src"),
    },
  }
})
