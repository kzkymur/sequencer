import { Fragment, IndependentFragment } from './fragments';
import { Timer } from './timer';
import { TIMER_UPDATE_EVENT } from './const';

export class Sequencer {
  protected fragments: Fragment[] = [];
  public timer: Timer;

  /**
   * Creates a Sequencer instance
   * @param pitch - Update interval in milliseconds
   * @param loopFlag - Whether to loop playback
   * @param speed - Playback speed multiplier (1.0 = normal speed)
   * @param useUniversalWorker - Use shared worker for timing precision
   */
  constructor(private pitch: number, private speed = 1.0, private loopFlag: boolean, useUniversalWorker = false) {
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
   * Gets the current playback time
   * @returns {number} Current time in milliseconds
   */
  getCurrentTime(): number { return this.timer.getCurrentTime(); }

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
   * Inserts fragment at specified position
   * @param {number} index - Position to insert at
   * @param {Fragment} fragment - Fragment to insert
   * @throws {Error} If fragment exists or index invalid
   */
  insert(index: number, fragment: Fragment): void {
    if (index < 0 || index > this.fragments.length) {
      throw new Error(`Invalid index: ${index}. Must be between 0 and ${this.fragments.length}`);
    }
    if (this.fragments.some(f => f.getId() === fragment.getId())) {
      throw new Error('Fragment already exists in sequencer');
    }
    this.fragments.splice(index, 0, fragment);
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
  isPlaying(): boolean { return this.timer.getIsPlaying(); }

  /**
   * Returns a promise that resolves when playback completes
   * @returns {Promise<void>} Completion promise
   * @throws {Error} If sequencer isn't playing
   */
  waitCompleted(): Promise<void> {
    if (!this.timer.getIsPlaying()) throw new Error('Sequencer is not playing');
    return this.timer.completionPromise;
  }

  /**
   * Stops playback
   * @param {number} [delay=0] - Delay in milliseconds before stopping
   * @throws {Error} If delay is invalid or sequencer not playing
   */
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

  protected updateTotalTime(): void {
    const total = this.fragments.reduce((sum, f) => sum + f.getDuration(), 0);
    this.timer.setTotalTime(total);
  }

  protected exec(currentTime: number): void {
    let accumulated = 0;
    for (const fragment of this.fragments) {
      if (currentTime < accumulated + fragment.getDuration()) {
        fragment.getCallback()?.();
        return;
      }
      accumulated += fragment.getDuration();
    }
  }

  /**
   * Renders sequencer visualization to canvas context
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
   * @param {Object} options - Visualization configuration
   * @param {number} [options.width] - Canvas width
   * @param {number} [options.height] - Canvas height
   * @param {string} [options.activeColor] - Color for active fragments
   * @param {string} [options.inactiveColor] - Color for inactive fragments
   * @param {string} [options.timeIndicatorColor] - Color for time indicator
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

/**
 * IndependentSequencer handles fragments with individual start points
 */
export class IndependentSequencer extends Sequencer {
  /**
   * @override Disabled for IndependentSequencer
   * @throws {Error} Always throws since insertion order is irrelevant
   */
  insert(_: number, __: Fragment): never {
    throw new Error('Insert operation not supported for IndependentSequencer');
  }
  /**
   * Executes callbacks for all fragments active at currentTime
   * @param currentTime - Current playback time in milliseconds
   */
  protected exec(currentTime: number): void {
    // Handle loop reset if enabled
    if (this.isLooping()) {
      const totalTime = this.getTotalTime();
      if (totalTime > 0 && currentTime >= totalTime) {
        currentTime %= totalTime;
      }
    }

    // Check all fragments for activation
    for (const fragment of this.getFragments()) {
      if (fragment instanceof IndependentFragment) {
        const start = fragment.getStartPoint();
        const end = start + fragment.getDuration();
        
        if (currentTime >= start && currentTime < end) {
          fragment.getCallback()?.();
        }
      }
    }
  }

  /**
   * Gets total time (max fragment end time)
   * @returns Maximum end time of all fragments
   */
  getTotalTime(): number {
    return this.getFragments().reduce((max, frag) => {
      if (frag instanceof IndependentFragment) {
        return Math.max(max, frag.getStartPoint() + frag.getDuration());
      }
      return max;
    }, 0);
  }

  protected updateTotalTime(): void {
    this.timer.setTotalTime(this.getTotalTime());
  }

  /**
   * Renders sequencer visualization to canvas context for Independent Mode
   * @param ctx - Canvas 2D rendering context
   * @param options - Visualization configuration
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
    const fragments = this.getFragments().filter((f): f is IndependentFragment => f instanceof IndependentFragment);
    if (fragments.length === 0) return;

    const totalDuration = this.getTotalTime();
    if (totalDuration === 0) return;

    const currentTime = this.timer.getCurrentTime();
    const effectiveTime = this.isLooping() ? currentTime % totalDuration : currentTime;

    const width = options.width || ctx.canvas.width;
    const height = options.height || ctx.canvas.height;
    const activeColor = options.activeColor || '#ff4757';
    const inactiveColor = options.inactiveColor || '#2ed573';
    const timeColor = options.timeIndicatorColor || '#ffa502';

    // Calculate maximum concurrent fragments
    const points: Array<{ time: number, type: 'start' | 'end' }> = [];
    for (const frag of fragments) {
      points.push({ time: frag.getStartPoint(), type: 'start' });
      points.push({ time: frag.getStartPoint() + frag.getDuration(), type: 'end' });
    }
    points.sort((a, b) => a.time - b.time || (a.type === 'end' ? -1 : 1));

    let currentConcurrency = 0;
    let maxConcurrency = 0;
    for (const point of points) {
      currentConcurrency += point.type === 'start' ? 1 : -1;
      maxConcurrency = Math.max(maxConcurrency, currentConcurrency);
    }

    if (maxConcurrency === 0) return;
    const laneHeight = height / maxConcurrency;

    // Assign fragments to lanes
    const sortedFragments = [...fragments].sort((a, b) => a.getStartPoint() - b.getStartPoint());
    const lanes: number[] = [];
    const assignments: Array<{ fragment: IndependentFragment, lane: number }> = [];

    for (const frag of sortedFragments) {
      const start = frag.getStartPoint();
      const end = start + frag.getDuration();
      let lane = lanes.findIndex(laneEnd => laneEnd <= start);
      if (lane === -1) {
        lane = lanes.length;
        lanes.push(end);
      } else {
        lanes[lane] = end;
      }
      assignments.push({ fragment: frag, lane });
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw timeline background
    ctx.fillStyle = inactiveColor;
    ctx.fillRect(0, height / 2 - 1, width, 2);

    // Draw fragments
    assignments.forEach(({ fragment, lane }) => {
      const start = fragment.getStartPoint();
      const duration = fragment.getDuration();
      const isActive = effectiveTime >= start && effectiveTime < start + duration;

      const x = (start / totalDuration) * width;
      const fragmentWidth = (duration / totalDuration) * width;
      const y = lane * laneHeight;

      ctx.fillStyle = isActive ? activeColor : inactiveColor;
      ctx.fillRect(x, y + 2, fragmentWidth, laneHeight - 4);

      // Fragment name
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = '10px Arial';
      ctx.fillText(fragment.getName(), x + 4, y + 4);
    });

    // Draw current time indicator
    ctx.fillStyle = timeColor;
    const indicatorX = (effectiveTime / totalDuration) * width;
    ctx.beginPath();
    ctx.moveTo(indicatorX, 0);
    ctx.lineTo(indicatorX, height);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}