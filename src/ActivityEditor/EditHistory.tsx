import { Step } from "./Step"
import {
  undo,
  redo,
} from "./store/actions"
import {
  useActivityEditorDispatch,
  useActivityEditorSelector
} from "./store/store"

export const EditHistory = () => {
  const editorDispatch = useActivityEditorDispatch()

  const steps = useActivityEditorSelector(es => es.steps)
  const currentStepIndex = useActivityEditorSelector(es => es.currentStepIndex)

  return (
    <div>
      <b>Edit History</b>
      <br />
      currentStepIndex: {currentStepIndex}
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <button
          onClick={() => { editorDispatch(undo()) }}
          disabled={currentStepIndex === 0}
        >
          undo
        </button>
        <button
          onClick={() => { editorDispatch(redo()) }}
          disabled={currentStepIndex === steps.length - 1}
        >
          redo
        </button>
      </div>
      <ol>
        {steps
          .map((s, i) => ({
            step: s,
            index: i
          }))
          .reverse()
          .map(si => (
            <li key={si.index}>
              <Step
                stepIndex={si.index}
                step={si.step}
                disabled={si.index > currentStepIndex}
              />
            </li>
          ))
        }
      </ol>
    </div >
  )
}