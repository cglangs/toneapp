import librosa

file = "test_a1_FV1.wav"

# default sample rate(sr) is 22050
#signal is array of amplitude for each second times sample rate
signal, sr = librosa.load(file)


dur = librosa.get_duration(y=signal, sr=sr)

print(dur)