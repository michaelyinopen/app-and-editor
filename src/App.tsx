import { BrowserRouter, Switch, Route, Link, Redirect } from 'react-router-dom'
import { Home } from './Home'
import { Activities } from './Activities'
import { ActivityEditor } from './ActivityEditor'
import { PageNotFound } from './PageNotFound'

function App() {
  return (
    <div style={{ margin: 16 }}>
      <BrowserRouter>
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
            : <div>use with server, can perform all operations</div>}
        </div>
        <Switch>
          <Redirect exact from='/' to='/activities' />
          <Route exact path={'/home'} component={Home} />
          <Route exact path={'/activities'} component={Activities} />
          <Route exact path={'/activities/new'}
            render={() => (
              <ActivityEditor
                id={undefined}
                edit={true}
              />
            )}
          />
          <Route exact path={'/activities/:id(\\d+)/:edit(edit)?'}
            render={({ match }) => (
              <ActivityEditor
                id={parseInt(match.params.id)}
                edit={Boolean(match.params.edit)}
              />
            )}
          />
          <Route component={PageNotFound} />
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;
