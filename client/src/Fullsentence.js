import React, { Component } from 'react'
import hark from 'hark'

import io from "socket.io-client"
import RecordRTC from "recordrtc"

import './App.css';
import './Switch.css';


let endpoint = "http://localhost:5000"
let socket = io.connect(`${endpoint}`)
class Fullsentence extends Component {


  state = {
    threshold_decibels: 50,
    recorder: null,
    harkObject: null,
    voice_present: false,
    recording: false,
    new_audio: [],
    get_tone: true,
    tones_recorded: [],
    currentIndex: 0,
    sentence_finished: false,
    automatic_mode: false,
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

  render(){
    let btn_class = this.state.recording ? "pressedButton" : "defaultButton";
    return (
      <div className="App">
        <header className="App-header">
        </header>
      </div>
    );
  }
}

export default Fullsentence;