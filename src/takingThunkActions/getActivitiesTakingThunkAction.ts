import { createIsLoadingSelector } from '../redux-taking-thunk'
import type { AppDispatch, AppTakingThunkAction } from '../store/store'
import { getActivitiesSucceeded } from '../store/actions'
import { getActivitiesApiAsync } from '../api'

export const getActivitiesTakingThunkAction: AppTakingThunkAction = {
  name: 'getActivities',
  takeType: 'latest',
  thunk: function* (dispatch: AppDispatch) {
    const getActivitiesResult: any = yield getActivitiesApiAsync()
    if (getActivitiesResult[0] === true) {
      dispatch(getActivitiesSucceeded(getActivitiesResult[1]))
      return true
    } else {
      return false
    }
  }
}

export const activitiesIsLoadingSelector = createIsLoadingSelector('getActivities')