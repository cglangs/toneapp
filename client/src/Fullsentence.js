import React, { Component } from 'react'
import {Howl, Howler} from 'howler';
import hark from 'hark'

//import io from "socket.io-client"
import RecordRTC from "recordrtc"

import './App.css';
import './Switch.css';


//let endpoint = "http://localhost:5000"
//let socket = io.connect(`${endpoint}`)
class Fullsentence extends Component {

  constructor(props) {
    super(props);
    this.state = {
      threshold_decibels: 50,
      recorder: null,
      harkObject: null,
      audio_howler: null,
      voice_present: false,
      is_recording: false,
      is_playing: false,
      is_paused: false,
      test_sentence: {
        display: "1-2-3-4-5-6-7-8-9-10"
      }
    }    
    this.audioProgress = React.createRef();
    this.requestRef = React.createRef();
  }

  initRecorder = (stream) => {
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
    navigator.mediaDevices.getUserMedia({audio: true }).then(async function(stream) {
        var recorder = _this.initRecorder(stream)
        var options = {threshold: -1 * _this.state.threshold_decibels};//-100 is silence -50 is the default
        var speechEvents = hark(stream, options);

        recorder.startRecording();

        speechEvents.on('speaking', function() {
          console.log('speaking');
          _this.setState({voice_present: true, predicted_tone: null})
        });

        speechEvents.on('stopped_speaking', function() {
          console.log('STOPPED SPEAKING');
          recorder.stopRecording(async function() {
          speechEvents.stop()
          let blob = await recorder.getBlob()
          var sound = new Howl({
            src: [URL.createObjectURL(blob)],
            onplay: function(){
              console.log("PLAY")
              _this.setState({is_paused: false})
            },
            onpause: function(){
              _this.setState({is_playing: false, is_paused: true}, ()=> {cancelAnimationFrame(_this.requestRef.current)})
            },
            onend: function(){
              _this.setState({is_playing: false})
            },
            onload: function(){
              var audioSlider = document.getElementById("audio-slider")
              audioSlider.min = 0
              audioSlider.max = this.duration() * 1000
              audioSlider.value = 0
            },             
            format:["wav"]
          });
          _this.setState({voice_present: false, audio_blob: blob, audio_howler: sound, is_recording: false})
          });

        });
        _this.setState({harkObject: speechEvents, recorder: recorder, is_recording: true})
    });
  }

  replayAudio = (playAll,isAfter) => {
    if(this.state.audio_howler != null){
      this.state.audio_howler._sprite = {
        'before': [0,this.audioProgress.current.valueAsNumber], 
        'after': [this.audioProgress.current.valueAsNumber, this.audioProgress.current.max - this.audioProgress.current.valueAsNumber],
        'all': [0,this.audioProgress.current.max]
      }
      if(playAll){
        this.state.audio_howler.play('all')  
      }else{
        if(isAfter){
          this.state.audio_howler.play('after');
        } else{
          this.state.audio_howler.play('before');
        }        
      }
    }
  }

  pauseAudio = () => {
    if(this.state.audio_howler != null){
      this.state.audio_howler.pause();
    }
  }

  restartSentence = () => {
    this.setState({audio_howler: null})
  }

  playWithSlider = () => {
      let start = Date.now();
      let audioSlider = document.getElementById("audio-slider")
      let startPoint = this.audioProgress.current.valueAsNumber
      this.replayAudio(false, true)
      let _this = this
      _this.requestRef.current = requestAnimationFrame(function animateSlider() {
          let interval = Date.now() - start + startPoint
          audioSlider.value = interval
          if (interval < parseInt(audioSlider.max)) _this.requestRef.current = requestAnimationFrame(animateSlider); // queue request for next frame
      });
  }

  render(){
    let btn_class = this.state.is_recording ? "pressedButton" : "defaultButton";
    return (
      <div className="App"> 
        <header className="App-header">
          <div style={{display: "flex", flexDirection: "column"}}>
          <p style={{"textAlign": "center"}}>{this.state.test_sentence.english}</p>
          <p style={{"textAlign": "center"}}>{this.state.test_sentence.pinyin}</p>
          <p style={{"textAlign": "center"}}>{this.state.test_sentence.display}</p>
          <p style={{"height": "25px"}}>{this.state.voice_present ? "Voice heard" : this.state.is_recording ?  "Recording..." : ""}</p>
          {this.state.audio_howler && <input id="audio-slider" ref={this.audioProgress} type="range"/>}
          <div style={{display: "flex", flexDirection: "row", justifyContent: "center", "marginTop": "20px"}}>
            <button className={btn_class} onClick={this.startRecording}>
                  {this.state.is_recording ? "Stop Recording" : "Record"}
            </button>
            <button  className="defaultButton" disabled={this.state.audio_howler == null} onClick={()=> this.setState({is_playing: true}, ()=>{this.playWithSlider()})}>
                  Play
            </button>
            <button  className="defaultButton" disabled={this.state.audio_howler == null || !this.state.is_playing} onClick={this.pauseAudio}>
                  Pause
            </button>
            <button  className="defaultButton" disabled={this.state.audio_howler == null} onClick={() => this.replayAudio(true, false)}>
                  Play All
            </button>
            <button  className="defaultButton" disabled={this.state.audio_howler == null} onClick={() => this.replayAudio(false, false)}>
                  Play Before
            </button>
            <button  className="defaultButton" disabled={this.state.audio_howler == null} onClick={() => this.replayAudio(false, true)}>
                  Play After
            </button>
             <button  className="defaultButton" disabled={this.state.audio_howler == null} onClick={this.restartSentence}>
                  Restart Sentence
            </button>
        </div>
        </div>
        </header>
      </div>
    );
  }
}

export default Fullsentence;