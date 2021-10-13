import { produce, isDraft, current } from "immer"
import type {
  FormData,
  Step,
  ValueFieldChange,
  CollectionFieldChange,
  CollectionMoveChange,
  CollectionAddChange,
  CollectionRemoveChange,
} from './types'
import { numberOfSlashes } from "./StepCommon"

function groupby<T, K extends string | number>(
  array: T[],
  f: (item: T) => K
): { [key in K]: T[] } {
  return array.reduce(function (rv, x) {
    (rv[f(x)] = rv[f(x)] || []).push(x)
    return rv
  }, {} as { [key in K]: T[] })
}

function redoFieldChange(fieldChange: ValueFieldChange, formData: FormData): FormData {
  const { path, newValue } = fieldChange
  if (path === '/name') {
    return {
      ...formData,
      name: newValue
    }
  }
  else if (path === '/who') {
    return {
      ...formData,
      who: newValue
    }
  }
  else if (path === '/where') {
    return {
      ...formData,
      where: newValue
    }
  }
  else if (path === '/howMuch') {
    return {
      ...formData,
      howMuch: newValue
    }
  }
  else if (path.startsWith('/rides/entities/') && numberOfSlashes(path) === 3) {
    const rideId = path.substring('/rides/entities/'.length)
    if (newValue === undefined) {
      let newRideEntities = { ...formData.rides.entities }
      delete newRideEntities[rideId]
      return {
        ...formData,
        rides: {
          ...formData.rides,
          entities: newRideEntities
        }
      }
    } else {
      return {
        ...formData,
        rides: {
          ...formData.rides,
          entities: {
            ...formData.rides.entities,
            [rideId]: newValue
          }
        }
      }
    }
  }
  else if (path.startsWith('/rides/entities/') && path.endsWith('description')) {
    const rideId = path.substring('/rides/entities/'.length, path.length - 'description'.length - 1)
    return {
      ...formData,
      rides: {
        ...formData.rides,
        entities: {
          ...formData.rides.entities,
          [rideId]: {
            ...formData.rides.entities[rideId],
            description: newValue
          }
        }
      }
    }
  }
  return formData
}

function redoRideIdFieldChanges(
  formData: FormData,
  rideIdFieldChangeApplies: { fieldChange: CollectionFieldChange, applied: boolean }[]
): FormData {
  if (rideIdFieldChangeApplies.length === 0) {
    return formData
  }

  let rideIds: string[]

  // move
  const appliedMoveFieldChangeIndex = rideIdFieldChangeApplies
    .findIndex(ca => ca.fieldChange.collectionChange?.type === 'move' && ca.applied)
  if (appliedMoveFieldChangeIndex === -1) {
    rideIds = formData.rides.ids
  } else {
    const previousMoveRideIds: string[] =
      (rideIdFieldChangeApplies[appliedMoveFieldChangeIndex].fieldChange.collectionChange as CollectionMoveChange).previousValue
    const newMoveRideIds: string[] =
      (rideIdFieldChangeApplies[appliedMoveFieldChangeIndex].fieldChange.collectionChange as CollectionMoveChange).newValue
    rideIds = previousMoveRideIds.reduce(
      (accRideIds, pRid, index) => {
        // swap the moved items according to unaltered originalFormData.ride.ids
        accRideIds[formData.rides.ids.indexOf(pRid)] = newMoveRideIds[index]
        return accRideIds
      },
      [...formData.rides.ids]
    )
  }

  // add
  const appliedCollectionAddChanges = rideIdFieldChangeApplies
    .filter(ca => ca.applied && ca.fieldChange.collectionChange?.type === 'add')
    .map(ca => ca.fieldChange.collectionChange as CollectionAddChange)
  if (appliedCollectionAddChanges.length > 0) {
    let rideIdsWithAdd: string[] = []
    const rideIdAndIndices: Array<{ id: string, index: number }> =
      rideIds.map((id, index) => ({ id, index }))
    const groupedAddChanges = groupby(appliedCollectionAddChanges, c => c.position.index)
    for (const change of groupedAddChanges['beginning'] ?? []) {
      rideIdsWithAdd.push(change.id)
    }
    for (const { id, index } of rideIdAndIndices) {
      rideIdsWithAdd.push(id)
      for (const change of groupedAddChanges[index] ?? []) {
        rideIdsWithAdd.push(change.id)
      }
    }
    rideIds = rideIdsWithAdd
  }

  // remove
  const appliedCollectionRemoveChanges = rideIdFieldChangeApplies
    .filter(ca => ca.applied && ca.fieldChange.collectionChange?.type === 'remove')
    .map(ca => ca.fieldChange.collectionChange as CollectionRemoveChange)
  for (const removeChange of appliedCollectionRemoveChanges) {
    rideIds = rideIds.filter(id => id !== removeChange.id)
  }

  return {
    ...formData,
    rides: {
      ...formData.rides,
      ids: rideIds
    }
  }
}

