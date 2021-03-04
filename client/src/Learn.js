import { useState, useRef} from 'react'
import Characterbycharacter from './Characterbycharacter'
import Fullsentence from './Fullsentence'
import { useQuery, useMutation } from  'react-apollo';
import gql from 'graphql-tag';
import { redirectToLearnComponent} from './utils'
import { useParams } from "react-router-dom";


const GET_PHRASE = gql`
query getPhrase($deck_id: Int!) {
  me {
    _id
    user_name
    user_role
    user_password
  }
  getPhrasesInDeck(deck_id: $deck_id) {
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

const UPDATE_PROGRESS = gql`
mutation updateProgress($deck_id: Int!, $phrase_order: Int!, $is_completed_char: Boolean!, $is_completed_full: Boolean!) {
  setPhraseLearned(deck_id: $deck_id, phrase_order: $phrase_order, is_completed_char: $is_completed_char, is_completed_full: $is_completed_full){
    is_completed_char
    is_completed_full
  }
}
`

const Learn = (props) => {
  console.log(props)

  const [fullSentenceMode, setSentenceMode] = useState(props.location.state.isFullSentenceMode);

  const { deckId, phraseOrder } = useParams();
  const characterByCharacterRef = useRef();
  const fullSentenceRef = useRef();

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
    phrase_data["spoken_tones"] = phrase.spoken_tones.join("").replaceAll("5","_")
    phrase_data["pinyin_no_tones"] = phrase.pinyin_no_tones
    phrase_data["phrase_order"] = phrase.phrase_order
    phrase_data["is_completed_char"] = phrase.is_completed_char
    phrase_data["is_completed_full"] = phrase.is_completed_full
    console.log(phrase_data)
    return phrase_data
  }

  function onClickEvent(deck_id, phrase_order){
    if(fullSentenceMode){
      fullSentenceRef.current.restartSentence()
    }else{
      characterByCharacterRef.current.restartSentence()
    }
    redirectToLearnComponent(props, deck_id, phrase_order, fullSentenceMode)
  }

  function submitCorrect(is_completed_char, is_completed_full){
    updateProgress({variables:{deck_id: parseInt(deckId), phrase_order: parseInt(phraseOrder), is_completed_char: is_completed_char, is_completed_full: is_completed_full}, 
      update: (store)=> {
        const data = store.readQuery({ query: GET_PHRASE, variables: { deck_id: parseInt(deckId) } })
        data.getPhrasesInDeck[phraseOrder - 1]["is_completed_char"] = is_completed_char
        data.getPhrasesInDeck[phraseOrder - 1]["is_completed_full"] = is_completed_full
        store.writeQuery({
          query: GET_PHRASE,
          data
        })
     }})    
  }

  function checkComplete(){
    return ((data.getPhrasesInDeck[phraseOrder - 1]["is_completed_char"] && !fullSentenceMode) || (data.getPhrasesInDeck[phraseOrder - 1]["is_completed_full"] && fullSentenceMode))
  }

  return(
    <div className="LearnContainer">
      <div className="Navbar">
        <p className={!fullSentenceMode ? "selectedItem": ""} onClick={() => changeMode(false)}>Character by Character</p>
        <p className={fullSentenceMode ? "selectedItem": ""} onClick={() => changeMode(true)}>Full Sentence</p>
      </div>
      
      <div className="toneTrainingInterface">
      <button disabled={phraseOrder=== "1" } style={{marginRight: "5%"}}  onClick={() => onClickEvent(deckId,  parseInt(phraseOrder) - 1)}>
        <img style={{"padding": "0","height":  "7vh", "width":  "4vw"}}src="/left-arrow-button.svg" />
      </button>
      <div style={{width: "75%"}}>
      {fullSentenceMode ? <Fullsentence ref={fullSentenceRef} isComplete={checkComplete} user={data.me} sentence={getPhraseDetails(data.getPhrasesInDeck[phraseOrder - 1])} mutationFunction={submitCorrect} />: <Characterbycharacter ref={characterByCharacterRef} isComplete={checkComplete} user={data.me} sentence={getPhraseDetails(data.getPhrasesInDeck[phraseOrder - 1])} mutationFunction={submitCorrect}/>}
      </div>
      <button disabled={parseInt(phraseOrder) === data.getPhrasesInDeck.length } style={{marginLeft: "5%"}} onClick={() => onClickEvent(deckId, parseInt(phraseOrder) + 1)}>
        <img style={{"padding": "0","height":  "7vh", "width":  "4vw"}}src="/right-arrow-button.svg" />
      </button>
      </div>
    </div>
  )
    
}
export default Learn