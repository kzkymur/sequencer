export class Fragment {
  private id: string;
  private name: string;
  private duration: number;
  private callback?: () => void;

  /**
   * Creates a Fragment instance
   * @param {string} name - Unique name for the fragment
   * @param {number} duration - Duration in milliseconds
   * @param {() => void} [callback] - Optional callback function
   */
  constructor(name: string, duration: number, callback?: () => void) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.duration = duration;
    this.callback = callback;
  }

  /**
   * Gets the fragment's name
   * @returns {string} Current name
   */
  getName(): string { return this.name; }

  /**
   * Gets the fragment's duration
   * @returns {number} Duration in milliseconds
   */
  getDuration(): number { return this.duration; }

  /**
   * Gets the callback function
   * @returns {(() => void)|undefined} Callback if set
   */
  getCallback(): (() => void)|undefined { return this.callback; }

  /**
   * Gets the unique fragment ID (read-only)
   * @returns {string} UUID generated at creation
   */
  getId(): string { return this.id; }

  /**
   * Updates the fragment's name
   * @param {string} name - New name value
   */
  setName(name: string): void { this.name = name; }

  /**
   * Updates the fragment's duration
   * @param {number} duration - New duration in milliseconds
   */
  setDuration(duration: number): void { this.duration = duration; }

  /**
   * Updates the callback function
   * @param {() => void} callback - New callback to execute
   */
  setCallback(callback: () => void): void { this.callback = callback; }

  /**
   * Creates a copy of this fragment with new UUID
   * @returns {Fragment} New instance with identical properties
   * @throws {Error} If fragment already exists in sequencer
   */
  copy(): Fragment {
    return new Fragment(this.name, this.duration, this.callback);
  }
}