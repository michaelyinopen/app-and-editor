import { createAction } from '@reduxjs/toolkit'
import { ActivityHeader, Activity } from '../../types'

export const resetActivityEditor = createAction('resetActivityEditor')
export const setActivityEditorId = createAction<number | undefined>('setActivityEditorId')
export const setActivityEditorIsEdit = createAction<boolean>('setActivityEditorIsEdit')
export const loadedActivity = createAction('loadedActivity')
export const failedToLoadActivity = createAction('failedToLoadActivity')

export const setActivityFromAppStore = createAction(
  'setActivityFromAppStore',
  (activity: ActivityHeader & Partial<Activity>) => ({
    payload: {
      activity
    }
  })
)

export const setName = createAction<string>('setName')
export const setWho = createAction<string>('setWho')
export const setWhere = createAction<string>('setWhere')
export const setHowMuch = createAction<undefined | number>('setHowMuch')