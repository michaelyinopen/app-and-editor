import { createIsLoadingSelector } from '../redux-taking-thunk'
import { AppDispatch, AppTakingThunkAction, fetchedActivity } from '../store'
import { getSingleActivityApiAsync } from '../api'

export const getActivityTakingThunkAction = (id: number): AppTakingThunkAction => ({
  name: `getActivity/${id}`,
  takeType: 'latest',
  thunk: function* (dispatch: AppDispatch) {
    const getActivityResult: any = yield getSingleActivityApiAsync(id)
    if (getActivityResult[0] === true) {
      dispatch(fetchedActivity(getActivityResult[1]))
      return true
    } else {
      return false
    }
  }
})

export const createSingleActivityIsLoadingSelector = id => createIsLoadingSelector(`getActivity/${id}`)