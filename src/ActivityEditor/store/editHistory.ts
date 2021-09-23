import { produce } from "immer"
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

export type Operation = {
  type: 'edit' | 'merge' | 'conflict' | 'reverse local',
  fieldChanges: FieldChange[],
  conflictName?: string,
  conflictApplied?: boolean, // need this to preserve the selection when toggling 'merge' and 'discard local changes',
  applied: boolean,
}

export type Step = {
  name: string,
  operations: Operation[],
  versionToken?: string,
  mergeBehaviour?: 'merge' | 'discard local changes',
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
      // rides that are not added or removed
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

function combineFieldChanges(a: FieldChange, b: FieldChange): FieldChange[] {
  return (a.path === b.path)
    ? a.previousValue === b.newValue
      || (Array.isArray(a) && Array.isArray(b) && arraysEqual(a, b))
      ? [] // combined resulting in no-op
      : [{ path: a.path, previousValue: a.previousValue, newValue: b.newValue }] // merged
    : [a, b] // not combined
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
  if (fieldChanges.length !== 1
    || previousStep.versionToken
    || previousStep.saveStatus
    || previousStep.operations.length !== 1
    || previousStep.operations[0].fieldChanges.length !== 1
  ) {
    const name = calculateStepName(fieldChanges)
    const newStep = {
      name,
      operations: [{
        type: 'edit' as const,
        fieldChanges,
        applied: true
      }]
    }
    return [previousStep, newStep]
  }
  const combinedFieldChanges = combineFieldChanges(
    previousStep.operations[0].fieldChanges[0],
    fieldChanges[0]
  )
  if (combinedFieldChanges.length === 0) {
    // no-op
    return []
  }
  else if (combinedFieldChanges.length === 1) {
    // combined
    const name = calculateStepName(combinedFieldChanges)
    const mergedStep = {
      name,
      operations: [{
        type: 'edit' as const,
        fieldChanges: combinedFieldChanges,
        applied: true
      }]
    }
    return [mergedStep]
  }
  else {
    // did not combine
    const name = calculateStepName(fieldChanges)
    const newStep = {
      name,
      operations: [{
        type: 'edit' as const,
        fieldChanges,
        applied: true
      }]
    }
    return [previousStep, newStep]
  }
}

//#region formData manipulation
export type Adjust = {
  '/rides/ids'?: {
    type: 'remove' | 'add',
    id: string,
    index?: number,
  }[]
}

function undoFieldChange(fieldChange: FieldChange, formData: FormData, adjust: Adjust): FormData {
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
    else if (path === '/rides/ids') {
      let rideIds: string[] = [...previousValue]
      for (const rideIdAdjust of (adjust['/rides/ids'] ?? [])) {
        if (rideIdAdjust.type === 'remove') {
          // unapplied an remove
          rideIds = rideIds.filter(rId => rId !== rideIdAdjust.id)
        } else if (rideIdAdjust.type === 'add') {
          // unapplied a add
          rideIds = [
            ...rideIds.slice(0, rideIdAdjust.index),
            rideIdAdjust.id,
            ...rideIds.slice(rideIdAdjust.index)
          ]
        }
      }
      draft.rides.ids = rideIds
    }
  })
}

function redoFieldChange(fieldChange: FieldChange, formData: FormData, adjust: Adjust): FormData {
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
    else if (path === '/rides/ids') {
      let rideIds: string[] = [...newValue]
      for (const rideIdAdjust of (adjust['/rides/ids'] ?? [])) {
        if (rideIdAdjust.type === 'add') {
          // unapplied a remove
          rideIds = [
            ...rideIds.slice(0, rideIdAdjust.index),
            rideIdAdjust.id,
            ...rideIds.slice(rideIdAdjust.index)
          ]
        } else if (rideIdAdjust.type === 'remove') {
          // unapplied an add
          rideIds = rideIds.filter(rId => rId !== rideIdAdjust.id)
        }
      }
      draft.rides.ids = rideIds
    }
  })
}

function calculateUndoAdjust(unappliedFieldChange: FieldChange, adjust: Adjust): Adjust {
  const { path } = unappliedFieldChange
  if (path !== '/rides/ids') {
    return adjust
  }
  const rideIdAdjusts = adjust['/rides/ids'] ?? []
  const previousValue: string[] = unappliedFieldChange.previousValue
  const newValue: string[] = unappliedFieldChange.newValue
  if (previousValue.length > newValue.length) {
    // unapplied a remove
    const removedId = [...previousValue].reverse().find(pRid => !newValue.includes(pRid))!
    return {
      ...adjust,
      '/rides/ids': [
        ...rideIdAdjusts,
        {
          type: 'remove',
          id: removedId,
        }
      ]
    }
  } else if (previousValue.length < newValue.length) {
    // unapplied an add
    let addedIndex = (newValue.length - 1) - [...newValue].reverse().findIndex(nRid => !previousValue.includes(nRid))!
    return {
      ...adjust,
      '/rides/ids': [
        ...rideIdAdjusts,
        {
          type: 'add',
          id: newValue[addedIndex],
          index: addedIndex
        }
      ]
    }
  }
  return adjust
}

