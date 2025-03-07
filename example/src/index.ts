import { Sequencer, Fragment } from '../../src/main';

let sequencer: Sequencer = new Sequencer(100, false, 1.0, true);
let fragments: Fragment[] = [];

// Configuration handlers
document.getElementById('pitch')!.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLInputElement;
  sequencer.setPitch( parseInt(target.value));
});

document.getElementById('speed')!.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLInputElement;
  sequencer.setSpeed(Number(target.value));
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
const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement;
const playBtn = document.getElementById('play-btn') as HTMLButtonElement;
const stopBtn = document.getElementById('stop-btn') as HTMLButtonElement;

// Initialize button states
stopBtn.disabled = true;
replayBtn.disabled = true;

replayBtn.addEventListener('click', async () => {
  try {
    updateStatus('Replaying');
    playBtn.disabled = true;
    stopBtn.disabled = false;
    replayBtn.disabled = true;
    await sequencer.replay();
  } catch (err) {
    updateStatus(`Error: ${(err as Error).message}`);
  } finally {
    playBtn.disabled = false;
    stopBtn.disabled = true;
    replayBtn.disabled = false;
  }
});

playBtn.addEventListener('click', async () => {
  updateStatus('Playing');
  animateProgress();
  playBtn.disabled = true;
  stopBtn.disabled = false;
  replayBtn.disabled = true;
  await sequencer.play();
  
  playBtn.disabled = false;
  stopBtn.disabled = true;
  replayBtn.disabled = false;
  updateStatus('Completed');
});

stopBtn.addEventListener('click', () => {
  sequencer.stop();
  updateStatus('Stopped');
  resetProgress();
  playBtn.disabled = false;
  stopBtn.disabled = true;
  animateProgress();        // Force re-render
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
    // Always render visualization regardless of play state
    sequencer.renderToCanvas(ctx, {
      width,
      height,
      activeColor: '#ff6b6b',
      inactiveColor: '#4ecdc4',
      timeIndicatorColor: '#ffe66d'
    });
    requestAnimationFrame(renderFrame);
    sequencer.renderToCanvas(ctx, {
      width,
      height,
      activeColor: '#ff6b6b',
      inactiveColor: '#4ecdc4',
      timeIndicatorColor: '#ffe66d'
    });
  }
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