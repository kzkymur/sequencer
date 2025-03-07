import { Fragment } from './fragments';
import { Timer } from './timer';
import { TIMER_UPDATE_EVENT } from './const';

export class Sequencer {
  private fragments: Fragment[] = [];
  public timer: Timer;

  /**
   * Creates a Sequencer instance
   * @param pitch - Update interval in milliseconds
   * @param loopFlag - Whether to loop playback
   * @param speed - Playback speed multiplier (1.0 = normal speed)
   * @param useUniversalWorker - Use shared worker for timing precision
   */
  constructor(private pitch: number, private loopFlag: boolean, private speed = 1.0, useUniversalWorker = false) {
    this.timer = new Timer(0, pitch, loopFlag, this.speed, useUniversalWorker);
    this.timer.eventTarget.addEventListener(TIMER_UPDATE_EVENT, (e) => {
      this.exec((e as CustomEvent).detail);
    });
  }
  /**
   * Gets a copy of all fragments in the sequencer
   * @returns {Fragment[]} Copy of fragments array
   */
  getFragments(): Fragment[] { return [...this.fragments]; }

  /**
   * Gets the current update interval
   * @returns {number} Pitch value in milliseconds
   */
  getPitch(): number { return this.pitch; }

  /**
   * Checks if sequencer is configured to loop
   * @returns {boolean} Current loop status
   */
  isLooping(): boolean { return this.loopFlag; }

  /**
   * Updates the sequencer's update interval
   * @param {number} pitch - New interval in milliseconds
   * @throws {Error} If pitch is invalid (≤0 or NaN)
   */
  setPitch(pitch: number): void {
    if (pitch <= 0 || Number.isNaN(pitch)) {
      throw new Error(`Invalid pitch value: ${pitch}. Must be positive number`);
    }

    this.pitch = pitch;
    this.timer.setPitch(pitch);
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
    this.timer.setSpeed(speed);
  }

  /**
   * Updates the loop configuration
   * @param {boolean} loopFlag - New loop status
   */
  setLoopFlag(loopFlag: boolean): void {
    this.loopFlag = loopFlag;
    this.timer.setLoopFlag(loopFlag);
  }

  /**
   * Adds fragment to sequencer
   * @param {Fragment} fragment - Fragment to add
   * @throws {Error} If fragment already exists
   */
  push(fragment: Fragment): void {
    if (this.fragments.some(f => f.getId() === fragment.getId())) {
      throw new Error('Fragment already exists in sequencer');
    }
    this.fragments.push(fragment);
    this.updateTotalTime();
  }

  /**
   * Removes fragment from sequencer
   * @param {Fragment} fragment - Fragment to remove
   * @throws {Error} If fragment not found
   */
  remove(fragment: Fragment): void {
    const index = this.fragments.findIndex(f => f.getId() === fragment.getId());
    if (index === -1) throw new Error('Fragment not found in sequencer');
    this.fragments.splice(index, 1);
    this.updateTotalTime();
  }

  /**
   * Starts playback
   * @param {number} [delay=0] - Delay in milliseconds before starting
   * @throws {Error} If delay is invalid or already playing
   */
  play(delay = 0): Promise<void> {
    if (Number.isNaN(delay) || delay < 0) {
      throw new Error(`Invalid delay value: ${delay}. Must be non-negative number`);
    }
    if (this.timer.getIsPlaying()) throw new Error('Sequencer is already playing');
    return this.timer.play(delay);
  }

  /**
   * Checks if sequencer is currently playing
   * @returns True if playback is active
   */
  isPlaying(): boolean {
    return this.timer.getIsPlaying();
  }

  waitCompleted(): Promise<void> {
    if (!this.timer.getIsPlaying()) throw new Error('Sequencer is not playing');
    return this.timer.completionPromise;
  }

  stop(delay = 0): void {
    if (Number.isNaN(delay) || delay < 0) {
      throw new Error(`Invalid delay value: ${delay}. Must be non-negative number`);
    }
    if (!this.timer.getIsPlaying()) throw new Error('Sequencer is not playing');
    this.timer.stop(delay);
  }

  /**
   * Restarts playback from the beginning
   * @param delay - Delay in milliseconds before restarting (default: 0)
   * @throws {Error} If sequencer is not currently playing
   */
  replay(delay = 0): Promise<void> {
    if (this.timer.getIsPlaying()) {
      throw new Error('Sequencer is playing');
    }
    
    // Stop immediately without delay to ensure clean reset
    this.timer.reset();
    return this.timer.play(delay);
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

  /**
   * Renders sequencer visualization to canvas context
   * @param ctx Canvas 2D rendering context
   * @param options Visualization configuration
   */
  renderToCanvas(
    ctx: CanvasRenderingContext2D,
    options: {
      width?: number;
      height?: number;
      activeColor?: string;
      inactiveColor?: string;
      timeIndicatorColor?: string;
    }
  ): void {
    const totalDuration = this.fragments.reduce((sum, f) => sum + f.getDuration(), 0);
    const currentTime = this.timer.getCurrentTime() % totalDuration;
    const width = options.width || ctx.canvas.width;
    const height = options.height || ctx.canvas.height;
    const activeColor = options.activeColor || '#ff4757';
    const inactiveColor = options.inactiveColor || '#2ed573';
    const timeColor = options.timeIndicatorColor || '#ffa502';

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw timeline background
    ctx.fillStyle = inactiveColor;
    ctx.fillRect(0, height / 2 - 2, width, 4);

    // Draw fragments
    let accumulated = 0;
    for (const fragment of this.fragments) {
      const fragmentWidth = (fragment.getDuration() / totalDuration) * width;
      const isActive = currentTime >= accumulated &&
        currentTime <= accumulated + fragment.getDuration();

      ctx.fillStyle = isActive ? activeColor : inactiveColor;
      ctx.fillRect(
        (accumulated / totalDuration) * width,
        height / 2 - 15,
        fragmentWidth,
        30
      );

      // Fragment name
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '12px Arial';
      ctx.fillText(
        fragment.getName(),
        (accumulated / totalDuration) * width + fragmentWidth / 2,
        height / 2
      );

      accumulated += fragment.getDuration();
    }

    // Draw current time indicator
    ctx.fillStyle = timeColor;
    const indicatorX = (currentTime / totalDuration) * width;
    ctx.beginPath();
    ctx.arc(indicatorX, height / 2, height / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}