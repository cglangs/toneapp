from os import path
from pydub import AudioSegment

# files                                                                         
src = "test_a1_FV1.mp3"
dst = "test_a1_FV1.wav"

# convert mp3 to wav                                                           
sound = AudioSegment.from_mp3(src)
sound.export(dst, format="wav")
