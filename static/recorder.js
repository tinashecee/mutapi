function startRecording() {
  fetch("/start", { method: "POST" })
    .then((response) => response.json())
    .then((data) => console.log(data.message))
    .catch((error) => console.error("Error:", error));
}

function pauseRecording() {
  fetch("/pause", { method: "POST" })
    .then((response) => response.json())
    .then((data) => console.log(data.message))
    .catch((error) => console.error("Error:", error));
}

function stopRecording() {
  fetch("/stop", { method: "POST" })
    .then((response) => response.json())
    .then((data) => console.log(data.message))
    .catch((error) => console.error("Error:", error));
}
