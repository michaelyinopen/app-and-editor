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

export const fetchedActivity = createAction<Activity>('fetchedActivity')

export const deletedActivity = createAction<number>('deletedActivity')

// notifications
export const addNotification = createAction<string>('addNotification')

export const clearNotifications = createAction('clearNotifications')