import { Sequencer, Fragment } from '../../dist/seauencer-lib';

let sequencer: Sequencer = new Sequencer(100, false);
let fragments: Fragment[] = [];

// Configuration handlers
document.getElementById('pitch')!.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLInputElement;
  sequencer.setPitch( parseInt(target.value));
});

document.getElementById('loop')!.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLInputElement;
  sequencer.setLoopFlag( target.checked);
});

// Fragment form handler
document.getElementById('fragment-form')!.addEventListener('submit', (e: SubmitEvent) => {
  e.preventDefault();
  const nameInput = document.getElementById('frag-name') as HTMLInputElement;
  const durationInput = document.getElementById('frag-duration') as HTMLInputElement;
  
  const name = nameInput.value;
  const duration = parseInt(durationInput.value);
  
  const fragment = new Fragment(name, duration, () => {
    console.log(`Executing fragment: ${name}`);
  });
  
  fragments.push(fragment);
  sequencer.push(fragment);
  updateFragmentList();
  (e.target as HTMLFormElement).reset();
});

// Playback controls
document.getElementById('play-btn')!.addEventListener('click', () => {
  sequencer.play();
  updateStatus('Playing');
  animateProgress();
});

document.getElementById('stop-btn')!.addEventListener('click', () => {
  sequencer.stop();
  updateStatus('Stopped');
  resetProgress();
});

function updateFragmentList(): void {
  const list = document.getElementById('fragment-list')!;
  list.innerHTML = fragments.map(frag => `
    <li class="fragment-item">
      <span>${frag.getName()} (${frag.getDuration()}ms)</span>
      <button onclick="removeFragment('${frag.getId()}')">Remove</button>
    </li>
  `).join('');
}

const canvas = document.getElementById('visualization-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function animateProgress(): void {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width, canvas.height = height;
  const renderFrame = () => {
    if (sequencer.isLooping() || sequencer.timer.getIsPlaying()) {
      sequencer.renderToCanvas(ctx, {
        width,
        height,
        activeColor: '#ff6b6b',
        inactiveColor: '#4ecdc4',
        timeIndicatorColor: '#ffe66d'
      });
      requestAnimationFrame(renderFrame);
    }
  };
  requestAnimationFrame(renderFrame);
}

function resetProgress(): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updateStatus(text: string): void {
  document.getElementById('status')!.textContent = `Status: ${text}`;
}

// Extend window interface to include removeFragment
declare global {
  interface Window {
    removeFragment: (id: string) => void;
  }
}

window.removeFragment = (id: string) => {
  const fragment = fragments.find(frag => frag.getId() === id);
  if (fragment) {
    sequencer.remove(fragment);
    fragments = fragments.filter(frag => frag.getId() !== id);
    updateFragmentList();
  }
};