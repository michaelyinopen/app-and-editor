import { useAppDispatch, useAppSelector } from "./store";
import { getSingleActivitySucceeded } from "./store/actions";



function App() {
  const activities = useAppSelector(state => state.activities.entities)
  const dispatch = useAppDispatch()
  return (
    <div>
      <h1>App and editor</h1>
      <ol>
        {Object.values(activities).map(a => (
          <li key={a!.id}>{a!.name}</li>
        ))}
      </ol>
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
  );
}

export default App;
