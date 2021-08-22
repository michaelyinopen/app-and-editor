import { BrowserRouter, Switch, Route, Link } from 'react-router-dom'
import { Home } from './Home'
import { Activities } from './Activities'
import { Activity } from './Activity'
import { PageNotFound } from './PageNotFound'

function App() {
  return (
    <div>
      <BrowserRouter>
        <div>
          <Link to='/'>Home</Link>
          {' '}
          <Link to='/activities' >Activities</Link>
        </div>
        <Switch>
          <Route exact path={'/'} component={Home} />
          <Route exact path={'/activities'} component={Activities} />
          <Route exact path={'/activities/new'}
            render={() => (
              <Activity
                id={undefined}
                edit={true}
              />
            )}
          />
          <Route exact path={'/activities/:id(\\d+)/:edit(edit)?'}
            render={({ match }) => (
              <Activity
                key={match.params.id}
                id={+match.params.id}
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
