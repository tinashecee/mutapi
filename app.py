from flask import Flask, jsonify, render_template, send_file, request
import os
import wave
import pyaudio
import threading
import time
from pydub import AudioSegment
from io import BytesIO
import sqlite3
import json
from datetime import datetime


app = Flask(__name__)



# Get the user's Documents folder and ensure 'Mutapi' folder exists
documents_folder = os.path.join(os.path.expanduser("~"), "Documents", "Mutapi")
if not os.path.exists(documents_folder):
    os.makedirs(documents_folder)  # Create the folder if it doesn't exist

class AudioRecorder:
    def __init__(self):
        self.is_recording = False
        self.is_paused = False
        self.frames = []
        self.stream = None
        self.wave_file = None
        self.audio_interface = pyaudio.PyAudio()
        self.output_filename = None

        self.audio_format = pyaudio.paInt16  # 16-bit audio
        self.channels = 2  # Stereo
        self.rate = 44100  # 44.1 kHz sample rate
        self.chunk = 1024  # Buffer size
        self.recorded_duration = 0  # To track the total duration of recording
        self.last_start_time = None  # Track each active recording period

    def start_recording(self, output_filename):
        self.output_filename = output_filename
        self.is_recording = True
        self.is_paused = False
        self.frames = []
        self.last_start_time = datetime.now()  # Start timing

        self.stream = self.audio_interface.open(format=self.audio_format,
                                                channels=self.channels,
                                                rate=self.rate,
                                                input=True,
                                                frames_per_buffer=self.chunk)

        self.record_thread = threading.Thread(target=self.record)
        self.record_thread.start()

    def record(self):
        while self.is_recording:
            if not self.is_paused:
                data = self.stream.read(self.chunk)
                self.frames.append(data)

            # Accumulate time only if not paused
                if self.last_start_time:
                    self.recorded_duration += (datetime.now() - self.last_start_time).total_seconds()
                    self.last_start_time = datetime.now()  # Reset for the next active period    
            time.sleep(0.01)

    def pause_recording(self):
        self.is_paused = not self.is_paused
        if self.is_paused:
            # Update duration when pausing
            if self.last_start_time:
                self.recorded_duration += (datetime.now() - self.last_start_time).total_seconds()
                self.last_start_time = None  # Reset until resumed
        else:
            # Start timing again when resuming
            self.last_start_time = datetime.now()

    def stop_recording(self):
        self.is_recording = False
        self.record_thread.join()

        self.stream.stop_stream()
        self.stream.close()

        wave_file = wave.open(self.output_filename, 'wb')
        wave_file.setnchannels(self.channels)
        wave_file.setsampwidth(self.audio_interface.get_sample_size(self.audio_format))
        wave_file.setframerate(self.rate)
        wave_file.writeframes(b''.join(self.frames))
        wave_file.close()

        # Final duration calculation (considering any active time since last resume)
        if self.last_start_time:
            self.recorded_duration += (datetime.now() - self.last_start_time).total_seconds()

        # Get file size in MB
        file_size_bytes = os.path.getsize(self.output_filename)
        file_size_mb = file_size_bytes / (1024 * 1024)  # Convert bytes to MB

        print(f"Recording duration: {self.recorded_duration:.2f} seconds, Size: {file_size_mb:.2f} MB")

        return {'duration': self.recorded_duration, 'size': file_size_mb}

    def get_current_audio(self):
        # Create a temporary WAV file from the current recorded frames
        wav_buffer = BytesIO()
        wave_file = wave.open(wav_buffer, 'wb')
        wave_file.setnchannels(self.channels)
        wave_file.setsampwidth(self.audio_interface.get_sample_size(self.audio_format))
        wave_file.setframerate(self.rate)
        wave_file.writeframes(b''.join(self.frames))
        wave_file.close()
        wav_buffer.seek(0)
        return wav_buffer

# Initialize the recorder
recorder = AudioRecorder()

@app.route('/')
def splash():
    return render_template('splash.html')

# Route for login page
@app.route('/login')
def login():
    return render_template('login.html')

# Route for rec page
@app.route('/rec')
def rec():
    return render_template('rec.html')

# Route for recordings page
@app.route('/recordings')
def recordings():
    # Connect to SQLite database
    conn = sqlite3.connect('MutapiAudioRecordings.db')
    cursor = conn.cursor()
    
    # Retrieve data from case_recordings table
    cursor.execute("SELECT * FROM case_recordings")
    case_recordings = cursor.fetchall()
    print(case_recordings)
    # Close the database connection
    conn.close()
    
    # Pass the case_recordings data to the template
    return render_template('recordings.html', case_recordings=case_recordings)

