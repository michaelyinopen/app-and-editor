import { createAction } from '@reduxjs/toolkit'
import { Step } from './undoHistory'

export const resetActivityEditor = createAction('resetActivityEditor')
export const setActivityEditorId = createAction<number | undefined>('setActivityEditorId')
export const setActivityEditorIsEdit = createAction<boolean>('setActivityEditorIsEdit')
export const loadedActivity = createAction('loadedActivity')
export const failedToLoadActivity = createAction('failedToLoadActivity')

type activityFromStore =
  {
    id: number,
    name: string,
    versionToken: string,
    person?: string,
    place?: string,
    cost?: number,
    hasDetail: boolean,
  }

export const setActivityFromAppStore = createAction(
  'setActivityFromAppStore',
  (activity: activityFromStore | undefined, loaded: boolean) => ({
    payload: {
      activity,
      loaded
    }
  })
)

export const setName = createAction<string>('setName')
export const setWho = createAction<string>('setWho')
export const setWhere = createAction<string>('setWhere')
export const setHowMuch = createAction<undefined | number>('setHowMuch')

export const replaceLastStep = createAction<Step[]>('replaceLastStep')
export const undo = createAction('undo')
export const redo = createAction('redo')
export const jumpToStep = createAction<number>('jumpToStep')