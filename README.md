# Sequencer Library

A TypeScript library for precise timeline sequencing with queue and independent modes.

## Installation

```bash
npm install @roo/sequencer
```

## Features

- 🎛️ Two sequencing modes: Queue and Independent
- ⏱️ Precise millisecond-level control
- 🔁 Loop support
- 🛠️ Runtime editing of sequences
- 📈 Speed control (0.1x-10x)

## Usage

### Queue Mode Example

```typescript
import { Sequencer, Fragment } from '@roo/sequencer';

// Create fragments
const intro = new Fragment('Intro', 2000);
const main = new Fragment('Main', 5000, () => console.log('Main action!'));
const outro = new Fragment('Outro', 3000);

// Create sequencer
const queueSequencer = new Sequencer(100, 1.0, false);
queueSequencer.push(intro);
queueSequencer.push(main);
queueSequencer.push(outro);

// Control playback
queueSequencer.play();
queueSequencer.stop(2000); // Stop after 2 seconds
```

### Independent Mode Example

```typescript
import { IndependentSequencer, IndependentFragment } from '@roo/sequencer';

// Create overlapping fragments
const bgMusic = new IndependentFragment('Music', 10000, 0);
const effect = new IndependentFragment('Effect', 500, 3500);

// Create independent sequencer
const indepSequencer = new IndependentSequencer(50, 1.0, true);
indepSequencer.push(bgMusic);
indepSequencer.push(effect);

// Play indefinitely
indepSequencer.play();
```

## API Reference

### Fragment Types

| Class                | Properties              | Description                     |
|----------------------|-------------------------|---------------------------------|
| `Fragment`           | name, duration, callback | Base queue fragment            |
| `IndependentFragment`| + startPoint            | Positionable independent fragment |

### Sequencer Classes

#### Queue Sequencer
```typescript
class Sequencer {
  constructor(pitch: number, speed: number, loop: boolean);
  push(fragment: Fragment): void;
  remove(fragment: Fragment): void;
  play(delay?: number): void;
  stop(delay?: number): void;
  replay(delay?: number): void;
}
```

#### Independent Sequencer
```typescript
class IndependentSequencer extends Sequencer {
  // Inherits base methods with different execution logic
}
```

### Timer Control
```typescript
interface Timer {
  setPitch(ms: number): void;
  setSpeed(multiplier: number): void;
  toggleLoop(enable: boolean): void;
}
```

## Architecture Overview

```
src/
├── fragments.ts     # Fragment base classes
├── sequencer.ts     # Sequencer implementations
├── timer.ts         # Precision timing control
├── ticker.ts        # Web Worker-based tick generator
└── const.ts         # Event constants
```

## Testing

Run test suite with coverage:
```bash
npm run test:coverage
```

Requirements:
- 90%+ line coverage
- All public API methods tested
- Edge case validation

## Examples

Explore sample implementations in:
- `index.html` - Browser demo
- `example/src/index.ts` - TypeScript usage examples

## Contributing

1. Clone repository
2. Install dependencies: `npm install`
3. Implement features/fixes
4. Update tests
5. Verify quality:
```bash
npm run lint
npm run build
npm run test:coverage
```

## License

MIT © 2025 Roo Veterinary Inc.