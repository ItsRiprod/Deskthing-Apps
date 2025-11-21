import { randomFillSync, webcrypto } from 'node:crypto'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";

// Ensure a Web Crypto implementation with getRandomValues exists for Vite's build pipeline
if (typeof globalThis.crypto?.getRandomValues !== 'function') {
  const cryptoWithRandomValues =
    webcrypto && typeof webcrypto.getRandomValues === 'function'
      ? (webcrypto as unknown as Crypto)
      : {
          getRandomValues: <T extends ArrayBufferView>(array: T) => {
            randomFillSync(array)
            return array
          },
        }

  // @ts-expect-error - assigning Web Crypto to the global crypto reference for Node builds
  globalThis.crypto = cryptoWithRandomValues
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
