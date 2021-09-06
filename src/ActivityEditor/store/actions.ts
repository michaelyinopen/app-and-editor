import { createAction } from '@reduxjs/toolkit'
import { Step } from './editHistory'

export const resetActivityEditor = createAction('resetActivityEditor')
export const setActivityEditorId = createAction<number | undefined>('setActivityEditorId')
export const setActivityEditorIsEdit = createAction<boolean>('setActivityEditorIsEdit')
export const loadedActivity = createAction('loadedActivity')
export const failedToLoadActivity = createAction('failedToLoadActivity')

export type ActivityWithoutDetailFromStore = {
  id: number,
  name: string,
  versionToken: string,
  hasDetail: false,
}

export type ActivityWithDetailFromStore = {
  id: number,
  name: string,
  versionToken: string,
  person: string,
  place: string,
  cost: number,
  hasDetail: true,
}

export type ActivityFromStore = ActivityWithoutDetailFromStore | ActivityWithDetailFromStore

export const setActivityFromAppStore = createAction(
  'setActivityFromAppStore',
  (activity: ActivityFromStore | undefined, loaded: boolean) => ({
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

export const setMergeBehaviourMerge = createAction(
  'setMergeBehaviourMerge',
  (stepIndex: number) => ({
    payload: {
      stepIndex,
    }
  })
)
export const setMergeBehaviourDiscardLocal = createAction(
  'setMergeBehaviourDiscardLocal',
  (stepIndex: number) => ({
    payload: {
      stepIndex,
    }
  })
)
export const applyConflict = createAction(
  'applyConflict',
  (stepIndex: number, conflictIndex: number) => ({
    payload: {
      stepIndex,
      conflictIndex,
    }
  })
)
export const unApplyConflict = createAction(
  'unApplyConflict',
  (stepIndex: number, conflictIndex: number) => ({
    payload: {
      stepIndex,
      conflictIndex,
    }
  })
)