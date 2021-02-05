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

    if(this.state.get_tone){
        this.setState({voice_present: false, new_audio: newAudioArray, recording: false, currentIndex: previousIndex + 1, sentence_finished: finished, automatic_mode: automatic}, () =>
      {
          socket.emit('voice_recorded', {voice_recording: blob, character_index: previousIndex, threshold: this.state.threshold_decibels});
      })
    } else{
      this.setState({voice_present: false, new_audio: newAudioArray, recording: false}, () => { this.state.new_audio[previousIndex].play()})
    }   
  }


  startRecording = () => {
    let _this = this
    var newAudio = document.getElementById("replay-" + _this.state.currentIndex);
    navigator.mediaDevices.getUserMedia({audio: true }).then(async function(stream) {
        var recorder = _this.initRecorder(stream)
        var options = {threshold: -1 * _this.state.threshold_decibels};//-100 is silence -50 is the default
        var speechEvents = hark(stream, options);

        recorder.startRecording();

        speechEvents.on('speaking', function() {
          console.log('speaking');
          _this.setState({voice_present: true, predicted_tone: null})
        });

        /*window.addEventListener('keydown',  (event) => {
          if (event.keyCode === 39 && _this.state.voice_present && _this.state.get_tone) {
            console.log("RIGHT ARROW PRESSED")
            speechEvents.stop()
          }
        });*/

        speechEvents.on('stopped_speaking', function() {
          console.log('STOPPED SPEAKING');
          recorder.stopRecording(async function() {
          //recorder.save('audiorecording.wav');
          speechEvents.stop()
          let blob = await recorder.getBlob();
          _this.saveRecording(newAudio,blob)
          });

        });
        _this.setState({harkObject: speechEvents, recorder: recorder, recording: true})
    });
  }

  handleSliderChange = (e) => {
    this.setState({threshold_decibels: e.target.value}, () => this.state.harkObject.setThreshold(this.state.threshold_decibels));
  }

  toggleMic = () => {
    this.setState({get_tone: !this.state.get_tone})
  }

  toggleMode = () => {
    this.setState({automatic_mode: !this.state.automatic_mode})
  }

  replayAudio = () => {
    if(this.state.new_audio.length){
      this.state.new_audio[this.state.currentIndex].play()
    }
  }


  restartSentence = () => {
    this.setState({currentIndex: 0, tones_recorded: [], sentence_finished: false, new_audio: []})
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
      <div className="App">
        <header className="App-header">
        {
          this.state.test_sentence.characters.split('').map((recording, index)=> {
            return <audio key={index} id={"replay-" + index}/>
          })
        }
        <div style={{display: "flex", flexDirection: "column"}}>
          <p style={{"textAlign": "center"}}>{this.state.test_sentence.english}</p>
          <p style={{"textAlign": "center"}}>{this.state.test_sentence.display}</p>
          {this.state.sentence_finished && <p style={{"textAlign": "center"}}>{this.state.test_sentence.pinyin}</p>}
          {this.state.sentence_finished && this.diplayString(this.state.test_sentence.spoken_tones, false)}
          {this.diplayString(this.state.test_sentence.characters, true, this.state.currentIndex)}
          {this.diplayString(this.state.tones_recorded.join(''), false)}
          <label>{this.state.predicted_tone && ("Tone:" + this.state.predicted_tone)}</label>
        </div>
        <div style={{display: "flex", flexDirection: "row", justifyContent: "center", "marginTop": "20px"}}>
        <button className={btn_class} disabled={this.state.currentIndex >= this.state.test_sentence.spoken_tones.length} onClick={this.recordingButtonClick}>
                  {this.state.recording ? "Strop Recording" : "Record"}
        </button>
         <button  className="defaultButton" disabled={this.state.currentIndex >= this.state.tones_recorded.length} onClick={this.replayAudio}>
                  Replay
        </button>
         <button  className="defaultButton" onClick={this.restartSentence}>
                  Restart Sentence
        </button>
        </div>
        <div style={{display: "flex", flexDirection: "column", justifyContent: "center", width: "40%"}}>
          <p style={{"height": "25px"}}>{this.state.voice_present ? "Voice heard" : this.state.recording ?  "Recording..." : ""}</p>
          <div style={{display: "flex", flexDirection: "row", justifyContent: "center", "marginTop": "20px"}}>
            <p style={{fontSize: "14px", "marginBlockStart": "-1.5em", "marginRight": "20px", "width": "50px"}}>{"Test Mic"}</p> 
            <label className="switch">
              <input type="checkbox" checked={this.state.get_tone} onChange={this.toggleMic} />
              <span className="slider round"></span>
            </label>
            <p style={{fontSize: "14px", "marginBlockStart": "-1.5em", "marginLeft": "5%", "width": "50px"}}>{"Get Tone"}</p> 
          </div>
          <div style={{display: "flex", flexDirection: "row", justifyContent: "center", "marginTop": "20px"}}>
            <p style={{fontSize: "14px", "marginBlockStart": "-1.5em", "marginRight": "20px", "width": "50px"}}>{"Manual Mode"}</p> 
            <label className="switch">
              <input type="checkbox" checked={this.state.automatic_mode} onChange={this.toggleMode} />
              <span className="slider round"></span>
            </label>
           <p style={{fontSize: "14px", "width": "50px", "marginBlockStart": "-1.5em", "marginLeft": "5%"}}>{"Automatic Mode"}</p> 
          </div>
         </div>
        <label>Mic sensitivity</label>
        <input type="range" min="1" max="99" disabled={this.state.harkObject == null}value={this.state.threshold_decibels} onChange={this.handleSliderChange}/>
        <span>{this.state.threshold_decibels}</span>
        </header>
      </div>
    );
  }
}

export default App;
