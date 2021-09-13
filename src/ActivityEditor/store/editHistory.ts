import { produce, isDraft, Draft } from "immer"
import { ActivityWithDetailFromStore } from "./actions"

export type FormData = {
  name: string,
  who: string,
  where: string,
  howMuch?: number,
  rides: {
    [id: string]: {
      id: string,
      description: string,
      sequence: number
    }
  }
}

export type FieldChange = {
  path: string,
  previousValue: any,
  newValue: any,
}

export type Conflict = {
  name: string,
  fieldChanges: FieldChange[],
  applied: boolean,
}

export type Step = {
  name: string,
  fieldChanges: FieldChange[],
  versionToken?: string,
  mergeBehaviour?: 'merge' | 'discard local changes',
  conflicts?: Conflict[],
  reverseLocalFieldChanges?: FieldChange[],
  saveStatus?: 'saving' | 'saved',
}

const defaultFormData = {
  name: '',
  who: '',
  where: '',
  howMuch: undefined,
  rides: {},
}

function numberOfSlashes(value: string): number {
  return [...value].filter(c => c === '/').length
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

  function getRidesFieldChanges(previousFormData: FormData, currentFormData: FormData): FieldChange[] {
    const rideFieldChanges: FieldChange[] = []
    const previousRideKeys = Object.keys(previousFormData.rides)
    const currentRideKeys = Object.keys(currentFormData.rides)

    const createdRideKeys = currentRideKeys.filter(ck => !previousRideKeys.includes(ck))
    for (const createdRideKey of createdRideKeys) {
      rideFieldChanges.push({
        path: `/rides/${createdRideKey}`,
        previousValue: undefined,
        newValue: currentFormData.rides[createdRideKey]
      })
    }

    const removedRideKeys = previousRideKeys.filter(pk => !currentRideKeys.includes(pk))
    for (const removedRideKey of removedRideKeys) {
      rideFieldChanges.push({
        path: `/rides/${removedRideKey}`,
        previousValue: previousFormData.rides[removedRideKey],
        newValue: undefined
      })
    }

    const commonRideKeys = currentRideKeys.filter(ck => previousRideKeys.includes(ck))
    for (const commonRideKey of commonRideKeys) {
      const previousRide = previousFormData.rides[commonRideKey]
      const currentRide = currentFormData.rides[commonRideKey]
      if (previousRide.description !== currentRide.description) {
        rideFieldChanges.push({
          path: `/rides/${commonRideKey}/description`,
          previousValue: previousRide.description,
          newValue: currentRide.description
        })
      }
      // do not care about sequence for now
    }
    return rideFieldChanges
  }
  fieldChanges.push(...getRidesFieldChanges(previousFormData, currentFormData))

  return fieldChanges
}

