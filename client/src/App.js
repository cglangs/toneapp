import React, { Component } from 'react'
import hark from 'hark'


//import io from "socket.io-client"
import RecordRTC from "recordrtc"


//import logo from './logo.svg';
import './App.css';


//let endpoint = "http://localhost:5000"
//let socket = io.connect(`${endpoint}`)
class App extends Component {

  initRecorder(stream){
      let recorder = RecordRTC(stream, {
      type: 'audio',
      sampleRate: 44100,
      bufferSize: 1024,
      numberOfAudioChannels: 1,
      recorderType: RecordRTC.StereoAudioRecorder
    });
      return recorder
  }

  componentDidMount(){
    let _this = this
    var newAudio = document.createElement('audio');
    newAudio.autoplay = true;
    navigator.mediaDevices.getUserMedia({audio: true }).then(async function(stream) {
      var recorder = _this.initRecorder(stream)
        var options = {};
        var speechEvents = hark(stream, options);

        speechEvents.on('speaking', function() {
          recorder.startRecording();
          console.log('speaking');
        });
     
        speechEvents.on('stopped_speaking', function() {
          console.log('stopped_speaking');
          recorder.stopRecording(async function() {
              //recorder.save('audiorecording.wav');
              let blob = await recorder.getBlob();
              newAudio.src = URL.createObjectURL(blob)
              newAudio.play()
              //socket.emit('message', blob);
              recorder = _this.initRecorder(stream)
              ;
          });
        });
    });

  }





  render(){
    return (
      <div className="App">
        <header className="App-header">


        </header>
      </div>
    );
  }
}

export default App;
