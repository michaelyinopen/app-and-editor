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
  ActivityWithDetailFromStore,
  setMergeBehaviourMerge,
  setMergeBehaviourDiscardLocal,
  applyConflict,
  unApplyConflict,
  savingStep,
  savedStep,
} from './actions'
import {
  unApplyConflictToFromData,
  applyConflictToFromData,
  CalculateRefreshedStep,
  redoStep,
  Step,
  SwitchToDiscardLocalChange,
  SwitchToMerge,
  undoStep
} from './editHistory'

type FormDataState = {
  name: string,
  who: string,
  where: string,
  howMuch?: number,
}

type ActivityEditorState = {
  id?: number
  versions: {
    versionToken: string,
    formData: FormDataState
  }[],
  isEdit: boolean
  hasDetail: boolean
  loadStatus: 'not loaded' | 'loaded' | 'failed'
  initialized: boolean,
  formData: FormDataState,
  steps: Step[],
  currentStepIndex: number,
}

const activityEditorInitialState: ActivityEditorState = {
  id: undefined,
  versions: [],
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
        state.hasDetail = activity?.hasDetail ?? activityEditorInitialState.hasDetail
        state.formData.name = activity?.name ?? activityEditorInitialState.formData.name
        state.formData.who = activity && activity.hasDetail
          ? activity.person
          : activityEditorInitialState.formData.who
        state.formData.where = activity && activity.hasDetail
          ? activity.place
          : activityEditorInitialState.formData.where
        state.formData.howMuch = activity && activity.hasDetail
          ? activity.cost
          : activityEditorInitialState.formData.howMuch

        if (loaded) {
          // if loaded, it is garunteed that (activity && activity.hasDetail) === true
          const activityWithDetail = activity as ActivityWithDetailFromStore
          state.initialized = true
          state.versions = [
            {
              versionToken: activityWithDetail.versionToken,
              formData: {
                name: activityWithDetail.name,
                who: activityWithDetail.person,
                where: activityWithDetail.place,
                howMuch: activityWithDetail.cost,
              }
            }
          ]
        }
        return
      }
      else { //state.initialized === true
        if (!activity
          || activity.versionToken === state.versions[state.versions.length - 1].versionToken
          || !activity.hasDetail) {
          return
        }
        const refreshedStep = CalculateRefreshedStep(
          state.versions[state.versions.length - 1].formData,
          state.formData,
          activity
        )
        if (refreshedStep) {
          state.formData = redoStep(refreshedStep, state.formData)
          state.steps.splice(state.currentStepIndex + 1)
          state.steps.push(refreshedStep)
          state.currentStepIndex = state.steps.length - 1
          for (const step of state.steps.filter(s => s.saveStatus)) {
            step.saveStatus = undefined
          }
        }
        state.versions.push({
          versionToken: activity.versionToken,
          formData: {
            name: activity.name,
            who: activity.person,
            where: activity.place,
            howMuch: activity.cost,
          }
        })
      }
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
      state.steps.splice(state.currentStepIndex)
      state.steps.push(...payload)
      state.currentStepIndex = state.steps.length - 1
    })
    .addCase(undo, (state) => {
      if (state.currentStepIndex > 0) {
        state.formData = undoStep(state.steps[state.currentStepIndex], state.formData)
        state.currentStepIndex = state.currentStepIndex - 1
      }
    })
    .addCase(redo, (state) => {
      if (state.currentStepIndex < state.steps.length - 1) {
        state.formData = redoStep(state.steps[state.currentStepIndex + 1], state.formData)
        state.currentStepIndex = state.currentStepIndex + 1
      }
    })
    .addCase(jumpToStep, (state, { payload: targetStepIndex }) => {
      if (targetStepIndex >= 0 && targetStepIndex <= state.steps.length - 1) {
        let formData = state.formData
        if (targetStepIndex < state.currentStepIndex) {
          const stepsToUndo = state.steps
            .slice(targetStepIndex + 1, state.currentStepIndex + 1)
            .reverse()
          for (const stepToUndo of stepsToUndo) {
            formData = undoStep(stepToUndo, formData)
          }
        }
        else if (targetStepIndex > state.currentStepIndex) {
          const stepsToRedo = state.steps
            .slice(state.currentStepIndex + 1, targetStepIndex + 1)
          for (const stepToRedo of stepsToRedo) {
            formData = redoStep(stepToRedo, formData)
          }
        }
        state.formData = formData
        state.currentStepIndex = targetStepIndex
      }
    })
    .addCase(savingStep, (state, { payload: { stepIndex, saving } }) => {
      if (stepIndex > state.steps.length - 1) {
        return
      }
      for (const step of state.steps.filter(s => s.saveStatus)) {
        step.saveStatus = undefined
      }
      state.steps[stepIndex].saveStatus = saving ? 'saving' : undefined
    })
    .addCase(savedStep, (state, { payload: { stepIndex } }) => {
      if (stepIndex > state.steps.length - 1) {
        return
      }
      for (const step of state.steps.filter(s => s.saveStatus)) {
        step.saveStatus = undefined
      }
      state.steps[stepIndex].saveStatus = 'saved'
    })
    .addCase(setMergeBehaviourMerge, (state, { payload: { stepIndex } }) => {
      if (state.currentStepIndex !== stepIndex
        || state.steps[stepIndex].mergeBehaviour === 'merge'
      ) {
        return
      }
      state.steps.splice(state.currentStepIndex + 1)
      state.steps[stepIndex].mergeBehaviour = 'merge'
      state.formData = SwitchToMerge(state.steps[stepIndex], state.formData)
      for (const step of state.steps.slice(stepIndex).filter(s => s.saveStatus)) {
        step.saveStatus = undefined
      }
    })
    .addCase(setMergeBehaviourDiscardLocal, (state, { payload: { stepIndex } }) => {
      if (state.currentStepIndex !== stepIndex
        || state.steps[stepIndex].mergeBehaviour === 'discard local changes'
      ) {
        return
      }
      state.steps.splice(state.currentStepIndex + 1)
      state.steps[stepIndex].mergeBehaviour = 'discard local changes'
      state.formData = SwitchToDiscardLocalChange(state.steps[stepIndex], state.formData)
      for (const step of state.steps.slice(stepIndex).filter(s => s.saveStatus)) {
        step.saveStatus = undefined
      }
    })
    .addCase(applyConflict, (state, { payload: { stepIndex, conflictIndex } }) => {
      if (
        state.steps[stepIndex].mergeBehaviour !== 'merge'
        || state.steps[stepIndex].conflicts![conflictIndex].applied
      ) {
        return
      }
      state.steps.splice(state.currentStepIndex + 1)
      state.steps[stepIndex].conflicts![conflictIndex].applied = true
      state.formData = applyConflictToFromData(state.steps[stepIndex].conflicts![conflictIndex].fieldChange, state.formData)
      for (const step of state.steps.slice(stepIndex).filter(s => s.saveStatus)) {
        step.saveStatus = undefined
      }
    })
    .addCase(unApplyConflict, (state, { payload: { stepIndex, conflictIndex } }) => {
      if (
        state.steps[stepIndex].mergeBehaviour !== 'merge'
        || !state.steps[stepIndex].conflicts![conflictIndex].applied
      ) {
        return
      }
      state.steps.splice(state.currentStepIndex + 1)
      state.steps[stepIndex].conflicts![conflictIndex].applied = false
      state.formData = unApplyConflictToFromData(state.steps[stepIndex].conflicts![conflictIndex].fieldChange, state.formData)
      for (const step of state.steps.slice(stepIndex).filter(s => s.saveStatus)) {
        step.saveStatus = undefined
      }
    })
})