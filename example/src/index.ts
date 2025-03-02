import { Sequencer, Fragment } from '../../src/main';

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

function animateProgress(): void {
  const progressBar = document.querySelector('.progress-bar') as HTMLElement;
  let width = 0;
  const totalDuration = fragments.reduce((sum, frag) => sum + frag.getDuration(), 0);
  const interval = setInterval(() => {
    if (width >= 100) {
      if (sequencer.isLooping()) {
        width = 0;
      } else {
        clearInterval(interval);
      }
    }
    width += (sequencer.getPitch() / totalDuration) * 100;
    progressBar.style.width = `${Math.min(width, 100)}%`;
  }, sequencer.getPitch());
}

function resetProgress(): void {
  (document.querySelector('.progress-bar') as HTMLElement).style.width = '0%';
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