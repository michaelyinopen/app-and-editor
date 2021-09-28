import { Conflict } from './Conflict'
import {
  jumpToStep,
  setMergeBehaviourDiscardLocal,
  setMergeBehaviourMerge,
} from './store/actions'
import { Step as StepType } from './store/editHistory'
import { useActivityEditorDispatch, useActivityEditorSelector } from './store/store'

type StepProps = {
  stepIndex: number,
  step: StepType,
  disabled: boolean,
}

const NormalStep = ({
  stepIndex,
  step,
  disabled
}: StepProps) => {
  const editorDispatch = useActivityEditorDispatch()
  return (
    <button
      onClick={() => { editorDispatch(jumpToStep(stepIndex)) }}
      {...(disabled ? { style: { color: 'grey' } } : {})}
    >
      {step.name}{step.saveStatus === 'saved' ? ' (saved)' : undefined}
    </button>
  )
}

const VersionedStep = ({
  stepIndex,
  step,
  disabled
}: StepProps) => {
  const editorDispatch = useActivityEditorDispatch()
  const currentStepIndex = useActivityEditorSelector(es => es.currentStepIndex)
  const showMergeOptions = step.operations.some(op => op.type === 'reverse local' || op.type === 'conflict')
  const conflicts = step.mergeBehaviour !== 'merge'
    ? []
    : step.operations.filter(op => op.type === 'conflict')

  return (
    <div
      style={{ borderStyle: 'ridge' }}
    >
      <button
        onClick={() => { editorDispatch(jumpToStep(stepIndex)) }}
        {...(disabled ? { style: { color: 'grey' } } : {})}
      >
        {step.name}{step.saveStatus === 'saved' ? ' (saved)' : undefined}
      </button>
      {showMergeOptions && (
        <div>
          <input
            type="radio"
            id={`step${stepIndex}-discard`}
            checked={step.mergeBehaviour === 'discard local changes'}
            onChange={e => {
              if (e.target.checked) {
                editorDispatch(setMergeBehaviourDiscardLocal(stepIndex))
              }
            }}
            disabled={disabled || stepIndex !== currentStepIndex}
          />
          <label htmlFor={`step${stepIndex}-discard`}>Discard local changes</label>
          <br />
          <input
            type="radio"
            id={`step${stepIndex}-merge`}
            checked={step.mergeBehaviour === 'merge'}
            onChange={e => {
              if (e.target.checked) {
                editorDispatch(setMergeBehaviourMerge(stepIndex))
              }
            }}
            disabled={disabled || stepIndex !== currentStepIndex}
          />
          <label htmlFor={`step${stepIndex}-merge`}>Merge</label>
        </div>
      )}
      {conflicts.length !== 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 32 }}>
          <b>Conflicts</b>
          {conflicts.map((conflict, conflictIndex) => (
            <Conflict
              key={`conflict-${stepIndex}-${conflictIndex}`}
              stepIndex={stepIndex}
              conflictIndex={conflictIndex}
              conflict={conflict}
            />
          ))}
        </div>
      )}
    </div >
  )
}

export const Step = (props: StepProps) => {
  if (!props.step.versionToken) {
    return <NormalStep {...props} />
  }
  else {
    return <VersionedStep {...props} />
  }
}