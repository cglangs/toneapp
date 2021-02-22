
import React, { Component } from 'react'
import { Switch, Route } from 'react-router-dom'
import Login from './Login'
import Header from './Header'
import Characterbycharacter from './Characterbycharacter'
import Fullsentence from './Fullsentence'


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
          <Switch>
            <Route exact path="/fullsentence" render={() => (<Fullsentence  user={user} refetchUser={refetch}/> )} />
            <Route exact path="/charbychar" component={Characterbycharacter} />
            <Route exact path="/login" render={() => (<Login user={user} refetchUser={refetch}/>)} />
          </Switch>
        </div>
        )
      }}
      </Query>
      </div>
    )
  }

}

export default App
