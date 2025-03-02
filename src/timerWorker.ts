import { TIMER_UPDATE_EVENT } from './const';
import type { UniversalWorker } from './universalWorker';

export class TimerWorker {
  private totalTime: number;
  private pitch: number;
  private loopFlag: boolean;
  private intervalId: NodeJS.Timeout | null = null;
  private worker: UniversalWorker | null = null;
  private currentTime = 0;
  private isPlaying = false;
  public eventTarget = new EventTarget();

  constructor(
    totalTime: number,
    pitch: number,
    loopFlag: boolean,
    private useUniversalWorker = true
  ) {
    this.totalTime = totalTime;
    this.pitch = pitch;
    this.loopFlag = loopFlag;
  }

  setTotalTime(totalTime: number): void {
    this.totalTime = totalTime;
  }

  setPitch(pitch: number): void {
    this.pitch = pitch;
  }

  setLoopFlag(loopFlag: boolean): void {
    this.loopFlag = loopFlag;
  }

  async play(delay = 0): Promise<void> {
    if (this.isPlaying) {
      throw new Error('TimerWorker already playing');
    }
    this.isPlaying = true;

    if (this.useUniversalWorker) {
      const { createWorker } = await import('./universalWorker');
      this.worker = await createWorker(new URL('./timerWorkerImpl', import.meta.url).href);
      
      this.worker.addEventListener('message', (e) => {
        this.currentTime = e.data.currentTime;
        this.exec();
      });
      
      this.worker.addEventListener('error', (err) => {
        console.error('Worker error:', err);
        this.stop();
      });

      this.worker.postMessage({
        type: 'start',
        pitch: this.pitch,
        totalTime: this.totalTime,
        loopFlag: this.loopFlag,
        delay
      });
    } else {
      console.log(`Starting timer with ${this.pitch}ms pitch after ${delay}ms delay`);
      this.intervalId = setTimeout(() => {
        this.intervalId = setInterval(() => {
          console.log(`Timer tick at ${this.currentTime}ms`);
          this.exec();
        }, this.pitch);
      }, delay);
    }
  }

  stop(delay = 0): void {
    if (!this.isPlaying) {
      throw new Error('TimerWorker not playing');
    }
    console.log(`Stopping timer after ${delay}ms delay`);
    this.isPlaying = false;

    if (this.useUniversalWorker && this.worker) {
      this.worker.postMessage({ type: 'stop' });
      this.worker.terminate();
      this.worker = null;
    } else if (this.intervalId) {
      clearTimeout(this.intervalId);
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private exec(): void {
    if (!this.useUniversalWorker) {
      this.currentTime += this.pitch;
      
      if (this.currentTime >= this.totalTime) {
        this.currentTime -= this.totalTime;
        if (!this.loopFlag) {
          this.stop();
          return;
        }
      }
    }

    this.eventTarget.dispatchEvent(new CustomEvent(TIMER_UPDATE_EVENT, {
      detail: this.currentTime
    }));
  }

  getCurrentTime(): number {
    return this.currentTime;
  }
}