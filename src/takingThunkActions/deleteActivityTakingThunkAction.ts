import { createIsLoadingSelector } from '../redux-taking-thunk'
import { AppDispatch, AppTakingThunkAction, deletedActivity } from '../store'
import { deleteActivityApiAsync } from '../api'

export const deleteActivityTakingThunkAction = (id: number): AppTakingThunkAction => ({
  name: `deleteActivity/${id}`,
  takeType: 'leading',
  thunk: function* (dispatch: AppDispatch) {
    const deleteActivityResult: boolean = yield deleteActivityApiAsync(id)
    if (deleteActivityResult === true) {
      dispatch(deletedActivity(id))
      return true
    } else {
      return false
    }
  }
})

export const createActivityIsDeletingSelector = id => createIsLoadingSelector(`deleteActivity/${id}`)