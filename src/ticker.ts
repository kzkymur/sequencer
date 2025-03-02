/// <reference lib="webworker" />

let intervalId: number | NodeJS.Timeout | null = null;
let currentTime = 0;
let totalTime = 0;
let pitch = 0;
let loopFlag = false;

self.addEventListener('message', (e) => {
  switch (e.data.type) {
    case 'start':
      ({ totalTime, pitch, loopFlag } = e.data);
      currentTime = 0;
      
      intervalId = setInterval(() => {
        currentTime += pitch;
        
        if (currentTime >= totalTime) {
          if (loopFlag) {
            currentTime %= totalTime;
          } else {
            self.postMessage({ type: 'stop' });
            clearInterval(intervalId!);
            return;
          }
        }

        self.postMessage({
          type: 'tick',
          currentTime,
          totalTime
        });
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