function calculateRedoAdjust(unappliedFieldChange: FieldChange, adjust: Adjust): Adjust {
  const { path } = unappliedFieldChange
  if (path !== '/rides/ids') {
    return adjust
  }
  const rideIdAdjusts = adjust['/rides/ids'] ?? []
  const previousValue: string[] = unappliedFieldChange.previousValue
  const newValue: string[] = unappliedFieldChange.newValue
  if (previousValue.length > newValue.length) {
    // unapplied a remove
    const removedIndex = previousValue.findIndex(pRid => !newValue.includes(pRid))
    const accumulatedOffset = rideIdAdjusts.filter(adj => adj.type === 'add').length
    return {
      ...adjust,
      '/rides/ids': [
        ...rideIdAdjusts,
        {
          index: accumulatedOffset + removedIndex,
          id: previousValue[removedIndex],
          type: 'add'
        }
      ]
    }
  } else if (previousValue.length < newValue.length) {
    // unapplied an add
    let addedId = newValue.find(pRid => !previousValue.includes(pRid))!
    return {
      ...adjust,
      '/rides/ids': [
        ...rideIdAdjusts,
        {
          type: 'remove',
          id: addedId,
        }
      ]
    }
  }
  return adjust
}

export function undoStep(step: Step, previousFormData: FormData): FormData {
  let formData = previousFormData
  let adjust: Adjust = {}

  const fieldChangeApplied = step.operations
    .flatMap(op => op.fieldChanges.map(fc => [fc, op.applied] as const))
    .reverse()

  for (const [fieldChange, applied] of fieldChangeApplied) {
    if (applied) {
      formData = undoFieldChange(fieldChange, formData, adjust)
    } else {
      adjust = calculateUndoAdjust(fieldChange, adjust)
    }
  }
  return formData
}

export function redoStep(step: Step, previousFormData: FormData): FormData {
  let formData = previousFormData
  let adjust: Adjust = {}

  const fieldChangeApplied = step.operations
    .flatMap(op => op.fieldChanges.map(fc => [fc, op.applied] as const))

  for (const [fieldChange, applied] of fieldChangeApplied) {
    if (applied) {
      formData = redoFieldChange(fieldChange, formData, adjust)
    } else {
      adjust = calculateRedoAdjust(fieldChange, adjust)
    }
  }
  return formData
}
//#endregion formData maipulation

function hasRelatedChanges(
  aChanges: FieldChange[],
  bChanges: FieldChange[]
): boolean {
  return aChanges.some(ac => bChanges.some(bc => bc.path === ac.path))
}

export function conflictHasRelatedChanges(operation: Operation, step: Step): boolean {
  return hasRelatedChanges(
    operation.fieldChanges,
    step.operations.flatMap(op => op.fieldChanges)
  )
}

//#region Refreshed Step
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

function isRemovedRide(change: FieldChange | GroupedFieldChanges): [true, string] | [false] {
  if (Array.isArray(change)) {
    const removalIdsFieldChange = change.find(c =>
      c.path === '/rides/ids'
      && c.previousValue.length > c.newValue.length)
    if (removalIdsFieldChange) {
      const removedId = removalIdsFieldChange.previousValue
        .find((id: string) => !removalIdsFieldChange.newValue.includes(id))
      return [true, removedId]
    }
  }
  return [false]
}

function isMovedRides(change: FieldChange | GroupedFieldChanges): boolean {
  return !Array.isArray(change) && change.path === '/rides/ids'
}

function isAddedRide(change: FieldChange | GroupedFieldChanges): [true, string] | [false] {
  if (Array.isArray(change)) {
    const additionIdsFieldChange = change.find(c =>
      c.path === '/rides/ids'
      && c.previousValue.length < c.newValue.length)
    if (additionIdsFieldChange) {
      const addedId = additionIdsFieldChange.newValue
        .find((id: string) => !additionIdsFieldChange.previousValue.includes(id))
      return [true, addedId]
    }
  }
  return [false]
}

function isEditRideFor(rideId: string, change: FieldChange | GroupedFieldChanges): boolean {
  return !Array.isArray(change)
    && change.path.startsWith(`/rides/entities/${rideId}`)
    && numberOfSlashes(change.path) > 3
}

function isRemovedRideFor(rideId: string, change: FieldChange | GroupedFieldChanges): boolean {
  return Array.isArray(change)
    && change.some(c =>
      c.path === '/rides/ids'
      && c.previousValue.length > c.newValue.length
      && !c.newValue.includes(rideId)
      && c.previousValue.includes(rideId)
    )
}

