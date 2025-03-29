/// <reference types="vitest" />
import { defineConfig } from "vite";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  root: "./example/",
  base: "/sequencer/",
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'example/index.html'),
        queue: resolve(__dirname, 'example/queue/index.html'),
        independent: resolve(__dirname, 'example/independent/index.html'),
      }
    },
    outDir: "dist"
  },
  resolve: {
    alias: {
      ...(command === 'build' && {
        '../../src/main': resolve(__dirname, 'dist/main')
      })
    }
  },
  server: {
    port: 8080
  }
}));