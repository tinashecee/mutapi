
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

// Recording table management
function addRecordingToTable(recordingData) {
  const tbody = document.getElementById('recordingsTableBody');
  const row = document.createElement('tr');

  const duration = formatTime(recordingData.duration);
  const fileSize = formatFileSize(recordingData.fileSize);

  row.innerHTML = `
    <td>${recordingData.timestamp}</td>
    <td>
      <div><strong>${recordingData.caseNumber}</strong></div>
      <small class="text-muted">Judge ${recordingData.judgeName}</small>
    </td>
    <td>${duration}</td>
    <td><span class="status-badge bg-success text-white">Complete</span></td>
    <td>${fileSize}</td>
    <td>
      <div class="recording-actions">
        <button class="action-btn" onclick="playRecording('${recordingData.caseNumber}')">
          <i class="fas fa-play"></i>
        </button>
        <button class="action-btn" onclick="downloadRecording('${recordingData.caseNumber}')">
          <i class="fas fa-download"></i>
        </button>
        <button class="action-btn" onclick="editRecording('${recordingData.caseNumber}')">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn text-danger" onclick="deleteRecording('${recordingData.caseNumber}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </td>
  `;

  tbody.insertBefore(row, tbody.firstChild);
}

// Recording actions
function playRecording(caseNumber) {
  const recording = recordings.find(r => r.caseNumber === caseNumber);
  if (recording) {
    document.getElementById('playerModalTitle').textContent = `Case ${recording.caseNumber} Recording`;
    document.getElementById('totalTime').textContent = formatTime(recording.duration);
    const playerModal = new bootstrap.Modal(document.getElementById('playerModal'));
    playerModal.show();
  }
}

function downloadRecording(caseNumber) {
  alert(`Downloading recording for case ${caseNumber}`);
}

function editRecording(caseNumber) {
  alert(`Editing recording for case ${caseNumber}`);
}

function deleteRecording(caseNumber) {
  if (confirm(`Are you sure you want to delete the recording for case ${caseNumber}?`)) {
    const row = document.querySelector(`tr[data-case="${caseNumber}"]`);
    if (row) row.remove();
  }
}

// Start recording process
document.getElementById('startRecord').addEventListener('click', function() {
  const modal = new bootstrap.Modal(document.getElementById('caseDetailsModal'));
  modal.show();
});

