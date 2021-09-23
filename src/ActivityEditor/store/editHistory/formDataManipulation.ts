import { produce } from "immer"
import type {
  FieldChange,
  FormData,
  Step,
} from './types'
import { numberOfSlashes } from "./StepCommon"

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
    if (fieldChange.path === '/rides/ids') {
      formData = undoFieldChange(fieldChange, formData, adjust)
      if (!applied) {
        adjust = calculateUndoAdjust(fieldChange, adjust)
      }
    } else {
      if (applied) {
        formData = undoFieldChange(fieldChange, formData, adjust)
      }
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
    if (fieldChange.path === '/rides/ids') {
      formData = redoFieldChange(fieldChange, formData, adjust)
      if (!applied) {
        adjust = calculateRedoAdjust(fieldChange, adjust)
      }
    } else {
      if (applied) {
        formData = redoFieldChange(fieldChange, formData, adjust)
      }
    }
  }
  return formData
}