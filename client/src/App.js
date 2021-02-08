import React, { Component } from 'react'
import Characterbycharacter from './Characterbycharacter'




class App extends Component {
  render() {
    const isFull = false
    return(
      <div>
      {isFull ? null : <Characterbycharacter/>}
      </div>
      )
  }
}

export default App