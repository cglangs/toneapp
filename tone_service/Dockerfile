FROM fastdotai/fastai:latest
COPY . .
RUN apt-get update
RUN apt-get install libasound-dev portaudio19-dev libportaudio2 libportaudiocpp0 libsndfile1 -y
RUN apt-get install libsndfile1
RUN python3 -m pip install -r requirements.txt
CMD python3 app.py
