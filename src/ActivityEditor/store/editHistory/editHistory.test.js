
import { createStore, applyMiddleware } from "redux";
import {
  setActivityEditorId,
  setActivityEditorIsEdit,
  loadedActivity,
  setActivityFromAppStore,
  setName,
  setWho,
  undo,
  redo,
  setMergeBehaviourDiscardLocal,
  applyConflict,
  unApplyConflict,
  addRide,
  setRideDescription,
  removeRide,
  moveRide,
} from "../actions";
import { activityEditorReducer } from "../activityEditorReducer";
import { editHistoryMiddleware } from './editStep'
import { conflictHasRelatedChanges } from './conflictHasRelatedChanges'

describe('Edit Name', () => {
  const createLoadedAppStore = () => {
    const activityEditorStore = createStore(
      activityEditorReducer,
      applyMiddleware(editHistoryMiddleware)
    )
    activityEditorStore.dispatch(setActivityEditorId(1))
    activityEditorStore.dispatch(setActivityEditorIsEdit(true))
    activityEditorStore.dispatch(loadedActivity())

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity",
        versionToken: "1",
        person: "some person",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 1
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 2
          }
        ],
        hasDetail: true,
      },
      true
    ))
    return activityEditorStore
  }
  test('Loaded from App Store', () => {
    const activityEditorStore = createLoadedAppStore()

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState).toEqual({
      id: 1,
      versions: [{
        versionToken: '1',
        formData: {
          name: 'some activity',
          who: "some person",
          where: "some place",
          howMuch: 99,
          rides: {
            ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
            entities: {
              "GFqbzNATDKY8pKRAZV3ko": {
                id: "GFqbzNATDKY8pKRAZV3ko",
                description: "red car"
              },
              "zUxqlLLtWWjOdvHfAa1Vx": {
                id: "zUxqlLLtWWjOdvHfAa1Vx",
                description: "ferry"
              },
            }
          },
        }
      }],
      isEdit: true,
      hasDetail: true,
      loadStatus: 'loaded',
      initialized: true,
      formData: {
        name: 'some activity',
        who: "some person",
        where: "some place",
        howMuch: 99,
        rides: {
          ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
          entities: {
            "GFqbzNATDKY8pKRAZV3ko": {
              id: "GFqbzNATDKY8pKRAZV3ko",
              description: "red car"
            },
            "zUxqlLLtWWjOdvHfAa1Vx": {
              id: "zUxqlLLtWWjOdvHfAa1Vx",
              description: "ferry"
            },
          }
        },
      },
      steps: [{ name: 'initial', operations: [] }],
      currentStepIndex: 0
    })
  })
  test('Edit', () => {
    const activityEditorStore = createLoadedAppStore()

    // act
    activityEditorStore.dispatch(setName('some activity edited'))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.name).toEqual('some activity edited')
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Edit name',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity edited'
              }
            ],
            applied: true
          }
        ]
      },
    ])
  })
  test('Combine Edits', () => {
    const activityEditorStore = createLoadedAppStore()
    activityEditorStore.dispatch(setName('some activity edited'))

    // act
    activityEditorStore.dispatch(setName('some activity edited 2'))
    activityEditorStore.dispatch(setWho('some person also edited'))
    activityEditorStore.dispatch(setName('some activity edited 3'))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.name).toEqual('some activity edited 3')
    expect(actualState.formData.who).toEqual("some person also edited")
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      { // this step is combined
        name: 'Edit name',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity edited 2'
              }
            ],
            applied: true
          }
        ]
      },
      { // does not combine if unrelated
        name: 'Edit who',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/who',
                previousValue: 'some person',
                newValue: 'some person also edited'
              }
            ],
            applied: true
          }
        ]
      },
      { // does not combine because PREVIOUS step is unrelated
        name: 'Edit name',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity edited 2',
                newValue: 'some activity edited 3'
              }
            ],
            applied: true
          }
        ]
      },
    ])
  })
  test('Undo Redo', () => {
    const activityEditorStore = createLoadedAppStore()
    activityEditorStore.dispatch(setName('some activity edited'))

    // act Undo
    activityEditorStore.dispatch(undo())

    // assert Undo
    const actualUndoState = activityEditorStore.getState()
    expect(actualUndoState.formData.name).toEqual('some activity')
    expect(actualUndoState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Edit name',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity edited'
              }
            ],
            applied: true
          }
        ]
      },
    ])
    expect(actualUndoState.currentStepIndex).toBe(0)

    // act Redo
    activityEditorStore.dispatch(redo())

    // assert Redo
    const actualRedoState = activityEditorStore.getState()
    expect(actualRedoState.formData.name).toEqual('some activity edited')
    expect(actualRedoState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Edit name',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity edited'
              }
            ],
            applied: true
          }
        ]
      },
    ])
    expect(actualRedoState.currentStepIndex).toBe(1)
  })
  test('Refreshed unchanged, local edit', () => {
    // will not create any new step
    const activityEditorStore = createLoadedAppStore()
    activityEditorStore.dispatch(setName('some activity local edited'))

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity",
        versionToken: "1",
        person: "some person",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 1
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 2
          }
        ],
        hasDetail: true,
      },
      true
    ))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.name).toEqual('some activity local edited')
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Edit name',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity local edited'
              }
            ],
            applied: true
          }
        ]
      },
    ])
  })
  test('Refreshed only remote edit', () => {
    // will create a refreshed step
    const activityEditorStore = createLoadedAppStore()

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity remote edited",
        versionToken: "2",
        person: "some person",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 1
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 2
          }
        ],
        hasDetail: true,
      },
      true
    ))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.name).toEqual('some activity remote edited')
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Refreshed',
        operations: [
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity remote edited'
              }
            ],
            applied: true
          }
        ],
        versionToken: '2',
        mergeBehaviour: 'discard local changes',
      },
    ])
    expect(actualState.currentStepIndex).toBe(1)
    expect(actualState.versions).toEqual([{
      versionToken: '1',
      formData: {
        name: 'some activity',
        who: "some person",
        where: "some place",
        howMuch: 99,
        rides: {
          ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
          entities: {
            "GFqbzNATDKY8pKRAZV3ko": {
              id: "GFqbzNATDKY8pKRAZV3ko",
              description: "red car"
            },
            "zUxqlLLtWWjOdvHfAa1Vx": {
              id: "zUxqlLLtWWjOdvHfAa1Vx",
              description: "ferry"
            },
          }
        },
      }
    },
    {
      versionToken: '2',
      formData: {
        name: 'some activity remote edited',
        who: "some person",
        where: "some place",
        howMuch: 99,
        rides: {
          ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
          entities: {
            "GFqbzNATDKY8pKRAZV3ko": {
              id: "GFqbzNATDKY8pKRAZV3ko",
              description: "red car"
            },
            "zUxqlLLtWWjOdvHfAa1Vx": {
              id: "zUxqlLLtWWjOdvHfAa1Vx",
              description: "ferry"
            },
          }
        },
      }
    }])
  })
  test('Refreshed merge local edit', () => {
    // if 'name' was edited locally but not remotely
    // Merge will keep both local and remote changes if there is no conflict
    const activityEditorStore = createLoadedAppStore()
    activityEditorStore.dispatch(setName('some activity local edited'))

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity",
        versionToken: "2",
        person: "some person unrelated update",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 1
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 2
          }
        ],
        hasDetail: true,
      },
      true
    ))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.name).toEqual('some activity local edited')
    expect(actualState.formData.who).toEqual("some person unrelated update")
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Edit name',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity local edited'
              }
            ],
            applied: true
          }
        ]
      },
      {
        name: 'Refreshed',
        versionToken: '2',
        mergeBehaviour: 'merge',
        operations: [
          {
            type: 'reverse local',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity local edited',
                newValue: 'some activity'
              }
            ],
            applied: false
          },
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/who',
                previousValue: 'some person',
                newValue: 'some person unrelated update'
              }
            ],
            applied: true
          }
        ]
      },
    ])
    expect(actualState.currentStepIndex).toBe(2)
    expect(actualState.versions.length).toEqual(2)
  })
  test('Discard local changes', () => {
    // if 'name' was edited locally but not remotely
    // Discard local changes will revert 'name' to its remote state
    const activityEditorStore = createLoadedAppStore()
    activityEditorStore.dispatch(setName('some activity local edited'))
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity",
        versionToken: "2",
        person: "some person unrelated update",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 1
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 2
          }
        ],
        hasDetail: true,
      },
      true
    ))

    // act
    activityEditorStore.dispatch(setMergeBehaviourDiscardLocal(2))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.name).toEqual('some activity')
    expect(actualState.formData.who).toEqual("some person unrelated update")
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Edit name',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity local edited'
              }
            ],
            applied: true
          }
        ]
      },
      {
        name: 'Refreshed',
        versionToken: '2',
        mergeBehaviour: 'discard local changes',
        operations: [
          {
            type: 'reverse local',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity local edited',
                newValue: 'some activity'
              }
            ],
            applied: true
          },
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/who',
                previousValue: 'some person',
                newValue: 'some person unrelated update'
              }
            ],
            applied: true
          }
        ]
      },
    ])
    expect(actualState.currentStepIndex).toBe(2)
    expect(actualState.versions.length).toEqual(2)
  })
  test('Refreshed local and remote same update', () => {
    // will update versions but will not create any new step
    const activityEditorStore = createLoadedAppStore()
    activityEditorStore.dispatch(setName('some activity edited'))

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity edited",
        versionToken: "2",
        person: "some person",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 1
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 2
          }
        ],
        hasDetail: true,
      },
      true
    ))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.name).toEqual("some activity edited")
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Edit name',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity edited'
              }
            ],
            applied: true
          }
        ]
      },
    ])
    expect(actualState.currentStepIndex).toBe(1)
    expect(actualState.versions.length).toEqual(2)
  })
  const createAppStoreWithConflict = () => {
    const activityEditorStore = createLoadedAppStore()
    activityEditorStore.dispatch(setName('some activity local edited'))

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        versionToken: "2",
        name: "some activity remote edited",
        person: "some person",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 1
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 2
          }
        ],
        hasDetail: true,
      },
      true
    ))
    return activityEditorStore
  }
  test('Refreshed local and remote conflicting edit', () => {
    // will create a refreshed step with conflict
    const activityEditorStore = createAppStoreWithConflict()

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.name).toEqual('some activity remote edited')
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Edit name',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity local edited'
              }
            ],
            applied: true
          }
        ]
      },
      {
        name: 'Refreshed',
        versionToken: '2',
        mergeBehaviour: 'merge',
        operations: [
          {
            type: 'conflict',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity local edited',
                newValue: 'some activity remote edited'
              }
            ],
            conflictName: 'Edit name',
            conflictApplied: true,
            applied: true
          }
        ]
      },
    ])
    expect(actualState.currentStepIndex).toBe(2)
    expect(actualState.versions.length).toEqual(2)
  })
  test('Unapply re-apply Conflict', () => {
    const activityEditorStore = createAppStoreWithConflict()

    //act unapply
    activityEditorStore.dispatch(unApplyConflict(2, 0))

    // assert unapply
    const unapplyState = activityEditorStore.getState()
    expect(unapplyState.formData.name).toEqual('some activity local edited')
    expect(unapplyState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Edit name',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity local edited'
              }
            ],
            applied: true
          }
        ]
      },
      {
        name: 'Refreshed',
        versionToken: '2',
        mergeBehaviour: 'merge',
        operations: [
          {
            type: 'conflict',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity local edited',
                newValue: 'some activity remote edited'
              }
            ],
            conflictName: 'Edit name',
            conflictApplied: false,
            applied: false
          }
        ]
      },
    ])
    expect(unapplyState.currentStepIndex).toBe(2)
    expect(unapplyState.versions.length).toEqual(2)

    //act re-apply
    activityEditorStore.dispatch(applyConflict(2, 0))

    // assert re-apply
    const reapplyState = activityEditorStore.getState()
    expect(reapplyState.formData.name).toEqual('some activity remote edited')
    expect(reapplyState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Edit name',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity local edited'
              }
            ],
            applied: true
          }
        ]
      },
      {
        name: 'Refreshed',
        versionToken: '2',
        mergeBehaviour: 'merge',
        operations: [
          {
            type: 'conflict',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity local edited',
                newValue: 'some activity remote edited'
              }
            ],
            conflictName: 'Edit name',
            conflictApplied: true,
            applied: true
          }
        ]
      },
    ])
    expect(reapplyState.currentStepIndex).toBe(2)
    expect(reapplyState.versions.length).toEqual(2)
  })
  test('Conflict has related change', () => {
    const activityEditorStore = createAppStoreWithConflict()
    const conflictStepIndex = 2
    const conflictIndex = 0

    // edit
    activityEditorStore.dispatch(setName('some activity after'))
    const editState = activityEditorStore.getState()
    const editConflictOperation = editState.steps[conflictStepIndex].operations
      .filter(op => op.type === 'conflict')[conflictIndex]
    const editHasRelatedChanges = (() => {
      for (const step of editState.steps.slice(
        conflictStepIndex + 1,
        editState.currentStepIndex + 1
      )) {
        const stepResult = conflictHasRelatedChanges(editConflictOperation, step)
        if (stepResult) {
          return true
        }
      }
      return false
    })()

    // assert edit
    expect(editHasRelatedChanges).toBe(true)

    // undo edit
    activityEditorStore.dispatch(undo())
    const undoState = activityEditorStore.getState()
    const undoConflictOperation = undoState.steps[conflictStepIndex].operations
      .filter(op => op.type === 'conflict')[conflictIndex]
    const undoHasRelatedChanges = (() => {
      for (const step of undoState.steps.slice(
        conflictStepIndex + 1,
        undoState.currentStepIndex + 1
      )) {
        const stepResult = conflictHasRelatedChanges(undoConflictOperation, step)
        if (stepResult) {
          return true
        }
      }
      return false
    })()

    // assert undo edit
    expect(undoHasRelatedChanges).toBe(false)
  })
})

