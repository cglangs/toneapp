import React, { Component } from 'react'
import hark from 'hark'


import io from "socket.io-client"
import RecordRTC from "recordrtc"

//import logo from './logo.svg';
import './App.css';
import './Switch.css';


let endpoint = "http://localhost:5000"
let socket = io.connect(`${endpoint}`)
class Characterbycharacter extends Component {

  constructor(props) {
    super(props);
    this.state = {
      threshold_decibels: 50,
      voice_present: false,
      recording: false,
      new_audio: [],
      tones_recorded: [],
      currentIndex: 0,
      sentence_finished: false,
      automatic_mode: false,
    }
    this.state.test_sentence = this.props.sentence
    this.recorder = null
    this.speechEvents = null
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

  componentDidMount = () => {
    socket.on('predicted_tone', data => {
      const prediction = this.state.test_sentence.spoken_tones[data["index"]] === "_" ? "_" : data["prediction"].toString()
      const newToneArray = [...this.state.tones_recorded]
      newToneArray.splice(data["index"], 1, prediction)
      this.setState({tones_recorded: newToneArray},() => {!this.state.sentence_finished && this.state.automatic_mode && this.startRecording()})
    })
  }

  saveRecording = (newAudio, blob) => {
    newAudio.src = URL.createObjectURL(blob)
    const finished = this.state.tones_recorded.length === this.state.test_sentence.spoken_tones.length - 1 && this.state.currentIndex === this.state.test_sentence.spoken_tones.length - 1
    const automatic = this.state.automatic_mode && !finished
    const previousIndex = this.state.currentIndex
    const newAudioArray = [...this.state.new_audio]
    newAudioArray.splice(this.state.currentIndex, 1, newAudio)

    
    this.setState({voice_present: false, new_audio: newAudioArray, recording: false, currentIndex: previousIndex + 1, sentence_finished: finished, automatic_mode: automatic}, () =>
    {
        socket.emit('tone_recorded', {voice_recording: blob, character_index: previousIndex, threshold: this.state.threshold_decibels});
    })
   
  }


  startRecording = () => {
    let _this = this
    var newAudio = document.getElementById("replay-" + _this.state.currentIndex);
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
          let blob = await _this.recorder.getBlob();
          _this.saveRecording(newAudio,blob)
          });

        });
        _this.setState({recording: true})
    });
  }

  toggleMode = () => {
    this.setState({automatic_mode: !this.state.automatic_mode})
  }

  replayAudio = () => {
    if(this.state.new_audio.length){
      this.state.new_audio[this.state.currentIndex].play()
    }
  }

  playNativeVoice = () => {
    const letters = this.state.test_sentence.pinyin_no_tones[this.state.currentIndex]
    const toneNumber = this.state.test_sentence.spoken_tones[this.state.currentIndex]
    const fileName = '/native_voice_audio/' + letters + toneNumber + '_FV1_MP3.mp3'
    const audio = new Audio(fileName)
    audio.play()
  }


  restartSentence = () => {
    this.setState({currentIndex: 0, tones_recorded: [], sentence_finished: false, new_audio: [], recording: false, automatic_mode: false})
  }

  handleCharClick = (index) => {
    if(index <= this.state.tones_recorded.length){
      this.setState({currentIndex: index})  
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

  recordingButtonClick = () => {
    let _this = this
    if(_this.state.recording){
      _this.setState({automatic_mode: false, recording: false}, ()=> {
        _this.state.recorder.stopRecording(async function() {
          _this.state.harkObject.stop()
        });
      })
    } else{
      _this.startRecording()
    }
  }

  render(){
    console.log(this.state)
    let btn_class = this.state.recording ? "pressedButton" : "defaultButton";
    return (
      <div>
        {
          this.state.test_sentence.characters.split('').map((recording, index)=> {
            return <audio key={index} id={"replay-" + index}/>
          })
        }
        <div style={{display: "flex", flexDirection: "column"}}>
          <p style={{"textAlign": "center"}}>{this.state.test_sentence.display}</p>
          {this.state.sentence_finished && <p style={{"textAlign": "center"}}>{this.state.test_sentence.pinyin}</p>}
          {this.state.sentence_finished && this.diplayString(this.state.test_sentence.spoken_tones, false)}
          {this.diplayString(this.state.test_sentence.characters, true, this.state.currentIndex)}
          {this.diplayString(this.state.tones_recorded.join(''), false)}
        </div>
        <div style={{display: "flex", flexDirection: "row", justifyContent: "center", "marginTop": "20px"}}>
        <button className={btn_class} disabled={this.state.currentIndex >= this.state.test_sentence.spoken_tones.length} onClick={this.recordingButtonClick}>
                  {this.state.recording ? "Stop Recording" : "Record"}
        </button>
         <button  className="defaultButton" disabled={this.state.currentIndex >= this.state.tones_recorded.length} onClick={this.replayAudio}>
                  Replay
        </button>
         <button  className="defaultButton"  disabled={this.state.test_sentence.spoken_tones[this.state.currentIndex] === '_'} onClick={this.playNativeVoice}>
                  Play Native Speaker Audio
        </button>
         <button  className="defaultButton" onClick={this.restartSentence}>
                  Restart Sentence
        </button>
        </div>
        <div style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
          <p style={{"height": "25px"}}>{this.state.voice_present ? "Voice heard" : this.state.recording ?  "Recording..." : ""}</p>
          <div style={{display: "flex", flexDirection: "row", justifyContent: "center", "marginTop": "20px"}}>
            <p style={{fontSize: "14px", "marginBlockStart": "-1.5em", "marginRight": "20px", "width": "50px"}}>{"Manual Mode"}</p> 
            <label className="switch">
              <input type="checkbox" checked={this.state.automatic_mode} onChange={this.toggleMode} />
              <span className="slider round"></span>
            </label>
           <p style={{fontSize: "14px", "width": "50px", "marginBlockStart": "-1.5em", "marginLeft": "3%"}}>{"Automatic Mode"}</p> 
          </div>
         </div>
      </div>
    );
  }
}

export default Characterbycharacter;
