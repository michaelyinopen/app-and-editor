
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
  removeRide,
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
    expect(actualState.formData).toEqual({
      name: 'some activity edited',
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
    })
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
    expect(actualState.formData).toEqual({
      name: 'some activity edited 3',
      who: "some person also edited",
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
    })
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
  test('Undo Redo Edit', () => {
    const activityEditorStore = createLoadedAppStore()
    activityEditorStore.dispatch(setName('some activity edited'))

    // act Undo
    activityEditorStore.dispatch(undo())

    // assert Undo
    const actualUndoState = activityEditorStore.getState()
    expect(actualUndoState.formData).toEqual({
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
    })
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
    expect(actualRedoState.formData).toEqual({
      name: 'some activity edited',
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
    })
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
  test('Refreshed local updated', () => {
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
    expect(actualState.formData).toEqual({
      name: 'some activity local edited',
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
    })
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
    expect(actualState.currentStepIndex).toBe(1)
  })
  test('Refreshed remote updated', () => {
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
    expect(actualState.formData).toEqual({
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
                newValue: 'some activity remote edited'
              }
            ],
            applied: true
          }
        ],
        versionToken: '2',
        mergeBehaviour: 'merge',
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
  test('Merge', () => {
    // if 'name' was updated locally but not remotely
    // Merges keep both local and remote changes if there is no conflict
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
    expect(actualState.formData).toEqual({
      name: 'some activity local edited',
      who: "some person unrelated update",
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
    })
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
    // if 'name' was updated locally but not remotely
    // Discard local changes will revert 'name' to remote state
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
    expect(actualState.formData).toEqual({
      name: 'some activity',
      who: "some person unrelated update",
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
    })
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
  test('Refreshed remote and local same update', () => {
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
    expect(actualState.formData).toEqual({
      name: 'some activity edited',
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
    })
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
    return activityEditorStore
  }
  test('Refreshed remote and local different update', () => {
    // will create a refreshed step with conflict
    const activityEditorStore = createAppStoreWithConflict()

    // assert
    const actualState = activityEditorStore.getState()
    expect(actualState.formData).toEqual({
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
    })
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
    const actualUnapplyState = activityEditorStore.getState()
    expect(actualUnapplyState.formData).toEqual({
      name: 'some activity local edited',
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
    })
    expect(actualUnapplyState.steps).toEqual([
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
    expect(actualUnapplyState.currentStepIndex).toBe(2)
    expect(actualUnapplyState.versions.length).toEqual(2)

    //act re-apply
    activityEditorStore.dispatch(applyConflict(2, 0))

    // assert re-apply
    const actualReapplyState = activityEditorStore.getState()
    expect(actualReapplyState.formData).toEqual({
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
    })
    expect(actualReapplyState.steps).toEqual([
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
    expect(actualReapplyState.currentStepIndex).toBe(2)
    expect(actualReapplyState.versions.length).toEqual(2)
  })
  test('Conflict has related change', () => {
    // will create a refreshed step with conflict
    const activityEditorStore = createAppStoreWithConflict()
    const conflictStepIndex = 2
    const conflictIndex = 0

    // act edit
    activityEditorStore.dispatch(setName('some activity after'))
    const stateAfterEdit = activityEditorStore.getState()
    const conflictOperation = stateAfterEdit.steps[conflictStepIndex].operations
      .filter(op => op.type === 'conflict')[conflictIndex]
    const hasRelatedChanges = (() => {
      for (const step of stateAfterEdit.steps.slice(
        conflictStepIndex + 1,
        stateAfterEdit.currentStepIndex + 1
      )) {
        const stepResult = conflictHasRelatedChanges(conflictOperation, step)
        if (stepResult) {
          return true
        }
      }
      return false
    })()

    // assert edit
    expect(hasRelatedChanges).toBe(true)

    // act undo edit
    activityEditorStore.dispatch(undo())
    const stateAfterUndo = activityEditorStore.getState()
    const conflictOperationAfterUndo = stateAfterUndo.steps[conflictStepIndex].operations
      .filter(op => op.type === 'conflict')[conflictIndex]
    const hasRelatedChangesAfterUndo = (() => {
      for (const step of stateAfterUndo.steps.slice(
        conflictStepIndex + 1,
        stateAfterUndo.currentStepIndex + 1
      )) {
        const stepResult = conflictHasRelatedChanges(conflictOperationAfterUndo, step)
        if (stepResult) {
          return true
        }
      }
      return false
    })()

    // assert undo edit
    expect(hasRelatedChangesAfterUndo).toBe(false)
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
    expect(actualState.formData).toEqual({
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
    const actualUndoState = activityEditorStore.getState()
    expect(actualUndoState.formData).toEqual({
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
    })
    expect(actualUndoState.steps).toEqual([
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
    expect(actualUndoState.currentStepIndex).toBe(0)

    // act Redo
    activityEditorStore.dispatch(redo())

    // assert Redo
    const actualRedoState = activityEditorStore.getState()
    expect(actualRedoState.formData).toEqual({
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
    expect(actualRedoState.currentStepIndex).toBe(1)
  })
})