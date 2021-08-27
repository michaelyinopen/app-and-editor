export type State = {
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

export type Step = {
  name: string,
  operations: Operation[],
}

const defaultState = {
  name: '',
  who: '',
  where: '',
  howMuch: undefined,
}

function getFieldChanges(previousState: State, currentState: State): FieldChange[] {
  if (previousState === currentState) {
    return []
  }
  const fieldChanges: FieldChange[] = []
  if (previousState.name !== currentState.name) {
    fieldChanges.push({ path: '/name', previousValue: previousState.name, newValue: currentState.name })
  }
  if (previousState.who !== currentState.who) {
    fieldChanges.push({ path: '/who', previousValue: previousState.who, newValue: currentState.who })
  }
  if (previousState.where !== currentState.where) {
    fieldChanges.push({ path: '/where', previousValue: previousState.where, newValue: currentState.where })
  }
  if (previousState.howMuch !== currentState.howMuch) {
    fieldChanges.push({ path: '/howMuch', previousValue: previousState.howMuch, newValue: currentState.howMuch })
  }
  return fieldChanges
}

function mergeFieldChanges(a: FieldChange, b: FieldChange): Operation[] {
  return (a.path === b.path)
    ? a.previousValue === b.newValue
      ? [] // merged resulting in no-op
      : [b] // merged
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
    return 'Edit Name'
  }
  if (operation.path === '/who') {
    return 'Edit update'
  }
  if (operation.path === '/where') {
    return 'Edit update'
  }
  if (operation.path === '/howMuch') {
    return 'Edit How Much'
  }
  // should not reach here
  return ''
}

export function calculateSteps(
  previousStep: Step | undefined,
  previousState: State = defaultState,
  currentState: State)
  : Step[] {
  const fieldChanges = getFieldChanges(previousState, currentState)
  if (fieldChanges.length === 0) {
    return previousStep ? [previousStep] : []
  }
  if (!previousStep || previousStep.operations.length !== 1 || fieldChanges.length !== 1) {
    const name = calculateStepName(fieldChanges)
    const newStep = {
      name,
      operations: fieldChanges
    }
    return previousStep ? [previousStep, newStep] : [newStep]
  } else {
    // previousStep && previousOperations.length === 1 && fieldChanges.length === 1
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
}