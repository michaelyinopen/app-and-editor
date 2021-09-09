import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'
import { Home } from './Home'
import { Activities } from './Activities'
import { ActivityEditor } from './ActivityEditor'
import { PageNotFound } from './PageNotFound'
import { AppHeader } from './AppHeader'
import { Notifications } from './Notifications'

function App() {
  return (
    <BrowserRouter>
      <div style={{ margin: 16 }}>
        <AppHeader />
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
        <Notifications />
      </div>
    </BrowserRouter >
  );
}

export default App;
