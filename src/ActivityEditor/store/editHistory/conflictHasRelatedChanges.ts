import {
  FieldChange,
  Operation,
  Step,
} from './types'

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