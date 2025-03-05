/// <reference lib="webworker" />

const WORKER_START_EVENT = '@sequence/start';
const WORKER_STOP_EVENT = '@sequence/stop';
const WORKER_TICK_EVENT = '@sequence/tick';
const WORKER_UPDATE_EVENT = '@sequence/update';
// const TIMER_UPDATE_EVENT = '@sequence/timer_update';

let intervalId: number | NodeJS.Timeout | null = null;
let pitch: number = 10;

const stop = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

const start = () => {
  stop();
  intervalId = setInterval(() => {
    self.postMessage({ type: WORKER_TICK_EVENT });
  }, pitch);
}

self.addEventListener('message', (e) => {
  switch (e.data.type) {
    case WORKER_START_EVENT: {
      let { pitch: newPitch } = e.data;
      pitch = newPitch;
      
      start();
      break;
    }

    case WORKER_STOP_EVENT:
      stop();
      break;

    case WORKER_UPDATE_EVENT:
      const { type, value } = e.data.payload;
      switch(type) {
        case 'pitch':
          pitch = value;
          if (intervalId) start();
          break;
        case 'totalTime':
          // totalTime = value;
          break;
        case 'loopFlag':
          // loopFlag = value;
          break;
      }
      break;
  }
});