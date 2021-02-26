import React, { Component } from 'react'
import Characterbycharacter from './Characterbycharacter'
import Fullsentence from './Fullsentence'
import {Query} from 'react-apollo';
import gql from 'graphql-tag';
import { redirectToLearnComponent} from './utils'


const GET_PHRASE = gql`
query getPhrase($deck_id: Int!, $phrase_order: Int!) {
  getPhrasesInDeck(deck_id: $deck_id) {
    phrase_order
    full_phrase
    phrase_no_punctuation
    word_list
    pinyin
    pinyin_no_tones
    written_tones
    spoken_tones
  }
}
`
class Learn extends Component {
  constructor(props){
    super(props)
    this.state = {
      fullSentenceMode: false,
    }
  }

  changeMode = (isFullSentenceMode) => {
    this.setState({fullSentenceMode: isFullSentenceMode})
  }

  componentDidUpdate = (prevProps, prevState) => {
    console.log("LEARN UPDATE")
  }

  getUrlParams = () =>{
    let params = {}
    const path = this.props.location.pathname.split("/")
    const deck_id = parseInt(path[path.length - 2])
    const phrase_order = parseInt(path[path.length - 1])
    params.deck_id = deck_id
    params.phrase_order = phrase_order
    return params
  }

  getPhraseDetails = (phrase) => {
    let phrase_data = {}
    phrase_data["display"] = phrase.full_phrase
    phrase_data["characters"] = phrase.phrase_no_punctuation
    phrase_data["pinyin"] = phrase.pinyin.join(" ")
    phrase_data["spoken_tones"] = phrase.spoken_tones.join("").replace("0","_")
    phrase_data["pinyin_no_tones"] = phrase.pinyin_no_tones
    phrase_data["phrase_order"] = phrase.phrase_order
    return phrase_data
  }

  onClickEvent = (deck_id, phrase_order) => {
    redirectToLearnComponent(this.props, deck_id, phrase_order)
  }

  render() {
    let params = this.getUrlParams()
    return(
      <Query query={GET_PHRASE} variables={{deck_id: params.deck_id}}>
      {({ loading, error, data, refetch }) => {
        if (loading) return <div>Fetching</div>
        if (error) return <div>error</div>
        let phrase = data.getPhrasesInDeck[params.phrase_order - 1]
        return(
        <div className="LearnContainer">
          <div className="Navbar">
            <p className={!this.state.fullSentenceMode ? "selectedItem": ""} onClick={() => this.changeMode(false)}>Character by Character</p>
            <p className={this.state.fullSentenceMode ? "selectedItem": ""} onClick={() => this.changeMode(true)}>Full Sentence</p>
          </div>
          <div className="toneTrainingInterface">
          <button disabled={params.phrase_order === 1 } style={{marginRight: "5%"}}  onClick={() => this.onClickEvent(params.deck_id, params.phrase_order - 1)}>{"<"}</button>
          <div style={{width: "75%"}}>
          {this.state.fullSentenceMode ? <Fullsentence sentence={this.getPhraseDetails(phrase)}/>: <Characterbycharacter sentence={this.getPhraseDetails(phrase)}/>}
          </div>
          <button disabled={params.phrase_order === data.getPhrasesInDeck.length } style={{marginLeft: "5%"}} onClick={() => this.onClickEvent(params.deck_id, params.phrase_order + 1)}>{">"}</button>
          </div>
        </div>
      )
    }}
    </Query>
  )
  }
}

export default Learn