import { TIMER_UPDATE_EVENT, WORKER_START_EVENT, WORKER_STOP_EVENT, WORKER_TICK_EVENT, WORKER_UPDATE_EVENT } from './const';
import type { UniversalWorker } from './universalWorker';
import { createWorker } from './universalWorker';
import { log } from './logger';

type TimerUpdate =
  | { type: 'pitch'; value: number }
  | { type: 'totalTime'; value: number }
  | { type: 'loopFlag'; value: boolean };

export class Timer {
  private totalTime: number;
  private pitch: number;
  private loopFlag: boolean;
  private intervalId: NodeJS.Timeout | null = null;
  private worker: UniversalWorker | null = null;
  private currentTime = 0;
  private isPlaying = false;
  public eventTarget = new EventTarget();

  public completionPromise!: Promise<void>;
  private resolveCompletion!: () => void;

  /**
   * Creates a Timer instance
   * @param totalTime - Total duration in milliseconds
   * @param pitch - Interval duration between ticks in milliseconds
   * @param loopFlag - Whether to loop when reaching totalTime
   * @param speed - Playback speed multiplier (default: 1.0)
   * @param useUniversalWorker - Use web worker for timing (default: false)
   */
  constructor(
    totalTime: number,
    pitch: number,
    loopFlag: boolean,
    private speed: number = 1.0,
    private useUniversalWorker = false
  ) {
    this.totalTime = totalTime;
    this.pitch = pitch;
    this.loopFlag = loopFlag;
    this.speed = speed;
    this.useUniversalWorker = useUniversalWorker;
  }

  /**
   * Gets current playback state
   * @returns True if timer is active
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Sets total timer duration
   * @param totalTime - New duration in milliseconds
   * @throws Error if value is negative or NaN
   */
  setTotalTime(totalTime: number): void {
    if (totalTime < 0 || Number.isNaN(totalTime)) {
      throw new Error('Total time must be larger than 0');
    }
    this.totalTime = totalTime;
    this.sendUpdate({ type: 'totalTime', value: totalTime });
  }

  /**
   * Sets interval duration between ticks
   * @param pitch - New pitch value in milliseconds
   * @throws Error if value is not positive
   */
  setPitch(pitch: number): void {
    if (pitch <= 0 || Number.isNaN(pitch)) {
      throw new Error(`Invalid pitch value: ${pitch}. Must be positive number`);
    }
    this.pitch = pitch;
    this.sendUpdate({ type: 'pitch', value: pitch });
  }

  /**
   * Sets playback speed multiplier
   * @param speed - Speed multiplier (1.0 = normal speed)
   * @throws Error if value is not positive
   */
  setSpeed(speed: number): void {
    if (speed <= 0 || Number.isNaN(speed)) {
      throw new Error(`Invalid speed value: ${speed}. Must be positive number`);
    }
    this.speed = speed;
  }

  private sendUpdate(update: TimerUpdate): void {
    if (this.worker) {
      this.worker.postMessage({
        type: WORKER_UPDATE_EVENT,
        payload: update
      });
    }
  }

  /**
   * Sets whether the timer should loop
   * @param loopFlag - True to enable looping
   */
  setLoopFlag(loopFlag: boolean): void {
    this.loopFlag = loopFlag;
    this.sendUpdate({ type: 'loopFlag', value: loopFlag });
  }

  /**
   * Starts the timer
   * @param delay - Delay in milliseconds before starting (default: 0)
   * @returns Promise that resolves when timer completes
   * @throws Error if invalid delay or timer already playing
   */
  play(delay = 0): Promise<void> {
    if (Number.isNaN(delay) || delay < 0) {
      throw new Error(`Invalid delay value: ${delay}. Must be non-negative number`);
    }
    if (this.isPlaying) {
      throw new Error('Timer is already playing');
    }

    this.completionPromise = new Promise((resolve) => {
      this.resolveCompletion = resolve;
    });

    this.isPlaying = true;

    if (!this.useUniversalWorker) {
      log(`Starting timer with ${this.pitch}ms pitch after ${delay}ms delay`);
      this.intervalId = setTimeout(() => {
        this.intervalId = setInterval(() => {
          log(`Timer tick at ${this.currentTime}ms`);
          this.exec();
        }, this.pitch);
      }, delay);
      return this.completionPromise;
    }

    createWorker(new URL('./ticker', import.meta.url).href).then(worker => {
      this.worker = worker;
      
      const messageHandler = (e: MessageEvent) => {
        if (e.data.type !== WORKER_TICK_EVENT) return;
        this.currentTime += this.pitch * this.speed;
        this.exec();
      };
      this.worker.addEventListener("message", messageHandler);
        
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
    })
    return this.completionPromise;
  }

  /**
   * Stops the timer
   * @param delay - Delay in milliseconds before stopping (default: 0)
   * @throws Error if invalid delay or timer not playing
   */
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
      this.resolveCompletion();
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
    }
      
    if (this.currentTime >= this.totalTime) {
      this.currentTime -= this.totalTime;
      if (!this.loopFlag) {
        this.resolveCompletion();
        this.stop();
        return;
      }
    }

    this.eventTarget.dispatchEvent(new CustomEvent(TIMER_UPDATE_EVENT, {
      detail: this.currentTime
    }));
  }

  /**
   * Gets current elapsed time
   * @returns Current time in milliseconds
   */
  getCurrentTime(): number {
    return this.currentTime;
  }
}