# Route for claude page
@app.route('/claude')
def claude():
    return render_template('claude.html')

# Route for courtrec page
@app.route('/courtrec')
def courtrec():
    return render_template('courtrec.html')

@app.route('/start', methods=['POST'])
def start_recording():
    if not recorder.is_recording:
        
        data = request.get_json()
        caseNumber = data['caseNumber']
        title = data['title']
        notes = data['notes']
        annotations = data['annotations']
        dateStamp = data['dateStamp']

        # Extend with remaining fields
        judgeName = data['judgeName']
        prosecutionCounsel = data['prosecutionCounsel']
        defenseCounsel = data['defenseCounsel']
        courtroom = data['courtroom']
        transcript = data['transcript']
        duration = data['duration']
        size = data['size']
        status = data['status']
        
        # Sanitize the dateStamp by replacing invalid characters for a file name
        safe_dateStamp = dateStamp.replace(":", "-").replace("/", "-").replace(",", "")

        # Construct the file name using the case number, notes, and sanitized date stamp
        file_name = f"{caseNumber}_{notes}_{safe_dateStamp}.wav"
        
        # Save the file to the 'Mutapi' folder in Documents
        file_path = os.path.join(documents_folder, file_name)

        # Start recording and save to the constructed file path
        recorder.start_recording(file_path)
        print(file_path)
        return jsonify({'message': 'Recording started'})
    return jsonify({'message': 'Recording already in progress'})

@app.route('/pause', methods=['POST'])
def pause_recording():
    if recorder.is_recording:
        recorder.pause_recording()
        return jsonify({'message': 'Recording paused' if recorder.is_paused else 'Recording resumed'})
    return jsonify({'message': 'No recording to pause/resume'})

@app.route('/stop', methods=['POST'])
def stop_recording():
    if recorder.is_recording:
        recording_info = recorder.stop_recording()
        # Access duration and size from the returned dictionary
        duration = recording_info['duration']
        size = recording_info['size']

        data = request.get_json()
        insert_case_recording(data, duration, size)
        return jsonify({'message': 'Recording stopped and saved'})
    return jsonify({'message': 'No recording to stop'})

def insert_case_recording(data, duration, size):
    # Extract data from the request
    case_number = data['caseNumber']
    title = data['title']
    notes = data['notes']
    annotations = json.dumps(data['annotations'])  # Convert array to JSON string
    date_stamp = data['dateStamp']
    judge_name = data['judgeName']
    prosecution_counsel = data['prosecutionCounsel']
    defense_counsel = data['defenseCounsel']
    courtroom = data['courtroom']
    transcript = data['transcript']
    duration = f"{round(duration / 60, 2)} Minutes"
    size = f"{round(size, 2)} Mb"
    status = data['status']

    # Construct the file name and save path
    documents_folder = os.path.expanduser("~/Documents/Mutapi")
    if not os.path.exists(documents_folder):
        os.makedirs(documents_folder)
    
    # Sanitize the dateStamp by replacing invalid characters for a file name
    safe_dateStamp = date_stamp.replace(":", "-").replace("/", "-").replace(",", "")

      # Construct the file name using the case number, notes, and sanitized date stamp
    file_name = f"{case_number}_{notes}_{safe_dateStamp}.wav"
    file_path = os.path.join(documents_folder, file_name)

   
    # Insert data into SQLite
    with sqlite3.connect('MutapiAudioRecordings.db') as conn:
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO case_recordings (
                case_number, title, notes, annotations, date_stamp, judge_name,
                prosecution_counsel, defense_counsel, courtroom, transcript, 
                duration, size, status, file_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            case_number, title, notes, annotations, date_stamp, judge_name,
            prosecution_counsel, defense_counsel, courtroom, transcript, 
            duration, size, status, file_path
        ))

        conn.commit()
        print(f"Data for case {case_number} inserted successfully.")

@app.route('/playback', methods=['GET'])
def playback_audio():
    if recorder.frames:
        audio_data = recorder.get_current_audio()
        return send_file(audio_data, mimetype='audio/wav')
    return jsonify({'message': 'No recording available for playback'})

if __name__ == '__main__':
    app.run(debug=True)
