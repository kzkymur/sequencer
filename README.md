# Sequencer - Precision Timeline Control Library

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript library for precise sequencing and scheduling of timeline-based operations. Provides two distinct modes for different sequencing needs.

## Features

- 🕒 Millisecond-precision timing control
- 🔁 Loopable sequences with adjustable speed
- 🧩 Fragment-based architecture
- 🎛️ Queue Mode (linear execution) and Independent Mode (parallel execution)
- 🖥️ Canvas-based visualization tools
- 🧪 Full test coverage with Vitest

## Installation

```bash
npm install @kzkymur/sequencer
```

## Usage

### Queue Mode (Linear Sequencing)
```typescript
import { Sequencer, Fragment } from '@kzkymur/sequencer';

// Create fragments
const fragment1 = new Fragment('Intro', 1000, () => console.log('Start!'));
const fragment2 = new Fragment('Main', 2000, () => console.log('Running'));

// Create sequencer
const sequencer = new Sequencer({
  pitch: 100,
  speed: 1.0,
  loop: false
});

// Add fragments
sequencer.push(fragment1);
sequencer.push(fragment2);

// Control playback
sequencer.play();
```

### Independent Mode (Parallel Sequencing)
```typescript
import { IndependentSequencer, IndependentFragment } from '@kzkymur/sequencer';

// Create parallel fragments
const fragmentA = new IndependentFragment('SFX', 500, 0, () => playSound());
const fragmentB = new IndependentFragment('Animation', 1000, 250, () => updateFrame());

// Create independent sequencer
const sequencer = new IndependentSequencer({
  pitch: 50,
  speed: 1.0,
  loop: true
});

// Add fragments (order irrelevant)
sequencer.push(fragmentA);
sequencer.push(fragmentB);

// Start parallel execution
sequencer.play();
```

## API Documentation

### Core Classes

#### `Fragment`
- `constructor(name: string, duration: number, callback?: Function)`
- Methods: `copy()`, `updateDuration()`, `updateCallback()`

#### `IndependentFragment` (extends Fragment)
- `constructor(name: string, duration: number, startPoint: number, callback?: Function)`
- Additional methods: `updateStartPoint()`

#### `Sequencer`
- `constructor(config: { pitch: number, speed: number, loop: boolean })`
- Methods: `push()`, `remove()`, `insert()`, `play()`, `stop()`, `replay()`

#### `IndependentSequencer` (extends Sequencer)
- Modified execution logic for parallel fragments
- Disabled `insert()` method

## Examples

Explore complete implementation examples:
- Queue Mode: `/example/queue/index.ts`
- Independent Mode: `/example/independent/index.ts`

## Testing

```bash
npm test              # Run test suite
npm run test:coverage # Generate coverage report
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.