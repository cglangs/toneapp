# -*- coding: utf-8 -*-
"""toneapp.ipynb

Automatically generated by Colaboratory.

Original file is located at
    https://colab.research.google.com/drive/1ZVwDxaQ7Gdl0EjRCShnNLHjeR9SCOTOp
"""

from google.colab import drive
drive.mount('/content/drive')

!pip install -Uqq fastbook
import fastbook
fastbook.setup_book()

import librosa, librosa.display
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import os
from fastbook import *
from fastai.vision.all import *

path = "/content/drive/MyDrive"

def create_spectrograms(): 
    os.mkdir(path + "/spectrograms")
    count = 0
    for audio_file in os.listdir(path + "/tone_wav"):
        count += 1
        print(count)
        samples, sample_rate = librosa.load(path + "/tone_wav/" + audio_file)
        fig = plt.figure(figsize=[0.72,0.72])
        ax = fig.add_subplot(111)
        ax.axes.get_xaxis().set_visible(False)
        ax.axes.get_yaxis().set_visible(False)
        ax.set_frame_on(False)
        filename  = path + "/spectrograms/" + audio_file.replace('.wav','.png')
        S = librosa.feature.melspectrogram(y=samples, sr=sample_rate)
        librosa.display.specshow(librosa.power_to_db(S, ref=np.max))
        plt.savefig(filename, dpi=400, bbox_inches='tight',pad_inches=0)
        plt.close('all')

#create_spectrograms()

fnames = [audio_file for audio_file in os.listdir(path + "/spectrograms")]
  labels = [fname.split("_")[0][:-1] + " " + fname.split("_")[0][-1] for fname in fnames]

df = pd.DataFrame({'fnames':fnames, 'labels':labels})
def get_x(r): return path + "/spectrograms/" + r['fnames']
def get_y(r): return r['labels'].split(' ')

def splitter(df):
    train = df.index[df["fnames"].apply(lambda x: x.split('_')[1]) != "FV3"].tolist()
    valid = df.index[df["fnames"].apply(lambda x: x.split('_')[1]) == "FV3"].tolist()
    return train,valid

dblock = DataBlock(blocks=(ImageBlock, MultiCategoryBlock),
                   splitter=splitter,
                   get_x=get_x, 
                   get_y=get_y,
                   item_tfms = RandomResizedCrop(128, min_scale=0.35))
dls = dblock.dataloaders(df)