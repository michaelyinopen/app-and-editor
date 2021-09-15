import { memo } from 'react'
import { addRide, removeRide, setRideDescription } from "./store/actions"
import { useActivityEditorDispatch, useActivityEditorSelector } from "./store/store"

const AddRide = () => {
  const editorDispatch = useActivityEditorDispatch()
  return (
    <button
      type="button"
      onClick={() => { editorDispatch(addRide()) }}
    >
      Add Ride
    </button>
  )
}

const RemoveRide = ({ id }) => {
  const editorDispatch = useActivityEditorDispatch()
  return (
    <button
      type="button"
      onClick={() => { editorDispatch(removeRide(id)) }}
    >
      Remove
    </button>
  )
}

const Ride = ({ id }) => {
  const editorDispatch = useActivityEditorDispatch()
  const ride = useActivityEditorSelector(es => es.formData.rides.entities[id])
  return (
    <div style={{ borderBottomStyle: 'dashed' }}>
      <label htmlFor={`ride-description-${id}`}>description:</label>
      <br />
      <input
        type="text"
        id={`ride-description-${id}`}
        value={ride?.description}
        onChange={e => { editorDispatch(setRideDescription(id, e.target.value ?? '')) }}
      />
      <br />
      <RemoveRide id={id} />
    </div>
  )
}

export const RideSection = memo(() => {
  const rideIds = useActivityEditorSelector(es => es.formData.rides.ids)
  return (
    <div>
      <h3>Rides</h3>
      <ol>
        {rideIds.map(rid => (
          <li key={rid}>
            <Ride id={rid} />
          </li>
        ))}
      </ol>
      <AddRide />
    </div>
  )
})