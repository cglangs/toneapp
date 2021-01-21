import librosa
from os import listdir
import statistics


minimum = 9999999

for filename in listdir("./tone_wav"):
	y, sr = librosa.load("tone_wav/" + filename)
	local_max = max(y, key=abs)
	if local_max < minimum:
		minimum = local_max
		
print(minimum)


