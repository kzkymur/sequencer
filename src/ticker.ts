/// <reference lib="webworker" />

let intervalId: number | NodeJS.Timeout | null = null;

self.addEventListener('message', (e) => {
  switch (e.data.type) {
    case 'start':
      const { pitch } = e.data;
      intervalId = setInterval(() => {
        self.postMessage({ type: 'tick' });
      }, pitch);
      break;

    case 'stop':
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      break;
  }
});