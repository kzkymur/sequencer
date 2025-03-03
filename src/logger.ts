export const log = (...args: unknown[]) => {
  if (import.meta.env.MODE === 'development') {
    console.log('[Sequencer]', ...args);
  }
};