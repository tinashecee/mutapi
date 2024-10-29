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