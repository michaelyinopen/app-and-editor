import { produce, isDraft, Draft } from "immer"
import { ActivityWithDetailFromStore } from "./actions"

export type FormData = {
  name: string,
  who: string,
  where: string,
  howMuch?: number,
}

export type FieldChange = {
  path: string,
  previousValue: any,
  newValue: any,
}

// todo conflict is more lika a step(has name and can have multiple field changes)
export type Conflict = {
  name: string,
  fieldChange: FieldChange,
  applied: boolean,
}

export type Step = {
  name: string,
  fieldChanges: FieldChange[],
  versionToken?: string,
  mergeBehaviour?: 'merge' | 'discard local changes',
  conflicts?: Conflict[],
  reverseCurrentFieldChanges?: FieldChange[],
  saveStatus?: 'saving' | 'saved',
}

const defaultFormData = {
  name: '',
  who: '',
  where: '',
  howMuch: undefined,
}

function getFieldChanges(previousFormData: FormData, currentFormData: FormData): FieldChange[] {
  if (previousFormData === currentFormData) {
    return []
  }
  const fieldChanges: FieldChange[] = []
  if (previousFormData.name !== currentFormData.name) {
    fieldChanges.push({ path: '/name', previousValue: previousFormData.name, newValue: currentFormData.name })
  }
  if (previousFormData.who !== currentFormData.who) {
    fieldChanges.push({ path: '/who', previousValue: previousFormData.who, newValue: currentFormData.who })
  }
  if (previousFormData.where !== currentFormData.where) {
    fieldChanges.push({ path: '/where', previousValue: previousFormData.where, newValue: currentFormData.where })
  }
  if (previousFormData.howMuch !== currentFormData.howMuch) {
    fieldChanges.push({ path: '/howMuch', previousValue: previousFormData.howMuch, newValue: currentFormData.howMuch })
  }
  return fieldChanges
}

function mergeFieldChanges(a: FieldChange, b: FieldChange): FieldChange[] {
  return (a.path === b.path)
    ? a.previousValue === b.newValue
      ? [] // merged resulting in no-op
      : [{ path: a.path, previousValue: a.previousValue, newValue: b.newValue }] // merged
    : [a, b] // not merged
}

function calculateStepName(fieldChanges: FieldChange[]): string {
  if (fieldChanges.length === 0) {
    return '';
  }
  if (fieldChanges.length > 1) {
    return 'Multiple edits'
  }
  const fieldChange = fieldChanges[0] // assumes one step only has one field change
  if (fieldChange.path === '/name') {
    return 'Edit name'
  }
  if (fieldChange.path === '/who') {
    return 'Edit who'
  }
  if (fieldChange.path === '/where') {
    return 'Edit where'
  }
  if (fieldChange.path === '/howMuch') {
    return 'Edit how much'
  }
  // should not reach here
  return ''
}

export function calculateSteps(
  previousStep: Step,
  previousFormData: FormData = defaultFormData,
  currentFormData: FormData)
  : Step[] {
  const fieldChanges = getFieldChanges(previousFormData, currentFormData)
  if (fieldChanges.length === 0) {
    return previousStep ? [previousStep] : []
  }
  if (previousStep.fieldChanges.length !== 1
    || fieldChanges.length !== 1
    || previousStep.versionToken
    || previousStep.saveStatus) {
    const name = calculateStepName(fieldChanges)
    const newStep = {
      name,
      fieldChanges: fieldChanges
    }
    return previousStep ? [previousStep, newStep] : [newStep]
  }
  const mergedFieldChanges = mergeFieldChanges(
    previousStep.fieldChanges[0],
    fieldChanges[0]
  )
  if (mergedFieldChanges.length === 0) {
    return []
  }
  else if (mergedFieldChanges.length === 1) {
    const name = calculateStepName(mergedFieldChanges)
    const mergedStep = {
      name,
      fieldChanges: mergedFieldChanges
    }
    return [mergedStep]
  }
  else {// mergedFieldChanges.length === 2
    const name = calculateStepName(fieldChanges)
    const newStep = {
      name,
      fieldChanges: fieldChanges
    }
    return [previousStep, newStep]
  }
}

//#region formData maipulation
function undoFieldChange(fieldChange: FieldChange, formData: Draft<FormData>): FormData | undefined {
  return produce(formData, (draft) => {
    if (fieldChange.path === '/name') {
      draft.name = fieldChange.previousValue
    }
    else if (fieldChange.path === '/who') {
      draft.who = fieldChange.previousValue
    }
    else if (fieldChange.path === '/where') {
      draft.where = fieldChange.previousValue
    }
    else if (fieldChange.path === '/howMuch') {
      draft.howMuch = fieldChange.previousValue
    }
  })
}

export function undoStep(step: Step, previousFormData: FormData | Draft<FormData>): FormData {
  let formData = previousFormData
  const allFieldChanges = step.mergeBehaviour === 'merge'
    ? step.fieldChanges
      .concat(
        step.conflicts?.filter(c => c.applied).map(c => c.fieldChange) ?? []
      )
    : step.mergeBehaviour === 'discard local changes'
      ? step.fieldChanges
        .concat(
          step.conflicts?.map(c => c.fieldChange) ?? []
        )
        .concat(
          step.reverseCurrentFieldChanges ?? []
        )
      : step.fieldChanges
  for (const fieldChange of allFieldChanges) {
    if (isDraft(formData)) {
      const undoResult = undoFieldChange(fieldChange, formData)
      formData = typeof undoResult === 'undefined'
        ? formData
        : undoResult
    } else {
      formData = produce(formData, (draft) => {
        return undoFieldChange(fieldChange, draft)
      })
    }
  }
  return formData
}