describe('Add Ride', () => {
  const createLoadedAppStore = () => {
    const activityEditorStore = createStore(
      activityEditorReducer,
      applyMiddleware(editHistoryMiddleware)
    )
    activityEditorStore.dispatch(setActivityEditorId(1))
    activityEditorStore.dispatch(setActivityEditorIsEdit(true))
    activityEditorStore.dispatch(loadedActivity())

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity",
        versionToken: "1",
        person: "some person",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 1
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 2
          }
        ],
        hasDetail: true,
      },
      true
    ))
    return activityEditorStore
  }
  test('Add', () => {
    const activityEditorStore = createLoadedAppStore()

    // act
    const addedRideAction = addRide()
    const addedRideId = addedRideAction.payload.id
    activityEditorStore.dispatch(addedRideAction)

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.rides).toEqual({
      ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx", addedRideId],
      entities: {
        "GFqbzNATDKY8pKRAZV3ko": {
          id: "GFqbzNATDKY8pKRAZV3ko",
          description: "red car"
        },
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
        [addedRideId]: {
          id: addedRideId,
          description: ""
        },
      }
    })
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Add ride',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'add',
                  id: addedRideId,
                  index: 2
                }
              },
              {
                path: `/rides/entities/${addedRideId}`,
                previousValue: undefined,
                newValue: {
                  id: addedRideId,
                  description: ""
                },
              }
            ],
            applied: true
          }
        ]
      },
    ])
  })
  test('Undo Redo Add', () => {
    const activityEditorStore = createLoadedAppStore()
    const addedRideAction = addRide()
    const addedRideId = addedRideAction.payload.id
    activityEditorStore.dispatch(addedRideAction)

    // act undo
    activityEditorStore.dispatch(undo())

    // assert undo
    const undoState = activityEditorStore.getState()
    expect(undoState.formData.rides).toEqual({
      ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
      entities: {
        "GFqbzNATDKY8pKRAZV3ko": {
          id: "GFqbzNATDKY8pKRAZV3ko",
          description: "red car"
        },
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        }
      }
    })
    expect(undoState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Add ride',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'add',
                  id: addedRideId,
                  index: 2
                }
              },
              {
                path: `/rides/entities/${addedRideId}`,
                previousValue: undefined,
                newValue: {
                  id: addedRideId,
                  description: ""
                },
              }
            ],
            applied: true
          }
        ]
      },
    ])
    expect(undoState.currentStepIndex).toBe(0)

    // act redo
    activityEditorStore.dispatch(redo())

    // assert redo
    const redoState = activityEditorStore.getState()
    expect(redoState.formData.rides).toEqual({
      ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx", addedRideId],
      entities: {
        "GFqbzNATDKY8pKRAZV3ko": {
          id: "GFqbzNATDKY8pKRAZV3ko",
          description: "red car"
        },
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
        [addedRideId]: {
          id: addedRideId,
          description: ""
        },
      }
    })
    expect(redoState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Add ride',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'add',
                  id: addedRideId,
                  index: 2
                }
              },
              {
                path: `/rides/entities/${addedRideId}`,
                previousValue: undefined,
                newValue: {
                  id: addedRideId,
                  description: ""
                },
              }
            ],
            applied: true
          }
        ]
      },
    ])
    expect(redoState.currentStepIndex).toBe(1)
  })
  test('Refreshed merge local Add', () => {
    const activityEditorStore = createLoadedAppStore()
    const addedRideAction = addRide()
    const addedRideId = addedRideAction.payload.id
    activityEditorStore.dispatch(addedRideAction)

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity unrelated change",
        versionToken: "2",
        person: "some person",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 1
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 2
          }
        ],
        hasDetail: true,
      },
      true
    ))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.name).toEqual('some activity unrelated change')
    expect(actualState.formData.rides).toEqual({
      ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx", addedRideId],
      entities: {
        "GFqbzNATDKY8pKRAZV3ko": {
          id: "GFqbzNATDKY8pKRAZV3ko",
          description: "red car"
        },
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
        [addedRideId]: {
          id: addedRideId,
          description: ""
        },
      }
    })
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Add ride',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'add',
                  id: addedRideId,
                  index: 2
                }
              },
              {
                path: `/rides/entities/${addedRideId}`,
                previousValue: undefined,
                newValue: {
                  id: addedRideId,
                  description: ""
                },
              }
            ],
            applied: true
          }
        ]
      },
      {
        name: 'Refreshed',
        operations: [
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity unrelated change'
              }
            ],
            applied: true
          },
          {
            type: 'reverse local',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'remove',
                  id: addedRideId,
                  index: 2
                }
              },
              {
                path: `/rides/entities/${addedRideId}`,
                previousValue: {
                  id: addedRideId,
                  description: ''
                },
                newValue: undefined
              }
            ],
            applied: false
          },
        ],
        versionToken: '2',
        mergeBehaviour: 'merge',
      },
    ])
    expect(actualState.currentStepIndex).toBe(2)
    expect(actualState.versions.length).toEqual(2)
  })
  test('Refreshed only remote Add', () => {
    const activityEditorStore = createLoadedAppStore()

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity unrelated change",
        versionToken: "2",
        person: "some person",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 1
          },
          {
            id: "Uho4iijucZABUUpPeg0cU",
            description: "bus",
            sequence: 2
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 3
          }
        ],
        hasDetail: true,
      },
      true
    ))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData).toEqual({
      name: 'some activity unrelated change',
      who: "some person",
      where: "some place",
      howMuch: 99,
      rides: {
        ids: ["GFqbzNATDKY8pKRAZV3ko", 'Uho4iijucZABUUpPeg0cU', "zUxqlLLtWWjOdvHfAa1Vx"],
        entities: {
          "GFqbzNATDKY8pKRAZV3ko": {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car"
          },
          'Uho4iijucZABUUpPeg0cU': {
            id: 'Uho4iijucZABUUpPeg0cU',
            description: "bus"
          },
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      },
    })
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Refreshed',
        operations: [
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity unrelated change'
              }
            ],
            applied: true
          },
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'add',
                  id: 'Uho4iijucZABUUpPeg0cU',
                  index: 1
                }
              },
              {
                path: '/rides/entities/Uho4iijucZABUUpPeg0cU',
                previousValue: undefined,
                newValue: {
                  id: 'Uho4iijucZABUUpPeg0cU',
                  description: 'bus'
                }
              }
            ],
            applied: true
          },
        ],
        versionToken: '2',
        mergeBehaviour: 'discard local changes',
      },
    ])
    expect(actualState.currentStepIndex).toBe(1)
    expect(actualState.versions.length).toEqual(2)
  })
})

