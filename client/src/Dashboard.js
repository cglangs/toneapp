import React, { Component } from 'react'
import {Query} from 'react-apollo';
import gql from 'graphql-tag';


const GET_DECKS = gql`
query getDeckList {
  getDecks {
    deck_id
    deck_name
  }
}
`
const GET_PHRASES = gql`
query getPhraseList($deck_id: Int!) {
  getPhrasesInDeck(deck_id: $deck_id) {
    _id
    phrase_order
    full_phrase
    phrase_no_punctuation
    word_list
    pinyin
    written_tones
    spoken_tones
  }
}
`

class Dashboard extends Component {
  state = {
    indexSelected: null
  }

  selectMenuItem = (index) => {
    this.setState(prevState => ({indexSelected: prevState.indexSelected  === index ? null : index}));
  }


  redirectToLearnComponent = (phrase) => {
    let phrase_data = {}
    phrase_data["display"] = phrase.full_phrase
    phrase_data["characters"] = phrase.phrase_no_punctuation
    phrase_data["pinyin"] = phrase.pinyin.join(" ")
    phrase_data["spoken_tones"] = phrase.spoken_tones.join("").replace("0","_")
    this.props.history.push({
      pathname: '/learn',
      state: {
        sentence: phrase_data,
      }  
    })
  }

  getPhraseList = (deck_id) => {
    return(
      <Query query={GET_PHRASES} variables={{deck_id: deck_id}}>
      {({ loading, error, data, refetch }) => {
        if (loading) return <div>Fetching</div>
        if (error) return <div>error</div>
        return (
          <div className="menuSubItemContainer">
          {data.getPhrasesInDeck.map((phrase)=>
            <div className="menuSubItem" onClick={()=> this.redirectToLearnComponent(phrase)}>
            <span>{phrase.full_phrase}</span>
            </div>
          )}
          </div>
        )
      }}
      </Query>
    )
  }

  render() {
    return(
      <Query query={GET_DECKS}>
      {({ loading, error, data, refetch }) => {
        if (loading) return <div>Fetching</div>
        if (error) return <div>error</div>
        return(
          <div className="menuContainer">
            <div className="menuHeader"/>
            <div className="menuList">
              {data.getDecks.map((deck, index)=>
                <div className="menuItem" onClick={() => this.selectMenuItem(index)}>
                  <p>{deck.deck_name}</p>
                  <span className={index === this.state.indexSelected ? "chevron bottom": "chevron top"}/>
                </div>
               )}
              {this.state.indexSelected !== null && this.getPhraseList(1)}
             </div>
          </div>
        )
      }}
      </Query>
    )
  }

}

export default Dashboard