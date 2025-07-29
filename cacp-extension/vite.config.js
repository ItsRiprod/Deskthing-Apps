import { defineConfig } from "vite";
import { chromeExtension } from "vite-plugin-chrome-extension";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: resolve(import.meta.dirname, "manifest.json")
    }
  },
  plugins: [
    chromeExtension()
  ],
});