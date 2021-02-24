import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { Link} from 'react-router-dom'
import { getCookie} from './utils'


class Header extends Component {

  render() {
    const isLoggedIn = !!getCookie('access-token');
    const currentPath = this.props.location.pathname
    console.log(currentPath)


    return (
      <div>
        <div>
            {currentPath !== "/learn" && (<div className="flex">
              <Link to="/learn">
                Learn
              </Link>
            </div>)}
          </div>
          {currentPath !== "/login" && (<div className="flex flex-fixed">
            {isLoggedIn && this.props.user && this.props.user.user_role !== 'TESTER' ? (
              <div
                onClick={() => {
                  document.cookie = "access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  document.cookie = "refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  this.props.history.push('/')
                  window.location.reload(true);
                }}
              >
                Logout
              </div>
            ) : (
              <Link to="/login">
                Login
              </Link>
            )}
          </div>)}
      </div>
    )
  }
}

export default withRouter(Header)