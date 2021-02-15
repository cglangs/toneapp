import React, { Component } from 'react'
import {Howl} from 'howler';

import hark from 'hark'
import {strings} from './constants'

import io from "socket.io-client"
import RecordRTC from "recordrtc"

import './App.css';
import './Switch.css';


let endpoint = "http://localhost:5000"
let socket = io.connect(`${endpoint}`)
class Fullsentence extends Component {

  constructor(props) {
    super(props);
    this.state = {
      threshold_decibels: 50,
      milliseconds: 0,
      voice_present: false,
      is_recording: false,
      is_playing: false,
      is_paused: false,
      sentence_finished: false,
      currentIndex: null,
      character_offsets: [],
      tones_recorded: [],
      test_sentence: {
        display: "你好！",
        characters: "你好",
        written_tones: "33",
        spoken_tones: "23",
        english: "Hello!",
        pinyin: "nǐ hǎo"
      }
    }    
    this.audioProgress = React.createRef();
    this.requestRef = React.createRef();
    this.howler = null
    this.recorder = null
    this.speechEvents = null
    //this.arrayBuffer = null
  }

   componentDidMount = () => {
    socket.on('predicted_tone', data => {
      const prediction = this.state.test_sentence.spoken_tones[data["index"]] === "_" ? "_" : data["prediction"].toString()
      const newToneArray = [...this.state.tones_recorded, prediction]
      this.setState({tones_recorded: newToneArray})
    })
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
        _this.recorder = _this.initRecorder(stream)
        var options = {threshold: -1 * _this.state.threshold_decibels};//-100 is silence -50 is the default
        _this.speechEvents = hark(stream, options);

        _this.recorder.startRecording();

        _this.speechEvents.on('speaking', function() {
          console.log('speaking');
          _this.setState({voice_present: true})
        });

        _this.speechEvents.on('stopped_speaking', function() {
          console.log('STOPPED SPEAKING');
          _this.recorder.stopRecording(async function() {
          _this.speechEvents.stop()
          let blob = await _this.recorder.getBlob()
          socket.emit('phrase_recorded', {voice_recording: blob});
          _this.howler = new Howl({
            src: [URL.createObjectURL(blob)],
            onplay: function(){
              console.log("PLAY")
              _this.setState({is_paused: false, milliseconds: 0})
            },
            onpause: function(){
              _this.setState({is_playing: false, is_paused: true, milliseconds: _this.audioProgress.current.valueAsNumber}, ()=> {cancelAnimationFrame(_this.requestRef.current)})
            },
            onend: function(){
              _this.setState({is_playing: false, milliseconds: _this.audioProgress.current.valueAsNumber})
            },
            onload: function(){
              var audioSlider = document.getElementById("audio-slider")
              audioSlider.min = 0
              audioSlider.max = this.duration() * 1000
              audioSlider.value = 0
            },             
            format:["wav"]
          });
          _this.setState({voice_present: false, audio_blob: blob, is_recording: false})
          });

        });
        _this.setState({is_recording: true})
    });
  }

  setSprites = (minValue, currentValue, maxValue, previousMin) => {
     this.howler._sprite = {
      "before" : [minValue, currentValue-minValue], 
      "after" : [currentValue, maxValue-currentValue],
      "all" : [minValue, maxValue-minValue]
    }

    this.state.character_offsets.forEach((char, index) => {
      this.howler._sprite[index.toString()] = [char.begin, char.end]
    })
  }

  replayAudio = (spriteName) => {
    if(this.howler != null){

      const minimum = this.state.character_offsets.length ? this.state.character_offsets[this.state.character_offsets.length -1] : 0
      const maximum = parseInt(this.audioProgress.current.max)
      const currentValue = parseInt(this.audioProgress.current.valueAsNumber)

      this.setSprites(minimum, currentValue, maximum)
      this.howler.play(spriteName)
    }
  }

  pauseAudio = () => {
    if(this.howler != null){
      this.howler.pause();
    }
  }

  restartSentence = () => {
    this.setState({ milliseconds: 0, tones_recorded: [], character_offsets: [], currentIndex: null}, () => {this.howler = null})
  }

  playWithSlider = () => {
      let start = Date.now();
      let audioSlider = document.getElementById("audio-slider")
      let startPoint = this.audioProgress.current.valueAsNumber
      this.replayAudio(strings.AFTER)
      let _this = this
      _this.requestRef.current = requestAnimationFrame(function animateSlider() {
          let interval = Date.now() - start + startPoint
          audioSlider.value = interval
          if (interval < parseInt(audioSlider.max)) _this.requestRef.current = requestAnimationFrame(animateSlider); // queue request for next frame
      });
  }

  updateTime = () => {
    this.setState({milliseconds: this.audioProgress.current.valueAsNumber})
  }

  removeLeft = () => {
    socket.emit('cut_phrase', {begin: parseInt(this.audioProgress.current.min), end: this.audioProgress.current.valueAsNumber, "character_index": this.state.tones_recorded.length});
    const finished = this.state.tones_recorded.length === this.state.test_sentence.spoken_tones.length - 1 
    const charIndex = this.state.tones_recorded.length
    let _this = this
    this.setState(prevState => ({character_offsets: [...prevState.character_offsets, {begin: parseInt(this.audioProgress.current.min), end: parseInt(this.audioProgress.current.valueAsNumber)}], sentence_finished: finished}), ()=>{
      _this.setSprites(parseInt(this.audioProgress.current.valueAsNumber), parseInt(this.audioProgress.current.valueAsNumber), parseInt(this.audioProgress.current.max))
      var audioSlider = document.getElementById("audio-slider")
      audioSlider.max = this.audioProgress.current.max
      audioSlider.min = this.audioProgress.current.valueAsNumber
      audioSlider.value = this.audioProgress.current.valueAsNumber
    })
  }

  handleCharClick = (index) => {
    let _this = this
    if(index < this.state.tones_recorded.length){
      this.setState({currentIndex: index}, ()=> {_this.howler.play(index.toString())})  
    }
  }

  diplayString = (text = '', highlighted= false, highlightIndex = 0) => {
     const parts = text.split('')
     return (
       <span className="String-holder">
         {parts.map((char,index)=> {
           if(highlighted && index === highlightIndex){
             return <mark key={index} onClick={() => this.handleCharClick(index)}>{char}</mark>
           } else{
             return <span key={index} onClick={() => this.handleCharClick(index)}>{char}</span>
           }

         })}
      </span>
     )
  }

  render(){
    const btn_class = this.state.is_recording ? "pressedButton" : "defaultButton";
    const btns_disabled = this.howler == null
    console.log(this.state)
    return (
      <div className="App"> 
        <header className="App-header">
          <audio id="replay"/>
          <div style={{display: "flex", flexDirection: "column"}}>
          <p style={{"textAlign": "center"}}>{this.state.test_sentence.english}</p>
          <p style={{"textAlign": "center"}}>{this.state.test_sentence.display}</p>
          {this.state.sentence_finished && <p style={{"textAlign": "center"}}>{this.state.test_sentence.pinyin}</p>}
          {this.state.sentence_finished && this.diplayString(this.state.test_sentence.spoken_tones, false)}
          {this.diplayString(this.state.test_sentence.characters, true, this.state.currentIndex)}
          {this.diplayString(this.state.tones_recorded.join(''), false)}
          <p style={{"height": "25px"}}>{this.state.voice_present ? "Voice heard" : this.state.is_recording ?  "Recording..." : ""}</p>
          <p style={{"height": "25px"}}>{this.state.milliseconds ? (this.state.milliseconds/1000) + " Seconds" : null}</p>
          {this.howler && <input id="audio-slider" ref={this.audioProgress} type="range" onChange={this.updateTime} />}
          <div style={{display: "flex", flexDirection: "row", justifyContent: "center", "marginTop": "20px"}}>
            <button className={btn_class} onClick={this.startRecording}>
                  {this.state.is_recording ? "Stop Recording" : "Record"}
            </button>
            <button  className="defaultButton" disabled={btns_disabled} onClick={this.removeLeft}>
                  Remove Left
            </button>
            <button  className="defaultButton" disabled={btns_disabled} onClick={()=> this.setState({is_playing: true}, ()=>{this.playWithSlider()})}>
                  Play
            </button>
            <button  className="defaultButton" disabled={btns_disabled || !this.state.is_playing} onClick={this.pauseAudio}>
                  Pause
            </button>
            <button  className="defaultButton" disabled={btns_disabled} onClick={() => this.replayAudio(strings.ALL)}>
                  Play All
            </button>
            <button  className="defaultButton" disabled={btns_disabled} onClick={() => this.replayAudio(strings.BEFORE)}>
                  Play Before
            </button>
            <button  className="defaultButton" disabled={btns_disabled} onClick={() => this.replayAudio(strings.AFTER)}>
                  Play After
            </button>
             <button  className="defaultButton" disabled={btns_disabled} onClick={this.restartSentence}>
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