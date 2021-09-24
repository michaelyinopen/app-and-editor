import type { Middleware } from 'redux'
import {
  applyConflict,
  jumpToStep,
  redo,
  replaceLastStep,
  resetActivityEditor,
  setActivityFromAppStore,
  setMergeBehaviourDiscardLocal,
  setMergeBehaviourMerge,
  unApplyConflict,
  undo,
} from '../actions'
import {
  calculateStepName,
  arraysEqual,
  getFieldChanges
} from './StepCommon'
import {
  FormData,
  Step,
  FieldChange
} from './types'

const excludeActionTypes = [
  replaceLastStep,
  setActivityFromAppStore,
  resetActivityEditor,

  undo,
  redo,
  jumpToStep,
  setMergeBehaviourMerge,
  setMergeBehaviourDiscardLocal,
  applyConflict,
  unApplyConflict,
].map(a => a.type)

function combineFieldChanges(a: FieldChange, b: FieldChange): FieldChange[] {
  return (a.path === b.path)
    ? a.previousValue === b.newValue
      || (Array.isArray(a) && Array.isArray(b) && arraysEqual(a, b))
      ? [] // combined resulting in no-op
      : [{ ...a, previousValue: a.previousValue, newValue: b.newValue }] // merged
    : [a, b] // not combined
}

export function calculateEditSteps(
  previousStep: Step,
  previousFormData: FormData,
  currentFormData: FormData)
  : Step[] {
  const fieldChanges = getFieldChanges(previousFormData, currentFormData).flat()
  if (fieldChanges.length === 0) {
    return [previousStep]
  }
  if (fieldChanges.length !== 1
    || previousStep.versionToken
    || previousStep.saveStatus
    || previousStep.operations.length !== 1
    || previousStep.operations[0].fieldChanges.length !== 1
  ) {
    const name = calculateStepName(fieldChanges)
    const newStep = {
      name,
      operations: [{
        type: 'edit' as const,
        fieldChanges,
        applied: true
      }]
    }
    return [previousStep, newStep]
  }
  const combinedFieldChanges = combineFieldChanges(
    previousStep.operations[0].fieldChanges[0],
    fieldChanges[0]
  )
  if (combinedFieldChanges.length === 0) {
    // no-op
    return []
  }
  else if (combinedFieldChanges.length === 1) {
    // combined
    const name = calculateStepName(combinedFieldChanges)
    const mergedStep = {
      name,
      operations: [{
        type: 'edit' as const,
        fieldChanges: combinedFieldChanges,
        applied: true
      }]
    }
    return [mergedStep]
  }
  else {
    // did not combine
    const name = calculateStepName(fieldChanges)
    const newStep = {
      name,
      operations: [{
        type: 'edit' as const,
        fieldChanges,
        applied: true
      }]
    }
    return [previousStep, newStep]
  }
}

export const editHistoryMiddleware: Middleware = store => next => action => {
  const dispatch = store.dispatch

  const previousState = store.getState()
  const previousStep = previousState.steps[previousState.currentStepIndex]
  const previousFormData = previousState.formData
  const previousInitialized = previousState.initialized
  const previousIsNew = previousState.id === undefined

  const nextResult = next(action)

  const currentFormData = store.getState().formData

  if ((previousIsNew || previousInitialized) && !excludeActionTypes.includes(action.type)) {
    const steps = calculateEditSteps(
      previousStep,
      previousFormData,
      currentFormData
    )
    if (steps.length !== 1 || steps[0] !== previousStep) {
      dispatch(replaceLastStep(steps))
    }
  }

  return nextResult
}