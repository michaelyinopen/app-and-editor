import { createReducer } from '@reduxjs/toolkit'
import {
  failedToLoadActivity,
  loadedActivity,
  resetActivityEditor,
  setActivityEditorId,
  setActivityEditorIsEdit,
  setActivityFromAppStore,
  setHowMuch,
  setName,
  setWhere,
  setWho,
  replaceLastStep,
  undo,
  redo,
  jumpToStep,
} from './actions'
import { Step } from './undoHistory'

type ActivityEditorState = {
  id?: number
  versionToken: string
  isEdit: boolean
  hasDetail: boolean
  loadStatus: 'not loaded' | 'loaded' | 'failed'
  initialized: boolean,
  formData: {
    name: string,
    who: string,
    where: string,
    howMuch?: number,
  },
  steps: Step[],
  currentStepIndex: number,
}

const activityEditorInitialState: ActivityEditorState = {
  id: undefined,
  versionToken: '',
  isEdit: false,
  hasDetail: false,
  loadStatus: 'not loaded',
  initialized: false,
  formData: {
    name: '',
    who: '',
    where: '',
    howMuch: undefined,
  },
  steps: [{ name: 'initial', operations: [] }],
  currentStepIndex: 0,
}

export const activityEditorReducer = createReducer(activityEditorInitialState, (builder) => {
  builder
    .addCase(resetActivityEditor, (_state) => {
      return activityEditorInitialState
    })
    .addCase(setActivityEditorId, (state, { payload: id }) => {
      state.id = id
      if (!id) {
        // isNew
        state.initialized = true
        state.loadStatus = 'loaded'
        state.isEdit = true
        state.hasDetail = true
      }
    })
    .addCase(setActivityEditorIsEdit, (state, { payload: isEdit }) => {
      state.isEdit = isEdit
    })
    .addCase(loadedActivity, (state) => {
      state.loadStatus = 'loaded'
    })
    .addCase(failedToLoadActivity, (state) => {
      state.loadStatus = 'failed'
    })
    .addCase(setActivityFromAppStore, (state, action) => {
      const { payload: { activity, loaded } } = action
      if (!state.initialized) {
        if (loaded) {
          state.initialized = true
        }
        state.versionToken = activity?.versionToken ?? activityEditorInitialState.versionToken
        state.hasDetail = activity?.hasDetail ?? activityEditorInitialState.hasDetail
        state.formData.name = activity?.name ?? activityEditorInitialState.formData.name
        state.formData.who = activity && activity.hasDetail
          ? activity.person!
          : activityEditorInitialState.formData.who
        state.formData.where = activity && activity.hasDetail
          ? activity.place!
          : activityEditorInitialState.formData.where
        state.formData.howMuch = activity && activity.hasDetail
          ? activity.cost!
          : activityEditorInitialState.formData.howMuch
        return
      }

      // already initialized
      //todo
    })
    .addCase(setName, (state, { payload }) => {
      state.formData.name = payload
    })
    .addCase(setWho, (state, { payload }) => {
      state.formData.who = payload
    })
    .addCase(setWhere, (state, { payload }) => {
      state.formData.where = payload
    })
    .addCase(setHowMuch, (state, { payload }) => {
      state.formData.howMuch = payload
    })
    .addCase(replaceLastStep, (state, { payload }) => {
      state.steps.splice(state.currentStepIndex + 1)
      state.steps.pop()
      state.steps.push(...payload)
      state.currentStepIndex = state.steps.length - 1
    })
    .addCase(undo, (state) => {
      state.currentStepIndex = Math.max(0, state.currentStepIndex - 1)
      //todo
    })
    .addCase(redo, (state) => {
      state.currentStepIndex = Math.min(state.steps.length - 1, state.currentStepIndex + 1)
      //todo
    })
    .addCase(jumpToStep, (state, { payload }) => {
      state.currentStepIndex = Math.max(-1, Math.min(state.steps.length - 1, payload))
      //todo
    })
})