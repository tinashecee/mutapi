const socket = io();

// Get DOM elements
const listMicrophonesButton = document.getElementById("listMicrophones");
const microphonesList = document.getElementById("microphonesList");
const outputFileInput = document.getElementById("outputFile");
const startButton = document.getElementById("startRecording");
const pauseButton = document.getElementById("pauseRecording");
const resumeButton = document.getElementById("resumeRecording");
const stopButton = document.getElementById("stopRecording");
const statusText = document.getElementById("status");

// List microphones
listMicrophonesButton.addEventListener("click", () => {
  socket.emit("listMicrophones");
});

socket.on("microphonesList", (devices) => {
  microphonesList.innerHTML = "";
  devices.forEach((device, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.text = device.name;
    microphonesList.appendChild(option);
  });
});

// Start recording
startButton.addEventListener("click", () => {
  const outputFile = outputFileInput.value;
  const microphoneIndex = microphonesList.value;

  if (outputFile && microphoneIndex !== null) {
    socket.emit("startRecording", { outputFile, microphoneIndex });
  } else {
    alert("Please select a microphone and provide an output filename.");
  }
});

// Pause recording
pauseButton.addEventListener("click", () => {
  socket.emit("pauseRecording");
});

// Resume recording
resumeButton.addEventListener("click", () => {
  socket.emit("resumeRecording");
});

// Stop recording
stopButton.addEventListener("click", () => {
  socket.emit("stopRecording");
});

// Update status
socket.on("status", (status) => {
  statusText.textContent = `Status: ${status}`;
});
