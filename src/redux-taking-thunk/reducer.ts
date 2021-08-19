import produce from 'immer'
import {
  takeLeading_Start,
  takeLeading_End,
  takeEvery_Add,
  takeEvery_Remove,
  takeLatest_SetLatestExecutionId,
  takeLatest_Destroy,
  reduxTakingThunkActionTypes
} from './actions'
import {
  isTakeLeading,
  isTakeEvery,
  isTakeLatest,
} from './types'
import type {
  ReduxTakingThunkState,
  StateWithReduxTakingThunk
} from './types'

const reduxTakingThunkInitialState: ReduxTakingThunkState = {}

/**
 * Add to root reducer with combineReducers
 * The key MUST be reduxTakingThunk
 */
export function reduxTakingThunkReducer(
  state = reduxTakingThunkInitialState,
  action: { type: string }
) {
  const { type } = action
  if (!reduxTakingThunkActionTypes.includes(type)) {
    return state
  }
  const { payload: { name } } = action as any
  return produce(state, draftState => {
    // takeLeading
    if (type === takeLeading_Start.type) {
      if (draftState[name] === undefined) {
        draftState[name] = { takeLeading_isLoading: true }
      }
    }
    else if (type === takeLeading_End.type) {
      if (isTakeLeading(draftState[name])) {
        delete draftState[name]
      }
    }

    // takeEvery
    else if (type === takeEvery_Add.type) {
      const target = draftState[name]
      if (draftState[name] === undefined) {
        draftState[name] = { takeEvery_loadingCount: 1 }
      }
      else if (isTakeEvery(target)) {
        target.takeEvery_loadingCount = target.takeEvery_loadingCount + 1
      }
    }
    else if (type === takeEvery_Remove.type) {
      const target = draftState[name]
      if (isTakeEvery(target)) {
        const newCount = target.takeEvery_loadingCount - 1
        if (newCount > 0) {
          target.takeEvery_loadingCount = newCount
        } else {
          delete draftState[name]
        }
      }
    }

    // takeLatest
    else if (type === takeLatest_SetLatestExecutionId.type) {
      const { payload: { executionId } } = action as ReturnType<typeof takeLatest_SetLatestExecutionId>
      const target = draftState[name]
      if (draftState[name] === undefined) {
        draftState[name] = { takeLatest_latestExecutionId: executionId }
      }
      if (isTakeLatest(target)) {
        target.takeLatest_latestExecutionId = executionId
      }
    }
    else if (type === takeLatest_Destroy.type) {
      if (isTakeLatest(draftState[name])) {
        delete draftState[name]
      }
    }
  })
}

export const createIsLoadingSelector = (name: string) => (state: StateWithReduxTakingThunk) => {
  return state.reduxTakingThunk[name] !== undefined
}

export const createLatestExecutionIdSelector = (name: string) => (state: StateWithReduxTakingThunk) => {
  const target = state.reduxTakingThunk[name]
  return isTakeLatest(target)
    ? target.takeLatest_latestExecutionId
    : undefined
}