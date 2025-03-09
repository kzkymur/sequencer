/// <reference types="vitest" />
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  root: "./example/",
  server: {
    port: 8080
  }
});