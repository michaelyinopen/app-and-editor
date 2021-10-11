import { ActivityWithDetailFromStore } from "../actions"
import {
  FormData,
  FieldChange,
  GroupedFieldChanges,
  Operation,
  Step,
  CollectionRemoveChange,
  CollectionAddChange,
} from './types'
import {
  calculateStepName,
  getFieldChanges,
  numberOfSlashes,
} from "./StepCommon"
import { CollectionFieldChange } from "."

export function ActivityToFormData(activity: ActivityWithDetailFromStore): FormData {
  return {
    name: activity.name,
    who: activity.person,
    where: activity.place,
    howMuch: activity.cost,
    rides: {
      ids: [...activity.rides]
        .sort((a, b) => a.sequence - b.sequence)
        .map(r => r.id),
      entities:
        Object.fromEntries(activity.rides.map(r => [
          r.id,
          {
            id: r.id,
            description: r.description
          }
        ]))
    }
  }
}

function isRemovedRide(change: FieldChange | GroupedFieldChanges): [true, string] | [false] {
  if (Array.isArray(change)) {
    const removalIdsFieldChange = change.find(c =>
      c.path === '/rides/ids'
      && 'collectionChange' in c
      && c.collectionChange?.type === 'remove') as CollectionFieldChange
    if (removalIdsFieldChange) {
      const removedId = (removalIdsFieldChange.collectionChange as CollectionRemoveChange).id
      return [true, removedId]
    }
  }
  return [false]
}

function isMovedRides(change: FieldChange | GroupedFieldChanges): boolean {
  return !Array.isArray(change) && change.path === '/rides/ids'
}

function isAddedRide(change: FieldChange | GroupedFieldChanges): [true, string] | [false] {
  if (Array.isArray(change)) {
    const additionIdsFieldChange = change.find(c =>
      c.path === '/rides/ids'
      && 'collectionChange' in c
      && c.collectionChange?.type === 'add') as CollectionFieldChange
    if (additionIdsFieldChange) {
      const addedId = (additionIdsFieldChange.collectionChange as CollectionAddChange).id
      return [true, addedId]
    }
  }
  return [false]
}

function isEditRideFor(rideId: string, change: FieldChange | GroupedFieldChanges): boolean {
  return !Array.isArray(change)
    && change.path.startsWith(`/rides/entities/${rideId}`)
    && numberOfSlashes(change.path) > 3
}

function isRemovedRideFor(rideId: string, change: FieldChange | GroupedFieldChanges): boolean {
  return Array.isArray(change)
    && change.some(c =>
      c.path === '/rides/ids'
      && 'collectionChange' in c
      && c.collectionChange?.type === 'remove'
      && c.collectionChange.id === rideId
    )
}

function isAddedRideFor(rideId: string, change: FieldChange | GroupedFieldChanges): boolean {
  return Array.isArray(change)
    && change.some(c =>
      c.path === '/rides/ids'
      && 'collectionChange' in c
      && c.collectionChange?.type === 'add'
      && c.collectionChange.id === rideId
    )
}

function calculateOperationFromRefreshedFieldChange(
  change: FieldChange | GroupedFieldChanges,
  currentVsPreviousVersion: (FieldChange | GroupedFieldChanges)[],
  remoteVsPreviousVersion: (FieldChange | GroupedFieldChanges)[]
): Operation {
  const isRemoveRideResult = isRemovedRide(change)
  if (isRemoveRideResult[0]) {
    const removedRideId = isRemoveRideResult[1]
    if (currentVsPreviousVersion.some(cs => isEditRideFor(removedRideId, cs))) {
      return {
        type: 'conflict' as const,
        fieldChanges: [change].flat(),
        conflictName: 'Remove ride',
        conflictApplied: true,
        applied: true
      }
    } else if (remoteVsPreviousVersion.some(cs => isRemovedRideFor(removedRideId, cs))) {
      return {
        type: 'merge' as const,
        fieldChanges: [change].flat(),
        applied: true
      }
    } else {
      return {
        type: 'reverse local' as const,
        fieldChanges: [change].flat(),
        applied: false
      }
    }
  }
  if (isMovedRides(change)) {
    if (remoteVsPreviousVersion.some(cs => isMovedRides(cs))
      && currentVsPreviousVersion.some(cs => isMovedRides(cs))) {
      return {
        type: 'conflict' as const,
        fieldChanges: [change].flat(),
        conflictName: 'Move rides',
        conflictApplied: true,
        applied: true
      }
    } else if (remoteVsPreviousVersion.some(cs => isMovedRides(cs))) {
      return {
        type: 'merge' as const,
        fieldChanges: [change].flat(),
        applied: true
      }
    } else {
      return {
        type: 'reverse local' as const,
        fieldChanges: [change].flat(),
        applied: false
      }
    }
  }
  const isAddedRideResult = isAddedRide(change)
  if (isAddedRideResult[0]) {
    const addedRideId = isAddedRideResult[1]
    if (remoteVsPreviousVersion.some(cs => isEditRideFor(addedRideId, cs))) {
      return {
        type: 'conflict' as const,
        fieldChanges: [change].flat(),
        conflictName: 'Reverse remove ride',
        conflictApplied: true,
        applied: true
      }
    } else if (remoteVsPreviousVersion.some(cs => isAddedRideFor(addedRideId, cs))) {
      return {
        type: 'merge' as const,
        fieldChanges: [change].flat(),
        applied: true
      }
    } else {
      return {
        type: 'reverse local' as const,
        fieldChanges: [change].flat(),
        applied: false
      }
    }
  }

  // changes not related to rideIds
  const fieldChange = change as FieldChange
  if (!currentVsPreviousVersion.flat().some(c => c.path === fieldChange.path)) {
    // remote activity changed and there are no local edits
    return {
      type: 'merge' as const,
      fieldChanges: [fieldChange],
      applied: true
    }
  }
  else if (remoteVsPreviousVersion.flat().some(c => c.path === fieldChange.path)) {
    // remote activity and local both changed
    return {
      type: 'conflict' as const,
      fieldChanges: [fieldChange],
      conflictName: calculateStepName([fieldChange]),
      conflictApplied: true,
      applied: true
    }
  }
  else {
    // only local changed
    return {
      type: 'reverse local' as const,
      fieldChanges: [fieldChange],
      applied: false
    }
  }
}

export function calculateRefreshedStep(
  previousVersionFormData: FormData,
  localFormData: FormData,
  remoteActivity: ActivityWithDetailFromStore
): Step | undefined {
  const remoteFormData = ActivityToFormData(remoteActivity)

  const remoteVsLocal = getFieldChanges(localFormData, remoteFormData)
  const currentVsPreviousVersion = getFieldChanges(previousVersionFormData, localFormData)
  const remoteVsPreviousVersion = getFieldChanges(previousVersionFormData, remoteFormData)

  const operations: Operation[] = []

  for (const change of remoteVsLocal) {
    const operation = calculateOperationFromRefreshedFieldChange(
      change,
      currentVsPreviousVersion,
      remoteVsPreviousVersion)
    operations.push(operation)
  }

  if (operations.length === 0) {
    return undefined
  }
  const mergeBehaviour = operations.some(op => op.type === 'reverse local' || op.type === 'conflict')
    ? 'merge'
    : 'discard local changes'
  return {
    name: 'Refreshed',
    operations,
    versionToken: remoteActivity.versionToken,
    mergeBehaviour,
  }
}