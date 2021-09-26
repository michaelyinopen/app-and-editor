import {
  FieldChange,
  Operation,
  Step,
} from './types'

//todo important add/delete and item update
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