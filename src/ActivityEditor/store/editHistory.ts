import { produce, isDraft, Draft } from "immer"
import { ActivityWithDetailFromStore } from "./actions"

export type FormData = {
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
  }
}

export type FieldChange = {
  path: string,
  previousValue: any,
  newValue: any,
}

export type GroupedFieldChanges = FieldChange[]

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
  rides: {
    ids: [],
    entities: {}
  },
}

function numberOfSlashes(value: string): number {
  return [...value].filter(c => c === '/').length
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function getFieldChanges(previousFormData: FormData, currentFormData: FormData): Array<FieldChange | GroupedFieldChanges> {
  if (previousFormData === currentFormData) {
    return []
  }
  const fieldChanges: Array<FieldChange | GroupedFieldChanges> = []
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

  function getRidesFieldChanges(previousFormData: FormData, currentFormData: FormData): Array<FieldChange | GroupedFieldChanges> {
    const previousRideIds = previousFormData.rides.ids
    const currentRideIds = currentFormData.rides.ids

    let rideFieldChanges: Array<FieldChange | GroupedFieldChanges> = []
    let calculationRideIds: string[] = previousRideIds;

    (function removeRideFieldChanges() {
      const removedRideIds = previousRideIds.filter(pRId => !currentRideIds.includes(pRId))
      for (const removedRideId of removedRideIds) {
        const newCalculationRideIds = calculationRideIds.filter(rId => rId !== removedRideId)
        const idFieldChange = {
          path: '/rides/ids',
          previousValue: calculationRideIds,
          newValue: newCalculationRideIds
        }
        const entityFieldChange = {
          path: `/rides/entities/${removedRideId}`,
          previousValue: previousFormData.rides.entities[removedRideId],
          newValue: undefined
        }

        calculationRideIds = newCalculationRideIds
        rideFieldChanges.push([idFieldChange, entityFieldChange])
      }
    })();

    (function moveRideFieldChanges() {
      // rides that are not added or deleted
      const correspondingCurrentRideIds = currentRideIds.filter(cRId => previousRideIds.includes(cRId))
      if (!arraysEqual(calculationRideIds, correspondingCurrentRideIds)) {
        rideFieldChanges.push({
          path: '/rides/ids',
          previousValue: calculationRideIds,
          newValue: correspondingCurrentRideIds
        })
      }
    })();

    (function updateRidePropertiesFieldChanges() {
      const commonRideIds = currentRideIds.filter(cRId => previousRideIds.includes(cRId))
      for (const commonRideId of commonRideIds) {
        const previousRide = previousFormData.rides.entities[commonRideId]
        const currentRide = currentFormData.rides.entities[commonRideId]
        if (previousRide.description !== currentRide.description) {
          rideFieldChanges.push({
            path: `/rides/entities/${commonRideId}/description`,
            previousValue: previousRide.description,
            newValue: currentRide.description
          })
        }
      }
    })();

    (function addRidePropertiesFieldChanges() {
      const addedRideIds = currentRideIds.filter(cRId => !previousRideIds.includes(cRId))
      for (const addedRideId of addedRideIds) {
        const addedIndex = currentRideIds.indexOf(addedRideId)
        const newCalculationRideIds = [
          ...calculationRideIds.slice(0, addedIndex),
          addedRideId,
          ...calculationRideIds.slice(addedIndex)
        ]
        const idFieldChange = {
          path: '/rides/ids',
          previousValue: calculationRideIds,
          newValue: newCalculationRideIds
        }
        const entityFieldChange = {
          path: `/rides/entities/${addedRideId}`,
          previousValue: undefined,
          newValue: currentFormData.rides.entities[addedRideId]
        }

        calculationRideIds = newCalculationRideIds
        rideFieldChanges.push([idFieldChange, entityFieldChange])
      }
    })();

    return rideFieldChanges
  }
  fieldChanges.push(...getRidesFieldChanges(previousFormData, currentFormData))

  return fieldChanges
}

function mergeFieldChanges(a: FieldChange, b: FieldChange): FieldChange[] {
  return (a.path === b.path)
    ? a.previousValue === b.newValue
      || (Array.isArray(a) && Array.isArray(b) && arraysEqual(a, b))
      ? [] // merged resulting in no-op
      : [{ path: a.path, previousValue: a.previousValue, newValue: b.newValue }] // merged
    : [a, b] // not merged
}

// isItem means non-property change, means create or delete
function getRideId(path: string): { rideId: string | undefined, isItem: boolean } {
  if (path.startsWith('/rides/entities/') && numberOfSlashes(path) === 3) {
    const rideId = path.substring('/rides/entities/'.length)
    return {
      rideId,
      isItem: true
    }
  }
  else if (path.startsWith('/rides/entities/') && path.endsWith('description')) {
    const rideId = path.substring('/rides/entities/'.length, path.length - 'description'.length - 1)
    return {
      rideId,
      isItem: false
    }
  }
  return {
    rideId: undefined,
    isItem: false
  }
}

function calculateStepName(fieldChanges: FieldChange[]): string {
  if (fieldChanges.length === 0) {
    return '';
  }

  if (fieldChanges.length === 2 && fieldChanges.some(c => c.path === '/rides/ids')) {
    const entityChange = fieldChanges.find(c =>
      c.path.startsWith('/rides/entities/') && numberOfSlashes(c.path) === 3)!
    if (entityChange
      && entityChange.previousValue === undefined
      && entityChange.newValue !== undefined) {
      return 'Add ride'
    }
    if (entityChange
      && entityChange.previousValue !== undefined
      && entityChange.newValue === undefined) {
      return 'Remove ride'
    }
  }

  if (fieldChanges.length > 1) {
    return 'Multiple edits'
  }

  const { path } = fieldChanges[0]
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
  if (path === '/rides/ids') {
    return 'Move rides'
  }
  if (path.startsWith('/rides/entities/') && path.endsWith('description')) {
    return 'Edit ride description'
  }
  throw new Error('Cannot determine step name')
}

export function calculateSteps(
  previousStep: Step,
  previousFormData: FormData = defaultFormData,
  currentFormData: FormData)
  : Step[] {
  const fieldChanges = getFieldChanges(previousFormData, currentFormData).flat()
  if (fieldChanges.length === 0) {
    return [previousStep]
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
    return [previousStep, newStep]
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
  else {// fieldChanges did not merge
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
  // todo sequence undoFieldChange
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
    else if (path.startsWith('/rides/entities/') && numberOfSlashes(path) === 3) {
      const rideId = path.substring('/rides/entities/'.length)
      if (previousValue === undefined) {
        delete draft.rides.entities[rideId]
      } else {
        draft.rides.entities[rideId] = previousValue
      }
    }
    else if (path.startsWith('/rides/entities/') && path.endsWith('description')) {
      const rideId = path.substring('/rides/entities/'.length, path.length - 'description'.length - 1)
      draft.rides.entities[rideId].description = previousValue
    }
  })
}

function redoFieldChange(fieldChange: FieldChange, formData: Draft<FormData>): FormData | undefined {
  // todo sequence redoFieldChange
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
    else if (path.startsWith('/rides/entities/') && numberOfSlashes(path) === 3) {
      const rideId = path.substring('/rides/entities/'.length)
      if (newValue === undefined) {
        delete draft.rides.entities[rideId]
      } else {
        draft.rides.entities[rideId] = newValue
      }
    }
    else if (path.startsWith('/rides/entities/') && path.endsWith('description')) {
      const rideId = path.substring('/rides/entities/'.length, path.length - 'description'.length - 1)
      draft.rides.entities[rideId].description = newValue
    }
  })
}

