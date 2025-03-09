/// <reference types="vitest" />
import { resolve } from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.ts"), // エントリポイント
      name: "Sequencer", // グローバル変数として公開するライブラリの変数名
      fileName: "seauencer-lib", // 生成するファイルのファイル名を指定します。
      formats: ["es", "umd"], // 生成するモジュール形式を配列で指定します。デフォルトで['es', 'umd'] なのでこの場合はなくても大丈夫です。
    },
    rollupOptions: {
      input: {
        queue: resolve(__dirname, 'example/queue.html'),
        independent: resolve(__dirname, 'example/independent.html'),
      },
    },
  },
  plugins: [],
  test: {
    setupFiles: ['@vitest/web-worker'],
  },
});