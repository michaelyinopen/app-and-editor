import { createIsLoadingSelector } from './redux-taking-thunk'
import type { AppDispatch, AppTakingThunkAction } from './store/store'
import { deleteActivityApiAsync } from './api'
import { deleteActivitySucceeded } from './store/actions'

export const deleteActivityTakingThunkAction = (id: number): AppTakingThunkAction => ({
  name: `deleteActivity/${id}`,
  takeType: 'leading',
  thunk: function* (dispatch: AppDispatch) {
    const deleteActivityResult: boolean = yield deleteActivityApiAsync(id)
    if (deleteActivityResult === true) {
      dispatch(deleteActivitySucceeded(id))
      return true
    } else {
      return false
    }
  }
})

export const createActivityIsDeletingSelector = id => createIsLoadingSelector(`deleteActivity/${id}`)