import React, { Component } from 'react'
import {Query} from 'react-apollo';
import gql from 'graphql-tag';
import { redirectToLearnComponent} from './utils'
import { Link} from 'react-router-dom'




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
    pinyin_no_tones
    written_tones
    spoken_tones
    is_completed_char
    is_completed_full
  }
}
`

class Dashboard extends Component {
  state = {
    deckIndexSelected: null
  }

  selectMenuItem = (index) => {
    this.setState(prevState => ({deckIndexSelected: prevState.deckIndexSelected  === index ? null : index}));
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
            <div className="menuSubItem">
            <span style={{ display: "inlineBlock", minWidth: "50%"}}>{phrase.full_phrase}</span>
            <Link className="menuSubItemLink tooltip"
              to={{
                pathname: "/learn/" + deck_id + "/" + phrase.phrase_order,
                state: { isFullSentenceMode: false }
              }}
            >
            Char Mode
            <span class="tooltiptext">Practice each character separately</span>
            </Link>
            <span className={"circle " + (phrase.is_completed_char ? "" : "hide")}/>
            <Link className="menuSubItemLink tooltip"
              to={{
                pathname: "/learn/" + deck_id + "/" + phrase.phrase_order,
                state: { isFullSentenceMode: true }
              }}
            >
            Full Mode
            <span class="tooltiptext">Practice entire phrase</span>
            </Link>
             <span className={"circle " + (phrase.is_completed_char ? "" : "hide")}/>     
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
                  <span className={index === this.state.deckIndexSelected ? "chevron bottom": "chevron top"}/>
                </div>
               )}
              {this.state.deckIndexSelected !== null && this.getPhraseList(1)}
             </div>
          </div>
        )
      }}
      </Query>
    )
  }

}

export default Dashboard