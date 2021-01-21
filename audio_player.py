from pydub import AudioSegment
from pydub.playback import play

song = AudioSegment.from_wav("./records/2.wav")
play(song)