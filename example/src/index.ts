import { Sequencer, Fragment } from '../../src/main';

const sequencer = new Sequencer(100, false);
const outputDiv = document.getElementById('root')!;

// Create fragments
const callback = (name: string) => () => {
  outputDiv.innerHTML += `${name} `;
}
const fragment = new Fragment('Beep', 1000, callback('Beep'));

// Add fragments to sequencer
sequencer.push(fragment);

// UI Controls
const controls = document.createElement('div');
controls.innerHTML = `
  <div class="control-group">
    <input type="text" id="fragName" placeholder="Fragment name" required>
    <input type="number" id="fragDuration" placeholder="Duration (ms)" min="1" value="1000" required>
    <button id="addFragment">Add Fragment</button>
  </div>
  <div class="control-group">
    <button id="play">Play</button>
    <button id="stop">Stop</button>
  </div>
  <div id="status">
    <div id="timeDisplay">Current Time: 0ms / Total: 0ms</div>
    <div id="currentFragment">Current Fragment: None</div>
  </div>
  <div id="fragmentList"><h3>Fragments:</h3></div>
`;
document.body.prepend(controls);

// Event listeners
document.getElementById('play')!.addEventListener('click', () => {
  sequencer.play();
});

document.getElementById('stop')!.addEventListener('click', () => {
  sequencer.stop();
});

// Fragment list click handler
document.getElementById('fragmentList')!.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains('remove')) {
    const id = target.dataset.id!;
    const fragment = sequencer.getFragments().find(f => f.getId() === id);
    if (fragment) {
      sequencer.remove(fragment);
      updateFragmentList();
      updateTotalDuration();
    }
  }
});

// Initial setup
updateFragmentList();
updateTotalDuration();

// Add fragment handler
document.getElementById('addFragment')!.addEventListener('click', () => {
  const nameInput = document.getElementById('fragName') as HTMLInputElement;
  const durationInput = document.getElementById('fragDuration') as HTMLInputElement;

  try {
    const fragment = new Fragment(
      nameInput.value || `Sleep`,
      parseInt(durationInput.value),
      callback(nameInput.value)
    );

    sequencer.push(fragment);
    updateFragmentList();
    updateTotalDuration();

    // Clear inputs
    nameInput.value = '';
    durationInput.value = '1000';
  } catch (error) {
    alert(`Error creating fragment: ${error}`);
  }
});

function updateFragmentList() {
  const list = document.getElementById('fragmentList')!;
  list.innerHTML = '<h3>Fragments:</h3>';
  sequencer.getFragments().forEach((fragment, index) => {
    const div = document.createElement('div');
    div.className = 'fragment-item';
    div.innerHTML = `
      ${index + 1}. ${fragment.getName()}
      (${fragment.getDuration()}ms)
      <button class="remove" data-id="${fragment.getId()}">×</button>
    `;
    list.appendChild(div);
  });
}

function updateTotalDuration() {
  const total = sequencer.getFragments().reduce(
    (sum, frag) => sum + frag.getDuration(), 0
  );
  document.getElementById('timeDisplay')!.textContent =
    `Current Time: 0ms / Total: ${total}ms`;
}

// Timer updates
sequencer.timerWorker.eventTarget.addEventListener('timer_update', (e) => {
  const currentTime = (e as CustomEvent).detail;
  document.getElementById('timeDisplay')!.textContent = 
    `Current Time: ${currentTime}ms`;
  
  let accumulated = 0;
  for (const fragment of sequencer.getFragments()) {
    if (currentTime <= accumulated + fragment.getDuration()) {
      document.getElementById('currentFragment')!.textContent = 
        `Current Fragment: ${fragment.getName()}`;
      break;
    }
    accumulated += fragment.getDuration();
  }
});