function mergeFieldChanges(a: FieldChange, b: FieldChange): FieldChange[] {
  // assumes single field change step
  // add/delete rides cannot use reference equal of values
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
  const { path, previousValue, newValue } = fieldChanges[0] // assumes one step only has one field change
  if (path === '/name') {
    return 'Edit name'
  }
  if (path === '/who') {
    return 'Edit who'
  }
  if (path === '/where') {
    return 'Edit where'
  }
  if (path === '/howMuch') {
    return 'Edit how much'
  }
  if (path.startsWith('/rides/') && numberOfSlashes(path) === 2) {
    if (previousValue === undefined && newValue !== undefined) {
      return 'Add ride'
    }
    if (previousValue !== undefined && newValue === undefined) {
      return 'Remove ride'
    }
  }
  if (path.startsWith('/rides/') && path.endsWith('description')) {
    return 'Edit ride description'
  }
  throw new Error('Cannot determine step name')
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

//#region formData manipulation
function undoFieldChange(fieldChange: FieldChange, formData: Draft<FormData>): FormData | undefined {
  const { path, previousValue } = fieldChange
  return produce(formData, (draft) => {
    if (path === '/name') {
      draft.name = previousValue
    }
    else if (path === '/who') {
      draft.who = previousValue
    }
    else if (path === '/where') {
      draft.where = previousValue
    }
    else if (path === '/howMuch') {
      draft.howMuch = previousValue
    }
    else if (path === '/howMuch') {
      draft.howMuch = previousValue
    }
    else if (path.startsWith('/rides/') && numberOfSlashes(path) === 2) {
      const rideId = path.substring('/rides/'.length)
      if (previousValue === undefined) {
        delete draft.rides[rideId]
      } else {
        draft.rides[rideId] = previousValue
      }
    }
    else if (path.startsWith('/rides/') && path.endsWith('description')) {
      const rideId = path.substring('/rides/'.length, path.length - 'description'.length - 1)
      draft.rides[rideId].description = previousValue
    }
  })
}

function redoFieldChange(fieldChange: FieldChange, formData: Draft<FormData>): FormData | undefined {
  const { path, newValue } = fieldChange
  return produce(formData, (draft) => {
    if (path === '/name') {
      draft.name = newValue
    }
    else if (path === '/who') {
      draft.who = newValue
    }
    else if (path === '/where') {
      draft.where = newValue
    }
    else if (path === '/howMuch') {
      draft.howMuch = newValue
    }
    else if (path.startsWith('/rides/') && numberOfSlashes(path) === 2) {
      const rideId = path.substring('/rides/'.length)
      if (newValue === undefined) {
        delete draft.rides[rideId]
      } else {
        draft.rides[rideId] = newValue
      }
    }
    else if (path.startsWith('/rides/') && path.endsWith('description')) {
      const rideId = path.substring('/rides/'.length, path.length - 'description'.length - 1)
      draft.rides[rideId].description = newValue
    }
  })
}

function undoFieldChanges(fieldChanges: FieldChange[], sourceFormData: FormData | Draft<FormData>): FormData {
  let formData = sourceFormData
  for (const fieldChange of fieldChanges) {
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

function redoFieldChanges(fieldChanges: FieldChange[], sourceFormData: FormData | Draft<FormData>): FormData {
  let formData = sourceFormData
  for (const fieldChange of fieldChanges) {
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

export function undoStep(step: Step, previousFormData: FormData | Draft<FormData>): FormData {
  const allFieldChanges = step.mergeBehaviour === 'merge'
    ? step.fieldChanges
      .concat(
        step.conflicts?.filter(c => c.applied).flatMap(c => c.fieldChanges) ?? []
      )
    : step.mergeBehaviour === 'discard local changes'
      ? step.fieldChanges
        .concat(
          step.conflicts?.flatMap(c => c.fieldChanges) ?? []
        )
        .concat(
          step.reverseLocalFieldChanges ?? []
        )
      : step.fieldChanges
  return undoFieldChanges(allFieldChanges, previousFormData)
}

export function redoStep(step: Step, previousFormData: FormData): FormData {
  const allFieldChanges = step.mergeBehaviour === 'merge'
    ? step.fieldChanges
      .concat(
        step.conflicts?.filter(c => c.applied).flatMap(c => c.fieldChanges) ?? []
      )
    : step.mergeBehaviour === 'discard local changes'
      ? step.fieldChanges
        .concat(
          step.conflicts?.flatMap(c => c.fieldChanges) ?? []
        )
        .concat(
          step.reverseLocalFieldChanges ?? []
        )
      : step.fieldChanges
  return redoFieldChanges(allFieldChanges, previousFormData)
}

export function SwitchToMerge(step: Step, currentFormData: FormData): FormData {
  const allFieldChanges = (step.conflicts?.filter(c => !c.applied).flatMap(c => c.fieldChanges) ?? [])
    .concat(step.reverseLocalFieldChanges ?? [])
  return undoFieldChanges(allFieldChanges, currentFormData)
}

export function SwitchToDiscardLocalChanges(step: Step, currentFormData: FormData): FormData {
  const allFieldChanges = (step.conflicts?.filter(c => !c.applied).flatMap(c => c.fieldChanges) ?? [])
    .concat(step.reverseLocalFieldChanges ?? [])
  return redoFieldChanges(allFieldChanges, currentFormData)
}

export function applyConflictToFromData(conflict: Conflict, currentFormData: FormData): FormData {
  return redoFieldChanges(conflict.fieldChanges, currentFormData)
}

export function unApplyConflictToFromData(conflict: Conflict, currentFormData: FormData): FormData {
  return undoFieldChanges(conflict.fieldChanges, currentFormData)
}
//#endregion formData maipulation

export function ActivityToFormData(activity: ActivityWithDetailFromStore) {
  return {
    name: activity.name,
    who: activity.person,
    where: activity.place,
    howMuch: activity.cost,
    rides: Object.fromEntries(activity.rides.map(r => [r.id, r]))
  }
}

export function CalculateRefreshedStep(
  previousVersionFormData: FormData,
  currentFormData: FormData,
  storeActivity: ActivityWithDetailFromStore,
  discardLocalChanges: boolean
): Step | undefined {
  const storeFormData = ActivityToFormData(storeActivity)

  const storeVsCurrent = getFieldChanges(currentFormData, storeFormData)
  const currentVsPreviousVersion = getFieldChanges(previousVersionFormData, currentFormData)
  const storeVsPreviousVersion = getFieldChanges(previousVersionFormData, storeFormData)

  const nonConflictFieldChanges: FieldChange[] = []
  const conflictFieldChanges: FieldChange[] = []
  const reverseLocalFieldChanges: FieldChange[] = []

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
      reverseLocalFieldChanges.push(change)
    }
  }
  if (nonConflictFieldChanges.length === 0 && conflictFieldChanges.length === 0) {
    return undefined
  }
  return {
    name: 'Refreshed',
    fieldChanges: nonConflictFieldChanges,
    versionToken: storeActivity.versionToken,
    mergeBehaviour: discardLocalChanges ? 'discard local changes' : 'merge',
    conflicts: conflictFieldChanges.map(c => ({
      name: calculateStepName([c]),
      fieldChanges: [c],
      applied: true
    })),
    reverseLocalFieldChanges,
  }
}