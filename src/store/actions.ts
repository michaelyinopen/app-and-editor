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
// todo create another action for version condition failed, and updated

export const deleteActivitySucceeded = createAction<number>('deleteActivitySucceeded')

// notifications
export const addNotification = createAction<string>('addNotification')

export const clearNotifications = createAction('clearNotifications')