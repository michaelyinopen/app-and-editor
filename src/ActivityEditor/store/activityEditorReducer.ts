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
  setWho
} from './actions'

type ActivityEditorState = {
  id?: number
  versionToken: string
  isEdit: boolean
  loadStatus: 'not loaded' | 'loaded' | 'failed'
  initialized: boolean,
  formData: {
    name: string,
    who: string,
    where: string,
    howMuch?: number,
  }
}

const activityEditorInitialState: ActivityEditorState = {
  id: undefined,
  versionToken: '',
  isEdit: false,
  loadStatus: 'not loaded',
  initialized: false,
  formData: {
    name: '',
    who: '',
    where: '',
    howMuch: undefined,
  }
}

export const activityEditorReducer = createReducer(activityEditorInitialState, (builder) => {
  builder
    .addCase(resetActivityEditor, (state) => {
      return activityEditorInitialState
    })
    .addCase(setActivityEditorId, (state, { payload: id }) => {
      state.id = id
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
})