function undoFieldChanges(fieldChanges: FieldChange[], sourceFormData: FormData | Draft<FormData>): FormData {
  // todo sequence undoFieldChanges
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
  // todo sequence redoFieldChanges
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
  // todo sequence undoStep
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
  // todo sequence redoStep
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
  // todo sequence SwitchToMerge
  const allFieldChanges = (step.conflicts?.filter(c => !c.applied).flatMap(c => c.fieldChanges) ?? [])
    .concat(step.reverseLocalFieldChanges ?? [])
  return undoFieldChanges(allFieldChanges, currentFormData)
}

export function SwitchToDiscardLocalChanges(step: Step, currentFormData: FormData): FormData {
  // todo sequence SwitchToDiscardLocalChanges
  const allFieldChanges = (step.conflicts?.filter(c => !c.applied).flatMap(c => c.fieldChanges) ?? [])
    .concat(step.reverseLocalFieldChanges ?? [])
  return redoFieldChanges(allFieldChanges, currentFormData)
}

export function applyConflictToFromData(conflict: Conflict, currentFormData: FormData): FormData {
  // todo sequence applyConflictToFromData
  return redoFieldChanges(conflict.fieldChanges, currentFormData)
}

export function unApplyConflictToFromData(conflict: Conflict, currentFormData: FormData): FormData {
  // todo sequence unApplyConflictToFromData
  return undoFieldChanges(conflict.fieldChanges, currentFormData)
}
//#endregion formData maipulation

