type Callback = (t?: number) => void;

export class Fragment {
  private id: string;
  private name: string;
  private duration: number;
  private callback?: Callback;

  /**
   * Creates a Fragment instance
   * @param {string} name - Unique name for the fragment (non-empty string)
   * @param {number} duration - Duration in milliseconds (positive number)
   * @param {Callback} [callback] - Optional callback function to execute during playback
   * @throws {Error} If name is empty or duration is not positive
   */
  constructor(name: string, duration: number, callback?: Callback) {
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
   * @returns {Callback|undefined} Callback if set
   */
  getCallback(): (Callback)|undefined { return this.callback; }

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
   * @param {Callback} callback - New callback to execute
   */
  setCallback(callback: Callback): void { this.callback = callback; }

  /**
   * Creates a copy of this fragment with new UUID
   * @returns {Fragment} New instance with identical properties
   * @throws {Error} If fragment already exists in sequencer
   */
  copy(): Fragment {
    return new Fragment(this.name, this.duration, this.callback);
  }
}

/**
 * IndependentFragment extends Fragment with start point capability
 */
export class IndependentFragment extends Fragment {
  private startPoint: number;

  /**
   * Creates an IndependentFragment instance
   * @param {string} name - Unique name for the fragment
   * @param {number} duration - Duration in milliseconds
   * @param {number} startPoint - Start time in milliseconds
   * @param {Callback} [callback] - Optional callback function
   */
  constructor(name: string, duration: number, startPoint: number, callback?: Callback) {
    super(name, duration, callback);
    this.startPoint = startPoint;
  }

  /**
   * Gets the fragment's start point
   * @returns {number} Start time in milliseconds
   */
  getStartPoint(): number { return this.startPoint; }

  /**
   * Updates the fragment's start point
   * @param {number} startPoint - New start time in milliseconds
   */
  setStartPoint(startPoint: number): void { this.startPoint = startPoint; }

  /**
   * Creates a copy of this fragment with new UUID
   * @returns {IndependentFragment} New instance with identical properties
   */
  copy(): IndependentFragment {
    return new IndependentFragment(
      this.getName(),
      this.getDuration(),
      this.startPoint,
      this.getCallback()
    );
  }
}

/**
 * CustomFragment bundles multiple fragments into a reusable module
 */
export class CustomFragment extends IndependentFragment {
  private fragments: Array<IndependentFragment|CustomFragment>;

  /**
   * Creates a CustomFragment instance
   * @param {string} name - Unique name for the fragment module
   * @param {number} startPoint - Start time in milliseconds
   * @throws {Error} If name is empty or startPoint is negative
   */
  constructor(name: string, startPoint: number) {
    super(name, 0, startPoint);
    this.fragments = [];
    
    if (!name.trim()) throw new Error("Name cannot be empty");
    if (startPoint < 0) throw new Error("Start point cannot be negative");
  }

  /**
   * Gets calculated duration based on contained fragments
   * @returns {number} Maximum end time of all fragments
   */
  override getDuration(): number {
    return this.fragments.reduce((max, frag) => {
      const end = frag.getStartPoint() + frag.getDuration();
      return Math.max(max, end);
    }, 0);
  }

  /**
   * Adds a fragment to the bundle
   * @param {IndependentFragment|CustomFragment} fragment - Fragment to add
   * @throws {Error} If fragment already exists
   */
  addFragment(fragment: IndependentFragment|CustomFragment): void {
    if (this.fragments.some(f => f.getId() === fragment.getId())) {
      throw new Error(`Fragment ${fragment.getId()} already exists`);
    }
    this.fragments.push(fragment);
  }

  /**
   * Removes a fragment from the bundle
   * @param {IndependentFragment|CustomFragment} fragment - Fragment to remove
   */
  removeFragment(fragment: IndependentFragment|CustomFragment): void {
    this.fragments = this.fragments.filter(f => f.getId() !== fragment.getId());
  }

  /**
   * Executes callbacks for active child fragments
   * @param {number} currentTime - Current sequencer time
   */
  private executeCallbacks(currentTime: number): void {
    this.fragments.forEach(fragment => {
      const start = fragment.getStartPoint();
      const end = start + fragment.getDuration();
      
      if (currentTime >= start && currentTime <= end) {
        if (fragment instanceof CustomFragment) {
          fragment.executeCallbacks(currentTime - start);
        } else if (fragment.getCallback()) {
          fragment.getCallback()!(currentTime);
        }
      }
    });
  }

  /**
   * Creates a copy with new UUID and cloned fragments
   * @returns {CustomFragment} New instance
   */
  override copy(): CustomFragment {
    const copy = new CustomFragment(this.getName(), this.getStartPoint());
    this.fragments.forEach(f => copy.addFragment(f.copy()));
    return copy;
  }

  /**
   * @override Prevent direct callback modification
   */
  override setCallback(): never {
    throw new Error('CustomFragment callback cannot be set directly');
  }

  /**
   * @override Get automatic callback handler
   */
  override getCallback(): Callback {
    return (currentTime?: number) => {
      if (currentTime === undefined) {
        throw new Error("currentTime have to be number");
      }
      this.executeCallbacks(currentTime);
    }
  }

  /**
   * Gets a copy of all fragments in the CustomFragment
   * @returns {Fragment[]} Copy of fragments array
   */
  getFragments(): Fragment[] { return [...this.fragments]; }
}