import { createIsLoadingSelector } from './redux-taking-thunk'
import type { AppDispatch, AppTakingThunkAction } from './store/store'
import { getSingleActivityApiAsync } from './api'
import { getSingleActivitySucceeded } from './store/actions'

export const getActivityTakingThunkAction = (id: number): AppTakingThunkAction => ({
  name: `activity/${id}`,
  takeType: 'latest',
  thunk: function* (dispatch: AppDispatch) {
    const getActivityResult: any = yield getSingleActivityApiAsync(id)
    if (getActivityResult[0] === true) {
      dispatch(getSingleActivitySucceeded(getActivityResult[1]))
    } else {
      return false
    }
    return true
  }
})

export const createSingleActivityIsLoadingSelector = id => createIsLoadingSelector(`activity/${id}`)