// Handle form submission and recording start
document.getElementById('startRecordingBtn').addEventListener('click', function() {
  const form = document.getElementById('caseDetailsForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Collect case details
  currentCaseDetails = {
    caseNumber: document.getElementById('caseNumber').value,
    judgeName: document.getElementById('judgeName').value,
    prosecutionCounsel: document.getElementById('prosecutionCounsel').value,
    defenseCounsel: document.getElementById('defenseCounsel').value,
    notes: document.getElementById('caseNotes').value
  };

  // Close modal and start recording
  const modal = bootstrap.Modal.getInstance(document.getElementById('caseDetailsModal'));
  modal.hide();

  // Initialize recording state
  recordingStartTime = Date.now();
  document.getElementById('recordingBadge').style.display = 'block';
  document.getElementById('startRecord').disabled = true;
  document.getElementById('pauseRecord').disabled = false;
  document.getElementById('stopRecord').disabled = false;

  // Start all intervals
  waveformInterval = setInterval(updateWaveform, 100);
  micLevelsInterval = setInterval(updateMicrophoneLevels, 100);
  timerInterval = setInterval(updateTimer, 1000);
});

// Handle pause recording
document.getElementById('pauseRecord').addEventListener('click', function() {
  const startButton = document.getElementById('startRecord');
  const ispaused = startButton.disabled;

  if (ispaused) {
    // Resume recording
    startButton.disabled = true;
    this.innerHTML = '<i class="fas fa-pause me-2"></i>Pause';
    document.getElementById('recordingBadge').style.display = 'block';
    waveformInterval = setInterval(updateWaveform, 100);
    micLevelsInterval = setInterval(updateMicrophoneLevels, 100);
    timerInterval = setInterval(updateTimer, 1000);
  } else {
    // Pause recording
    startButton.disabled = false;
    this.innerHTML = '<i class="fas fa-play me-2"></i>Resume';
    document.getElementById('recordingBadge').style.display = 'none';
    clearInterval(waveformInterval);
    clearInterval(micLevelsInterval);
    clearInterval(timerInterval);
  }
});

// Handle stop recording
document.getElementById('stopRecord').addEventListener('click', function() {
  // Calculate duration
  const duration = Date.now() - recordingStartTime;

  // Create recording entry
  const recordingData = {
    ...currentCaseDetails,
    timestamp: new Date().toLocaleString(),
    duration: duration,
    fileSize: generateRandomFileSize(),
  };

  // Add to recordings array
  recordings.push(recordingData);

  // Add to table
  addRecordingToTable(recordingData);

  // Reset recording state
  clearInterval(waveformInterval);
  clearInterval(micLevelsInterval);
  clearInterval(timerInterval);

  document.getElementById('recordingBadge').style.display = 'none';
  document.getElementById('recordingTimer').textContent = '00:00:00';
  document.getElementById('startRecord').disabled = false;
  document.getElementById('pauseRecord').disabled = true;
  document.getElementById('stopRecord').disabled = true;

  // Reset form
  document.getElementById('caseDetailsForm').reset();
  recordingStartTime = null;
  currentCaseDetails = null;
});

// Media player functionality
let playbackInterval;
document.querySelector('#playerModal .btn-primary').addEventListener('click', function() {
  const progressBar = document.getElementById('playbackProgress');
  const icon = this.querySelector('i');

  if (icon.classList.contains('fa-play')) {
    icon.classList.replace('fa-play', 'fa-pause');
    playbackInterval = setInterval(() => {
      const currentWidth = parseFloat(progressBar.style.width) || 0;
      if (currentWidth < 100) {
        progressBar.style.width = (currentWidth + 0.1) + '%';
        document.getElementById('currentTime').textContent =
          formatTime(currentWidth * parseFloat(document.getElementById('totalTime').textContent.split(':').reduce((acc, time) => (60 * acc) + parseFloat(time))) / 100);
      }
    }, 100);
  } else {
    icon.classList.replace('fa-pause', 'fa-play');
    clearInterval(playbackInterval);
  }
});

// Clean up on modal close
document.getElementById('playerModal').addEventListener('hidden.bs.modal', function () {
  clearInterval(playbackInterval);
  const playButton = this.querySelector('.btn-primary i');
  if (playButton.classList.contains('fa-pause')) {
    playButton.classList.replace('fa-pause', 'fa-play');
  }
  document.getElementById('playbackProgress').style.width = '0%';
  document.getElementById('currentTime').textContent = '00:00:00';
});

// Handle microphone configuration modal
let activeMics = [];

// Function to dynamically add a new microphone section
function createMicrophoneSection() {
  const micContainer = document.getElementById('microphoneContainer');
  const micSection = document.createElement('div');
  micSection.classList.add('mic-section', 'mb-3');
  micSection.innerHTML = `
    <div class="mic-header">
      <h6>Microphone Input</h6>
      <div>
        <i class="fas fa-check-circle confirm-mic me-2"></i>
        <i class="fas fa-times-circle remove-mic"></i>
      </div>
    </div>
    <select class="form-select mb-3">
      <option selected disabled>Select audio input device...</option>
    </select>
    <div class="label-input">
      <input type="text" class="form-control" placeholder="Enter microphone label">
    </div>
  `;
  micContainer.appendChild(micSection);
}

// Add new microphone section in modal
document.getElementById('addMicrophoneBtn').addEventListener('click', function() {
  createMicrophoneSection();
  populateDeviceDropdowns();  // Ensure devices are populated in the new section
});

// Save selected mics
document.getElementById('saveMicrophoneConfig').addEventListener('click', function() {
  document.querySelectorAll('.mic-section').forEach((section, index) => {
    const micSelect = section.querySelector('select');
    const micLabel = section.querySelector('.label-input input').value;

    if (micSelect.value !== 'Select audio input device...' && micLabel) {
      activeMics.push({ id: micSelect.value, label: micLabel });
    }
  });
  displayActiveMics();
  const modal = bootstrap.Modal.getInstance(document.getElementById('microphoneModal'));
  modal.hide();
});

// Display active microphones in 4x4 grid
function displayActiveMics() {
  const micLevelsContainer = document.querySelector('.microphone-levels');
  micLevelsContainer.innerHTML = ''; // Clear previous entries
  activeMics.forEach((mic, index) => {
    const micChannel = `
      <div class="mic-channel">
        <div class="d-flex justify-content-between">
          <h6>${mic.label}</h6>
          <span class="badge bg-success">Active</span>
        </div>
        <div class="level-meter">
          <div class="level-fill" id="micLevel-${index}"></div>
        </div>
      </div>
    `;
    micLevelsContainer.insertAdjacentHTML('beforeend', micChannel);
  });
}

// Populate mic dropdowns
async function populateDeviceDropdowns() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const selects = document.querySelectorAll('.mic-section select');
  selects.forEach(select => {
    while (select.options.length > 1) {
      select.remove(1);
    }
    devices.filter(device => device.kind === 'audioinput').forEach(device => {
      const option = new Option(device.label || `Mic ${device.deviceId.slice(0, 5)}`, device.deviceId);
      select.add(option);
    });
  });
}

// Start recording with MediaRecorder API
let mediaRecorder;
let audioChunks = [];
const audioPlayback = document.getElementById('audioPlayback');

document.getElementById('startRecord').addEventListener('click', async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayback.src = audioUrl;
    audioChunks = [];
  };

  mediaRecorder.start();
  document.getElementById('startRecord').disabled = true;
  document.getElementById('stopRecord').disabled = false;

  // Start updating microphone levels during recording
  micLevelsInterval = setInterval(updateMicrophoneLevels, 100);
});

// Stop recording
document.getElementById('stopRecord').addEventListener('click', () => {
  mediaRecorder.stop();
  document.getElementById('stopRecord').disabled = true;
  document.getElementById('startRecord').disabled = false;

  clearInterval(micLevelsInterval);  // Stop mic level updates
});

// Event listeners for the modal
const microphoneModal = document.getElementById('microphoneModal');
microphoneModal.addEventListener('show.bs.modal', function() {
  populateDeviceDropdowns();
});