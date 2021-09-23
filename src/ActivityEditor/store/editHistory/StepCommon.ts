import type {
  FormData,
  FieldChange,
  GroupedFieldChanges
} from './types'

export function numberOfSlashes(value: string): number {
  return [...value].filter(c => c === '/').length
}

export function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function getFieldChanges(previousFormData: FormData, currentFormData: FormData): Array<FieldChange | GroupedFieldChanges> {
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

export function calculateStepName(fieldChanges: FieldChange[]): string {
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
