// Node.js 環境かどうかの判定関数
function isNode(): boolean {
    return (
      typeof process !== 'undefined' &&
      process.versions != null &&
      process.versions.node != null
    );
  }


// Vitest 実行中かどうかの判定関数（Vitest 実行時は process.env.VITEST === 'true' となる）
function isVitest(): boolean {
    return process?.env?.VITEST === 'true';
  }

  
  // Worker の共通インターフェース（必要に応じて拡張可能）
  export interface UniversalWorker {
    postMessage: (msg: any) => void;
    addEventListener: (event: string, handler: (e: any) => void) => void;
    terminate: () => Promise<number> | void;
  }
  
  // 環境に応じた Worker を生成する関数
  export async function createWorker(scriptPath: string): Promise<UniversalWorker> {
    if (!isNode() || isVitest()) {
      // ブラウザ環境の場合：標準の WebWorker を利用
      return new Worker(new URL(scriptPath));
    } else {
      // Node.js 環境の場合：worker_threads を利用
      const { Worker } = await import("worker_threads");
      const nodeWorker = new Worker(new URL(scriptPath));
  
      // WebWorker 互換のインターフェースを提供するラッパー
      return {
        postMessage: (msg: any) => nodeWorker.postMessage(msg),
        addEventListener: (event: string, handler: (e: any) => void) => {
          // worker_threads の Worker は addEventListener は持たないため on() で代用
          if (event === 'message') {
            nodeWorker.on('message', handler);
          } else if (event === 'error') {
            nodeWorker.on('error', handler);
          }
          // 必要に応じて他のイベントもラップ可能
        },
        terminate: () => nodeWorker.terminate(),
      };
    }
  }