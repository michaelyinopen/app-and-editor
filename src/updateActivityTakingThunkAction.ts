import { createIsLoadingSelector } from './redux-taking-thunk'
import type { AppDispatch, AppTakingThunkAction } from './store/store'
import { updateActivityApiAsync, UpdateActivityResponseBody } from './api'
import { getSingleActivitySucceeded } from './store/actions'
import { Activity } from './types'

export type UpdateActivityTakingThunkActionResult = 'failed' | 'success' | 'versionConditionFailed'

export const updateActivityTakingThunkAction = (id: number, activity: Activity): AppTakingThunkAction => ({
  name: `updateActivity/${id}`,
  takeType: 'latest',
  thunk: function* (dispatch: AppDispatch): Generator<unknown, UpdateActivityTakingThunkActionResult> {
    const updateActivityResult: any = yield updateActivityApiAsync(id, activity)
    if (updateActivityResult[0] === true) {
      const updateActivityResponseBody: UpdateActivityResponseBody = updateActivityResult[1]
      if (updateActivityResponseBody.versionConditionFailed) {
        dispatch(getSingleActivitySucceeded(updateActivityResponseBody.activity))
        return 'versionConditionFailed'
      } else {
        dispatch(getSingleActivitySucceeded(updateActivityResponseBody.activity))
        return 'success'
      }
    } else {
      return 'failed'
    }
  }
})

export const createUpdateActivityIsLoadingSelector = (id: number) => createIsLoadingSelector(`updateActivity/${id}`)