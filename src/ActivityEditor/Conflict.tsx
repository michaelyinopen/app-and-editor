import {
  Step as StepType,
  Conflict as ConflictType
} from './store/editHistory'
import {
  useActivityEditorDispatch,
  useActivityEditorSelector,
} from './store/store'
import {
  applyConflict,
  unApplyConflict
} from './store/actions'

type ConfictProps = {
  stepIndex: number,
  conflictIndex: number,
  conflict: ConflictType,
}

export const Conflict = ({
  stepIndex,
  conflictIndex,
  conflict
}: ConfictProps) => {
  const editorDispatch = useActivityEditorDispatch()
  const currentStepIndex = useActivityEditorSelector(es => es.currentStepIndex)
  const steps: StepType[] = useActivityEditorSelector(es => es.steps)

  const undone = stepIndex > currentStepIndex
  const hasLaterChangesOnSamePath = steps
    .slice(stepIndex + 1, currentStepIndex + 1)
    .flatMap(s => s.fieldChanges
      .concat(s.conflicts?.flatMap(c => c.fieldChanges) ?? [])
      .concat(s.reverseCurrentFieldChanges ?? [])
    )
    .some(op => conflict.fieldChanges.some(c => c.path === op.path))
  //todo some other matching mechanism
  const disabled = undone || hasLaterChangesOnSamePath
  return (
    <div>
      <input
        type="checkbox"
        id={`conflict-${stepIndex}-${conflictIndex}`}
        checked={conflict.applied}
        onChange={e => {
          if (e.target.checked) {
            editorDispatch(applyConflict(stepIndex, conflictIndex))
          } else {
            editorDispatch(unApplyConflict(stepIndex, conflictIndex))
          }
        }}
        disabled={disabled}
      />
      <label htmlFor={`conflict-${stepIndex}-${conflictIndex}`}>{conflict.name}</label>
    </div>
  )
}