function redoFieldChange(fieldChange: FieldChange, formData: Draft<FormData>): FormData | undefined {
  return produce(formData, (draft) => {
    if (fieldChange.path === '/name') {
      draft.name = fieldChange.newValue
    }
    else if (fieldChange.path === '/who') {
      draft.who = fieldChange.newValue
    }
    else if (fieldChange.path === '/where') {
      draft.where = fieldChange.newValue
    }
    else if (fieldChange.path === '/howMuch') {
      draft.howMuch = fieldChange.newValue
    }
  })
}

export function redoStep(step: Step, previousFormData: FormData): FormData {
  let formData = previousFormData
  const allFieldChanges = step.mergeBehaviour === 'merge'
    ? step.fieldChanges
      .concat(
        step.conflicts?.filter(c => c.applied).map(c => c.fieldChange) ?? []
      )
    : step.mergeBehaviour === 'discard local changes'
      ? step.fieldChanges
        .concat(
          step.conflicts?.map(c => c.fieldChange) ?? []
        )
        .concat(
          step.reverseCurrentFieldChanges ?? []
        )
      : step.fieldChanges
  for (const fieldChange of allFieldChanges) {
    if (isDraft(formData)) {
      const redoResult = redoFieldChange(fieldChange, formData)
      formData = typeof redoResult === 'undefined'
        ? formData
        : redoResult
    } else {
      formData = produce(formData, (draft) => {
        return redoFieldChange(fieldChange, draft)
      })
    }
  }
  return formData
}

export function SwitchToMerge(step: Step, currentFormData: FormData): FormData {
  let formData = currentFormData
  const allFieldChanges = (step.conflicts?.filter(c => !c.applied).map(c => c.fieldChange) ?? [])
    .concat(step.reverseCurrentFieldChanges ?? [])
  for (const fieldChange of allFieldChanges) {
    if (isDraft(formData)) {
      const undoResult = undoFieldChange(fieldChange, formData)
      formData = typeof undoResult === 'undefined'
        ? formData
        : undoResult
    } else {
      formData = produce(formData, (draft) => {
        return undoFieldChange(fieldChange, draft)
      })
    }
  }
  return formData
}

export function SwitchToDiscardLocalChange(step: Step, currentFormData: FormData): FormData {
  let formData = currentFormData
  const allFieldChanges = (step.conflicts?.filter(c => !c.applied).map(c => c.fieldChange) ?? [])
    .concat(step.reverseCurrentFieldChanges ?? [])
  for (const fieldChange of allFieldChanges) {
    if (isDraft(formData)) {
      const redoResult = redoFieldChange(fieldChange, formData)
      formData = typeof redoResult === 'undefined'
        ? formData
        : redoResult
    } else {
      formData = produce(formData, (draft) => {
        return redoFieldChange(fieldChange, draft)
      })
    }
  }
  return formData
}

export function applyConflictToFromData(conflict: FieldChange, currentFormData: FormData): FormData {
  let formData = currentFormData
  const fieldChange = conflict
  if (isDraft(formData)) {
    const redoResult = redoFieldChange(fieldChange, formData)
    formData = typeof redoResult === 'undefined'
      ? formData
      : redoResult
  } else {
    formData = produce(formData, (draft) => {
      return redoFieldChange(fieldChange, draft)
    })
  }
  return formData
}

export function unApplyConflictToFromData(conflict: FieldChange, currentFormData: FormData): FormData {
  let formData = currentFormData
  const fieldChange = conflict
  if (isDraft(formData)) {
    const undoResult = undoFieldChange(fieldChange, formData)
    formData = typeof undoResult === 'undefined'
      ? formData
      : undoResult
  } else {
    formData = produce(formData, (draft) => {
      return undoFieldChange(fieldChange, draft)
    })
  }
  return formData
}
//#endregion formData maipulation

export function ActivityToFormData(activity: ActivityWithDetailFromStore) {
  return {
    name: activity.name,
    who: activity.person,
    where: activity.place,
    howMuch: activity.cost,
  }
}

export function CalculateRefreshedStep(
  previousVersionFormData: FormData,
  currentFormData: FormData,
  storeActivity: ActivityWithDetailFromStore
): Step | undefined {
  const storeFormData = ActivityToFormData(storeActivity)

  const storeVsCurrent = getFieldChanges(currentFormData, storeFormData)
  const currentVsPreviousVersion = getFieldChanges(previousVersionFormData, currentFormData)
  const storeVsPreviousVersion = getFieldChanges(previousVersionFormData, storeFormData)

  const nonConflictFieldChanges: FieldChange[] = []
  const conflictFieldChanges: FieldChange[] = []
  const reverseCurrentFieldChanges: FieldChange[] = []

  for (const change of storeVsCurrent) {
    if (!currentVsPreviousVersion.find(c => c.path === change.path)) {
      // store activity changed and there are no current edits
      nonConflictFieldChanges.push(change)
    }
    else if (storeVsPreviousVersion.find(c => c.path === change.path)) {
      // store activity and current both changed
      conflictFieldChanges.push(change)
    }
    else {
      // only current changed
      reverseCurrentFieldChanges.push(change)
    }
  }
  if (nonConflictFieldChanges.length === 0 && conflictFieldChanges.length === 0) {
    return undefined
  }
  return {
    name: 'Refreshed',
    fieldChanges: nonConflictFieldChanges,
    versionToken: storeActivity.versionToken,
    mergeBehaviour: 'merge',
    conflicts: conflictFieldChanges.map(c => ({
      name: calculateStepName([c]),
      fieldChange: c,
      applied: true
    })),
    reverseCurrentFieldChanges: reverseCurrentFieldChanges,
  }
}