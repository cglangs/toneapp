import pyaudio
import wave
import os
import numpy as np
import librosa, librosa.display
import matplotlib.pyplot as plt
import numpy as np
from flask import Flask
from flask import request
from flask_socketio import SocketIO, send
from pydub import AudioSegment
from fastai.vision.all import *
device = torch.device('cpu')
import ssl
ssl._create_default_https_context = ssl._create_unverified_context

SHORT_NORMALIZE = (1.0/32768.0)
chunk = 2048
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100
swidth = 2

TIMEOUT_LENGTH = 0.05

f_name_directory = './records'

FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100

f_name_directory = './tone_records'
phrase_directory = './phrase_records'
p = pyaudio.PyAudio()

with open('fnames.pkl', 'rb') as f:
	fnames = pickle.load(f)
labels = [fname.split("_")[-3][-1] for fname in fnames]

def get_x(r): return "spectrograms/" + r['fnames']
def get_y(r): return r['labels']

learn = load_learner('tone_classifier.pkl')

app = Flask(__name__)
app.config['SECRET_KEY'] = 'mysecret'


socketIo = SocketIO(app, cors_allowed_origins="*")

app.debug = True


def getTone(filename, characterIndex):
	signal, sr = librosa.load(filename)
	os.remove(filename)
	signal_t, index = librosa.effects.trim(y=signal[100:], top_db=20)
	fig = plt.figure(figsize=[0.72,0.72])
	ax = fig.add_subplot(111)
	ax.axes.get_xaxis().set_visible(False)
	ax.axes.get_yaxis().set_visible(False)
	ax.set_frame_on(False)
	spectrofilename = filename.replace('.wav','.png')
	S = librosa.feature.melspectrogram(y=signal_t, sr=sr)
	librosa.display.specshow(librosa.power_to_db(S, ref=np.max))
	plt.savefig(spectrofilename, dpi=400, bbox_inches='tight',pad_inches=0)
	plt.close('all')

	prediction = learn.predict(spectrofilename)
	os.remove(spectrofilename)

	predictionDict = {}
	predictionDict["prediction"] = prediction[0]
	predictionDict["index"] = characterIndex
	socketIo.emit('predicted_tone', predictionDict)	

def save_tone(data):
	filename = os.path.join(f_name_directory, '{}.wav'.format(request.sid))
	wf = wave.open(filename, 'wb')
	wf.setnchannels(CHANNELS)
	wf.setsampwidth(p.get_sample_size(FORMAT))
	wf.setframerate(RATE)
	wf.writeframes(data["voice_recording"])
	wf.close()
	getTone(filename, data["character_index"])

def save_phrase(data):
	filename = os.path.join(phrase_directory, '{}.wav'.format(request.sid))
	wf = wave.open(filename, 'wb')
	wf.setnchannels(CHANNELS)
	wf.setsampwidth(p.get_sample_size(FORMAT))
	wf.setframerate(RATE)
	wf.writeframes(data["voice_recording"])
	wf.close()
	rec = AudioSegment.from_wav(filename)

def cut_phrase(data):
	source_filename = os.path.join(phrase_directory, '{}.wav'.format(request.sid))
	newAudio = AudioSegment.from_wav(source_filename)
	newAudio = newAudio[data["begin"]:data["end"]]
	filename = os.path.join(f_name_directory, '{}.wav'.format(request.sid))
	newAudio.export(filename, format="wav")
	getTone(filename, data["character_index"])

@socketIo.on("disconnect")
def disconnect():
	try:
	    os.remove(os.path.join(phrase_directory, '{}.wav'.format(request.sid)))
	except OSError:
	    pass
	return None

@socketIo.on("tone_recorded")
def handleVoice(data):
	save_tone(data)
	return None

@socketIo.on("phrase_recorded")
def savePhrase(data):
	save_phrase(data)
	return None	

@socketIo.on("cut_phrase")
def cutPhrase(data):
	cut_phrase(data)
	return None	

if __name__ == '__main__':
	socketIo.run(app, host='0.0.0.0', port=5000, debug=True)