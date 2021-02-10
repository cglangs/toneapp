import React, { Component } from 'react'
import {Howl} from 'howler';
import hark from 'hark'

//import io from "socket.io-client"
import RecordRTC from "recordrtc"

import './App.css';
import './Switch.css';


//let endpoint = "http://localhost:5000"
//let socket = io.connect(`${endpoint}`)
class Fullsentence extends Component {


  state = {
    threshold_decibels: 50,
    recorder: null,
    harkObject: null,
    audio_src: null,
    audio_howler: null,
    voice_present: false,
    is_recording: false,
    is_playing: false,
    is_paused: false,
    test_sentence: {
      display: "我喜欢在图书馆学习。",
      characters: "我喜欢在图书馆学习",
      written_tones: "33_421322",
      spoken_tones: "23_421322",
      english: "I like to study in the library.",
      pinyin: "wǒ xǐhuan zài túshūguǎn xuéxí"
    }
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
              _this.setState({is_playing: true, is_paused: false})
            },
            onpause: function(){
              _this.setState({is_playing: false, is_paused: true})
            },
            onend: function(){
              _this.setState({is_playing: false})
            },           
            format:["wav"]
          });

          _this.setState({voice_present: false, audio_blob: blob, audio_howler: sound, is_recording: false})
          });

        });
        _this.setState({harkObject: speechEvents, recorder: recorder, is_recording: true})
    });
  }

  replayAudio = () => {
    if(this.state.audio_howler != null){
      this.state.audio_howler.play();
    }
  }

  pauseAudio = () => {
    if(this.state.audio_howler != null){
      this.state.audio_howler.pause();
    }
  }

  continueAudio = () => {
    if(this.state.audio_howler != null){
      this.state.audio_howler.pause();
    }
  }

  restartSentence = () => {
    this.setState({audio_howler: null})
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
          <div style={{display: "flex", flexDirection: "row", justifyContent: "center", "marginTop": "20px"}}>
            <button className={btn_class} onClick={this.startRecording}>
                  {this.state.is_recording ? "Stop Recording" : "Record"}
            </button>
            <button  className="defaultButton" disabled={this.state.audio_howler == null} onClick={this.replayAudio}>
                  Replay
            </button>
            <button  className="defaultButton" disabled={this.state.audio_howler == null || !this.state.is_playing} onClick={this.pauseAudio}>
                  Pause
            </button>
            <button  className="defaultButton" disabled={this.state.audio_howler == null || !this.state.is_paused} onClick={this.replayAudio}>
                  Continue
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