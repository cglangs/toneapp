import React, { Component } from 'react'
import hark from 'hark'


import io from "socket.io-client"
import RecordRTC from "recordrtc"


//import logo from './logo.svg';
import './App.css';
import './Switch.css';


let endpoint = "http://localhost:5000"
let socket = io.connect(`${endpoint}`)
class App extends Component {


  state = {
    threshold_decibels: 64,
    harkObject: null,
    voice_present: false,
    recording: false,
    new_audio: null,
    get_tone: false
  }

  initRecorder = (stream, listofBlobs) => {
      let recorder = RecordRTC(stream, {
      type: 'audio',
      sampleRate: 44100,
      bufferSize: 2048,
      numberOfAudioChannels: 1,
      recorderType: RecordRTC.StereoAudioRecorder
    });
      return recorder
  }


  startRecording = () => {
    let _this = this
    var newAudio = document.getElementById("replay");
    navigator.mediaDevices.getUserMedia({audio: true }).then(async function(stream) {
        var recorder = _this.initRecorder(stream)
        var options = {threshold: -1 * _this.state.threshold_decibels};//-100 is silence -50 is the default
        var speechEvents = hark(stream, options);

        speechEvents.on('speaking', function() {
          console.log('speaking');
          recorder.startRecording();
          _this.setState({voice_present: true})
        });
     
        speechEvents.on('stopped_speaking', function() {
          console.log('stopped_speaking');
          recorder.stopRecording(async function() {
          //recorder.save('audiorecording.wav');
          let blob = await recorder.getBlob();
          if(_this.state.get_tone){
            socket.emit('voice_recorded', blob);
          }
          newAudio.src = URL.createObjectURL(blob)
          speechEvents.stop()
          _this.setState({voice_present: false, new_audio: newAudio, recording: false})
          });

        });
        _this.setState({harkObject: speechEvents, recording: true})
    });
  }

  handleSliderChange = (e) => {
    this.setState({threshold_decibels: e.target.value}, () => this.state.harkObject.setThreshold(-1 * this.state.threshold_decibels));
  }

  toggleMic = () => {
    this.setState({get_tone: !this.state.get_tone})
  }

  replayAudio = () => {
    console.log(this.state)
    if(this.state.new_audio){
      this.state.new_audio.play()
    }
  }

  render(){
    let btn_class = this.state.recording ? "pressedButton" : "defaultButton";
    return (
      <div className="App">
        <header className="App-header">
        {this.state.voice_present && "Voice heard"}
        <audio id="replay"/>
        <button className={btn_class} onClick={this.startRecording}>
                  {this.state.recording ? "Recording" : "Record"}
        </button>
         <button  className={"defaultButton"} onClick={this.replayAudio}>
                  Replay
        </button>
        <div style={{display: "flex", flexDirectioion: "row", justifyContent: "center", "marginTop": "20px", width: "40%"}}>
        <p style={{fontSize: "14px", "marginBlockStart": "-1.5em", "marginRight": "20px"}}>{"Test Mic"}</p> 
        <label className="switch">
          <input type="checkbox" checked={this.state.show_tone} />
          <span className="slider round"></span>
        </label>
          <p style={{fontSize: "14px", "marginBlockStart": "-1.5em", "marginLeft": "5%"}}>{"Get Tone"}</p> 
         </div>
        <input type="range" min="50" max="79" disabled={this.state.harkObject == null}value={this.state.threshold_decibels} onChange={this.handleSliderChange}/>
        <span>{this.state.threshold_decibels - 49 }</span>
        </header>
      </div>
    );
  }
}

export default App;
