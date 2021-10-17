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
  addRide,
  setRideDescription,
  removeRide,
  moveRide,
} from './actions'
import {
  calculateRefreshedStep,
  undoStep,
  redoStep,
  Step,
} from './editHistory'

type FormDataState = {
  name: string,
  who: string,
  where: string,
  howMuch?: number,
  rides: {
    ids: string[],
    entities: {
      [id: string]: {
        id: string,
        description: string
      }
    }
  },
}

type ActivityEditorState = {
  id?: number
  lastVersion?: {
    versionToken: string,
    formData: FormDataState
  },
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
  lastVersion: undefined,
  isEdit: false,
  hasDetail: false,
  loadStatus: 'not loaded',
  initialized: false,
  formData: {
    name: '',
    who: '',
    where: '',
    howMuch: undefined,
    rides: {
      ids: [],
      entities: {}
    },
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
        state.formData.rides = activity && activity.hasDetail
          ? {
            ids: [...activity.rides]
              .sort((a, b) => a.sequence - b.sequence)
              .map(r => r.id),
            entities:
              Object.fromEntries(activity.rides.map(r => [
                r.id,
                {
                  id: r.id,
                  description: r.description
                }
              ]))
          }
          : activityEditorInitialState.formData.rides

        if (loaded) {
          // if loaded, it is garunteed that (activity && activity.hasDetail) === true
          const activityWithDetail = activity as ActivityWithDetailFromStore
          state.initialized = true
          state.lastVersion = {
            versionToken: activityWithDetail.versionToken,
            formData: {
              name: activityWithDetail.name,
              who: activityWithDetail.person,
              where: activityWithDetail.place,
              howMuch: activityWithDetail.cost,
              rides: {
                ids: [...activityWithDetail.rides]
                  .sort((a, b) => a.sequence - b.sequence)
                  .map(r => r.id),
                entities:
                  Object.fromEntries(activityWithDetail.rides.map(r => [
                    r.id,
                    {
                      id: r.id,
                      description: r.description
                    }
                  ]))
              }
            }
          }
        }
        return
      }
      else { //state.initialized === true
        if (!activity
          || !activity.hasDetail) {
          return
        }
        const refreshedStep = calculateRefreshedStep(
          state.lastVersion!.formData,
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
        state.lastVersion = {
          versionToken: activity.versionToken,
          formData: {
            name: activity.name,
            who: activity.person,
            where: activity.place,
            howMuch: activity.cost,
            rides: {
              ids: [...activity.rides]
                .sort((a, b) => a.sequence - b.sequence)
                .map(r => r.id),
              entities:
                Object.fromEntries(activity.rides.map(r => [
                  r.id,
                  {
                    id: r.id,
                    description: r.description
                  }
                ]))
            }
          }
        }
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
    .addCase(addRide, (state, { payload: { id } }) => {
      // always the last sequence
      state.formData.rides.ids.push(id)
      state.formData.rides.entities[id] = {
        id,
        description: ''
      }
    })
    .addCase(moveRide, (state, { payload: { id, targetIndex } }) => {
      const originalIndex = state.formData.rides.ids.indexOf(id)
      if (originalIndex > targetIndex) {
        state.formData.rides.ids = [
          ...state.formData.rides.ids.slice(0, targetIndex),
          id,
          ...state.formData.rides.ids.slice(targetIndex, originalIndex),
          ...state.formData.rides.ids.slice(originalIndex + 1)
        ]
      } else if (originalIndex < targetIndex) {
        state.formData.rides.ids = [
          ...state.formData.rides.ids.slice(0, originalIndex),
          ...state.formData.rides.ids.slice(originalIndex + 1, targetIndex + 1),
          id,
          ...state.formData.rides.ids.slice(targetIndex + 1),
        ]
      }
    })
    .addCase(setRideDescription, (state, { payload: { id, value } }) => {
      state.formData.rides.entities[id].description = value
    })
    .addCase(removeRide, (state, { payload: { id } }) => {
      const index = state.formData.rides.ids.findIndex(rId => rId === id)
      if (index !== -1) {
        state.formData.rides.ids.splice(index, 1)
      }
      delete state.formData.rides.entities[id]
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

      // undo step, then change step to merge, then redo the updated step
      const step = state.steps[stepIndex]

      let formData = state.formData
      formData = undoStep(step, formData)
      step.mergeBehaviour = 'merge'
      for (const operation of step.operations) {
        operation.applied =
          operation.type === 'merge' ? true
            : operation.type === 'conflict' ? operation.conflictApplied!
              : operation.type === 'reverse local' ? false
                : false
      }
      formData = redoStep(step, formData)
      state.formData = formData

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

      // undo step, then change step to merge, then redo the updated step
      const step = state.steps[stepIndex]

      let formData = state.formData
      formData = undoStep(step, formData)
      step.mergeBehaviour = 'discard local changes'
      for (const operation of step.operations) {
        operation.applied = true
      }
      formData = redoStep(step, formData)
      state.formData = formData

      for (const step of state.steps.slice(stepIndex).filter(s => s.saveStatus)) {
        step.saveStatus = undefined
      }
    })
    .addCase(applyConflict, (state, { payload: { stepIndex, conflictIndex } }) => {
      if (state.steps[stepIndex].mergeBehaviour !== 'merge') {
        return
      }
      state.steps.splice(state.currentStepIndex + 1)

      // undo all subsequent steps and the refreshed step
      // then update step's conflict's conflictApplied and apply
      // then redo the refreshed step and subsequent steps
      const step = state.steps[stepIndex]
      const conflictToApply = step.operations.filter(op => op.type === 'conflict')[conflictIndex]

      let formData = state.formData
      const stepsToUndo = state.steps
        .slice(stepIndex, state.currentStepIndex + 1)
        .reverse()
      for (const stepToUndo of stepsToUndo) {
        formData = undoStep(stepToUndo, formData)
      }

      conflictToApply.conflictApplied = true
      conflictToApply.applied = true

      const stepsToRedo = stepsToUndo.reverse()
      for (const stepToRedo of stepsToRedo) {
        formData = redoStep(stepToRedo, formData)
      }
      state.formData = formData

      for (const step of state.steps.slice(stepIndex).filter(s => s.saveStatus)) {
        step.saveStatus = undefined
      }
    })
    .addCase(unApplyConflict, (state, { payload: { stepIndex, conflictIndex } }) => {
      if (state.steps[stepIndex].mergeBehaviour !== 'merge') {
        return
      }
      state.steps.splice(state.currentStepIndex + 1)

      // undo all subsequent steps and the refreshed step
      // then update step's conflict's conflictApplied and apply
      // then redo the refreshed step and subsequent steps
      const step = state.steps[stepIndex]
      const conflictToApply = step.operations.filter(op => op.type === 'conflict')[conflictIndex]

      let formData = state.formData
      const stepsToUndo = state.steps
        .slice(stepIndex, state.currentStepIndex + 1)
        .reverse()
      for (const stepToUndo of stepsToUndo) {
        formData = undoStep(stepToUndo, formData)
      }

      conflictToApply.conflictApplied = false
      conflictToApply.applied = false

      const stepsToRedo = stepsToUndo.reverse()
      for (const stepToRedo of stepsToRedo) {
        formData = redoStep(stepToRedo, formData)
      }
      state.formData = formData

      for (const step of state.steps.slice(stepIndex).filter(s => s.saveStatus)) {
        step.saveStatus = undefined
      }
    })
})