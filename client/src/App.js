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
    harkObject: null,
    voice_present: false,
    recording: false,
    new_audio: null,
    get_tone: false,
    tones_recorded: [],
    currentIndex: 0,
    sentence_finished: false,
    automatic_mode: false,
    test_sentence: {
      display: "我喜欢他。",
      characters: "我喜欢他",
      written_tones: "33_1",
      spoken_tones: "23_1",
      english: "I like him.",
      pinyin: "wǒ xǐhuan tā"
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


  startRecording = () => {
    let _this = this
    var newAudio = document.getElementById("replay");
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
          console.log('stopped_speaking');
          recorder.stopRecording(async function() {
          //recorder.save('audiorecording.wav');
          let blob = await recorder.getBlob();
          console.log(_this.state.get_tone)
          newAudio.src = URL.createObjectURL(blob)
          speechEvents.stop()
          const finished = _this.state.tones_recorded.length === _this.state.test_sentence.spoken_tones.length - 1
          const previousIndex = _this.state.currentIndex
          if(_this.state.get_tone){
              _this.setState({voice_present: false, new_audio: newAudio, recording: false, currentIndex: previousIndex + 1, sentence_finished: finished}, () =>
            {
                socket.emit('voice_recorded', {voice_recording: blob, character_index: previousIndex, threshold: _this.state.threshold_decibels});
            })
          } else{
            _this.setState({voice_present: false, new_audio: newAudio, recording: false}, () => {_this.state.new_audio.play()})
          }

          });

        });
        _this.setState({harkObject: speechEvents, recording: true})
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
    if(this.state.new_audio){
      this.state.new_audio.play()
    }
  }

  restartSentence = () => {
    this.setState({currentIndex: 0, tones_recorded: [], sentence_finished: false})
  }

  handleCharClick = (index) => {
    console.log(index,this.state.tones_recorded.length)
    if(index < this.state.tones_recorded.length){
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

  render(){
    console.log(this.state)
    let btn_class = this.state.recording ? "pressedButton" : "defaultButton";
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
          <label>{this.state.predicted_tone && ("Tone:" + this.state.predicted_tone)}</label>
        </div>
        <div style={{display: "flex", flexDirection: "row", justifyContent: "center", "marginTop": "20px"}}>
        <button className={btn_class} disabled={this.state.currentIndex >= this.state.test_sentence.spoken_tones.length} onClick={this.startRecording}>
                  {this.state.recording ? "Recording" : "Record"}
        </button>
         <button  className="defaultButton" onClick={this.replayAudio}>
                  Replay
        </button>
         <button  className="defaultButton" onClick={this.restartSentence}>
                  Restart Sentence
        </button>
        </div>
        <div style={{display: "flex", flexDirection: "column", justifyContent: "center", width: "40%"}}>
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
        {this.state.voice_present && "Voice heard"}
        </header>
      </div>
    );
  }
}

export default App;
