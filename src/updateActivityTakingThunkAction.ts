import { createIsLoadingSelector } from './redux-taking-thunk'
import type { AppDispatch, AppTakingThunkAction } from './store/store'
import { updateActivityApiAsync, UpdateActivityResponseBody } from './api'
import { getSingleActivitySucceeded } from './store/actions'
import { Activity } from './types'

export type UpdateActivityTakingThunkActionResult = 'version condition failed' | 'not found' | 'failed' | 'success'

export const updateActivityTakingThunkAction = (id: number, activity: Activity): AppTakingThunkAction => ({
  name: `updateActivity/${id}`,
  takeType: 'latest',
  thunk: function* (dispatch: AppDispatch): Generator<unknown, UpdateActivityTakingThunkActionResult> {
    const updateActivityResult: any = yield updateActivityApiAsync(id, activity)
    if (updateActivityResult[0] === true) {
      const updateActivityResponseBody: UpdateActivityResponseBody = updateActivityResult[1]
      if (updateActivityResponseBody.status === 'version condition failed') {
        dispatch(getSingleActivitySucceeded(updateActivityResponseBody.activity!))
        return 'version condition failed'
      } else if (updateActivityResponseBody.status === 'not found') {
        return 'not found'
      } else {
        dispatch(getSingleActivitySucceeded(updateActivityResponseBody.updatedActivity!))
        return 'success'
      }
    } else {
      return 'failed'
    }
  }
})

export const createUpdateActivityIsLoadingSelector = (id: number) => createIsLoadingSelector(`updateActivity/${id}`)