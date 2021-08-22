import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from "./store";
import { getSingleActivitySucceeded } from "./store/actions";

export const Activities = () => {
  const activities = useAppSelector(state => state.activities.entities)
  const dispatch = useAppDispatch()
  return (
    <div>
      <h1>Activities</h1>
      <Link to={`/activities/new`}>New</Link>
      <ol>
        {Object.values(activities).map(a => (
          <li key={a!.id}>
            {a!.name}{' '}
            <Link to={`/activities/${a!.id}`}>View</Link>{' '}
            <Link to={`/activities/${a!.id}/edit`}>Edit</Link>
          </li>
        ))}
      </ol>
      
      {/* todo remove */}
      <button onClick={() => {
        dispatch(getSingleActivitySucceeded({
          id: 1,
          name: 'some activity',
          person: 'some person',
          place: 'some place',
          cost: 99
        }))
      }}>Add Activity</button>
    </div>
  )
}