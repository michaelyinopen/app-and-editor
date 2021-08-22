import { createAction } from '@reduxjs/toolkit'

export const resetActivityEditor = createAction('resetActivityEditor')
export const setActivityEditorId = createAction<number>('setActivityEditorId')
export const setActivityEditorIsEdit = createAction<boolean>('setActivityEditorIsEdit')
export const loadedActivity = createAction('loadedActivity')
export const failedToLoadActivity = createAction('failedToLoadActivity')

export const setActivityFromAppStore = createAction(
  'setActivityFromAppStore',
  (activity) => ({
    payload: {
      activity
    }
  })
)

export const setName = createAction<string>('setName')
export const setWho = createAction<string>('setName')
export const setWhere = createAction<string>('setName')
export const setHowMuch = createAction<undefined | number>('setHowMuch')