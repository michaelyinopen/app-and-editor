import { produce } from "immer"
import type {
  FieldChange,
  FormData,
  Step,
  CollectionAddChange,
  CollectionRemoveChange,
} from './types'
import { numberOfSlashes } from "./StepCommon"

export type RideIdAdjust = {
  type: 'remove' | 'add',
  id: string,
  index: number,
}

function redoFieldChange(fieldChange: FieldChange, formData: FormData): FormData {
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

// if there is a move field change, use the move's newValue, then redo add, and reverse unapplied remove
// if there is not a move field change, apply the adds and removes, while adjust the indices for unapplied changes
function redoRideIdFieldChanges(
  formData: FormData,
  rideIdFieldChangeApplies: { fieldChange: FieldChange, applied: boolean }[]
): FormData {
  if (rideIdFieldChangeApplies.length === 0) {
    return formData
  }
  const appliedMoveFieldChangeIndex = rideIdFieldChangeApplies
    .findIndex(ca => ca.fieldChange.collectionChange?.type === 'move' && ca.applied)
  let rideIds: string[]
  if (appliedMoveFieldChangeIndex === -1) {
    rideIds = formData.rides.ids
  } else {
    const previousMoveRideIds: string[] = rideIdFieldChangeApplies[appliedMoveFieldChangeIndex].fieldChange.previousValue
    const newMoveRideIds: string[] = rideIdFieldChangeApplies[appliedMoveFieldChangeIndex].fieldChange.newValue
    rideIds = previousMoveRideIds.reduce(
      (accRideIds, pRid, index) => {
        // swap the moved items according to unaltered formData.ride.ids
        accRideIds[formData.rides.ids.indexOf(pRid)] = newMoveRideIds[index]
        return accRideIds
      },
      [...formData.rides.ids]
    )
  }
  let rideIdAdjusts: RideIdAdjust[] = []
  for (const { fieldChange, applied } of rideIdFieldChangeApplies) {
    const collectionChange = fieldChange.collectionChange
    if (applied) {
      // applied, apply fieldChange to rideIds
      if (collectionChange?.type === 'remove') {
        const removedRideId = collectionChange.id
        rideIds = rideIds.filter(rid => rid !== removedRideId)
      } else if (collectionChange?.type === 'add') {
        const removeAdjustsOffset = rideIdAdjusts
          .filter(a => a.type === 'remove' && a.index <= collectionChange.index)
          .length
        const addAdjustsOffset = rideIdAdjusts.filter(a => a.type === 'add').length
        const accumulatedOffset = removeAdjustsOffset - addAdjustsOffset
        const addedRideIdIndex = collectionChange.index + accumulatedOffset
        rideIds = [
          ...rideIds.slice(0, addedRideIdIndex),
          collectionChange.id,
          ...rideIds.slice(addedRideIdIndex),
        ]
      }
    } else {
      // not applied, calculate rideIdAdjusts
      if (collectionChange?.type === 'remove') {
        const accumulatedOffset = rideIdAdjusts.length
        const rideIdAdjust = {
          type: 'remove' as const,
          id: collectionChange.id,
          index: collectionChange.index + accumulatedOffset
        }
        rideIdAdjusts = [...rideIdAdjusts, rideIdAdjust]
      } else if (collectionChange?.type === 'add') {
        const removeAdjustsOffset = rideIdAdjusts
          .filter(a => a.type === 'remove' && a.index <= collectionChange.index)
          .length
        const addAdjustsOffset = rideIdAdjusts.filter(a => a.type === 'add').length
        const accumulatedOffset = removeAdjustsOffset - addAdjustsOffset
        const rideIdAdjust = {
          type: 'add' as const,
          id: collectionChange.id,
          index: collectionChange.index + accumulatedOffset
        }
        rideIdAdjusts = [...rideIdAdjusts, rideIdAdjust]
      }
    }
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
  let formData = previousFormData

  const fieldChangeApplied = step.operations
    .flatMap(op => op.fieldChanges.map(fc => ({ fieldChange: fc, applied: op.applied })))

  const rideIdFieldChanges = fieldChangeApplied.filter(ca => ca.fieldChange.path === '/rides/ids')
  formData = redoRideIdFieldChanges(formData, rideIdFieldChanges)

  const ordinaryFieldChanges = fieldChangeApplied.filter(ca => ca.fieldChange.path !== '/rides/ids')
  for (const { fieldChange, applied } of ordinaryFieldChanges) {
    if (applied) {
      formData = redoFieldChange(fieldChange, formData)
    }
  }
  return formData
}

function undoFieldChange(fieldChange: FieldChange, formData: FormData): FormData {
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

// if there is a move field change, use the move's previousValue, then undo remove
// if there is not a move field change, calcluate the adds and removes, while adjust the indices for unapplied changes
//     then undo the changes
function undoRideIdFieldChanges(
  formData: FormData,
  rideIdFieldChangeApplies: { fieldChange: FieldChange, applied: boolean }[]
): FormData {
  if (rideIdFieldChangeApplies.length === 0) {
    return formData
  }
  const appliedMoveFieldChangeIndex = rideIdFieldChangeApplies
    .findIndex(ca => ca.fieldChange.collectionChange?.type === 'move' && ca.applied)
  let rideIds: string[]
  if (appliedMoveFieldChangeIndex === -1) {
    rideIds = formData.rides.ids
  } else {
    const newMoveRideIds: string[] = rideIdFieldChangeApplies[appliedMoveFieldChangeIndex].fieldChange.newValue
    const previousMoveRideIds: string[] = rideIdFieldChangeApplies[appliedMoveFieldChangeIndex].fieldChange.previousValue
    rideIds = newMoveRideIds.reduce(
      (accRideIds, nRid, index) => {
        // swap the moved items according to unaltered formData.ride.ids
        accRideIds[formData.rides.ids.indexOf(nRid)] = previousMoveRideIds[index]
        return accRideIds
      },
      [...formData.rides.ids]
    )
  }

  // no move field change
  let removedIdAndIndices: { id: string, index: number }[] = []
  let addedIds: string[] = []
  let rideIdAdjusts: RideIdAdjust[] = []
  for (const { fieldChange, applied } of rideIdFieldChangeApplies) {
    const collectionChange = fieldChange.collectionChange
    if (applied) {
      // applied, apply fieldChange to rideIds
      if (collectionChange?.type === 'remove') {
        const accumulatedOffset = rideIdAdjusts.length
        const removedIdAndIndex = {
          id: collectionChange.id,
          index: collectionChange.index + accumulatedOffset
        }
        removedIdAndIndices = [removedIdAndIndex, ...removedIdAndIndices] // add to beginning
      } else if (collectionChange?.type === 'add') {
        addedIds = [...addedIds, collectionChange.id]
      }
    } else {
      // not applied, calculate rideIdAdjusts
      if (collectionChange?.type === 'remove') {
        const accumulatedOffset = rideIdAdjusts.length
        const rideIdAdjust = {
          type: 'remove' as const,
          id: collectionChange.id,
          index: collectionChange.index + accumulatedOffset
        }
        rideIdAdjusts = [...rideIdAdjusts, rideIdAdjust]
      } else if (collectionChange?.type === 'add') {
        const removeAdjustsOffset = rideIdAdjusts
          .filter(a => a.type === 'remove' && a.index <= collectionChange.index)
          .length
        const addAdjustsOffset = rideIdAdjusts.filter(a => a.type === 'add').length
        const accumulatedOffset = removeAdjustsOffset - addAdjustsOffset
        const rideIdAdjust = {
          type: 'add' as const,
          id: collectionChange.id,
          index: collectionChange.index + accumulatedOffset
        }
        rideIdAdjusts = [...rideIdAdjusts, rideIdAdjust]
      }
    }
  }
  rideIds = rideIds.filter(rid => !addedIds.includes(rid))
  for (const { id, index } of removedIdAndIndices) {
    rideIds = [
      ...rideIds.slice(0, index),
      id,
      ...rideIds.slice(index),
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
  let formData = previousFormData

  const fieldChangeApplied = step.operations
    .flatMap(op => op.fieldChanges.map(fc => ({ fieldChange: fc, applied: op.applied })))

  const rideIdFieldChanges = fieldChangeApplied.filter(ca => ca.fieldChange.path === '/rides/ids')
  formData = undoRideIdFieldChanges(formData, rideIdFieldChanges)

  const ordinaryFieldChanges = fieldChangeApplied.filter(ca => ca.fieldChange.path !== '/rides/ids')
  for (const { fieldChange, applied } of ordinaryFieldChanges) {
    if (applied) {
      formData = undoFieldChange(fieldChange, formData)
    }
  }
  return formData
}
