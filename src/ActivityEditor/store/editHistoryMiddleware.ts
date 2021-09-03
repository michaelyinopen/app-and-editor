import type { Middleware } from 'redux'
import {
  jumpToStep,
  redo,
  replaceLastStep,
  resetActivityEditor,
  setActivityFromAppStore,
  undo,
} from './actions'
import { calculateSteps } from './editHistory'

const excludeActionTypes = [
  replaceLastStep,
  setActivityFromAppStore,
  resetActivityEditor,

  undo,
  redo,
  jumpToStep,
].map(a => a.type)

export const editHistoryMiddleware: Middleware = store => next => action => {
  const dispatch = store.dispatch

  const previousState = store.getState()
  const previousStep = previousState.steps[previousState.currentStepIndex]
  const previousFormData = previousState.formData
  const previousInitialized = previousState.initialized

  const nextResult = next(action)

  const currentFormData = store.getState().formData

  if (previousInitialized && !excludeActionTypes.includes(action.type)) {
    const steps = calculateSteps(
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