function hasRelatedChanges(
  aChanges: FieldChange[],
  bChanges: FieldChange[]
): boolean {
  return aChanges.some(ac => bChanges.some(bc => bc.path === ac.path))
}

export function conflictHasRelatedChanges(conflict: Conflict, step: Step): boolean {
  const stepFieldChanges = step.fieldChanges
    .concat(step.conflicts?.flatMap(c => c.fieldChanges) ?? [])
    .concat(step.reverseLocalFieldChanges ?? [])

  return hasRelatedChanges(conflict.fieldChanges, stepFieldChanges)
}

export function ActivityToFormData(activity: ActivityWithDetailFromStore): FormData {
  return {
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

function hasConflictedChanges(
  change: FieldChange | GroupedFieldChanges,
  otherChanges: (FieldChange | GroupedFieldChanges)[]
): boolean {
  //todo
}

export function CalculateRefreshedStep(
  previousVersionFormData: FormData,
  currentFormData: FormData,
  remoteActivity: ActivityWithDetailFromStore,
  discardLocalChanges: boolean
): Step | undefined {
  const remoteFormData = ActivityToFormData(remoteActivity)

  const remoteVsCurrent = getFieldChanges(currentFormData, remoteFormData)
  const currentVsPreviousVersion = getFieldChanges(previousVersionFormData, currentFormData)
  const remoteVsPreviousVersion = getFieldChanges(previousVersionFormData, remoteFormData)

  const nonConflictFieldChanges: FieldChange[] = []
  const conflictFieldChanges: (FieldChange | GroupedFieldChanges)[] = []
  const reverseLocalFieldChanges: FieldChange[] = []

  for (const change of remoteVsCurrent) {
    if (!hasConflictedChanges(change, currentVsPreviousVersion)) {
      // remote activity changed and there are no current edits
      nonConflictFieldChanges.push(...[change].flat())
    }
    else if (hasConflictedChanges(change, remoteVsPreviousVersion)) {
      // remote activity and current both changed
      conflictFieldChanges.push(change)
    }
    else {
      // only current changed
      reverseLocalFieldChanges.push(...[change].flat())
    }
  }
  if (nonConflictFieldChanges.length === 0 && conflictFieldChanges.length === 0) {
    return undefined
  }
  return {
    name: 'Refreshed',
    fieldChanges: nonConflictFieldChanges,
    versionToken: remoteActivity.versionToken,
    mergeBehaviour: discardLocalChanges ? 'discard local changes' : 'merge',
    conflicts: conflictFieldChanges.map(c => ({
      name: calculateStepName([c].flat()),
      fieldChanges: [c].flat(),
      applied: true
    })),
    reverseLocalFieldChanges,
  }
}