export class Fragment {
  private id: string;
  private name: string;
  private duration: number;
  private callback?: () => void;

  constructor(name: string, duration: number, callback?: () => void) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.duration = duration;
    this.callback = callback;
  }

  getName(): string { return this.name; }
  getDuration(): number { return this.duration; }
  getCallback(): (() => void)|undefined { return this.callback; }
  getId(): string { return this.id; }

  setName(name: string): void { this.name = name; }
  setDuration(duration: number): void { this.duration = duration; }
  setCallback(callback: () => void): void { this.callback = callback; }

  copy(): Fragment {
    return new Fragment(this.name, this.duration, this.callback);
  }
}