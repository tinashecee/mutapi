// Global variables to track recording state
let recordingStartTime = null;
let currentCaseDetails = null;
let timerInterval = null;
let waveformInterval = null;
let micLevelsInterval = null;
const recordings = [];

// Initialize waveform
const waveform = document.getElementById('waveform');
const bars = 100;
for (let i = 0; i < bars; i++) {
  const bar = document.createElement('div');
  bar.className = 'waveform-bar';
  waveform.appendChild(bar);
}

// Utility functions
function formatTime(ms) {
  if (!ms) return '00:00:00';
  const date = new Date(ms);
  return date.toISOString().substr(11, 8);
}

function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function generateRandomFileSize() {
  return Math.floor(Math.random() * 1000000000); // Random size up to 1GB
}

// Update waveform visualization
function updateWaveform() {
  const waveformBars = document.querySelectorAll('.waveform-bar');
  waveformBars.forEach(bar => {
    const height = Math.random() * 100;
    bar.style.height = `${height}%`;
  });
}

// Function to update simulated microphone levels
function updateMicrophoneLevels() {
  activeMics.forEach((mic, index) => {
    const micLevel = Math.random() * 100; // Simulated mic level
    document.querySelector(`#micLevel-${index}`).style.width = `${micLevel}%`;
  });
}

function updateTimer() {
  if (recordingStartTime) {
    const elapsed = Date.now() - recordingStartTime;
    document.getElementById('recordingTimer').textContent = formatTime(elapsed);
  }
}
