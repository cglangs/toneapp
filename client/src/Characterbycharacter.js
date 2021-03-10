import React, { Component } from 'react'
import hark from 'hark'

import io from "socket.io-client"
import RecordRTC from "recordrtc"

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
      show_pinyin: false
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
      this.setState({tones_recorded: newToneArray},() => {this.checkPhrase()})
    })
  }

  componentDidUpdate = (prevProps) => {
    if(prevProps.sentence.phrase_order && prevProps.sentence.phrase_order !== this.props.sentence.phrase_order){
      console.log("UPDATE")
      this.setState({test_sentence: this.props.sentence})
    }
  }

  checkPhrase = () => {
    let isCorrect = false
    if(!this.state.sentence_finished && this.state.automatic_mode){
      this.startRecording()
    } else if(this.state.sentence_finished){
      isCorrect = this.state.tones_recorded.every((tone,index) => tone === this.state.test_sentence.spoken_tones[index])    
    }
    if(isCorrect && this.props.user && !this.state.test_sentence.is_completed_char){
      this.props.mutationFunction(true, this.state.test_sentence.is_completed_full)
    }

  }

  saveRecording = (newAudio, blob) => {
    newAudio.src = URL.createObjectURL(blob)
    const finished = this.state.tones_recorded.length === this.state.test_sentence.spoken_tones.length - 1 && this.state.currentIndex === this.state.test_sentence.spoken_tones.length - 1
    const automatic = this.state.automatic_mode && !finished
    const showPinyin = finished || this.state.show_pinyin
    const previousIndex = this.state.currentIndex
    const newAudioArray = [...this.state.new_audio]
    newAudioArray.splice(this.state.currentIndex, 1, newAudio)

    
    this.setState({voice_present: false, new_audio: newAudioArray, recording: false, currentIndex: previousIndex + 1, sentence_finished: finished, automatic_mode: automatic, show_pinyin: showPinyin}, () =>
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

  togglePinyin = () => {
    this.setState({show_pinyin: !this.state.show_pinyin})
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
    this.setState({currentIndex: 0, tones_recorded: [], sentence_finished: false, new_audio: [], recording: false, automatic_mode: false, show_pinyin: false})
  }

  handleCharClick = (index) => {
    if(index <= this.state.tones_recorded.length){
      this.setState({currentIndex: index})  
    }
  }

  diplayString = (text = '', isChars = false) => {
     const parts = text.split('')
     return (
       <span className="String-holder charByChar">
         {parts.map((char,index)=> {
           if(isChars && index === this.state.currentIndex){
             return <mark key={index} onClick={() => this.handleCharClick(index)}>{char}</mark>
           } else if(!isChars && index <= this.state.tones_recorded.length -1 && this.state.test_sentence.spoken_tones[index] == this.state.tones_recorded[index]) {
             return <mark style={{"backgroundColor": "green"}}key={index} onClick={() => this.handleCharClick(index)}>{char}</mark>
           } else if(!isChars && index <= this.state.tones_recorded.length -1 && this.state.test_sentence.spoken_tones[index] != this.state.tones_recorded[index]) {
             return <mark style={{"backgroundColor": "red"}}key={index} onClick={() => this.handleCharClick(index)}>{char}</mark>
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
    let btn_class = this.state.recording ? "pressedButton" : "defaultButton";
    const spoken_tones = this.state.sentence_finished ? this.state.test_sentence.spoken_tones : ''
    return (
      <div>
        {
          this.state.test_sentence.characters.split('').map((recording, index)=> {
            return <audio key={index} id={"replay-" + index}/>
          })
        }
        <div style={{display: "inline-flex", flexDirection: "column"}}>
          <p style={{"textAlign": "center", height: "1vh"}}>{this.state.show_pinyin && this.state.test_sentence.pinyin}</p>
          <span className={"circle " + (this.props.isComplete() ? "" : "hide")}/>  
          <span style={{"textAlign": "center"}}>{this.state.test_sentence.display}</span>
          {/*this.diplayString(spoken_tones, false)*/}
          {this.diplayString(this.state.test_sentence.characters, true)}
          {this.diplayString(this.state.tones_recorded.join(''), false)}
        </div>
        <div style={{display: "flex", flexDirection: "row", justifyContent: "center", "marginTop": "20px", "marginBottom": "20px"}}>
        <button className="tooltip" disabled={this.state.currentIndex >= this.state.test_sentence.spoken_tones.length} onClick={this.recordingButtonClick}>
          <img style={{"padding": "0","height":  "7vh", "width":  "4vw"}}src="/record-voice-button.svg" />
          <span className="tooltiptext">Record voice</span>
        </button>
        <button className="tooltip" disabled={this.state.currentIndex >=this.state.tones_recorded.length}  onClick={this.replayAudio}>
          <img style={{"padding": "0","height":  "7vh", "width":  "4vw"}}src="/play-button.svg" />
          <span className="tooltiptext">Replay recording for selected character</span>
        </button>
         <button className="tooltip" disabled={this.state.tones_recorded.length === 0} onClick={this.restartSentence}>
              <img style={{"padding": "0","height":  "7vh", "width":  "4vw"}}src="/delete-button.svg" />
              <span className="tooltiptext">Restart phrase</span>
        </button>
        </div>
         <button  className="defaultButton"  disabled={this.state.test_sentence.spoken_tones[this.state.currentIndex] === '_' || this.state.currentIndex >= this.state.test_sentence.spoken_tones.length} onClick={this.playNativeVoice}>
                  Play Native Speaker Audio
        </button>
        <div style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
          <p style={{"height": "25px"}}>{this.state.voice_present ? "Voice heard" : this.state.recording ?  "Recording..." : ""}</p>
          <div style={{display: "flex", flexDirection: "row", justifyContent: "center", "marginTop": "20px"}}>
            <p className="tooltip" style={{fontSize: "14px", "marginBlockStart": "-1.5em", "marginRight": "20px", "width": "50px"}}>{"Manual Mode"}
            <span className="tooltiptext">User must press the record button for each character</span>
            </p> 
            <label className="switch">
              <input type="checkbox" checked={this.state.automatic_mode} onChange={this.toggleMode} />
              <span className="slider round"></span>
            </label>
           <p className="tooltip" style={{fontSize: "14px", "width": "50px", "marginBlockStart": "-1.5em", "marginLeft": "3%"}}>{"Automatic Mode"}
           <span className="tooltiptext">Recording will restart automatically after selected chaaracter changes</span>
           </p>
           </div>
           <div style={{display: "flex", flexDirection: "row", justifyContent: "center", "marginTop": "20px"}}>
           <p style={{fontSize: "14px", "marginBlockStart": "-1.5em", "marginRight": "20px", "width": "50px"}}>{"Hide Pinyin"}</p>
            <label className="switch">
              <input type="checkbox" checked={this.state.show_pinyin} onChange={this.togglePinyin} />
              <span className="slider round"></span>
            </label>
           <p style={{fontSize: "14px", "width": "50px", "marginBlockStart": "-1.5em", "marginLeft": "3%"}}>{"Show Pinyin"}</p>
          </div>
         </div>
      </div>
    );
  }
}

export default Characterbycharacter;
