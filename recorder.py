import pyaudio
import wave
import threading

class AudioRecorder:
    def __init__(self):
        self.is_recording = False
        self.frames = []
        self.stream = None
        self.wave_file = None
        self.audio_format = pyaudio.paInt16  # 16-bit audio
        self.channels = 1
        self.rate = 44100  # 44.1kHz sample rate
        self.chunk = 1024  # Buffer size
        self.audio_interface = pyaudio.PyAudio()

    def start_recording(self, output_filename):
        self.wave_file = wave.open(output_filename, 'wb')
        self.wave_file.setnchannels(self.channels)
        self.wave_file.setsampwidth(self.audio_interface.get_sample_size(self.audio_format))
        self.wave_file.setframerate(self.rate)

        self.stream = self.audio_interface.open(format=self.audio_format,
                                                channels=self.channels,
                                                rate=self.rate,
                                                input=True,
                                                frames_per_buffer=self.chunk)
        self.is_recording = True
        self.frames = []

        self.record_thread = threading.Thread(target=self.record)
        self.record_thread.start()

    def record(self):
        while self.is_recording:
            data = self.stream.read(self.chunk)
            self.frames.append(data)

    def stop_recording(self):
        self.is_recording = False
        self.record_thread.join()

        self.stream.stop_stream()
        self.stream.close()

        self.wave_file.writeframes(b''.join(self.frames))
        self.wave_file.close()
        self.audio_interface.terminate()

recorder = AudioRecorder()