describe('Edit Ride Property', () => {
  const createLoadedAppStore = () => {
    const activityEditorStore = createStore(
      activityEditorReducer,
      applyMiddleware(editHistoryMiddleware)
    )
    activityEditorStore.dispatch(setActivityEditorId(1))
    activityEditorStore.dispatch(setActivityEditorIsEdit(true))
    activityEditorStore.dispatch(loadedActivity())

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity",
        versionToken: "1",
        person: "some person",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 1
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 2
          }
        ],
        hasDetail: true,
      },
      true
    ))
    return activityEditorStore
  }
  test('Edit ride description', () => {
    const activityEditorStore = createLoadedAppStore()

    // act
    activityEditorStore.dispatch(setRideDescription('GFqbzNATDKY8pKRAZV3ko', 'big red car'))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.rides).toEqual({
      ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
      entities: {
        "GFqbzNATDKY8pKRAZV3ko": {
          id: "GFqbzNATDKY8pKRAZV3ko",
          description: "big red car"
        },
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
      }
    })
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Edit ride description',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko/description',
                previousValue: 'red car',
                newValue: 'big red car'
              }
            ],
            applied: true
          }
        ]
      },
    ])
  })
  test('Combine Edits', () => {
    const activityEditorStore = createLoadedAppStore()

    // act
    activityEditorStore.dispatch(setRideDescription('GFqbzNATDKY8pKRAZV3ko', 'b red car'))
    activityEditorStore.dispatch(setRideDescription('GFqbzNATDKY8pKRAZV3ko', 'bi red car'))
    activityEditorStore.dispatch(setRideDescription('GFqbzNATDKY8pKRAZV3ko', 'big red car'))
    activityEditorStore.dispatch(setRideDescription('zUxqlLLtWWjOdvHfAa1Vx', 'ferry unrelated'))
    activityEditorStore.dispatch(setRideDescription('GFqbzNATDKY8pKRAZV3ko', 'big fast red car'))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.rides).toEqual({
      ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
      entities: {
        "GFqbzNATDKY8pKRAZV3ko": {
          id: "GFqbzNATDKY8pKRAZV3ko",
          description: 'big fast red car'
        },
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry unrelated"
        },
      }
    })
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      { // combined
        name: 'Edit ride description',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko/description',
                previousValue: 'red car',
                newValue: 'big red car'
              }
            ],
            applied: true
          }
        ]
      },
      { // does not combine if unrelated
        name: 'Edit ride description',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/entities/zUxqlLLtWWjOdvHfAa1Vx/description',
                previousValue: 'ferry',
                newValue: 'ferry unrelated'
              }
            ],
            applied: true
          }
        ]
      },
      { // does not combine because PREVIOUS step is unrelated
        name: 'Edit ride description',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko/description',
                previousValue: 'big red car',
                newValue: 'big fast red car'
              }
            ],
            applied: true
          }
        ]
      },
    ])
  })
  test('Undo Redo', () => {
    const activityEditorStore = createLoadedAppStore()
    activityEditorStore.dispatch(setRideDescription('GFqbzNATDKY8pKRAZV3ko', 'big red car'))

    // act Undo
    activityEditorStore.dispatch(undo())

    // assert Undo
    const undoState = activityEditorStore.getState()
    expect(undoState.formData.rides).toEqual({
      ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
      entities: {
        "GFqbzNATDKY8pKRAZV3ko": {
          id: "GFqbzNATDKY8pKRAZV3ko",
          description: "red car"
        },
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
      }
    })
    expect(undoState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Edit ride description',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko/description',
                previousValue: 'red car',
                newValue: 'big red car'
              }
            ],
            applied: true
          }
        ]
      },
    ])
    expect(undoState.currentStepIndex).toBe(0)

    // act Redo
    activityEditorStore.dispatch(redo())

    // assert Redo
    const redoState = activityEditorStore.getState()
    expect(redoState.formData.rides).toEqual({
      ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
      entities: {
        "GFqbzNATDKY8pKRAZV3ko": {
          id: "GFqbzNATDKY8pKRAZV3ko",
          description: "big red car"
        },
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
      }
    })
    expect(redoState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Edit ride description',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko/description',
                previousValue: 'red car',
                newValue: 'big red car'
              }
            ],
            applied: true
          }
        ]
      },
    ])
    expect(redoState.currentStepIndex).toBe(1)
  })
  test('Refreshed merge local edit', () => {
    const activityEditorStore = createLoadedAppStore()
    activityEditorStore.dispatch(setRideDescription('GFqbzNATDKY8pKRAZV3ko', 'big red car'))

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity",
        versionToken: "2",
        person: "some person unrelated update",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 1
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 2
          }
        ],
        hasDetail: true,
      },
      true
    ))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.who).toEqual("some person unrelated update")
    expect(actualState.formData.rides).toEqual({
      ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
      entities: {
        "GFqbzNATDKY8pKRAZV3ko": {
          id: "GFqbzNATDKY8pKRAZV3ko",
          description: "big red car"
        },
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
      }
    })
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Edit ride description',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko/description',
                previousValue: 'red car',
                newValue: 'big red car'
              }
            ],
            applied: true
          }
        ]
      },
      {
        name: 'Refreshed',
        versionToken: '2',
        mergeBehaviour: 'merge',
        operations: [
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/who',
                previousValue: 'some person',
                newValue: 'some person unrelated update'
              }
            ],
            applied: true
          },
          {
            type: 'reverse local',
            fieldChanges: [
              {
                path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko/description',
                previousValue: 'big red car',
                newValue: 'red car'
              }
            ],
            applied: false
          },
        ]
      },
    ])
    expect(actualState.currentStepIndex).toBe(2)
    expect(actualState.versions.length).toEqual(2)
  })
  test('Refreshed only remote edit', () => {
    const activityEditorStore = createLoadedAppStore()

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity",
        versionToken: "2",
        person: "some person unrelated update",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red VAN",
            sequence: 1
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 2
          }
        ],
        hasDetail: true,
      },
      true
    ))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.who).toEqual("some person unrelated update")
    expect(actualState.formData.rides).toEqual({
      ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
      entities: {
        "GFqbzNATDKY8pKRAZV3ko": {
          id: "GFqbzNATDKY8pKRAZV3ko",
          description: "red VAN"
        },
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
      }
    })
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Refreshed',
        versionToken: '2',
        mergeBehaviour: 'discard local changes',
        operations: [
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/who',
                previousValue: 'some person',
                newValue: 'some person unrelated update'
              }
            ],
            applied: true
          },
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko/description',
                previousValue: 'red car',
                newValue: 'red VAN'
              }
            ],
            applied: true
          },
        ]
      },
    ])
    expect(actualState.currentStepIndex).toBe(1)
    expect(actualState.versions.length).toEqual(2)
  })
  test('Refreshed remote and local conflicting edit', () => {
    const activityEditorStore = createLoadedAppStore()
    activityEditorStore.dispatch(setRideDescription('GFqbzNATDKY8pKRAZV3ko', 'big red car'))

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity",
        versionToken: "2",
        person: "some person unrelated update",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red VAN",
            sequence: 1
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 2
          }
        ],
        hasDetail: true,
      },
      true
    ))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.who).toEqual("some person unrelated update")
    expect(actualState.formData.rides).toEqual({
      ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
      entities: {
        "GFqbzNATDKY8pKRAZV3ko": {
          id: "GFqbzNATDKY8pKRAZV3ko",
          description: "red VAN"
        },
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
      }
    })
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Edit ride description',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko/description',
                previousValue: 'red car',
                newValue: 'big red car'
              }
            ],
            applied: true
          }
        ]
      },
      {
        name: 'Refreshed',
        versionToken: '2',
        mergeBehaviour: 'merge',
        operations: [
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/who',
                previousValue: 'some person',
                newValue: 'some person unrelated update'
              }
            ],
            applied: true
          },
          {
            type: 'conflict',
            fieldChanges: [
              {
                path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko/description',
                previousValue: 'big red car',
                newValue: 'red VAN'
              }
            ],
            conflictName: 'Edit ride description',
            conflictApplied: true,
            applied: true
          },
        ]
      },
    ])
    expect(actualState.currentStepIndex).toBe(2)
    expect(actualState.versions.length).toEqual(2)
  })
})