export function redoStep(step: Step, previousFormData: FormData): FormData {
  let formData = isDraft(previousFormData)
    ? current(previousFormData)
    : previousFormData

  const fieldChangeApplied = step.operations
    .flatMap(op => op.fieldChanges.map(fc => ({ fieldChange: fc, applied: op.applied })))

  const rideIdFieldChanges = fieldChangeApplied
    .filter(ca => ca.fieldChange.path === '/rides/ids') as { fieldChange: CollectionFieldChange, applied: boolean }[]
  formData = redoRideIdFieldChanges(formData, rideIdFieldChanges)

  const ordinaryFieldChanges = fieldChangeApplied.filter(ca => ca.fieldChange.path !== '/rides/ids')
  for (const { fieldChange, applied } of ordinaryFieldChanges) {
    if (applied) {
      formData = redoFieldChange(fieldChange as ValueFieldChange, formData)
    }
  }
  return formData
}

function undoFieldChange(fieldChange: ValueFieldChange, formData: FormData): FormData {
  const { path, previousValue } = fieldChange
  if (path === '/name') {
    return {
      ...formData,
      name: previousValue
    }
  }
  else if (path === '/who') {
    return {
      ...formData,
      who: previousValue
    }
  }
  else if (path === '/where') {
    return {
      ...formData,
      where: previousValue
    }
  }
  else if (path === '/howMuch') {
    return {
      ...formData,
      howMuch: previousValue
    }
  }
  else if (path.startsWith('/rides/entities/') && numberOfSlashes(path) === 3) {
    const rideId = path.substring('/rides/entities/'.length)
    if (previousValue === undefined) {
      let newRideEntities = { ...formData.rides.entities }
      delete newRideEntities[rideId]
      return {
        ...formData,
        rides: {
          ...formData.rides,
          entities: newRideEntities
        }
      }
    } else {
      return {
        ...formData,
        rides: {
          ...formData.rides,
          entities: {
            ...formData.rides.entities,
            [rideId]: previousValue
          }
        }
      }
    }
  }
  else if (path.startsWith('/rides/entities/') && path.endsWith('description')) {
    const rideId = path.substring('/rides/entities/'.length, path.length - 'description'.length - 1)
    return {
      ...formData,
      rides: {
        ...formData.rides,
        entities: {
          ...formData.rides.entities,
          [rideId]: {
            ...formData.rides.entities[rideId],
            description: previousValue
          }
        }
      }
    }
  }
  return formData
}

function undoRideIdFieldChanges(
  formData: FormData,
  rideIdFieldChangeApplies: { fieldChange: CollectionFieldChange, applied: boolean }[]
): FormData {
  if (rideIdFieldChangeApplies.length === 0) {
    return formData
  }
  let rideIds: string[]

  // undo move
  const appliedMoveFieldChangeIndex = rideIdFieldChangeApplies
    .findIndex(ca => ca.fieldChange.collectionChange?.type === 'move' && ca.applied)
  if (appliedMoveFieldChangeIndex === -1) {
    rideIds = formData.rides.ids
  } else {
    const newMoveRideIds: string[] =
      (rideIdFieldChangeApplies[appliedMoveFieldChangeIndex].fieldChange.collectionChange as CollectionMoveChange).newValue
    const previousMoveRideIds: string[] =
      (rideIdFieldChangeApplies[appliedMoveFieldChangeIndex].fieldChange.collectionChange as CollectionMoveChange).previousValue
    rideIds = newMoveRideIds.reduce(
      (accRideIds, nRid, index) => {
        // swap the moved items according to unaltered originalFormData.ride.ids
        accRideIds[formData.rides.ids.indexOf(nRid)] = previousMoveRideIds[index]
        return accRideIds
      },
      [...formData.rides.ids]
    )
  }

  // undo add
  const appliedCollectionAddChanges = rideIdFieldChangeApplies
    .filter(ca => ca.applied && ca.fieldChange.collectionChange?.type === 'add')
    .map(ca => ca.fieldChange.collectionChange as CollectionAddChange)
  for (const addChange of appliedCollectionAddChanges) {
    rideIds = rideIds.filter(id => id !== addChange.id)
  }

  // undo remove
  const appliedCollectionRemoveChanges = rideIdFieldChangeApplies
    .filter(ca => ca.applied && ca.fieldChange.collectionChange?.type === 'remove')
    .map(ca => ca.fieldChange.collectionChange as CollectionRemoveChange)
  for (const removeChange of appliedCollectionRemoveChanges) {
    rideIds = [
      ...rideIds.slice(0, removeChange.index),
      removeChange.id,
      ...rideIds.slice(removeChange.index),
    ]
  }

  return {
    ...formData,
    rides: {
      ...formData.rides,
      ids: rideIds
    }
  }
}

export function undoStep(step: Step, previousFormData: FormData): FormData {
  let formData = isDraft(previousFormData)
    ? current(previousFormData)
    : previousFormData

  const fieldChangeApplied = step.operations
    .flatMap(op => op.fieldChanges.map(fc => ({ fieldChange: fc, applied: op.applied })))

  const rideIdFieldChanges = fieldChangeApplied
    .filter(ca => ca.fieldChange.path === '/rides/ids') as { fieldChange: CollectionFieldChange, applied: boolean }[]
  formData = undoRideIdFieldChanges(formData, rideIdFieldChanges)

  const ordinaryFieldChanges = fieldChangeApplied.filter(ca => ca.fieldChange.path !== '/rides/ids')
  for (const { fieldChange, applied } of ordinaryFieldChanges) {
    if (applied) {
      formData = undoFieldChange(fieldChange as ValueFieldChange, formData)
    }
  }
  return formData
}
