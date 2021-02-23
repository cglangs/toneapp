import React, { Component } from 'react'
import Characterbycharacter from './Characterbycharacter'
import Fullsentence from './Fullsentence'
import {Query} from 'react-apollo';
import gql from 'graphql-tag';


class Learn extends Component {
  state = {
    fullSentenceMode: false
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
        {this.state.fullSentenceMode ? <Fullsentence/>: <Characterbycharacter/>}
      </div>
    )
  }

}

export default Learn