describe('Remove Ride', () => {
  const createLoadedAppStore = () => {
    const activityEditorStore = createStore(
      activityEditorReducer,
      applyMiddleware(editHistoryMiddleware)
    )
    activityEditorStore.dispatch(setActivityEditorId(1))
    activityEditorStore.dispatch(setActivityEditorIsEdit(true))
    activityEditorStore.dispatch(loadedActivity())

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity",
        versionToken: "1",
        person: "some person",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 1
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 2
          }
        ],
        hasDetail: true,
      },
      true
    ))
    return activityEditorStore
  }
  test('Remove', () => {
    const activityEditorStore = createLoadedAppStore()

    // act
    activityEditorStore.dispatch(removeRide('GFqbzNATDKY8pKRAZV3ko'))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.rides).toEqual({
      ids: ["zUxqlLLtWWjOdvHfAa1Vx"],
      entities: {
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
      }
    })
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Remove ride',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'remove',
                  id: "GFqbzNATDKY8pKRAZV3ko",
                  index: 0
                }
              },
              {
                path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko',
                previousValue: {
                  id: "GFqbzNATDKY8pKRAZV3ko",
                  description: "red car"
                },
                newValue: undefined
              }
            ],
            applied: true
          }
        ]
      },
    ])
  })
  test('Undo Redo Remove', () => {
    const activityEditorStore = createLoadedAppStore()
    activityEditorStore.dispatch(removeRide('GFqbzNATDKY8pKRAZV3ko'))

    // act Undo
    activityEditorStore.dispatch(undo())

    // assert Undo
    const undoState = activityEditorStore.getState()
    expect(undoState.formData.rides).toEqual({
      ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
      entities: {
        "GFqbzNATDKY8pKRAZV3ko": {
          id: "GFqbzNATDKY8pKRAZV3ko",
          description: "red car"
        },
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
      }
    })
    expect(undoState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Remove ride',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'remove',
                  id: "GFqbzNATDKY8pKRAZV3ko",
                  index: 0
                }
              },
              {
                path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko',
                previousValue: {
                  id: "GFqbzNATDKY8pKRAZV3ko",
                  description: "red car"
                },
                newValue: undefined
              }
            ],
            applied: true
          }
        ]
      },
    ])
    expect(undoState.currentStepIndex).toBe(0)

    // act Redo
    activityEditorStore.dispatch(redo())

    // assert Redo
    const redoState = activityEditorStore.getState()
    expect(redoState.formData).toEqual({
      name: 'some activity',
      who: "some person",
      where: "some place",
      howMuch: 99,
      rides: {
        ids: ["zUxqlLLtWWjOdvHfAa1Vx"],
        entities: {
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      },
    })
    expect(redoState.currentStepIndex).toBe(1)
  })
  test('Refreshed merge local remove', () => {
    const activityEditorStore = createLoadedAppStore()
    activityEditorStore.dispatch(removeRide('GFqbzNATDKY8pKRAZV3ko'))

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity unrelated change",
        versionToken: "2",
        person: "some person",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 1
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 2
          }
        ],
        hasDetail: true,
      },
      true
    ))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.name).toEqual('some activity unrelated change')
    expect(actualState.formData.rides).toEqual({
      ids: ["zUxqlLLtWWjOdvHfAa1Vx"],
      entities: {
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
      }
    })
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Remove ride',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'remove',
                  id: "GFqbzNATDKY8pKRAZV3ko",
                  index: 0
                }
              },
              {
                path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko',
                previousValue: {
                  id: "GFqbzNATDKY8pKRAZV3ko",
                  description: "red car"
                },
                newValue: undefined
              }
            ],
            applied: true
          }
        ]
      },
      {
        name: 'Refreshed',
        operations: [
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity unrelated change'
              }
            ],
            applied: true
          },
          {
            type: 'reverse local',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'add',
                  id: "GFqbzNATDKY8pKRAZV3ko",
                  index: 0
                }
              },
              {
                path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko',
                previousValue: undefined,
                newValue: {
                  id: "GFqbzNATDKY8pKRAZV3ko",
                  description: "red car"
                }
              }
            ],
            applied: false
          },
        ],
        versionToken: '2',
        mergeBehaviour: 'merge',
      },
    ])
    expect(actualState.currentStepIndex).toBe(2)
    expect(actualState.versions.length).toEqual(2)
  })
  test('Refreshed only remote remove', () => {
    const activityEditorStore = createLoadedAppStore()

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity unrelated change",
        versionToken: "2",
        person: "some person",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 1
          }
        ],
        hasDetail: true,
      },
      true
    ))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.name).toEqual('some activity unrelated change')
    expect(actualState.formData.rides).toEqual({
      ids: ["zUxqlLLtWWjOdvHfAa1Vx"],
      entities: {
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
      }
    })
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Refreshed',
        operations: [
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity unrelated change'
              }
            ],
            applied: true
          },
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'remove',
                  id: "GFqbzNATDKY8pKRAZV3ko",
                  index: 0
                }
              },
              {
                path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko',
                previousValue: {
                  id: "GFqbzNATDKY8pKRAZV3ko",
                  description: "red car"
                },
                newValue: undefined
              }
            ],
            applied: true
          },
        ],
        versionToken: '2',
        mergeBehaviour: 'discard local changes',
      },
    ])
    expect(actualState.currentStepIndex).toBe(1)
    expect(actualState.versions.length).toEqual(2)
  })
  test('Refreshed local and remote both remove', () => {
    const activityEditorStore = createLoadedAppStore()

    // act
    activityEditorStore.dispatch(removeRide('GFqbzNATDKY8pKRAZV3ko'))
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity unrelated change",
        versionToken: "2",
        person: "some person",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 1
          }
        ],
        hasDetail: true,
      },
      true
    ))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.name).toEqual('some activity unrelated change')
    expect(actualState.formData.rides).toEqual({
      ids: ["zUxqlLLtWWjOdvHfAa1Vx"],
      entities: {
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
      }
    })
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Remove ride',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'remove',
                  id: "GFqbzNATDKY8pKRAZV3ko",
                  index: 0
                }
              },
              {
                path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko',
                previousValue: {
                  id: "GFqbzNATDKY8pKRAZV3ko",
                  description: "red car"
                },
                newValue: undefined
              }
            ],
            applied: true
          }
        ]
      },
      {
        name: 'Refreshed',
        operations: [
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity unrelated change'
              }
            ],
            applied: true
          }
        ],
        versionToken: '2',
        mergeBehaviour: 'discard local changes',
      },
    ])
    expect(actualState.currentStepIndex).toBe(2)
    expect(actualState.versions.length).toEqual(2)
  })
  describe('Refreshed local remove remote update', () => {
    test('Conflict', () => {
      const activityEditorStore = createLoadedAppStore()

      // act
      activityEditorStore.dispatch(removeRide('GFqbzNATDKY8pKRAZV3ko'))
      activityEditorStore.dispatch(setActivityFromAppStore(
        {
          id: 1,
          name: "some activity unrelated change",
          versionToken: "2",
          person: "some person",
          place: "some place",
          cost: 99,
          rides: [
            {
              id: "GFqbzNATDKY8pKRAZV3ko",
              description: "red VAN",
              sequence: 1
            },
            {
              id: "zUxqlLLtWWjOdvHfAa1Vx",
              description: "ferry",
              sequence: 2
            }
          ],
          hasDetail: true,
        },
        true
      ))

      // assert
      const actualState = activityEditorStore.getState()
      expect(actualState.formData.name).toEqual('some activity unrelated change')
      expect(actualState.formData.rides).toEqual({
        ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
        entities: {
          "GFqbzNATDKY8pKRAZV3ko": {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red VAN"
          },
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })
      expect(actualState.steps).toEqual([
        {
          name: 'initial',
          operations: []
        },
        {
          name: 'Remove ride',
          operations: [
            {
              type: 'edit',
              fieldChanges: [
                {
                  path: '/rides/ids',
                  collectionChange: {
                    type: 'remove',
                    id: "GFqbzNATDKY8pKRAZV3ko",
                    index: 0
                  }
                },
                {
                  path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko',
                  previousValue: {
                    id: "GFqbzNATDKY8pKRAZV3ko",
                    description: "red car"
                  },
                  newValue: undefined
                }
              ],
              applied: true
            }
          ]
        },
        {
          name: 'Refreshed',
          operations: [
            {
              type: 'merge',
              fieldChanges: [
                {
                  path: '/name',
                  previousValue: 'some activity',
                  newValue: 'some activity unrelated change'
                }
              ],
              applied: true
            },
            {
              type: 'conflict',
              fieldChanges: [
                {
                  path: '/rides/ids',
                  collectionChange: {
                    type: 'add',
                    id: 'GFqbzNATDKY8pKRAZV3ko',
                    index: 0
                  }
                },
                {
                  path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko',
                  previousValue: undefined,
                  newValue: {
                    id: 'GFqbzNATDKY8pKRAZV3ko',
                    description: 'red VAN'
                  }
                }
              ],
              conflictName: 'Reverse delete ride',
              conflictApplied: true,
              applied: true
            }
          ],
          versionToken: '2',
          mergeBehaviour: 'merge',
        },
      ])
      expect(actualState.currentStepIndex).toBe(2)
      expect(actualState.versions.length).toEqual(2)
    })
    test('Unapply re-apply undo redo', () => {
      const activityEditorStore = createLoadedAppStore()
      activityEditorStore.dispatch(removeRide('GFqbzNATDKY8pKRAZV3ko'))
      activityEditorStore.dispatch(setActivityFromAppStore(
        {
          id: 1,
          name: "some activity unrelated change",
          versionToken: "2",
          person: "some person",
          place: "some place",
          cost: 99,
          rides: [
            {
              id: "GFqbzNATDKY8pKRAZV3ko",
              description: "red VAN",
              sequence: 1
            },
            {
              id: "zUxqlLLtWWjOdvHfAa1Vx",
              description: "ferry",
              sequence: 2
            }
          ],
          hasDetail: true,
        },
        true
      ))

      // unapply
      activityEditorStore.dispatch(unApplyConflict(2, 0))
      const unapplyState = activityEditorStore.getState()
      expect(unapplyState.formData.rides).toEqual({
        ids: ["zUxqlLLtWWjOdvHfAa1Vx"],
        entities: {
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })

      // undo unapply
      activityEditorStore.dispatch(undo())
      const undoUnapplyState = activityEditorStore.getState()
      expect(undoUnapplyState.formData.rides).toEqual({
        ids: ["zUxqlLLtWWjOdvHfAa1Vx"],
        entities: {
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })
      expect(undoUnapplyState.currentStepIndex).toBe(1)

      // redo unapply
      activityEditorStore.dispatch(redo())
      const redoUnapplyState = activityEditorStore.getState()
      expect(redoUnapplyState.formData.rides).toEqual({
        ids: ["zUxqlLLtWWjOdvHfAa1Vx"],
        entities: {
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })
      expect(redoUnapplyState.currentStepIndex).toBe(2)

      // reapply
      activityEditorStore.dispatch(applyConflict(2, 0))
      const reapplyState = activityEditorStore.getState()
      expect(reapplyState.formData.rides).toEqual({
        ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
        entities: {
          "GFqbzNATDKY8pKRAZV3ko": {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red VAN"
          },
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })

      // undo reapply
      activityEditorStore.dispatch(undo())
      const undoReapplyState = activityEditorStore.getState()
      expect(undoReapplyState.formData.rides).toEqual({
        ids: ["zUxqlLLtWWjOdvHfAa1Vx"],
        entities: {
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })
      expect(undoReapplyState.currentStepIndex).toBe(1)

      // redo reapply
      activityEditorStore.dispatch(redo())
      const redoReapplyState = activityEditorStore.getState()
      expect(redoReapplyState.formData.rides).toEqual({
        ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
        entities: {
          "GFqbzNATDKY8pKRAZV3ko": {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red VAN"
          },
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })
      expect(redoReapplyState.currentStepIndex).toBe(2)
    })
    test('Conflict has related change: edit ride property', () => {
      const activityEditorStore = createLoadedAppStore()
      activityEditorStore.dispatch(removeRide('GFqbzNATDKY8pKRAZV3ko'))
      activityEditorStore.dispatch(setActivityFromAppStore(
        {
          id: 1,
          name: "some activity unrelated change",
          versionToken: "2",
          person: "some person",
          place: "some place",
          cost: 99,
          rides: [
            {
              id: "GFqbzNATDKY8pKRAZV3ko",
              description: "red VAN",
              sequence: 1
            },
            {
              id: "zUxqlLLtWWjOdvHfAa1Vx",
              description: "ferry",
              sequence: 2
            }
          ],
          hasDetail: true,
        },
        true
      ))
      const conflictStepIndex = 2
      const conflictIndex = 0

      // edit
      activityEditorStore.dispatch(setRideDescription('GFqbzNATDKY8pKRAZV3ko', 'red TRUCK'))
      const editState = activityEditorStore.getState()
      const editConflictOperation = editState.steps[conflictStepIndex].operations
        .filter(op => op.type === 'conflict')[conflictIndex]
      const editHasRelatedChanges = (() => {
        for (const step of editState.steps.slice(
          conflictStepIndex + 1,
          editState.currentStepIndex + 1
        )) {
          const stepResult = conflictHasRelatedChanges(editConflictOperation, step)
          if (stepResult) {
            return true
          }
        }
        return false
      })()
      expect(editHasRelatedChanges).toBe(true)

      // undo edit
      activityEditorStore.dispatch(undo())
      const undoEditState = activityEditorStore.getState()
      const undoEditConflictOperation = undoEditState.steps[conflictStepIndex].operations
        .filter(op => op.type === 'conflict')[conflictIndex]
      const undoEditHasRelatedChanges = (() => {
        for (const step of undoEditState.steps.slice(
          conflictStepIndex + 1,
          undoEditState.currentStepIndex + 1
        )) {
          const stepResult = conflictHasRelatedChanges(undoEditConflictOperation, step)
          if (stepResult) {
            return true
          }
        }
        return false
      })()
      expect(undoEditHasRelatedChanges).toBe(false)
    })
    test('Conflict has related change: remove', () => {
      const activityEditorStore = createLoadedAppStore()
      activityEditorStore.dispatch(removeRide('GFqbzNATDKY8pKRAZV3ko'))
      activityEditorStore.dispatch(setActivityFromAppStore(
        {
          id: 1,
          name: "some activity unrelated change",
          versionToken: "2",
          person: "some person",
          place: "some place",
          cost: 99,
          rides: [
            {
              id: "GFqbzNATDKY8pKRAZV3ko",
              description: "red VAN",
              sequence: 1
            },
            {
              id: "zUxqlLLtWWjOdvHfAa1Vx",
              description: "ferry",
              sequence: 2
            }
          ],
          hasDetail: true,
        },
        true
      ))
      const conflictStepIndex = 2
      const conflictIndex = 0

      // remove
      activityEditorStore.dispatch(removeRide('GFqbzNATDKY8pKRAZV3ko'))
      const removeState = activityEditorStore.getState()
      const removeConflictOperation = removeState.steps[conflictStepIndex].operations
        .filter(op => op.type === 'conflict')[conflictIndex]
      const removeHasRelatedChanges = (() => {
        for (const step of removeState.steps.slice(
          conflictStepIndex + 1,
          removeState.currentStepIndex + 1
        )) {
          const stepResult = conflictHasRelatedChanges(removeConflictOperation, step)
          if (stepResult) {
            return true
          }
        }
        return false
      })()
      expect(removeHasRelatedChanges).toBe(true)

      // undo remove
      activityEditorStore.dispatch(undo())
      const undoRemoveStat = activityEditorStore.getState()
      const undoRemoveConflictOperation = undoRemoveStat.steps[conflictStepIndex].operations
        .filter(op => op.type === 'conflict')[conflictIndex]
      const undoRemoveHasRelatedChanges = (() => {
        for (const step of undoRemoveStat.steps.slice(
          conflictStepIndex + 1,
          undoRemoveStat.currentStepIndex + 1
        )) {
          const stepResult = conflictHasRelatedChanges(undoRemoveConflictOperation, step)
          if (stepResult) {
            return true
          }
        }
        return false
      })()
      expect(undoRemoveHasRelatedChanges).toBe(false)
    })
  })
  describe('Refreshed local update remote remove', () => {
    test('Conflict', () => {
      const activityEditorStore = createLoadedAppStore()

      // act
      activityEditorStore.dispatch(setRideDescription('GFqbzNATDKY8pKRAZV3ko', 'big red car'))
      activityEditorStore.dispatch(setActivityFromAppStore(
        {
          id: 1,
          name: "some activity unrelated change",
          versionToken: "2",
          person: "some person",
          place: "some place",
          cost: 99,
          rides: [
            {
              id: "zUxqlLLtWWjOdvHfAa1Vx",
              description: "ferry",
              sequence: 1
            }
          ],
          hasDetail: true,
        },
        true
      ))

      // assert
      const actualState = activityEditorStore.getState()
      expect(actualState.formData.name).toEqual('some activity unrelated change')
      expect(actualState.formData.rides).toEqual({
        ids: ["zUxqlLLtWWjOdvHfAa1Vx"],
        entities: {
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })
      expect(actualState.steps).toEqual([
        {
          name: 'initial',
          operations: []
        },
        {
          name: 'Edit ride description',
          operations: [
            {
              type: 'edit',
              fieldChanges: [
                {
                  path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko/description',
                  previousValue: 'red car',
                  newValue: 'big red car'
                }
              ],
              applied: true
            }
          ]
        },
        {
          name: 'Refreshed',
          operations: [
            {
              type: 'merge',
              fieldChanges: [
                {
                  path: '/name',
                  previousValue: 'some activity',
                  newValue: 'some activity unrelated change'
                }
              ],
              applied: true
            },
            {
              type: 'conflict',
              fieldChanges: [
                {
                  path: '/rides/ids',
                  collectionChange: {
                    type: 'remove',
                    id: 'GFqbzNATDKY8pKRAZV3ko',
                    index: 0
                  }
                },
                {
                  path: '/rides/entities/GFqbzNATDKY8pKRAZV3ko',
                  previousValue: {
                    id: 'GFqbzNATDKY8pKRAZV3ko',
                    description: 'big red car'
                  },
                  newValue: undefined
                }
              ],
              conflictName: 'Remove ride',
              conflictApplied: true,
              applied: true
            }
          ],
          versionToken: '2',
          mergeBehaviour: 'merge',
        },
      ])
      expect(actualState.currentStepIndex).toBe(2)
      expect(actualState.versions.length).toEqual(2)
    })
    test('Unapply re-apply undo redo', () => {
      const activityEditorStore = createLoadedAppStore()
      activityEditorStore.dispatch(setRideDescription('GFqbzNATDKY8pKRAZV3ko', 'big red car'))
      activityEditorStore.dispatch(setActivityFromAppStore(
        {
          id: 1,
          name: "some activity unrelated change",
          versionToken: "2",
          person: "some person",
          place: "some place",
          cost: 99,
          rides: [
            {
              id: "zUxqlLLtWWjOdvHfAa1Vx",
              description: "ferry",
              sequence: 1
            }
          ],
          hasDetail: true,
        },
        true
      ))

      // unapply
      activityEditorStore.dispatch(unApplyConflict(2, 0))
      const unapplyState = activityEditorStore.getState()
      expect(unapplyState.formData.rides).toEqual({
        ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
        entities: {
          "GFqbzNATDKY8pKRAZV3ko": {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "big red car"
          },
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })

      // undo unapply
      activityEditorStore.dispatch(undo())
      const undoUnapplyState = activityEditorStore.getState()
      expect(undoUnapplyState.formData.rides).toEqual({
        ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
        entities: {
          "GFqbzNATDKY8pKRAZV3ko": {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "big red car"
          },
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })
      expect(undoUnapplyState.currentStepIndex).toBe(1)

      // redo unapply
      activityEditorStore.dispatch(redo())
      const redoUnapplyState = activityEditorStore.getState()
      expect(redoUnapplyState.formData.rides).toEqual({
        ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
        entities: {
          "GFqbzNATDKY8pKRAZV3ko": {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "big red car"
          },
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })
      expect(redoUnapplyState.currentStepIndex).toBe(2)

      // reapply
      activityEditorStore.dispatch(applyConflict(2, 0))
      const reapplyState = activityEditorStore.getState()
      expect(reapplyState.formData.rides).toEqual({
        ids: ["zUxqlLLtWWjOdvHfAa1Vx"],
        entities: {
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })

      // undo reapply
      activityEditorStore.dispatch(undo())
      const undoReapplyState = activityEditorStore.getState()
      expect(undoReapplyState.formData.rides).toEqual({
        ids: ["GFqbzNATDKY8pKRAZV3ko", "zUxqlLLtWWjOdvHfAa1Vx"],
        entities: {
          "GFqbzNATDKY8pKRAZV3ko": {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "big red car"
          },
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })
      expect(undoReapplyState.currentStepIndex).toBe(1)

      // redo reapply
      activityEditorStore.dispatch(redo())
      const redoReapplyState = activityEditorStore.getState()
      expect(redoReapplyState.formData.rides).toEqual({
        ids: ["zUxqlLLtWWjOdvHfAa1Vx"],
        entities: {
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })
      expect(redoReapplyState.currentStepIndex).toBe(2)
    })
    test('Conflict has related change: edit ride property', () => {
      const activityEditorStore = createLoadedAppStore()
      activityEditorStore.dispatch(setRideDescription('GFqbzNATDKY8pKRAZV3ko', 'big red car'))
      activityEditorStore.dispatch(setActivityFromAppStore(
        {
          id: 1,
          name: "some activity unrelated change",
          versionToken: "2",
          person: "some person",
          place: "some place",
          cost: 99,
          rides: [
            {
              id: "zUxqlLLtWWjOdvHfAa1Vx",
              description: "ferry",
              sequence: 1
            }
          ],
          hasDetail: true,
        },
        true
      ))
      const conflictStepIndex = 2
      const conflictIndex = 0
      activityEditorStore.dispatch(unApplyConflict(conflictStepIndex, conflictIndex))

      // edit
      activityEditorStore.dispatch(setRideDescription('GFqbzNATDKY8pKRAZV3ko', 'big blue car'))
      const stateEdit = activityEditorStore.getState()
      const conflictOperationEdit = stateEdit.steps[conflictStepIndex].operations
        .filter(op => op.type === 'conflict')[conflictIndex]
      const hasRelatedChangesEdit = (() => {
        for (const step of stateEdit.steps.slice(
          conflictStepIndex + 1,
          stateEdit.currentStepIndex + 1
        )) {
          const stepResult = conflictHasRelatedChanges(conflictOperationEdit, step)
          if (stepResult) {
            return true
          }
        }
        return false
      })()
      expect(hasRelatedChangesEdit).toBe(true)

      // undoEdit
      activityEditorStore.dispatch(undo())
      const stateUndoEdit = activityEditorStore.getState()
      const conflictOperationUndoEdit = stateUndoEdit.steps[conflictStepIndex].operations
        .filter(op => op.type === 'conflict')[conflictIndex]
      const hasRelatedChangesUndoEdit = (() => {
        for (const step of stateUndoEdit.steps.slice(
          conflictStepIndex + 1,
          stateUndoEdit.currentStepIndex + 1
        )) {
          const stepResult = conflictHasRelatedChanges(conflictOperationUndoEdit, step)
          if (stepResult) {
            return true
          }
        }
        return false
      })()
      expect(hasRelatedChangesUndoEdit).toBe(false)
    })
    test('Conflict has related change: remove', () => {
      const activityEditorStore = createLoadedAppStore()
      activityEditorStore.dispatch(setRideDescription('GFqbzNATDKY8pKRAZV3ko', 'big red car'))
      activityEditorStore.dispatch(setActivityFromAppStore(
        {
          id: 1,
          name: "some activity unrelated change",
          versionToken: "2",
          person: "some person",
          place: "some place",
          cost: 99,
          rides: [
            {
              id: "zUxqlLLtWWjOdvHfAa1Vx",
              description: "ferry",
              sequence: 1
            }
          ],
          hasDetail: true,
        },
        true
      ))
      const conflictStepIndex = 2
      const conflictIndex = 0
      activityEditorStore.dispatch(unApplyConflict(conflictStepIndex, conflictIndex))

      // remove
      activityEditorStore.dispatch(removeRide('GFqbzNATDKY8pKRAZV3ko'))

      // assert remove
      const stateRemove = activityEditorStore.getState()
      const conflictOperationRemove = stateRemove.steps[conflictStepIndex].operations
        .filter(op => op.type === 'conflict')[conflictIndex]
      const hasRelatedChangesRemove = (() => {
        for (const step of stateRemove.steps.slice(
          conflictStepIndex + 1,
          stateRemove.currentStepIndex + 1
        )) {
          const stepResult = conflictHasRelatedChanges(conflictOperationRemove, step)
          if (stepResult) {
            return true
          }
        }
        return false
      })()
      expect(hasRelatedChangesRemove).toBe(true)

      // undo remove
      activityEditorStore.dispatch(undo())

      // assert undo remove
      const stateUndoRemove = activityEditorStore.getState()
      const conflictOperationUndoRemove = stateUndoRemove.steps[conflictStepIndex].operations
        .filter(op => op.type === 'conflict')[conflictIndex]
      const hasRelatedChangesUndoEdit = (() => {
        for (const step of stateUndoRemove.steps.slice(
          conflictStepIndex + 1,
          stateUndoRemove.currentStepIndex + 1
        )) {
          const stepResult = conflictHasRelatedChanges(conflictOperationUndoRemove, step)
          if (stepResult) {
            return true
          }
        }
        return false
      })()
      expect(hasRelatedChangesUndoEdit).toBe(false)
    })
  })
})

describe('Move Rides', () => {
  const createLoadedAppStore = () => {
    const activityEditorStore = createStore(
      activityEditorReducer,
      applyMiddleware(editHistoryMiddleware)
    )
    activityEditorStore.dispatch(setActivityEditorId(1))
    activityEditorStore.dispatch(setActivityEditorIsEdit(true))
    activityEditorStore.dispatch(loadedActivity())

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity",
        versionToken: "1",
        person: "some person",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 1
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 2
          },
          {
            id: "UpW9WgVUNXeYB3w8S0flu",
            description: "train",
            sequence: 3
          }
        ],
        hasDetail: true,
      },
      true
    ))
    return activityEditorStore
  }
  test('Move', () => {
    const activityEditorStore = createLoadedAppStore()

    // act
    activityEditorStore.dispatch(moveRide('UpW9WgVUNXeYB3w8S0flu', 0))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData).toEqual({
      name: 'some activity',
      who: "some person",
      where: "some place",
      howMuch: 99,
      rides: {
        ids: ['UpW9WgVUNXeYB3w8S0flu', 'GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx'],
        entities: {
          "UpW9WgVUNXeYB3w8S0flu": {
            id: "UpW9WgVUNXeYB3w8S0flu",
            description: "train"
          },
          "GFqbzNATDKY8pKRAZV3ko": {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car"
          },
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      },
    })
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Move rides',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'move'
                },
                previousValue: ['GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx', 'UpW9WgVUNXeYB3w8S0flu'],
                newValue: ['UpW9WgVUNXeYB3w8S0flu', 'GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx']
              }
            ],
            applied: true
          }
        ]
      },
    ])
  })
  test('Combine Moves', () => {
    const activityEditorStore = createLoadedAppStore()

    // act
    activityEditorStore.dispatch(moveRide('UpW9WgVUNXeYB3w8S0flu', 0))
    activityEditorStore.dispatch(moveRide('zUxqlLLtWWjOdvHfAa1Vx', 1))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData).toEqual({
      name: 'some activity',
      who: "some person",
      where: "some place",
      howMuch: 99,
      rides: {
        ids: ['UpW9WgVUNXeYB3w8S0flu', 'zUxqlLLtWWjOdvHfAa1Vx', 'GFqbzNATDKY8pKRAZV3ko'],
        entities: {
          "UpW9WgVUNXeYB3w8S0flu": {
            id: "UpW9WgVUNXeYB3w8S0flu",
            description: "train"
          },
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
          "GFqbzNATDKY8pKRAZV3ko": {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car"
          },
        }
      },
    })
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Move rides',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'move'
                },
                previousValue: ['GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx', 'UpW9WgVUNXeYB3w8S0flu'],
                newValue: ['UpW9WgVUNXeYB3w8S0flu', 'zUxqlLLtWWjOdvHfAa1Vx', 'GFqbzNATDKY8pKRAZV3ko']
              }
            ],
            applied: true
          }
        ]
      },
    ])
  })
  test('Undo Redo Move', () => {
    const activityEditorStore = createLoadedAppStore()
    activityEditorStore.dispatch(moveRide('UpW9WgVUNXeYB3w8S0flu', 0))

    // act undo
    activityEditorStore.dispatch(undo())

    // assert undo
    const undoState = activityEditorStore.getState()
    expect(undoState.formData.rides).toEqual({
      ids: ['GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx', 'UpW9WgVUNXeYB3w8S0flu'],
      entities: {
        "GFqbzNATDKY8pKRAZV3ko": {
          id: "GFqbzNATDKY8pKRAZV3ko",
          description: "red car"
        },
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
        "UpW9WgVUNXeYB3w8S0flu": {
          id: "UpW9WgVUNXeYB3w8S0flu",
          description: "train"
        },
      }
    })
    expect(undoState.currentStepIndex).toBe(0)

    // act redo
    activityEditorStore.dispatch(redo())

    // assert redo
    const redoState = activityEditorStore.getState()
    expect(redoState.formData.rides).toEqual({
      ids: ['UpW9WgVUNXeYB3w8S0flu', 'GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx'],
      entities: {
        "UpW9WgVUNXeYB3w8S0flu": {
          id: "UpW9WgVUNXeYB3w8S0flu",
          description: "train"
        },
        "GFqbzNATDKY8pKRAZV3ko": {
          id: "GFqbzNATDKY8pKRAZV3ko",
          description: "red car"
        },
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
      }
    })
    expect(redoState.currentStepIndex).toBe(1)
  })
  test('Refreshed merge local move', () => {
    const activityEditorStore = createLoadedAppStore()
    activityEditorStore.dispatch(moveRide('UpW9WgVUNXeYB3w8S0flu', 0))

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity unrelated change",
        versionToken: "2",
        person: "some person",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 1
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 2
          },
          {
            id: "UpW9WgVUNXeYB3w8S0flu",
            description: "train",
            sequence: 3
          },
        ],
        hasDetail: true,
      },
      true
    ))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.name).toEqual('some activity unrelated change')
    expect(actualState.formData.rides).toEqual({
      ids: ['UpW9WgVUNXeYB3w8S0flu', 'GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx'],
      entities: {
        "UpW9WgVUNXeYB3w8S0flu": {
          id: "UpW9WgVUNXeYB3w8S0flu",
          description: "train"
        },
        "GFqbzNATDKY8pKRAZV3ko": {
          id: "GFqbzNATDKY8pKRAZV3ko",
          description: "red car"
        },
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
      }
    })
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Move rides',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'move'
                },
                previousValue: ['GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx', 'UpW9WgVUNXeYB3w8S0flu'],
                newValue: ['UpW9WgVUNXeYB3w8S0flu', 'GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx']
              }
            ],
            applied: true
          }
        ]
      },
      {
        name: 'Refreshed',
        operations: [
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity unrelated change'
              }
            ],
            applied: true
          },
          {
            type: 'reverse local',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'move'
                },
                previousValue: ['UpW9WgVUNXeYB3w8S0flu', 'GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx'],
                newValue: ['GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx', 'UpW9WgVUNXeYB3w8S0flu'],
              }
            ],
            applied: false
          },
        ],
        versionToken: '2',
        mergeBehaviour: 'merge',
      },
    ])
    expect(actualState.currentStepIndex).toBe(2)
    expect(actualState.versions.length).toEqual(2)
  })
  test('Refreshed only remote move', () => {
    const activityEditorStore = createLoadedAppStore()

    // act
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity unrelated change",
        versionToken: "2",
        person: "some person",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 1
          },
          {
            id: "UpW9WgVUNXeYB3w8S0flu",
            description: "train",
            sequence: 2
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 3
          },
        ],
        hasDetail: true,
      },
      true
    ))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.name).toEqual('some activity unrelated change')
    expect(actualState.formData.rides).toEqual({
      ids: ['GFqbzNATDKY8pKRAZV3ko', 'UpW9WgVUNXeYB3w8S0flu', 'zUxqlLLtWWjOdvHfAa1Vx'],
      entities: {
        "GFqbzNATDKY8pKRAZV3ko": {
          id: "GFqbzNATDKY8pKRAZV3ko",
          description: "red car"
        },
        "UpW9WgVUNXeYB3w8S0flu": {
          id: "UpW9WgVUNXeYB3w8S0flu",
          description: "train"
        },
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
      }
    })
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Refreshed',
        operations: [
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity unrelated change'
              }
            ],
            applied: true
          },
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'move'
                },
                previousValue: ['GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx', 'UpW9WgVUNXeYB3w8S0flu'],
                newValue: ['GFqbzNATDKY8pKRAZV3ko', 'UpW9WgVUNXeYB3w8S0flu', 'zUxqlLLtWWjOdvHfAa1Vx'],
              }
            ],
            applied: true
          },
        ],
        versionToken: '2',
        mergeBehaviour: 'discard local changes',
      },
    ])
    expect(actualState.currentStepIndex).toBe(1)
    expect(actualState.versions.length).toEqual(2)
  })
  test('Refreshed local and remote both move', () => {
    const activityEditorStore = createLoadedAppStore()

    // act
    activityEditorStore.dispatch(moveRide('UpW9WgVUNXeYB3w8S0flu', 0))
    activityEditorStore.dispatch(setActivityFromAppStore(
      {
        id: 1,
        name: "some activity unrelated change",
        versionToken: "2",
        person: "some person",
        place: "some place",
        cost: 99,
        rides: [
          {
            id: "UpW9WgVUNXeYB3w8S0flu",
            description: "train",
            sequence: 1
          },
          {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car",
            sequence: 2
          },
          {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry",
            sequence: 3
          },
        ],
        hasDetail: true,
      },
      true
    ))

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData.name).toEqual('some activity unrelated change')
    expect(actualState.formData.rides).toEqual({
      ids: ['UpW9WgVUNXeYB3w8S0flu', 'GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx'],
      entities: {
        "UpW9WgVUNXeYB3w8S0flu": {
          id: "UpW9WgVUNXeYB3w8S0flu",
          description: "train"
        },
        "GFqbzNATDKY8pKRAZV3ko": {
          id: "GFqbzNATDKY8pKRAZV3ko",
          description: "red car"
        },
        "zUxqlLLtWWjOdvHfAa1Vx": {
          id: "zUxqlLLtWWjOdvHfAa1Vx",
          description: "ferry"
        },
      }
    })
    expect(actualState.steps).toEqual([
      {
        name: 'initial',
        operations: []
      },
      {
        name: 'Move rides',
        operations: [
          {
            type: 'edit',
            fieldChanges: [
              {
                path: '/rides/ids',
                collectionChange: {
                  type: 'move'
                },
                previousValue: ['GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx', 'UpW9WgVUNXeYB3w8S0flu'],
                newValue: ['UpW9WgVUNXeYB3w8S0flu', 'GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx']
              }
            ],
            applied: true
          }
        ]
      },
      {
        name: 'Refreshed',
        operations: [
          {
            type: 'merge',
            fieldChanges: [
              {
                path: '/name',
                previousValue: 'some activity',
                newValue: 'some activity unrelated change'
              }
            ],
            applied: true
          }
        ],
        versionToken: '2',
        mergeBehaviour: 'discard local changes',
      },
    ])
    expect(actualState.currentStepIndex).toBe(2)
    expect(actualState.versions.length).toEqual(2)
  })
  describe('Refreshed remote and local conflicting move', () => {
    test('Conflict', () => {
      const activityEditorStore = createLoadedAppStore()

      // act
      activityEditorStore.dispatch(moveRide('UpW9WgVUNXeYB3w8S0flu', 0))
      activityEditorStore.dispatch(setActivityFromAppStore(
        {
          id: 1,
          name: "some activity unrelated change",
          versionToken: "2",
          person: "some person",
          place: "some place",
          cost: 99,
          rides: [
            {
              id: "GFqbzNATDKY8pKRAZV3ko",
              description: "red car",
              sequence: 1
            },
            {
              id: "UpW9WgVUNXeYB3w8S0flu",
              description: "train",
              sequence: 2
            },
            {
              id: "zUxqlLLtWWjOdvHfAa1Vx",
              description: "ferry",
              sequence: 3
            },
          ],
          hasDetail: true,
        },
        true
      ))

      // assert
      const actualState = activityEditorStore.getState()
      expect(actualState.formData.name).toEqual('some activity unrelated change')
      expect(actualState.formData.rides).toEqual({
        ids: ['GFqbzNATDKY8pKRAZV3ko', 'UpW9WgVUNXeYB3w8S0flu', 'zUxqlLLtWWjOdvHfAa1Vx'],
        entities: {
          "GFqbzNATDKY8pKRAZV3ko": {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car"
          },
          "UpW9WgVUNXeYB3w8S0flu": {
            id: "UpW9WgVUNXeYB3w8S0flu",
            description: "train"
          },
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })
      expect(actualState.steps).toEqual([
        {
          name: 'initial',
          operations: []
        },
        {
          name: 'Move rides',
          operations: [
            {
              type: 'edit',
              fieldChanges: [
                {
                  path: '/rides/ids',
                  collectionChange: {
                    type: 'move'
                  },
                  previousValue: ['GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx', 'UpW9WgVUNXeYB3w8S0flu'],
                  newValue: ['UpW9WgVUNXeYB3w8S0flu', 'GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx']
                }
              ],
              applied: true
            }
          ]
        },
        {
          name: 'Refreshed',
          operations: [
            {
              type: 'merge',
              fieldChanges: [
                {
                  path: '/name',
                  previousValue: 'some activity',
                  newValue: 'some activity unrelated change'
                }
              ],
              applied: true
            },
            {
              type: 'conflict',
              fieldChanges: [
                {
                  path: '/rides/ids',
                  collectionChange: {
                    type: 'move'
                  },
                  previousValue: ['UpW9WgVUNXeYB3w8S0flu', 'GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx'],
                  newValue: ['GFqbzNATDKY8pKRAZV3ko', 'UpW9WgVUNXeYB3w8S0flu', 'zUxqlLLtWWjOdvHfAa1Vx'],
                }
              ],
              conflictName: 'Move rides',
              conflictApplied: true,
              applied: true
            },
          ],
          versionToken: '2',
          mergeBehaviour: 'merge',
        },
      ])
      expect(actualState.currentStepIndex).toBe(2)
      expect(actualState.versions.length).toEqual(2)
    })
    test('Unapply re-apply undo redo', () => {
      const activityEditorStore = createLoadedAppStore()
      activityEditorStore.dispatch(moveRide('UpW9WgVUNXeYB3w8S0flu', 0))
      activityEditorStore.dispatch(setActivityFromAppStore(
        {
          id: 1,
          name: "some activity unrelated change",
          versionToken: "2",
          person: "some person",
          place: "some place",
          cost: 99,
          rides: [
            {
              id: "GFqbzNATDKY8pKRAZV3ko",
              description: "red car",
              sequence: 1
            },
            {
              id: "UpW9WgVUNXeYB3w8S0flu",
              description: "train",
              sequence: 2
            },
            {
              id: "zUxqlLLtWWjOdvHfAa1Vx",
              description: "ferry",
              sequence: 3
            },
          ],
          hasDetail: true,
        },
        true
      ))

      // unapply
      activityEditorStore.dispatch(unApplyConflict(2, 0))
      const stateUnapply = activityEditorStore.getState()
      expect(stateUnapply.formData.name).toEqual("some activity unrelated change")
      expect(stateUnapply.formData.rides).toEqual({
        ids: ['UpW9WgVUNXeYB3w8S0flu', 'GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx'],
        entities: {
          "UpW9WgVUNXeYB3w8S0flu": {
            id: "UpW9WgVUNXeYB3w8S0flu",
            description: "train"
          },
          "GFqbzNATDKY8pKRAZV3ko": {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car"
          },
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })

      // undo unapply
      activityEditorStore.dispatch(undo())
      const stateUndoUnapply = activityEditorStore.getState()
      expect(stateUndoUnapply.formData.name).toEqual("some activity")
      expect(stateUndoUnapply.formData.rides).toEqual({
        ids: ['UpW9WgVUNXeYB3w8S0flu', 'GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx'],
        entities: {
          "UpW9WgVUNXeYB3w8S0flu": {
            id: "UpW9WgVUNXeYB3w8S0flu",
            description: "train"
          },
          "GFqbzNATDKY8pKRAZV3ko": {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car"
          },
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })
      expect(stateUndoUnapply.currentStepIndex).toBe(1)
      
      // redo unapply
      activityEditorStore.dispatch(redo())
      const stateRedoUnapply = activityEditorStore.getState()
      expect(stateRedoUnapply.formData.name).toEqual("some activity unrelated change")
      expect(stateRedoUnapply.formData.rides).toEqual({
        ids: ['UpW9WgVUNXeYB3w8S0flu', 'GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx'],
        entities: {
          "UpW9WgVUNXeYB3w8S0flu": {
            id: "UpW9WgVUNXeYB3w8S0flu",
            description: "train"
          },
          "GFqbzNATDKY8pKRAZV3ko": {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car"
          },
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })
      expect(stateRedoUnapply.currentStepIndex).toBe(2)
      
      // reapply
      activityEditorStore.dispatch(applyConflict(2, 0))
      const stateReapply = activityEditorStore.getState()
      expect(stateReapply.formData.name).toEqual("some activity unrelated change")
      expect(stateReapply.formData.rides).toEqual({
        ids: ['GFqbzNATDKY8pKRAZV3ko', 'UpW9WgVUNXeYB3w8S0flu', 'zUxqlLLtWWjOdvHfAa1Vx'],
        entities: {
          "GFqbzNATDKY8pKRAZV3ko": {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car"
          },
          "UpW9WgVUNXeYB3w8S0flu": {
            id: "UpW9WgVUNXeYB3w8S0flu",
            description: "train"
          },
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })

      // undo reapply
      activityEditorStore.dispatch(undo())
      const stateUndoReapply = activityEditorStore.getState()
      expect(stateUndoReapply.formData.name).toEqual("some activity")
      expect(stateUndoReapply.formData.rides).toEqual({
        ids: ['UpW9WgVUNXeYB3w8S0flu', 'GFqbzNATDKY8pKRAZV3ko', 'zUxqlLLtWWjOdvHfAa1Vx'],
        entities: {
          "UpW9WgVUNXeYB3w8S0flu": {
            id: "UpW9WgVUNXeYB3w8S0flu",
            description: "train"
          },
          "GFqbzNATDKY8pKRAZV3ko": {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car"
          },
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })
      expect(stateUndoUnapply.currentStepIndex).toBe(1)
      
      // redo reapply
      activityEditorStore.dispatch(redo())
      const stateRedoReapply = activityEditorStore.getState()
      expect(stateRedoReapply.formData.name).toEqual("some activity unrelated change")
      expect(stateRedoReapply.formData.rides).toEqual({
        ids: ['GFqbzNATDKY8pKRAZV3ko', 'UpW9WgVUNXeYB3w8S0flu', 'zUxqlLLtWWjOdvHfAa1Vx'],
        entities: {
          "GFqbzNATDKY8pKRAZV3ko": {
            id: "GFqbzNATDKY8pKRAZV3ko",
            description: "red car"
          },
          "UpW9WgVUNXeYB3w8S0flu": {
            id: "UpW9WgVUNXeYB3w8S0flu",
            description: "train"
          },
          "zUxqlLLtWWjOdvHfAa1Vx": {
            id: "zUxqlLLtWWjOdvHfAa1Vx",
            description: "ferry"
          },
        }
      })
      expect(stateRedoReapply.currentStepIndex).toBe(2)
    })
    //   Conflict has related change: remove
    //   Conflict has related change: add
    //   Conflict has related change: move
    //   Conflict does not has related change: update
  })
  // describe('Refreshed local move remote remove', () => {
  //   Refreshed
  //   undo redo
  // describe('Refreshed local move remote update', () => {
  //   Refreshed
  //   undo redo
  // describe('Refreshed local move remote add', () => {
  //   Refreshed
  //   undo redo
  // describe('Refreshed remote move local remove', () => {
  //   Refreshed
  //   undo redo
  // describe('Refreshed remote move local update', () => {
  //   Refreshed
  //   undo redo
  // describe('Refreshed remote move local add', () => {
  //   Refreshed
  //   undo redo
})

// describe('Refreshed multiple removes and multiple adds', () => {
//   Refreshed
//   undo redo

// describe('Refreshed move, multiple removes and multiple adds', () => {
//   Refreshed
//   undo redo