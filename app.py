import pyaudio
import math
import struct
import wave
import time
import os
import numpy as np
import librosa, librosa.display
import matplotlib.pyplot as plt
import numpy as np
from flask import Flask
from flask_socketio import SocketIO, send
from pydub import AudioSegment
from pydub.playback import play


app = Flask(__name__)
app.config['SECRET_KEY'] = 'mysecret'


socketIo = SocketIO(app, cors_allowed_origins="*")

app.debug = True

app.host = 'localhost'


FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100

f_name_directory = './records'
p = pyaudio.PyAudio()

def write(recording):
	#print(recording)
	print(type(recording))
	print(len(recording))
	n_files = len(os.listdir(f_name_directory))

	filename = os.path.join(f_name_directory, '{}.wav'.format(n_files))

	wf = wave.open(filename, 'wb')
	wf.setnchannels(CHANNELS)
	wf.setsampwidth(p.get_sample_size(FORMAT))
	wf.setframerate(RATE)
	wf.writeframes(recording)
	wf.close()



    #prediction = learn.predict(spectrofilename)

    #print(prediction)
	os.remove(filename)


@socketIo.on("message")
def handleMessage(msg):
	write(msg)
	return None

if __name__ == '__main__':
	socketIo.run(app)