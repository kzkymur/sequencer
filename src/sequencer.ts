import { Fragment } from './fragments';
import { Timer } from './timer';
import { TIMER_UPDATE_EVENT } from './const';

export class Sequencer {
  private fragments: Fragment[] = [];
  private pitch: number;
  private loopFlag: boolean;
  public timer: Timer;

  constructor(pitch: number, loopFlag: boolean, useUniversalWorker = false) {
    this.pitch = pitch;
    this.loopFlag = loopFlag;
    this.timer = new Timer(0, pitch, loopFlag, useUniversalWorker);
    this.timer.eventTarget.addEventListener(TIMER_UPDATE_EVENT, (e) => {
      this.exec((e as CustomEvent).detail);
    });
  }

  getFragments(): Fragment[] { return [...this.fragments]; }
  getPitch(): number { return this.pitch; }
  isLooping(): boolean { return this.loopFlag; }

  setPitch(pitch: number): void {
    if (pitch <= 0 || Number.isNaN(pitch)) {
      throw new Error(`Invalid pitch value: ${pitch}. Must be positive number`);
    }
    this.pitch = pitch;
    this.timer.setPitch(pitch);
  }

  setLoopFlag(loopFlag: boolean): void {
    this.loopFlag = loopFlag;
    this.timer.setLoopFlag(loopFlag);
  }

  push(fragment: Fragment): void {
    if (this.fragments.some(f => f.getId() === fragment.getId())) {
      throw new Error('Fragment already exists in sequencer');
    }
    this.fragments.push(fragment);
    this.updateTotalTime();
  }

  remove(fragment: Fragment): void {
    const index = this.fragments.findIndex(f => f.getId() === fragment.getId());
    if (index === -1) throw new Error('Fragment not found in sequencer');
    this.fragments.splice(index, 1);
    this.updateTotalTime();
  }

  play(delay = 0): void {
    if (Number.isNaN(delay) || delay < 0) {
      throw new Error(`Invalid delay value: ${delay}. Must be non-negative number`);
    }
    if (this.timer.getIsPlaying()) throw new Error('Sequencer is already playing');
    this.timer.play(delay);
  }

  stop(delay = 0): void {
    if (Number.isNaN(delay) || delay < 0) {
      throw new Error(`Invalid delay value: ${delay}. Must be non-negative number`);
    }
    if (!this.timer.getIsPlaying()) throw new Error('Sequencer is not playing');
    this.timer.stop(delay);
  }

  private updateTotalTime(): void {
    const total = this.fragments.reduce((sum, f) => sum + f.getDuration(), 0);
    this.timer.setTotalTime(total);
  }

  private exec(currentTime: number): void {
    let accumulated = 0;
    for (const fragment of this.fragments) {
      if (currentTime <= accumulated + fragment.getDuration()) {
        fragment.getCallback()?.();
        return;
      }
      accumulated += fragment.getDuration();
    }
  }
}