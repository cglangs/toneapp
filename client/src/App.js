import React, { Component } from 'react'
import hark from 'hark'


//import io from "socket.io-client"
import RecordRTC from "recordrtc"


//import logo from './logo.svg';
import './App.css';
import './Switch.css';


//let endpoint = "http://localhost:5000"
//let socket = io.connect(`${endpoint}`)
class App extends Component {


  state = {
    threshold_decibels: 59,
    harkObject: null
  }

  initRecorder(stream, listofBlobs){
      let recorder = RecordRTC(stream, {
      type: 'audio',
      sampleRate: 44100,
      bufferSize: 2048,
      numberOfAudioChannels: 1,
      recorderType: RecordRTC.StereoAudioRecorder
    });
      return recorder
  }

  componentDidMount() {
    let _this = this
    var newAudio = document.createElement('audio');
    newAudio.autoplay = true;
    navigator.mediaDevices.getUserMedia({audio: true }).then(async function(stream) {
        var recorder = _this.initRecorder(stream)
        var options = {threshold: -1 * _this.state.threshold_decibels};//-100 is silence -50 is the default
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
              //newAudio.src = URL.createObjectURL(blob)
              //newAudio.play()
              //socket.emit('message', blob);
              //recorder = _this.initRecorder(stream)
              ;
          });
        });
        _this.setState({harkObject: speechEvents})
    });
  }

  handleSliderChange = (e) => {
    this.setState({threshold_decibels: e.target.value}, () => this.state.harkObject.setThreshold(-1 * this.state.threshold_decibels));
  }


  render(){
    //console.log(this.state.harkObject && this.state.harkObject.threshold)
    return (
      <div className="App">
        <header className="App-header">
        <div style={{display: "flex", flexDirectioion: "row", justifyContent: "center", "marginTop": "20px", width: "40%"}}>
        <p style={{fontSize: "14px", "marginBlockStart": "-1.5em", "marginRight": "20px"}}>{"Test Mic"}</p> 
        <label class="switch">
          <input type="checkbox"/>
          <span class="slider round"></span>
        </label>
          <p style={{fontSize: "14px", "marginBlockStart": "-1.5em", "marginLeft": "5%"}}>{"Get Tone"}</p> 
         </div>
        <input type="range" min="50" max="69" value={this.state.threshold_decibels} onChange={this.handleSliderChange}/>
        <span>{this.state.threshold_decibels - 49 }</span>
        </header>
      </div>
    );
  }
}

export default App;
