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

fnames = [audio_file for audio_file in os.listdir("spectrograms")]
labels = [fname.split("_")[-3][-1] for fname in fnames]

df = pd.DataFrame({'fnames':fnames, 'labels':labels})
def get_x(r): return "spectrograms/" + r['fnames']
def get_y(r): return r['labels']

def splitter(df):
    train = df.index[df["fnames"].apply(lambda x: x.split('_')[-2]) != "FV1"].tolist()
    valid = df.index[df["fnames"].apply(lambda x: x.split('_')[-2]) == "FV1"].tolist()
    return train,valid

dblock = DataBlock(blocks=(ImageBlock, CategoryBlock),
                   splitter=splitter,
                   get_x=get_x, 
                   get_y=get_y)
dls = dblock.dataloaders(df)


learn=cnn_learner(dls, models.resnet18, metrics=error_rate)
learn.load('FV1_big_model')


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



def getTone(filename, characterIndex):
	signal, sr = librosa.load(filename)
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
	predictionDict = {}
	predictionDict["prediction"] = prediction[0]
	predictionDict["index"] = characterIndex
	socketIo.emit('predicted_tone', predictionDict)	

def save_tone(data):
	n_files = len(os.listdir(f_name_directory))

	filename = os.path.join(f_name_directory, '{}.wav'.format(n_files))

	wf = wave.open(filename, 'wb')
	wf.setnchannels(CHANNELS)
	wf.setsampwidth(p.get_sample_size(FORMAT))
	wf.setframerate(RATE)
	wf.writeframes(data["voice_recording"])
	wf.close()
	getTone(filename, data["character_index"])
	#os.remove(filename)

def save_phrase(data):
	filename = 'full_recording.wav'
	wf = wave.open(filename, 'wb')
	wf.setnchannels(CHANNELS)
	wf.setsampwidth(p.get_sample_size(FORMAT))
	wf.setframerate(RATE)
	wf.writeframes(data["voice_recording"])
	wf.close()
	rec = AudioSegment.from_wav(filename)
	play(rec)

def cut_phrase(data):
	filename = 'full_recording.wav'
	newAudio = AudioSegment.from_wav(filename)
	newAudio = newAudio[data["begin"]:data["end"]]
	play(newAudio)


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
	socketIo.run(app)