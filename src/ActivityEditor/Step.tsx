import { applyConflict, jumpToStep, setMergeBehaviourDiscardLocal, setMergeBehaviourMerge, unApplyConflict } from './store/actions'
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
      {step.name}
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
  return (
    <div
      style={{ borderStyle: 'ridge' }}
    >
      <button
        onClick={() => { editorDispatch(jumpToStep(stepIndex)) }}
        {...(disabled ? { style: { color: 'grey' } } : {})}
      >
        {step.name}
      </button>
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
      {step.mergeBehaviour === 'merge' && step.conflicts!.length !== 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 32 }}>
          <b>Conflicts</b>
          {step.conflicts!.map((conflict, conflictIndex) => (
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
                disabled={stepIndex > currentStepIndex/*no later changes*/}
              />
              <label htmlFor={`conflict-${stepIndex}-${conflictIndex}`}>{conflict.name}</label>
            </div>
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