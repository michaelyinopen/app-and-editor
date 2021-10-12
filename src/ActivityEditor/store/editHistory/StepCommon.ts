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
  if (a == null || b == null) return false
  if (a.length !== b.length) return false

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true
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

    let rideFieldChanges: Array<FieldChange | GroupedFieldChanges> = [];

    (function removeRideFieldChanges() {
      const previousRideIdAndIndices: Array<{ id: string, index: number }> =
        previousRideIds.map((id, index) => ({ id, index }))
      const removedRideIds = previousRideIds.filter(pRId => !currentRideIds.includes(pRId))
      for (const removedRideId of removedRideIds) {
        const removedIdIndex = previousRideIdAndIndices.find(i => i.id === removedRideId)
        const idFieldChange = {
          path: '/rides/ids',
          collectionChange: {
            type: 'remove' as const,
            id: removedRideId,
            index: removedIdIndex!.index
          }
        }
        const entityFieldChange = {
          path: `/rides/entities/${removedRideId}`,
          previousValue: previousFormData.rides.entities[removedRideId],
          newValue: undefined
        }
        rideFieldChanges.push([idFieldChange, entityFieldChange])
      }
    })();

    (function moveRideFieldChanges() {
      // rides that are not added or removed
      const correspondingPreviousRideIds = previousRideIds.filter(cRId => currentRideIds.includes(cRId))
      const correspondingCurrentRideIds = currentRideIds.filter(cRId => previousRideIds.includes(cRId))
      if (!arraysEqual(correspondingPreviousRideIds, correspondingCurrentRideIds)) {
        rideFieldChanges.push({
          path: '/rides/ids',
          collectionChange: {
            type: 'move' as const,
            previousValue: correspondingPreviousRideIds,
            newValue: correspondingCurrentRideIds,
          }
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

    (function addRideFieldChanges() {
      const correspondingCurrentRideIds = currentRideIds.filter(cRId => previousRideIds.includes(cRId))
      // currentIds with index of the previous position before any removal
      const referenceRideIdIndices: Array<{ id: string, index: number }> =
        previousRideIds
          .map((id, index) => ({ id, index }))
          .filter(pIdIndex => currentRideIds.includes(pIdIndex.id))
          .map((pIdIndex, j) => ({
            id: correspondingCurrentRideIds[j],
            index: pIdIndex.index
          }))

      let addedRideIdIndices: Array<{ id: string, index: number | 'beginning', subindex: number }> = []
      let currentIndex: number | 'beginning' = 'beginning'
      let subindex = 0
      for (const currentRideId of currentRideIds) {
        const matchingReference = referenceRideIdIndices.find(rIdIndex => rIdIndex.id === currentRideId)
        if (matchingReference) {
          currentIndex = matchingReference.index
          subindex = 0
        } else {
          addedRideIdIndices.push({
            id: currentRideId,
            index: currentIndex,
            subindex
          })
          subindex = subindex + 1
        }
      }

      for (const { id: addedId, index, subindex } of addedRideIdIndices) {
        const idFieldChange = {
          path: '/rides/ids',
          collectionChange: {
            type: 'add' as const,
            id: addedId,
            position: {
              index: index,
              subindex: subindex
            }

          }
        }
        const entityFieldChange = {
          path: `/rides/entities/${addedId}`,
          previousValue: undefined,
          newValue: currentFormData.rides.entities[addedId]
        }
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
    return ''
  }

  if (fieldChanges.length === 2 && fieldChanges.some(c => c.path === '/rides/ids')) {
    const idsChange = fieldChanges.find(c => c.path === '/rides/ids')!
    if (idsChange && 'collectionChange' in idsChange && idsChange.collectionChange.type === 'add') {
      return 'Add ride'
    }
    if (idsChange && 'collectionChange' in idsChange && idsChange.collectionChange.type === 'remove') {
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
