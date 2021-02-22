import React, { Component } from 'react'
import gql from 'graphql-tag'
import { Mutation} from 'react-apollo'
import { withRouter } from 'react-router-dom';


const SIGNUP_MUTATION = gql`
  mutation SignupMutation($email: String!, $password: String!, $user_name: String!, $role: String!) {
    CreateUser(user_email: $email, user_password: $password, user_name: $user_name, user_role: $role) {
      _id
      user_name
      user_password
      user_role
    }
  }
`
const UPGRADE_MUTATION = gql`
  mutation UpgradeMutation($email: String!, $password: String!, $user_name: String!) {
    UpgradeUser(user_email: $email, user_password: $password, user_name: $user_name) {
      _id
      user_name
      user_password
      user_role
    }
  }
`

const LOGIN_MUTATION = gql`
  mutation LoginMutation($email: String!, $password: String!) {
    Login(user_email: $email, user_password: $password) {
      _id
      user_name
      user_password
      user_role
    }
  }
`

class Login extends Component {
  state = {
    isLogin: true, // switch between Login and SignUp
    email: '',
    password: '',
    user_name: '',
    userId: null,
    role: "STUDENT"
  }

  componentDidMount(){
    if(this.props.user){
      const {user_name, user_id , user_role} = this.props.user
      this.setUserInfo(user_name, parseInt(user_id), user_role)
    }
  }

  setUserInfo(user_name, userId, role){
    this.setState({user_name, userId: userId, role: role})

  }

 render() {
    const { isLogin, email, password, user_name, userId, role} = this.state
    return (
    <div>
      <h4>{isLogin ? 'Login' : 'Sign Up'}</h4>

      <div className="flex flex-column">
        {!isLogin && (
          <input
            value={user_name}
            onChange={e => this.setState({ user_name: e.target.value })}
            type="text"
            placeholder="Your name"
          />
        )}
        <input
          value={email}
          onChange={e => this.setState({ email: e.target.value })}
          type="text"
          placeholder="Your email address"
        />
        <input
          value={password}
          onChange={e => this.setState({ password: e.target.value })}
          type="password"
          placeholder="Choose a safe password"
        />
      </div>
      <div>
      <Mutation
        mutation={isLogin ? LOGIN_MUTATION : role === 'TESTER' ? UPGRADE_MUTATION : SIGNUP_MUTATION}
        variables={{ email, password, user_name, userId, role: "STUDENT"}}
        onCompleted={data => this._confirm()}
        onError={(error) => console.log(error.message)}
      >
        {(mutation, { loading, error }) => (
          <div>
            <button
              type="button"
              onClick={e => this.handleLogin(e, mutation)}
              disabled={!this.state.email.length || !this.state.password.length || (!this.state.user_name.length && !this.state.isLogin)}
            >
              {isLogin ? 'login' : 'create account'}
            </button>
            <button
              type="button"
              onClick={() => this.setState({ isLogin: !this.state.isLogin })}
            >
            {isLogin ? 'need to create an account?' : 'already have an account?'}

            </button>
            {error && <p>{error.message.substring(error.message.lastIndexOf(':') + 1)}</p>}
          </div>
        )}
      </Mutation>
      </div>
    </div>
  )

 }


 handleLogin(event, mutation){
  event.preventDefault()
  mutation()
}

 _confirm() {
  this.props.history.push('/')
  window.location.reload(true);
}


}


export default withRouter(Login)