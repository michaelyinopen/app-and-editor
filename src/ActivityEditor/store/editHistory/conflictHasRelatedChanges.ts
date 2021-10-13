import { numberOfSlashes } from './StepCommon'
import {
  CollectionAddChange,
  CollectionFieldChange,
  CollectionRemoveChange,
  FieldChange,
  Operation,
  Step,
} from './types'

function hasRelatedChanges(
  aChanges: FieldChange[],
  bChanges: FieldChange[]
): boolean {
  if (aChanges.some(ac => bChanges.some(bc => bc.path === ac.path))) {
    return true
  }
  // add or remove conflicts with update ride property
  const addOrRemoveRideAChanges = aChanges.filter(ac =>
    ac.path === '/rides/ids'
    && ('collectionChange' in ac && (ac.collectionChange?.type === 'add' || ac.collectionChange?.type === 'remove'))
  ) as CollectionFieldChange[]

  for (const aChange of addOrRemoveRideAChanges) {
    const aRideId = (aChange.collectionChange as (CollectionAddChange | CollectionRemoveChange)).id
    if (bChanges.some(bc =>
      bc.path.startsWith(`/rides/entities/${aRideId}`)
      && numberOfSlashes(bc.path) > 3
    )) {
      return true
    }
  }
  // edit ride property conflicts with add or remove
  const editRidePropertyAChanges = aChanges.filter(ac =>
    ac.path.startsWith('/rides/entities/')
    && numberOfSlashes(ac.path) > 3
  )
  for (const aChange of editRidePropertyAChanges) {
    const indexOf3rdSlash = '/rides/entities/'.length - 1
    const indexOf4thSlash = aChange.path.indexOf('/', indexOf3rdSlash + 1)
    const aRideId = aChange.path.substring(indexOf3rdSlash + 1, indexOf4thSlash)
    if (bChanges.some(bc =>
      'collectionChange' in bc
      && bc.collectionChange?.type === 'remove'
      && (bc.collectionChange as (CollectionRemoveChange)).id === aRideId
    )) {
      return true
    }
  }
  return false
}

export function conflictHasRelatedChanges(operation: Operation, step: Step): boolean {
  return hasRelatedChanges(
    operation.fieldChanges,
    step.operations.flatMap(op => op.fieldChanges)
  )
}