export type FormData = {
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

const defaultFormData = {
  name: '',
  who: '',
  where: '',
  howMuch: undefined,
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
  return fieldChanges
}

function mergeFieldChanges(a: FieldChange, b: FieldChange): Operation[] {
  return (a.path === b.path)
    ? a.previousValue === b.newValue
      ? [] // merged resulting in no-op
      : [{ path: a.path, previousValue: a.previousValue, newValue: b.newValue }] // merged
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
    return 'Edit name'
  }
  if (operation.path === '/who') {
    return 'Edit who'
  }
  if (operation.path === '/where') {
    return 'Edit where'
  }
  if (operation.path === '/howMuch') {
    return 'Edit how much'
  }
  // should not reach here
  return ''
}

export function calculateSteps(
  previousStep: Step | undefined,
  previousFormData: FormData = defaultFormData,
  currentFormData: FormData)
  : Step[] {
  const fieldChanges = getFieldChanges(previousFormData, currentFormData)
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