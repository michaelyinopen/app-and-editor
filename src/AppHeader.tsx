import { Link } from 'react-router-dom'
import { resetServer } from './api'

export const AppHeader = () => {
  return (
    <div>
      <Link to='/home'>Home</Link>
      {' '}
      <Link to='/activities' >Activities</Link>
      {process.env.REACT_APP_MSW_MOCK
        ? (
          <div>
            MSW mock, can only query, and cannot create or save<br />
            use with server for all operations
          </div>
        )
        : (
          <div>
            use with server, can perform all operations<br />
            <button
              onClick={() => {
                resetServer()
              }}
            >
              reset server
            </button>
          </div>
        )
      }
    </div>
  )
}