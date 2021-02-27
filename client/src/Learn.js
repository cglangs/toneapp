import { useState} from 'react'
import Characterbycharacter from './Characterbycharacter'
import Fullsentence from './Fullsentence'
import { useQuery, useMutation } from  'react-apollo';
import gql from 'graphql-tag';
import { redirectToLearnComponent} from './utils'
import { useParams } from "react-router-dom";


const GET_PHRASE = gql`
query getPhrase($deck_id: Int!) {
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

const UPDATE_PROGRESS = gql`
mutation updateProgress($deck_id: Int!, $phrase_order: Int!) {
  setPhraseLearned(deck_id: $deck_id, phrase_order: $phrase_order)
}
`

const Learn = (props) => {

  const [fullSentenceMode, setSentenceMode] = useState(false);

  const { deckId, phraseOrder } = useParams();

  const { loading, error, data } = useQuery(GET_PHRASE, {
    variables: {deck_id: parseInt(deckId)}
  });

  const [updateProgress, { mutationData }] = useMutation(UPDATE_PROGRESS)

  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  function changeMode(isFullSentenceMode){
    setSentenceMode(isFullSentenceMode)
  }

  function getPhraseDetails(phrase){
    console.log(phrase)
    let phrase_data = {}
    phrase_data["deck_id"] = parseInt(deckId)
    phrase_data["phrase_order"] = parseInt(phraseOrder)
    phrase_data["display"] = phrase.full_phrase
    phrase_data["characters"] = phrase.phrase_no_punctuation
    phrase_data["pinyin"] = phrase.pinyin.join(" ")
    phrase_data["spoken_tones"] = phrase.spoken_tones.join("").replace("0","_")
    phrase_data["pinyin_no_tones"] = phrase.pinyin_no_tones
    phrase_data["phrase_order"] = phrase.phrase_order
    return phrase_data
  }

  function onClickEvent(deck_id, phrase_order){
    redirectToLearnComponent(props, deck_id, phrase_order)
  }

  return(
    <div className="LearnContainer">
      <div className="Navbar">
        <p className={!fullSentenceMode ? "selectedItem": ""} onClick={() => changeMode(false)}>Character by Character</p>
        <p className={fullSentenceMode ? "selectedItem": ""} onClick={() => changeMode(true)}>Full Sentence</p>
      </div>
      <div className="toneTrainingInterface">
      <button disabled={phraseOrder === 1 } style={{marginRight: "5%"}}  onClick={() => onClickEvent(deckId,  parseInt(phraseOrder) - 1)}>{"<"}</button>
      <div style={{width: "75%"}}>
      {fullSentenceMode ? <Fullsentence sentence={getPhraseDetails(data.getPhrasesInDeck[phraseOrder - 1])} mutationFunction={updateProgress} />: <Characterbycharacter sentence={getPhraseDetails(data.getPhrasesInDeck[phraseOrder - 1])} mutationFunction={updateProgress}/>}
      </div>
      <button disabled={phraseOrder === data.getPhrasesInDeck.length } style={{marginLeft: "5%"}} onClick={() => onClickEvent(deckId, parseInt(phraseOrder) + 1)}>{">"}</button>
      </div>
    </div>
  )
    
}
export default Learn