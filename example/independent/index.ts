import { IndependentSequencer, IndependentFragment, CustomFragment } from '../../src/main';

let sequencer: IndependentSequencer = new IndependentSequencer(100, 1.0, false);
let fragments: Array<IndependentFragment | CustomFragment> = [];

// Configuration handlers
document.getElementById('pitch')!.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLInputElement;
  sequencer.setPitch(parseInt(target.value));
});

document.getElementById('speed')!.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLInputElement;
  sequencer.setSpeed(Number(target.value));
});

document.getElementById('loop')!.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLInputElement;
  sequencer.setLoopFlag(target.checked);
});

// Handle Add to Sequencer button
document.getElementById('add-to-sequencer-btn')!.addEventListener('click', () => {
  const nameInput = document.getElementById('frag-name') as HTMLInputElement;
  const durationInput = document.getElementById('frag-duration') as HTMLInputElement;
  const startInput = document.getElementById('frag-start') as HTMLInputElement;

  if (!validateFragmentInputs(nameInput, durationInput, startInput)) return;

  const fragment = createIndependentFragment(
    nameInput.value,
    parseInt(durationInput.value),
    parseInt(startInput.value)
  );

  sequencer.push(fragment);
  fragments.push(fragment);
  updateFragmentList();
  clearFormInputs(nameInput, durationInput, startInput);
});

// Handle Add to Pool button
document.getElementById('add-to-pool-btn')!.addEventListener('click', () => {
  const nameInput = document.getElementById('frag-name') as HTMLInputElement;
  const durationInput = document.getElementById('frag-duration') as HTMLInputElement;
  const startInput = document.getElementById('frag-start') as HTMLInputElement;

  if (!validateFragmentInputs(nameInput, durationInput, startInput)) return;

  const fragment = createIndependentFragment(
    nameInput.value,
    parseInt(durationInput.value),
    parseInt(startInput.value)
  );

  fragments.push(fragment);
  updateFragmentList();
  clearFormInputs(nameInput, durationInput, startInput);
});

function validateFragmentInputs(
  nameInput: HTMLInputElement,
  durationInput: HTMLInputElement,
  startInput: HTMLInputElement
): boolean {
  if (!nameInput.value) {
    alert('Please enter a fragment name');
    return false;
  }
  if (!durationInput.value || parseInt(durationInput.value) <= 0) {
    alert('Please enter a valid duration (greater than 0)');
    return false;
  }
  if (!startInput.value || parseInt(startInput.value) < 0) {
    alert('Please enter a valid start point (0 or greater)');
    return false;
  }
  return true;
}

function createIndependentFragment(
  name: string,
  duration: number,
  startPoint: number
): IndependentFragment {
  return new IndependentFragment(
    name,
    duration,
    startPoint,
    () => console.log(`Executing fragment: ${name}`)
  );
}

function clearFormInputs(
  nameInput: HTMLInputElement,
  durationInput: HTMLInputElement,
  startInput: HTMLInputElement
): void {
  nameInput.value = '';
  durationInput.value = '';
  startInput.value = '';
}

// Handle Custom Fragment creation
document.getElementById('custom-fragment-form')!.addEventListener('submit', (e: SubmitEvent) => {
  e.preventDefault();
  const nameInput = document.getElementById('custom-frag-name') as HTMLInputElement;
  const startInput = document.getElementById('custom-frag-start') as HTMLInputElement;
  
  const name = nameInput.value;
  const startPoint = parseInt(startInput.value);

  const customFragment = new CustomFragment(name, startPoint);

  // Add selected fragments
  const checkboxes = document.querySelectorAll<HTMLInputElement>('#fragment-selection input:checked');
  checkboxes.forEach(checkbox => {
    const fragment = fragments.find(frag => frag.getId() === checkbox.value);
    if (fragment) {
      customFragment.addFragment(fragment);
    }
  });

  fragments.push(customFragment);
  sequencer.push(customFragment);
  updateFragmentList();
  (e.target as HTMLFormElement).reset();
});

// Populate fragment selection checkboxes
function populateFragmentSelection(): void {
  const container = document.getElementById('fragment-selection')!;
  container.innerHTML = fragments.map(frag => `
    <label style="display: block; margin: 5px 0;">
      <input type="checkbox" value="${frag.getId()}">
      ${frag.getName()} (${frag.constructor.name})
    </label>
  `).join('');
}

// Update fragment list to show compositions
function updateFragmentList(): void {
  const list = document.getElementById('fragment-list')!;
  list.innerHTML = fragments.map(frag => {
    if (frag instanceof CustomFragment) {
      return `
        <li class="fragment-item" style="background: #fff3e0;">
          <div>
            <strong>${frag.getName()}</strong> (Custom, Start: ${frag.getStartPoint()}ms)
            <div style="margin-left: 20px; color: #666;">
              ${frag.getFragments().map(subFrag =>
                `• ${subFrag.getName()} (${subFrag.getStartPoint()}ms-${subFrag.getStartPoint() + subFrag.getDuration()}ms)`
              ).join('<br>')}
            </div>
          </div>
          <button onclick="removeFragment('${frag.getId()}')">Remove</button>
        </li>
      `;
    }
    return `
      <li class="fragment-item">
        <span>${frag.getName()} (Start: ${frag.getStartPoint()}ms, Duration: ${frag.getDuration()}ms)</span>
        <button onclick="removeFragment('${frag.getId()}')">Remove</button>
      </li>
    `;
  }).join('');
  populateFragmentSelection();
}

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
  animateProgress(); // Force re-render
});

// function updateFragmentList(): void {
//   const list = document.getElementById('fragment-list')!;
//   list.innerHTML = fragments.map(frag => `
//     <li class="fragment-item">
//       <span>${frag.getName()} (Start: ${frag.getStartPoint()}ms, Duration: ${frag.getDuration()}ms)</span>
//       <button onclick="removeFragment('${frag.getId()}')">Remove</button>
//     </li>
//   `).join('');
// }

const canvas = document.getElementById('visualization-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function animateProgress(): void {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width, canvas.height = height;
  const renderFrame = () => {
    sequencer.renderToCanvas(ctx, {
      width,
      height,
      activeColor: '#ff6b6b',
      inactiveColor: '#4ecdc4',
      timeIndicatorColor: '#ffe66d',
    });
    requestAnimationFrame(renderFrame);
  }
  requestAnimationFrame(renderFrame);
}

function resetProgress(): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updateStatus(text: string): void {
  document.getElementById('status')!.textContent = `Status: ${text}`;
}

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