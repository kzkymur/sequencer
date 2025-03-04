import { TIMER_UPDATE_EVENT, WORKER_START_EVENT, WORKER_STOP_EVENT, WORKER_TICK_EVENT } from './const';
import type { UniversalWorker } from './universalWorker';
import { createWorker } from './universalWorker';
import { log } from './logger';

export class Timer {
  private totalTime: number;
  private pitch: number;
  private loopFlag: boolean;
  private intervalId: NodeJS.Timeout | null = null;
  private worker: UniversalWorker | null = null;
  private currentTime = 0;
  private isPlaying = false;
  public eventTarget = new EventTarget();

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

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
    if (totalTime < 0 || Number.isNaN(totalTime)) {
      throw new Error('Total time must be larger than 0');
    }
    this.totalTime = totalTime;
  }

  setPitch(pitch: number): void {
    if (pitch <= 0 || Number.isNaN(pitch)) {
      throw new Error(`Invalid pitch value: ${pitch}. Must be positive number`);
    }
    this.pitch = pitch;
  }

  setLoopFlag(loopFlag: boolean): void {
    this.loopFlag = loopFlag;
  }

  play(delay = 0): void {
    if (Number.isNaN(delay) || delay < 0) {
      throw new Error(`Invalid delay value: ${delay}. Must be non-negative number`);
    }
    if (this.isPlaying) {
      throw new Error('Timer is already playing');
    }
    this.isPlaying = true;

    if (this.useUniversalWorker) {
      createWorker(new URL('./ticker', import.meta.url).href).then(worker => {
        this.worker = worker;
        
        this.worker.addEventListener(WORKER_TICK_EVENT, () => {
          this.currentTime += this.pitch;
          this.exec();
        });
        
        this.worker.addEventListener('error', (err) => {
          console.error('Worker error:', err);
          this.stop();
        });

        this.worker.postMessage({
          type: WORKER_START_EVENT,
          pitch: this.pitch,
          totalTime: this.totalTime,
          loopFlag: this.loopFlag,
          delay
        });
      });
    } else {
      log(`Starting timer with ${this.pitch}ms pitch after ${delay}ms delay`);
      this.intervalId = setTimeout(() => {
        this.intervalId = setInterval(() => {
          log(`Timer tick at ${this.currentTime}ms`);
          this.exec();
        }, this.pitch);
      }, delay);
    }
  }

  stop(delay = 0): void {
    if (Number.isNaN(delay) || delay < 0) {
      throw new Error(`Invalid delay value: ${delay}. Must be non-negative number`);
    }
    if (!this.isPlaying) {
      throw new Error('Timer is not playing');
    }
    log(`Stopping timer after ${delay}ms delay`);
    this.isPlaying = false;

    const executeStop = () => {
      if (this.useUniversalWorker && this.worker) {
        this.worker.postMessage({ type: WORKER_STOP_EVENT });
        this.worker.terminate();
        this.worker = null;
      } else if (this.intervalId) {
        clearTimeout(this.intervalId);
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    };

    if (delay > 0) {
      setTimeout(executeStop, delay);
    } else {
      executeStop();
    }
  }

  /**
   * Resets the timer to initial state
   * @method
   */
  reset(): void {
    this.currentTime = 0;
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