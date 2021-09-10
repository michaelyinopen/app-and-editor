import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom'
import {
  deleteActivityTakingThunkAction,
  createActivityIsDeletingSelector,
} from './takingThunkActions/deleteActivityTakingThunkAction';
import {
  getActivitiesTakingThunkAction,
  activitiesIsLoadingSelector,
} from './takingThunkActions/getActivitiesTakingThunkAction';
import {
  useAppDispatch,
  useAppSelector,
  addNotification,
} from "./store";

const ActivityHeader = ({ id }) => {
  const activity = useAppSelector(state => state.activities.entities[id])
  const dispatch = useAppDispatch()
  const isDeleting = useAppSelector(createActivityIsDeletingSelector(id))
  if (!activity) {
    return null
  }
  return (
    <>
      {activity.name}{' '}
      <Link to={`/activities/${id}`}>View</Link>{' '}
      <Link to={`/activities/${id}/edit`}>Edit</Link>{' '}
      <button
        onClick={() => {
          dispatch(deleteActivityTakingThunkAction(id))
            .then(result => {
              if (result === true) {
                dispatch(addNotification(`Deleted Activity #${id}`))
              }
              if (result === false) {
                dispatch(addNotification(`Failed to deleted Activity #${id}`))
              }
            })
            .catch(() => {
              dispatch(addNotification(`Failed to deleted Activity #${id}`))
            })
        }}
      >
        Delete
      </button>
      {isDeleting && <span> Deleting...</span>}
    </ >
  )
}

export const Activities = () => {
  const activityIds = useAppSelector(state => state.activities.ids)
  const dispatch = useAppDispatch()

  const loadActivitiesCallback = useRef(() => {
    dispatch(getActivitiesTakingThunkAction)
      .then(result => {
        if (result === false) {
          dispatch(addNotification('Get Activities Failed'))
        }
      })
      .catch(() => {
        dispatch(addNotification('Get Activities Failed'))
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
        {activityIds.map(id => (
          <li key={id}>
            <ActivityHeader id={id} />
          </li>
        ))}
      </ol>
    </div>
  )
}