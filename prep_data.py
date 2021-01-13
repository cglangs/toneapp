import librosa, librosa.display
import matplotlib.pyplot as plt
import numpy as np

file = "test_a1_FV1.wav"

# default sample rate(sr) is 22050
#signal is array of amplitude for each second times sample rate
signal, sr = librosa.load(file)

#number of samples per fft
n_fft = 2048
#amount fft is moved in time
hop_length = 512


#############

#show graph of amplitude over time
'''
librosa.display.waveplot(signal, sr)
plt.xlabel("Time")
plt.ylabel("Amplitude")
plt.show()
'''

#############

'''
#fast fourier transform give array of complex value for total samples (sr*seconds)
fft = np.fft.fft(signal)
#derive magnitude from complex value this magnitude is the contribution of a given frequency to overall sound
magnitude = np.abs(fft)
#get frequencies from magnitude array by dividing length of magnitude array by samle size
frequency = np.linspace(0, sr, len(magnitude))

#get left half of graph
left_frequency = frequency[:int(len(frequency)/2)]
left_magnitude = magnitude[:int(len(magnitude)/2)]

plt.plot(left_frequency,left_magnitude)

plt.xlabel("Frequency")
plt.ylabel("Magnitude")
plt.show()
'''

#############

'''
stft = librosa.core.stft(signal,hop_length=hop_length, n_fft=n_fft)

spectrogram = np.abs(stft)

log_spectrogram = librosa.amplitude_to_db(spectrogram)

librosa.display.specshow(log_spectrogram, sr=sr, hop_length=hop_length)
plt.xlabel("Time")
plt.ylabel("Frequency")
plt.colorbar()
plt.show()
'''

#############
'''
MFCCs = librosa.feature.mfcc(signal,hop_length=hop_length, n_fft=n_fft, n_mfcc=13)

librosa.display.specshow(MFCCs, sr=sr, hop_length=hop_length)
plt.xlabel("Time")
plt.ylabel("MFCC")
plt.colorbar()
plt.show()
'''

