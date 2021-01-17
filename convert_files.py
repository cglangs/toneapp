from os import listdir
from pydub import AudioSegment


for filename in listdir("./tone_perfect"):
	filename_split = filename.split(".")
	print(filename_split[0])
	sound = AudioSegment.from_mp3("./tone_perfect/" + filename)
	sound.export("./tone_wav/" + filename_split[0] + ".wav", format="wav")

