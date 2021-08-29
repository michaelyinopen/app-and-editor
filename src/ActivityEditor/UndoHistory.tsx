import {
  undo,
  redo,
  jumpToStep,
} from "./store/actions"
import {
  useActivityEditorDispatch,
  useActivityEditorSelector
} from "./store/store"

export const UndoHistory = () => {
  const editorDispatch = useActivityEditorDispatch()

  const steps = useActivityEditorSelector(es => es.steps)
  const currentStepIndex = useActivityEditorSelector(es => es.currentStepIndex)

  return (
    <div>
      Undo History<br />
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
              <button
                onClick={() => { editorDispatch(jumpToStep(si.index)) }}
                {...(si.index > currentStepIndex ? { style: { color: 'grey' } } : {})}
              >
                {si.step.name}
              </button>
            </li>
          ))
        }
      </ol>
    </div >
  )
}