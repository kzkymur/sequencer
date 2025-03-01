import { Sequencer, Fragment } from '../../src/main';

const sequencer = new Sequencer(100, false);
const outputDiv = document.getElementById('root')!;

// Create fragments
const fragment1 = new Fragment('Beep', 1000, () => {
  outputDiv.innerHTML += 'BEEP! ';
});
const fragment2 = new Fragment('Pause', 500);

// Add fragments to sequencer
sequencer.push(fragment1);
sequencer.push(fragment2);

// UI Controls
const controls = document.createElement('div');
controls.innerHTML = `
  <button id="play">Play</button>
  <button id="stop">Stop</button>
  <div id="timeDisplay">Current Time: 0ms</div>
  <div id="currentFragment">Current Fragment: None</div>
`;
document.body.prepend(controls);

// Event listeners
document.getElementById('play')!.addEventListener('click', () => {
  sequencer.play();
});

document.getElementById('stop')!.addEventListener('click', () => {
  sequencer.stop();
});

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