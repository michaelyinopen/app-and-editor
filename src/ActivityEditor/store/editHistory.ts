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

// merged field changes
export type Operation = {
  path: string,
  previousValue: any,
  newValue: any,
}

export type Conflict = {
  name: string,
  fieldChange: FieldChange,
  applied: boolean,
}

export type Step = {
  name: string,
  operations: Operation[],
  versionToken?: string,
  mergeBehaviour?: 'merge' | 'discard local changes',
  conflicts?: Conflict[],
  reverseCurrentOperations?: FieldChange[],
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

function mergeFieldChanges(a: FieldChange, b: FieldChange): Operation[] {
  return (a.path === b.path)
    ? a.previousValue === b.newValue
      ? [] // merged resulting in no-op
      : [{ path: a.path, previousValue: a.previousValue, newValue: b.newValue }] // merged
    : [a, b] // not merged
}

function calculateStepName(operations: Operation[]): string {
  if (operations.length === 0) {
    return '';
  }
  if (operations.length > 1) {
    return 'Multiple edits'
  }
  const operation = operations[0]
  if (operation.path === '/name') {
    return 'Edit name'
  }
  if (operation.path === '/who') {
    return 'Edit who'
  }
  if (operation.path === '/where') {
    return 'Edit where'
  }
  if (operation.path === '/howMuch') {
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
  if (previousStep.operations.length !== 1
    || fieldChanges.length !== 1
    || previousStep.versionToken) {
    const name = calculateStepName(fieldChanges)
    const newStep = {
      name,
      operations: fieldChanges
    }
    return previousStep ? [previousStep, newStep] : [newStep]
  }
  const mergedOperations = mergeFieldChanges(
    previousStep.operations[0],
    fieldChanges[0]
  )
  if (mergedOperations.length === 0) {
    return []
  }
  else if (mergedOperations.length === 1) {
    const name = calculateStepName(mergedOperations)
    const mergedStep = {
      name,
      operations: mergedOperations
    }
    return [mergedStep]
  }
  else {// mergedOperations.length === 2
    const name = calculateStepName(fieldChanges)
    const newStep = {
      name,
      operations: fieldChanges
    }
    return [previousStep, newStep]
  }
}

//#region formData maipulation
function undoOperation(operation: Operation, formData: Draft<FormData>): FormData | undefined {
  return produce(formData, (draft) => {
    if (operation.path === '/name') {
      draft.name = operation.previousValue
    }
    else if (operation.path === '/who') {
      draft.who = operation.previousValue
    }
    else if (operation.path === '/where') {
      draft.where = operation.previousValue
    }
    else if (operation.path === '/howMuch') {
      draft.howMuch = operation.previousValue
    }
  })
}

export function undoStep(step: Step, previousFormData: FormData | Draft<FormData>): FormData {
  let formData = previousFormData
  const allOperations = step.mergeBehaviour === 'merge'
    ? step.operations
      .concat(
        step.conflicts?.filter(c => c.applied).map(c => c.fieldChange) ?? []
      )
    : step.mergeBehaviour === 'discard local changes'
      ? step.operations
        .concat(
          step.conflicts?.map(c => c.fieldChange) ?? []
        )
        .concat(
          step.reverseCurrentOperations ?? []
        )
      : step.operations
  for (const operation of allOperations) {
    if (isDraft(formData)) {
      const undoResult = undoOperation(operation, formData)
      formData = typeof undoResult === 'undefined'
        ? formData
        : undoResult
    } else {
      formData = produce(formData, (draft) => {
        return undoOperation(operation, draft)
      })
    }
  }
  return formData
}

function redoOperation(operation: Operation, formData: Draft<FormData>): FormData | undefined {
  return produce(formData, (draft) => {
    if (operation.path === '/name') {
      draft.name = operation.newValue
    }
    else if (operation.path === '/who') {
      draft.who = operation.newValue
    }
    else if (operation.path === '/where') {
      draft.where = operation.newValue
    }
    else if (operation.path === '/howMuch') {
      draft.howMuch = operation.newValue
    }
  })
}

export function redoStep(step: Step, previousFormData: FormData): FormData {
  let formData = previousFormData
  const allOperations = step.mergeBehaviour === 'merge'
    ? step.operations
      .concat(
        step.conflicts?.filter(c => c.applied).map(c => c.fieldChange) ?? []
      )
    : step.mergeBehaviour === 'discard local changes'
      ? step.operations
        .concat(
          step.conflicts?.map(c => c.fieldChange) ?? []
        )
        .concat(
          step.reverseCurrentOperations ?? []
        )
      : step.operations
  for (const operation of allOperations) {
    if (isDraft(formData)) {
      const redoResult = redoOperation(operation, formData)
      formData = typeof redoResult === 'undefined'
        ? formData
        : redoResult
    } else {
      formData = produce(formData, (draft) => {
        return redoOperation(operation, draft)
      })
    }
  }
  return formData
}

export function SwitchToMerge(step: Step, currentFormData: FormData): FormData {
  let formData = currentFormData
  const allOperations = (step.conflicts?.filter(c => !c.applied).map(c => c.fieldChange) ?? [])
    .concat(step.reverseCurrentOperations ?? [])
  for (const operation of allOperations) {
    if (isDraft(formData)) {
      const undoResult = undoOperation(operation, formData)
      formData = typeof undoResult === 'undefined'
        ? formData
        : undoResult
    } else {
      formData = produce(formData, (draft) => {
        return undoOperation(operation, draft)
      })
    }
  }
  return formData
}

export function SwitchToDiscardLocalChange(step: Step, currentFormData: FormData): FormData {
  let formData = currentFormData
  const allOperations = (step.conflicts?.filter(c => !c.applied).map(c => c.fieldChange) ?? [])
    .concat(step.reverseCurrentOperations ?? [])
  for (const operation of allOperations) {
    if (isDraft(formData)) {
      const redoResult = redoOperation(operation, formData)
      formData = typeof redoResult === 'undefined'
        ? formData
        : redoResult
    } else {
      formData = produce(formData, (draft) => {
        return redoOperation(operation, draft)
      })
    }
  }
  return formData
}

export function applyConflictToFromData(conflict: FieldChange, currentFormData: FormData): FormData {
  let formData = currentFormData
  const operation = conflict
  if (isDraft(formData)) {
    const redoResult = redoOperation(operation, formData)
    formData = typeof redoResult === 'undefined'
      ? formData
      : redoResult
  } else {
    formData = produce(formData, (draft) => {
      return redoOperation(operation, draft)
    })
  }
  return formData
}

export function unApplyConflictToFromData(conflict: FieldChange, currentFormData: FormData): FormData {
  let formData = currentFormData
  const operation = conflict
  if (isDraft(formData)) {
    const undoResult = undoOperation(operation, formData)
    formData = typeof undoResult === 'undefined'
      ? formData
      : undoResult
  } else {
    formData = produce(formData, (draft) => {
      return undoOperation(operation, draft)
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

export function CalculateRefreshStep(
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
    name: 'Refresh',
    operations: nonConflictFieldChanges,
    versionToken: storeActivity.versionToken,
    mergeBehaviour: 'merge',
    conflicts: conflictFieldChanges.map(c => ({
      name: calculateStepName([c]),
      fieldChange: c,
      applied: true
    })),
    reverseCurrentOperations: reverseCurrentFieldChanges,
  }
}