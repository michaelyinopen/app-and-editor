import type { Middleware } from 'redux'
import {
  replaceLastStep,
  setActivityFromAppStore,
} from './actions'
import { calculateSteps } from './undoHistory'

const excludeActionTypes = [
  replaceLastStep.type,
  setActivityFromAppStore.type,
]

export const undoHistoryMiddleware: Middleware = store => next => action => {
  const dispatch = store.dispatch

  const previousState = store.getState()
  const previousStep = previousState.steps[previousState.steps.length - 1]
  const previousFormData = previousState.formData

  const nextResult = next(action)

  const currentFormData = store.getState().formData

  if (!excludeActionTypes.includes(action.type)) {
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