function isAddedRideFor(rideId: string, change: FieldChange | GroupedFieldChanges): boolean {
  return Array.isArray(change)
    && change.some(c =>
      c.path === '/rides/ids'
      && c.previousValue.length < c.newValue.length
      && !c.previousValue.includes(rideId)
      && c.newValue.includes(rideId)
    )
}

function CalculateOperationFromRefreshedFieldChange(
  change: FieldChange | GroupedFieldChanges,
  currentVsPreviousVersion: (FieldChange | GroupedFieldChanges)[],
  remoteVsPreviousVersion: (FieldChange | GroupedFieldChanges)[]
): Operation {
  const isRemoveRideResult = isRemovedRide(change)
  if (isRemoveRideResult[0]) {
    const removedRideId = isRemoveRideResult[1]
    if (currentVsPreviousVersion.some(cs => isEditRideFor(removedRideId, cs))) {
      return {
        type: 'conflict' as const,
        fieldChanges: [change].flat(),
        conflictName: 'Remove ride',
        conflictApplied: true,
        applied: true
      }
    } else if (remoteVsPreviousVersion.some(cs => isRemovedRideFor(removedRideId, cs))) {
      return {
        type: 'merge' as const,
        fieldChanges: [change].flat(),
        applied: true
      }
    } else {
      return {
        type: 'reverse local' as const,
        fieldChanges: [change].flat(),
        applied: false
      }
    }
  }
  if (isMovedRides(change)) {
    if (remoteVsPreviousVersion.some(cs => isMovedRides(cs))
      && currentVsPreviousVersion.some(cs => isMovedRides(cs))) {
      return {
        type: 'conflict' as const,
        fieldChanges: [change].flat(),
        conflictName: 'Move rides',
        conflictApplied: true,
        applied: true
      }
    } else if (remoteVsPreviousVersion.some(cs => isMovedRides(cs))) {
      return {
        type: 'merge' as const,
        fieldChanges: [change].flat(),
        applied: true
      }
    } else {
      return {
        type: 'reverse local' as const,
        fieldChanges: [change].flat(),
        applied: false
      }
    }
  }
  const isAddedRideResult = isAddedRide(change)
  if (isAddedRideResult[0]) {
    const addedRideId = isAddedRideResult[1]
    if (remoteVsPreviousVersion.some(cs => isEditRideFor(addedRideId, cs))) {
      return {
        type: 'conflict' as const,
        fieldChanges: [change].flat(),
        conflictName: 'Reverse delete ride',
        conflictApplied: true,
        applied: true
      }
    } else if (remoteVsPreviousVersion.some(cs => isAddedRideFor(addedRideId, cs))) {
      return {
        type: 'merge' as const,
        fieldChanges: [change].flat(),
        applied: true
      }
    } else {
      return {
        type: 'reverse local' as const,
        fieldChanges: [change].flat(),
        applied: false
      }
    }
  }

  // changes not related to rideIds
  const fieldChange = change as FieldChange
  if (!currentVsPreviousVersion.flat().some(c => c.path === fieldChange.path)) {
    // remote activity changed and there are no local edits
    return {
      type: 'merge' as const,
      fieldChanges: [fieldChange],
      applied: true
    }
  }
  else if (remoteVsPreviousVersion.flat().some(c => c.path === fieldChange.path)) {
    // remote activity and local both changed
    return {
      type: 'conflict' as const,
      fieldChanges: [fieldChange],
      conflictName: calculateStepName([fieldChange]),
      conflictApplied: true,
      applied: true
    }
  }
  else {
    // only local changed
    return {
      type: 'reverse local' as const,
      fieldChanges: [fieldChange],
      applied: false
    }
  }
}

export function CalculateRefreshedStep(
  previousVersionFormData: FormData,
  localFormData: FormData,
  remoteActivity: ActivityWithDetailFromStore,
  discardLocalChanges: boolean
): Step | undefined {
  const remoteFormData = ActivityToFormData(remoteActivity)

  const remoteVsLocal = getFieldChanges(localFormData, remoteFormData)
  const currentVsPreviousVersion = getFieldChanges(previousVersionFormData, localFormData)
  const remoteVsPreviousVersion = getFieldChanges(previousVersionFormData, remoteFormData)

  const operations: Operation[] = []

  for (const change of remoteVsLocal) {
    const operation = CalculateOperationFromRefreshedFieldChange(
      change,
      currentVsPreviousVersion,
      remoteVsPreviousVersion)
    operations.push(operation)
  }

  // remove this?
  if (operations.length === 0) {
    return undefined
  }
  return {
    name: 'Refreshed',
    operations,
    versionToken: remoteActivity.versionToken,
    mergeBehaviour: discardLocalChanges ? 'discard local changes' : 'merge',
  }
}
//#endregion Refreshed Step