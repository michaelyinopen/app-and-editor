import { useMemo } from 'react'
import memoize from 'lodash/memoize'
import {
  Step as StepType,
  Operation as OperationType,
  Step,
  conflictHasRelatedChanges
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
  conflict: OperationType,
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
  const hasRelatedChangesWithStepMemoize = useMemo(
    () => {
      const hasRelatedChangesWithStep = (step: Step) => {
        return conflictHasRelatedChanges(conflict, step)
      }
      const memoized = memoize(hasRelatedChangesWithStep)
      memoized.cache = new WeakMap()
      return memoized
    },
    [conflict]
  )

  const hasRelatedChanges = useMemo(
    () => {
      for (const step of steps.slice(stepIndex + 1, currentStepIndex + 1)) {
        const stepResult = hasRelatedChangesWithStepMemoize(step)
        if (stepResult) {
          return true
        }
      }
      return false
    },
    [hasRelatedChangesWithStepMemoize, steps, stepIndex, currentStepIndex]
  )
  const disabled = undone || hasRelatedChanges
  return (
    <div>
      <input
        type="checkbox"
        id={`conflict-${stepIndex}-${conflictIndex}`}
        checked={conflict.conflictApplied}
        onChange={e => {
          if (e.target.checked) {
            editorDispatch(applyConflict(stepIndex, conflictIndex))
          } else {
            editorDispatch(unApplyConflict(stepIndex, conflictIndex))
          }
        }}
        disabled={disabled}
      />
      <label htmlFor={`conflict-${stepIndex}-${conflictIndex}`}>{conflict.conflictName}</label>
    </div>
  )
}