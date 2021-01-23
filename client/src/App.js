import React, { Component } from 'react'
import hark from 'hark'


import io from "socket.io-client"
import RecordRTC from "recordrtc"


//import logo from './logo.svg';
import './App.css';


let endpoint = "http://localhost:5000"
let socket = io.connect(`${endpoint}`)
class App extends Component {


  state = {
    isRecording: false
  }

  initRecorder(stream, listofBlobs){
      let _this = this
      let recorder = RecordRTC(stream, {
      type: 'audio',
      sampleRate: 44100,
      bufferSize: 2048,
      numberOfAudioChannels: 1,
      recorderType: RecordRTC.StereoAudioRecorder,
      timeSlice: 100,
      ondataavailable: function(blob) {
        console.log(_this.state)
        if(_this.state.isRecording){
          listofBlobs.push(blob)
        }
      }
    });
      return recorder
  }

  componentDidMount(){
    let _this = this
    console.log(_this)
    var listofBlobs = [];
    var newAudio = document.createElement('audio');
    newAudio.autoplay = true;
    navigator.mediaDevices.getUserMedia({audio: true }).then(async function(stream) {
      var recorder = _this.initRecorder(stream,listofBlobs)
        var options = {};
        var speechEvents = hark(stream, options);
        recorder.startRecording();

        speechEvents.on('speaking', function() {
          _this.setState({isRecording: true})
          console.log('speaking');
        });
     
        speechEvents.on('stopped_speaking', function() {
          console.log('stopped_speaking');
          _this.setState({isRecording: false})
          var singleBlob = new Blob(listofBlobs, {
            type: 'audio/wav'
          });
          console.log(singleBlob)
          socket.emit('message', singleBlob);


          //recorder.stopRecording(async function() {
              //recorder.save('audiorecording.wav');
              //let blob = await recorder.getBlob();
              //newAudio.src = URL.createObjectURL(blob)
              //newAudio.play()
              //socket.emit('message', blob);
              //recorder = _this.initRecorder(stream,listofBlobs)
              
          //});
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
