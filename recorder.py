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
from fastai.vision.all import *
device = torch.device('cpu')
import ssl
ssl._create_default_https_context = ssl._create_unverified_context

Threshold = 20

SHORT_NORMALIZE = (1.0/32768.0)
chunk = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 22050
swidth = 2

TIMEOUT_LENGTH = 0.1

f_name_directory = './records'

fnames = [audio_file for audio_file in os.listdir("spectrograms")]
labels = [fname.split("_")[0][-1] for fname in fnames]

df = pd.DataFrame({'fnames':fnames, 'labels':labels})
def get_x(r): return "spectrograms/" + r['fnames']
def get_y(r): return r['labels']

def splitter(df):
    train = df.index[df["fnames"].apply(lambda x: x.split('_')[1]) != "FV3"].tolist()
    valid = df.index[df["fnames"].apply(lambda x: x.split('_')[1]) == "FV3"].tolist()
    return train,valid

dblock = DataBlock(blocks=(ImageBlock, CategoryBlock),
                   splitter=splitter,
                   get_x=get_x, 
                   get_y=get_y)
dls = dblock.dataloaders(df)


learn=cnn_learner(dls, models.resnet18, metrics=error_rate)
learn.load('FV3_3epoch_model')

class Recorder:

    @staticmethod
    def rms(frame):
        count = len(frame) / swidth
        format = "%dh" % (count)
        shorts = struct.unpack(format, frame)

        sum_squares = 0.0
        for sample in shorts:
            n = sample * SHORT_NORMALIZE
            sum_squares += n * n
        rms = math.pow(sum_squares / count, 0.5)

        return rms * 1000

    def __init__(self):
        self.p = pyaudio.PyAudio()
        self.finished = False
        self.isRecording = False
        self.stream = self.p.open(format=FORMAT,
                                  channels=CHANNELS,
                                  rate=RATE,
                                  input=True,
                                  output=True,
                                  frames_per_buffer=chunk)
    def record(self):
        self.isRecording = True
        print('Noise detected, recording beginning')
        rec = []
        current = time.time()
        end = time.time() + TIMEOUT_LENGTH

        while current <= end:

            data = self.stream.read(chunk, exception_on_overflow = False)
            if self.rms(data) >= Threshold: end = time.time() + TIMEOUT_LENGTH

            current = time.time()
            rec.append(data)

        self.write(b''.join(rec))


    def write(self, recording):
        n_files = len(os.listdir(f_name_directory))

        filename = os.path.join(f_name_directory, '{}.wav'.format(n_files))

        wf = wave.open(filename, 'wb')
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(self.p.get_sample_size(FORMAT))
        wf.setframerate(RATE)
        wf.writeframes(recording)
        wf.close()
    

        signal, sr = librosa.load(filename)
        fig = plt.figure(figsize=[0.72,0.72])
        ax = fig.add_subplot(111)
        ax.axes.get_xaxis().set_visible(False)
        ax.axes.get_yaxis().set_visible(False)
        ax.set_frame_on(False)
        spectrofilename = filename.replace('.wav','.png')
        S = librosa.feature.melspectrogram(y=signal, sr=sr)
        librosa.display.specshow(librosa.power_to_db(S, ref=np.max))
        plt.savefig(spectrofilename, dpi=400, bbox_inches='tight',pad_inches=0)
        plt.close('all')


        prediction = learn.predict(spectrofilename)
        #os.remove(filename)
        #os.remove(spectrofilename)
        print(prediction)
        self.isRecording = False

        
        #print('Written to file: {}'.format(filename))
        #print('Returning to listening')




    def listen(self):
        print('Listening beginning')
        while True:
            if not self.isRecording:
                input = self.stream.read(chunk, exception_on_overflow=False)
                rms_val = self.rms(input)
                if rms_val > Threshold:
                    self.record()


a = Recorder()

a.listen()