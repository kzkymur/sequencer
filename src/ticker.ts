/// <reference lib="webworker" />

import { WORKER_START_EVENT, WORKER_STOP_EVENT } from "./const";

let intervalId: number | NodeJS.Timeout | null = null;

self.addEventListener('message', (e) => {
  switch (e.data.type) {
    case WORKER_START_EVENT:
      const { pitch } = e.data;
      intervalId = setInterval(() => {
        self.postMessage({ type: 'tick' });
      }, pitch);
      break;

    case WORKER_STOP_EVENT:
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      break;
  }
});