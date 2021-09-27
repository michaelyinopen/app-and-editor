import { memo } from 'react'
import { addRide, moveRide, removeRide, setRideDescription } from "./store/actions"
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

const Ride = ({ id, index }) => {
  const editorDispatch = useActivityEditorDispatch()
  const ride = useActivityEditorSelector(es => es.formData.rides.entities[id])
  const maxIndex = useActivityEditorSelector(es => es.formData.rides.ids.length - 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'row', borderBottomStyle: 'dashed' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <button
          type='button'
          onClick={() => { editorDispatch(moveRide(id, index - 1)) }}
          disabled={index === 0}
        >
          ▲
        </button>
        <button
          type='button'
          onClick={() => { editorDispatch(moveRide(id, index + 1)) }}
          disabled={index === maxIndex}
        >
          ▼
        </button>
      </div>
      <div>
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
    </div >
  )
}

export const RideSection = memo(() => {
  const rideIds = useActivityEditorSelector(es => es.formData.rides.ids)
  return (
    <div>
      <h3>Rides</h3>
      <ol>
        {rideIds.map((rid, index) => (
          <li key={rid}>
            <Ride id={rid} index={index} />
          </li>
        ))}
      </ol>
      <AddRide />
    </div>
  )
})