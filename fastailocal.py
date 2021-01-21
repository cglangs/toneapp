import librosa, librosa.display
import matplotlib.pyplot as plt
import numpy as np
from fastai.vision.all import *
device = torch.device('cpu')
import ssl
ssl._create_default_https_context = ssl._create_unverified_context

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

audio_filename = 'test_a1_FV1.wav'
samples, sample_rate = librosa.load(audio_filename)
print(sample_rate)

'''
fig = plt.figure(figsize=[0.72,0.72])
ax = fig.add_subplot(111)
ax.axes.get_xaxis().set_visible(False)
ax.axes.get_yaxis().set_visible(False)
ax.set_frame_on(False)
filename  = audio_filename.replace('.wav','.png')
S = librosa.feature.melspectrogram(y=samples, sr=sample_rate)
librosa.display.specshow(librosa.power_to_db(S, ref=np.max))
plt.savefig(filename, dpi=400, bbox_inches='tight',pad_inches=0)
plt.close('all')
'''
prediction = learn.predict("test_a1_FV1.png")
print(prediction)