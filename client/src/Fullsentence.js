import React, { Component } from 'react'
import {Howl} from 'howler';
import audioBufferSlice from 'audiobuffer-slice'

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
      character_offsets: [],
      tones_recorded: [],
      test_sentence: {
        display: "你好！",
        characters: "你好",
        written_tones: "23",
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
    this.arrayBuffer = null
  }

   componentDidMount = () => {
    socket.on('predicted_tone', data => {
      const prediction = this.state.test_sentence.spoken_tones[data["index"]] === "_" ? "_" : data["prediction"].toString()
      const newToneArray = [...this.state.tones_recorded]
      newToneArray.splice(data["index"], 1, prediction)
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
          _this.setState({voice_present: true, predicted_tone: null})
        });

        _this.speechEvents.on('stopped_speaking', function() {
          console.log('STOPPED SPEAKING');
          _this.recorder.stopRecording(async function() {
          _this.speechEvents.stop()
          let blob = await _this.recorder.getBlob()
          let arrayBuffer = await blob.arrayBuffer()
          _this.arrayBuffer = arrayBuffer
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

  setSprites = (minValue, currentValue, maxValue) => {
     this.howler._sprite = {
      "before" : [minValue, currentValue-minValue], 
      "after" : [currentValue, maxValue-currentValue],
      "all" : [minValue, maxValue-minValue]
    }
  }

  replayAudio = (spriteName) => {
    if(this.howler != null){

      const minimum = this.state.character_offsets.length ? this.state.character_offsets[this.state.character_offsets.length -1] : 0
      const maximum = parseInt(this.audioProgress.current.max)
      const currentValue = parseInt(this.audioProgress.current.valueAsNumber)

      this.setSprites(minimum, currentValue, maximum)
      console.log(spriteName)
      this.howler.play(spriteName)
    }
  }

  pauseAudio = () => {
    if(this.howler != null){
      this.howler.pause();
    }
  }

  restartSentence = () => {
    this.setState({ milliseconds: 0}, () => {this.howler = null})
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
    this.setSprites(parseInt(this.audioProgress.current.valueAsNumber), parseInt(this.audioProgress.current.valueAsNumber), parseInt(this.audioProgress.current.max))
    var audioSlider = document.getElementById("audio-slider")
    audioSlider.max = this.audioProgress.current.max
    audioSlider.min = this.audioProgress.current.valueAsNumber
    audioSlider.value = this.audioProgress.current.valueAsNumber
    this.setState(prevState => ({character_offsets: [...prevState.character_offsets, parseInt(this.audioProgress.current.valueAsNumber)]}))
  }

  testAudioBuffer = () => {
    const audioContext = new AudioContext()
    let sourceArray = new Float32Array(this.arrayBuffer)
    let myAudioBuffer = audioContext.createBuffer(1, 44100 * this.howler.duration(), 44100);
    myAudioBuffer.copyToChannel(sourceArray, 0, 0) 
    let _this = this
    audioBufferSlice(myAudioBuffer, 0, _this.howler.duration() * 1000, function(error, slicedAudioBuffer) {
    if (error) {
      console.error(error);
    } else {
      var destinationArray = new Float32Array(sourceArray.length)
      slicedAudioBuffer.copyFromChannel(destinationArray, 0, 0)
      socket.emit('voice_recorded', {voice_recording: destinationArray, character_index: 0, threshold: _this.state.threshold_decibels})    
    }
    });

    // This is the AudioNode to use when we want to play an AudioBuffer
    /*var source = audioContext.createBufferSource();

    // set the buffer in the AudioBufferSourceNode
    source.buffer = myAudioBuffer;

    // connect the AudioBufferSourceNode to the
    // destination so we can hear the sound
    source.connect(audioContext.destination);

    // start the source playing
    source.start();*/
    /*let newAudio = document.getElementById("replay")
    newAudio.src = URL.createObjectURL(new Blob(destinationArray, {type: "audio/wav"}))
    newAudio.play()*/
    
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
          <p style={{"textAlign": "center"}}>{this.state.test_sentence.pinyin}</p>
          <p style={{"textAlign": "center"}}>{this.state.test_sentence.display}</p>
          <p style={{"height": "25px"}}>{this.state.voice_present ? "Voice heard" : this.state.is_recording ?  "Recording..." : ""}</p>
          <p style={{"height": "25px"}}>{this.state.milliseconds ? (this.state.milliseconds/1000) + " Seconds" : null}</p>
          {this.howler && <input id="audio-slider" ref={this.audioProgress} type="range" onChange={this.updateTime} />}
          <div style={{display: "flex", flexDirection: "row", justifyContent: "center", "marginTop": "20px"}}>
            <button className={btn_class} onClick={this.startRecording}>
                  {this.state.is_recording ? "Stop Recording" : "Record"}
            </button>
            <button  className="defaultButton" disabled={btns_disabled} onClick={this.testAudioBuffer}>
                  Test
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