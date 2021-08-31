import { createAction } from '@reduxjs/toolkit'
import { ActivityHeader, Activity } from '../types'

export const getActivitiesSucceeded = createAction(
  'getActivitiesSucceeded',
  (activityHeaders: ActivityHeader[]) => ({
    payload: {
      activityHeaders
    }
  })
)

export const getSingleActivitySucceeded = createAction<Activity>('getSingleActivitySucceeded')

export const deleteActivitySucceeded = createAction<number>('deleteActivitySucceeded')