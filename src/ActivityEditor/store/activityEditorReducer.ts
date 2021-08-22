import {
  combineReducers,
  createReducer,
} from '@reduxjs/toolkit'
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

type ActivityEditorControlState = {
  id?: number
  isEdit: boolean
  loaded: boolean
  setFromAppStore: boolean
  failedToLoad: boolean
}

const activityEditorControlInitialState: ActivityEditorControlState = {
  id: undefined,
  isEdit: false,
  loaded: false,
  setFromAppStore: false,
  failedToLoad: false,
}

const controlReducer = createReducer(activityEditorControlInitialState, (builder) => {
  builder
    .addCase(resetActivityEditor, (state) => {
      state.id = undefined
      state.isEdit = false
      state.loaded = false
      state.setFromAppStore = false
      state.failedToLoad = false
    })
    .addCase(setActivityEditorId, (state, { payload: id }) => {
      state.id = id
    })
    .addCase(setActivityEditorIsEdit, (state, { payload: isEdit }) => {
      state.isEdit = isEdit
    })
    .addCase(loadedActivity, (state) => {
      state.loaded = true
      state.failedToLoad = false
    })
    .addCase(failedToLoadActivity, (state) => {
      state.loaded = false
      state.failedToLoad = true
    })
    .addCase(setActivityFromAppStore, (state, { payload: activity }) => {
      if (!state.loaded) {
        return
      }
      // todo implement
      // state.jobSet = jobSet //todo remove
    })
})

type ActivityEditorFormDataState = {
  name: string,
  who: string,
  where: string,
  howMuch?: number,
}

const activityEditorFormDataInitialState: ActivityEditorFormDataState = {
  name: '',
  who: '',
  where: '',
  howMuch: undefined,
}

const formDataReducer = createReducer(activityEditorFormDataInitialState, (builder) => {
  builder
    .addCase(resetActivityEditor, (state) => {
      // todo
    })
    .addCase(setActivityFromAppStore, (state) => {
      // todo
    })
    .addCase(setName, (state, { payload }) => {
      state.name = payload
    })
    .addCase(setWho, (state, { payload }) => {
      state.who = payload
    })
    .addCase(setWhere, (state, { payload }) => {
      state.where = payload
    })
    .addCase(setHowMuch, (state, { payload }) => {
      state.howMuch = payload
    })
})

export const activityEditorReducer = combineReducers({
  control: controlReducer,
  formData: formDataReducer,
})