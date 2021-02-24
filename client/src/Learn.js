import React, { Component } from 'react'
import Characterbycharacter from './Characterbycharacter'
import Fullsentence from './Fullsentence'

class Learn extends Component {
  constructor(props){
    super(props)
    this.state = {
      fullSentenceMode: false,
      sentence: props.location.state.sentence
    }
  }

  changeMode = (isFullSentenceMode) => {
    this.setState({fullSentenceMode: isFullSentenceMode})
  }

  render() {
    return(
      <div className="LearnContainer">
        <div className="Navbar">
          <p className={!this.state.fullSentenceMode ? "selectedItem": ""} onClick={() => this.changeMode(false)}>Character by Character</p>
          <p className={this.state.fullSentenceMode ? "selectedItem": ""} onClick={() => this.changeMode(true)}>Full Sentence</p>
        </div>
        {this.state.fullSentenceMode ? <Fullsentence sentence={this.state.sentence}/>: <Characterbycharacter sentence={this.state.sentence}/>}
      </div>
    )
  }

}

export default Learn