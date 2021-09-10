import { useState } from "react"
import { useActivityEditorSelector } from "./store/store"

const StepsText = () => {
  const steps = useActivityEditorSelector(es => es.steps)
  return (
    <pre style={{ whiteSpace: 'pre-wrap' }}>
      {JSON.stringify(steps, null, 2)}
    </pre>
  )
}

export const PrintSteps = () => {
  const [show, setShow] = useState(true)
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div>
        <input id='show-edit-history' type='checkbox' checked={show} onChange={e => { setShow(e.target.checked) }} />
        <label htmlFor='show-edit-history'>Show Steps JSON</label>
      </div>
      {show && <StepsText />}
    </div>
  )
}