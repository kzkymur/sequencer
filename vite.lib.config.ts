/// <reference types="vitest" />
import fs from "fs";
import path, { resolve } from "path";
import { defineConfig } from "vite";
import esbuild from 'esbuild'
import dts from 'vite-plugin-dts'

// 現在のモジュールから対象ファイルの絶対パスを解決
const getAbsolutePath = (dirname: string, filepath: string) => {
  let absolutePath = path.resolve(dirname, filepath);
  if (!fs.existsSync(absolutePath)) {
    const candidateTs = absolutePath + '.ts';
    if (fs.existsSync(candidateTs)) absolutePath = candidateTs;
  }
  return absolutePath;
}

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.ts"), // エントリポイント
      name: "Sequencer", // グローバル変数として公開するライブラリの変数名
      fileName: "main", // 生成するファイルのファイル名を指定します。
      formats: ["es", "umd"],
    },
  },
  plugins: [
    dts(),
    {
      name: 'worker-transform',
      apply: 'build', // ビルド時のみ
      enforce: 'pre',
      async transform(code, id) {
        // new URL("./filepath", import.meta.url).href にマッチする正規表現
        const regex = /new URL\((['"])(\.\/[^'"]+)\1,\s*import\.meta\.url\)\.href/g;
        const replacements: ({ start: number, end: number, replacement: string })[] = [];
        let match;

        while ((match = regex.exec(code)) !== null) {
          const quote = match[1];
          const absolutePath = getAbsolutePath(path.dirname(id), match[2])

          if (fs.existsSync(absolutePath) && path.extname(absolutePath) === '.ts') {
            // 対象ファイルのソースコードを取得
            // esbuild を使って対象ファイルをバンドル（import もすべて解決）
            const result = await esbuild.build({
              entryPoints: [absolutePath],
              bundle: true,
              write: false,      // 出力はメモリ上で保持
              splitting: false,
              format: 'esm',
              loader: { '.ts': 'ts' },
            });

            const dataUrl = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`;
            replacements.push({ start: match.index, end: regex.lastIndex, replacement: `${quote}${dataUrl}${quote}` });
          }
        }

        // 置換はインデックスのずれを避けるため逆順に実施
        let transformedCode = code;
        for (let i = replacements.length - 1; i >= 0; i--) {
          const { start, end, replacement } = replacements[i];
          transformedCode = transformedCode.slice(0, start) + replacement + transformedCode.slice(end);
        }

        return { code: transformedCode };
      }
    }
  ],
  test: {
    setupFiles: ['@vitest/web-worker'],
  },
});