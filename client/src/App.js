import React, { Component } from 'react'
import { Switch, Route } from 'react-router-dom'
import Login from './Login'
import Header from './Header'
import Dashboard from './Dashboard'
import Learn from './Learn'
import {Query} from 'react-apollo';
import gql from 'graphql-tag';


const GET_USER = gql`
query getUser {
  me {
    _id
    user_name
    user_role
    user_password
  }
}
`

class App extends Component {
  render() {
    return(
      <div>
      <Query query={GET_USER}>
      {({ loading, error, data, refetch }) => {
        if (loading) return <div>Fetching</div>
        if (error) return <div>error</div>
        const user = data.me
        return(
          <div>
          <Header user={user} refetchUser={refetch}/>
          <div className="App"> 
            <header className="App-header">  
          <Switch>
            <Route exact path="/dashboard" user={user} component={Dashboard} />
            <Route exact path="/learn/:deckId/:phraseOrder" component={Learn} />
            <Route exact path="/login" render={() => (<Login user={user} refetchUser={refetch}/>)} />
          </Switch>
        </header>
      </div>
      </div>
        )
      }}
      </Query>
      </div>
    )
  }

}

export default App
