import { TIMER_UPDATE_EVENT } from './const';

export class TimerWorker {
  private totalTime: number;
  private pitch: number;
  private loopFlag: boolean;
  private intervalId: number | null = null;
  private currentTime = 0;
  private isPlaying = false;
  public eventTarget = new EventTarget();

  constructor(totalTime: number, pitch: number, loopFlag: boolean) {
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

  play(delay = 0): void {
    if (this.isPlaying) {
      throw new Error('TimerWorker already playing');
    }
    this.isPlaying = true;
    console.log(`Starting timer with ${this.pitch}ms pitch after ${delay}ms delay`);
    this.intervalId = setTimeout(() => {
      this.intervalId = setInterval(() => {
        console.log(`Timer tick at ${this.currentTime}ms`);
        this.exec();
      }, this.pitch);
    }, delay);
  }

  stop(delay = 0): void {
    if (!this.isPlaying) {
      throw new Error('TimerWorker not playing');
    }
    console.log(`Stopping timer after ${delay}ms delay`);
    this.isPlaying = false;
    
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private exec(): void {
    this.currentTime += this.pitch;
    
    if (this.currentTime >= this.totalTime) {
      if (this.loopFlag) {
        this.currentTime %= this.totalTime;
      } else {
        this.stop();
        return;
      }
    }

    this.eventTarget.dispatchEvent(new CustomEvent(TIMER_UPDATE_EVENT, {
      detail: this.currentTime
    }));
  }
}