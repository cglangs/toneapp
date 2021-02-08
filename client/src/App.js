import React, { Component } from 'react'
import Characterbycharacter from './Characterbycharacter'
import Fullsentence from './Fullsentence'





class App extends Component {
  render() {
    const isFull = true
    return(
      <div>
      {isFull ? <Fullsentence/> : <Characterbycharacter/>}
      </div>
      )
  }
}

export default App