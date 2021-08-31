import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom'
import { deleteActivityTakingThunkAction } from './deleteActivityTakingThunkAction';
import {
  activitiesIsLoadingSelector,
  getActivitiesTakingThunkAction
} from './getActivitiesTakingThunkAction';
import { useAppDispatch, useAppSelector } from "./store";

export const Activities = () => {
  const activities = useAppSelector(state => state.activities.entities)
  const dispatch = useAppDispatch()

  const loadActivitiesCallback = useRef(() => {
    dispatch(getActivitiesTakingThunkAction)
      .then(result => {
        if (result === false) {
          alert('get jobSets failed')
        }
      })
      .catch(() => {
        alert('get jobSets failed catch')
      })
  }).current
  useEffect(() => {
    loadActivitiesCallback()
  }, [loadActivitiesCallback])

  const isLoading = useAppSelector(activitiesIsLoadingSelector)

  return (
    <div>
      <h1>Activities</h1>
      <div>
        <button onClick={() => { loadActivitiesCallback() }}>referesh</button>
        {isLoading && <span> Loading...</span>}
      </div>
      <div><Link to={`/activities/new`}>New</Link></div>
      <ol>
        {Object.values(activities).map(a => (
          <li key={a!.id}>
            {a!.name}{' '}
            <Link to={`/activities/${a!.id}`}>View</Link>{' '}
            <Link to={`/activities/${a!.id}/edit`}>Edit</Link>{' '}
            <button
              onClick={() => {
                dispatch(deleteActivityTakingThunkAction(a!.id))
                  .then(result => {
                    if (result === true) {
                      //todo notify
                    }
                    if (result === false) {
                      //todo notify
                    }
                  })
                  .catch(() => {
                    //todo notify
                  })
              }}
            >
              Delete
            </button>
            {/*deleting*/}
          </li>
        ))}
      </ol>
    </div>
  )
}