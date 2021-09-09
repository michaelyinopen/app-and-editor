import { createIsLoadingSelector } from '../redux-taking-thunk'
import { AppDispatch, AppTakingThunkAction, fetchedActivity } from '../store'
import { createActivityApiAsync } from '../api'
import { Activity } from '../types'

export type ActivityCreation = {
  name: string,
  person: string,
  place: string,
  cost: number,
}

export const createActivityTakingThunkAction = (activity: ActivityCreation, creationToken?: string): AppTakingThunkAction => ({
  name: `createActivity/${creationToken}`,
  takeType: 'leading',
  thunk: function* (dispatch: AppDispatch): Generator<unknown, [boolean, Activity | undefined]> {
    const createActivityResult: any = yield createActivityApiAsync(activity)
    if (createActivityResult[0] === true) {
      const createActivityResponseBody: Activity = createActivityResult[1]
      dispatch(fetchedActivity(createActivityResponseBody))
      return [true, createActivityResponseBody]
    } else {
      return [false, undefined]
    }
  }
})

export const createCreateActivityIsLoadingSelector = (creationToken?: string) => createIsLoadingSelector(`createActivity/${creationToken}`)