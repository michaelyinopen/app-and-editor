import {
  configureStore,
  createImmutableStateInvariantMiddleware,
  createSerializableStateInvariantMiddleware,
} from '@reduxjs/toolkit'
import thunkMiddleware from 'redux-thunk'
import { createReduxTakingThunkMiddleware, createIsLoadingSelector } from '../'
import {
  reducer,
  actionTypes,
  api,
} from './testUtilities'

let store

beforeEach(() => {
  store = configureStore({
    reducer,
    middleware: process.env.NODE_ENV !== 'production'
      ? [
        thunkMiddleware,
        createReduxTakingThunkMiddleware(),
        createImmutableStateInvariantMiddleware(),
        createSerializableStateInvariantMiddleware()
      ]
      : [
        thunkMiddleware,
        createReduxTakingThunkMiddleware(),
      ],
  })
})

test('Can dispatch simple action', () => {
  store.dispatch({ type: actionTypes.todoSetAll, payload: ['Alfa', 'Bravo'] })
  expect(store.getState().todo.items).toEqual(['Alfa', 'Bravo'])
})

test('Redux-thunk dispatch function still works', async () => {
  await store.dispatch(async function (dispatch) {
    const newTodos = await api.get_AB_oneSecond()
    dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
  })

  expect(store.getState().todo.items).toEqual(['Alfa', 'Bravo'])
})

test('Can dispatch function thunk', async () => {
  const takingThunkAction = {
    name: 'fetchTodos',
    takeType: 'every',
    thunk: function (dispatch) {
      dispatch({ type: actionTypes.todoSetAll, payload: ['Alfa', 'Bravo'] })
      return 'i can return'
    }
  }
  const returned = await store.dispatch(takingThunkAction)

  expect(store.getState().todo.items).toEqual(['Alfa', 'Bravo'])
  expect(returned).toEqual('i can return')
})

test('Can dispatch async function thunk', async () => {
  const takingThunkAction = {
    name: 'fetchTodos',
    takeType: 'every',
    thunk: async function (dispatch) {
      const newTodos = await api.get_AB_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
      return 'i can return'
    }
  }
  const returned = await store.dispatch(takingThunkAction)

  expect(store.getState().todo.items).toEqual(['Alfa', 'Bravo'])
  expect(returned).toEqual('i can return')
})

test('Can dispatch generator function thunk', async () => {
  const takingThunkAction = {
    name: 'fetchTodos',
    takeType: 'every',
    thunk: function* (dispatch) {
      const newTodos = yield api.get_AB_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
      return 'i can return'
    }
  }
  const returned = await store.dispatch(takingThunkAction)

  expect(store.getState().todo.items).toEqual(['Alfa', 'Bravo'])
  expect(returned).toEqual('i can return')
})

test('Can dispatch async generator function thunk', async () => {
  const takingThunkAction = {
    name: 'fetchTodos',
    takeType: 'every',
    thunk: async function* (dispatch) {
      const ms = 100
      await new Promise(resolve => setTimeout(resolve, ms))
      const newTodos = yield api.get_AB_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
      return 'i can return'
    }
  }
  const returned = await store.dispatch(takingThunkAction)

  expect(store.getState().todo.items).toEqual(['Alfa', 'Bravo'])
  expect(returned).toEqual('i can return')
})

test('Can dispatch multiple async function thunks', async () => {
  const first_get_AB_oneSecond = jest.fn(api.get_AB_oneSecond)
  const second_get_BCD_twoSecond = jest.fn(api.get_BCD_twoSecond)
  const third_get_BCDE_oneSecond = jest.fn(api.get_BCDE_oneSecond)
  const firstAction = {
    name: 'fetchTodos',
    takeType: 'every',
    thunk: async function (dispatch) {
      const newTodos = await first_get_AB_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const firstDispatchPromise = store.dispatch(firstAction)
  const secondAction = {
    name: 'fetchTodos',
    takeType: 'every',
    thunk: async function (dispatch) {
      const newTodos = await second_get_BCD_twoSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const secondDispatchPromise = store.dispatch(secondAction)
  const thirdAction = {
    name: 'fetchTodos',
    takeType: 'every',
    thunk: async function (dispatch) {
      const newTodos = await third_get_BCDE_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const thirdDispatchPromise = store.dispatch(thirdAction)
  await Promise.all([
    firstDispatchPromise,
    secondDispatchPromise,
    thirdDispatchPromise
  ])

  expect(store.getState().todo.items).toEqual(['Bravo', 'Charlie', 'Delta'])
  expect(first_get_AB_oneSecond.mock.calls.length).toBe(1)
  expect(second_get_BCD_twoSecond.mock.calls.length).toBe(1)
  expect(third_get_BCDE_oneSecond.mock.calls.length).toBe(1)
})

test('Default take type is every', async () => {
  const firstAction = {
    name: 'fetchTodos',
    thunk: async function (dispatch) {
      const newTodos = await api.get_AB_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const firstDispatchPromise = store.dispatch(firstAction)
  const secondAction = {
    name: 'fetchTodos',
    thunk: async function (dispatch) {
      const newTodos = await api.get_BCD_twoSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const secondDispatchPromise = store.dispatch(secondAction)
  const thirdAction = {
    name: 'fetchTodos',
    thunk: async function (dispatch) {
      const newTodos = await api.get_BCDE_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const thirdDispatchPromise = store.dispatch(thirdAction)
  await Promise.all([
    firstDispatchPromise,
    secondDispatchPromise,
    thirdDispatchPromise
  ])

  expect(store.getState().todo.items).toEqual(['Bravo', 'Charlie', 'Delta'])
})

test('Can use getState and extraArgument', async () => {
  store = configureStore({
    reducer,
    middleware: [
      thunkMiddleware,
      createReduxTakingThunkMiddleware("my extra argument"),
      createImmutableStateInvariantMiddleware(),
      createSerializableStateInvariantMiddleware()
    ]
  })
  store.dispatch({ type: actionTypes.todoSetAll, payload: ['Alfa'] })

  const takingThunkAction = {
    name: 'getStateExtraArgument',
    takeType: 'every',
    thunk: async function (dispatch, getState, extraArgument) {
      const originaltStateItems = getState().todo.items
      const fetchedTodos = await api.get_AB_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: [...fetchedTodos, extraArgument] })
      return originaltStateItems
    }
  }
  const returned = await store.dispatch(takingThunkAction)
  expect(store.getState().todo.items).toEqual(['Alfa', 'Bravo', "my extra argument"])
  expect(returned).toEqual(['Alfa'])
})

test.skip('Mixing take types will have unpredictable execution', async () => {
  const firstAction = {
    name: 'fetchTodos',
    takeType: 'every',
    thunk: async function (dispatch) {
      const newTodos = await api.get_AB_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const firstDispatchPromise = store.dispatch(firstAction)
  const secondAction = {
    name: 'fetchTodos',
    takeType: 'leading',
    thunk: async function (dispatch) {
      const newTodos = await api.get_BCD_twoSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const secondDispatchPromise = store.dispatch(secondAction)
  const thirdAction = {
    name: 'fetchTodos',
    takeType: 'latest',
    thunk: function* (dispatch) {
      const newTodos = yield api.get_BCDE_twoSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const thirdDispatchPromise = store.dispatch(thirdAction)
  await Promise.all([
    firstDispatchPromise,
    secondDispatchPromise,
    thirdDispatchPromise
  ])

  expect(store.getState().todo.items).toEqual(['Alfa', 'Bravo'])
})

test('Thrown error will return rejected promise', async () => {
  const takingThunkAction = {
    name: 'fetchTodos',
    takeType: 'every',
    thunk: async function (dispatch) {
      throw new Error("thrown error went wrong")
    }
  }
  let [hasError, errorMessage] = [false, null]
  try {
    await store.dispatch(takingThunkAction)
  } catch (e) {
    [hasError, errorMessage] = [true, e.message]
  }
  expect(hasError).toBeTruthy()
  expect(errorMessage).toEqual("thrown error went wrong")
})

test('isLoading will be true if there are thunks waiting', async () => {
  const selector = createIsLoadingSelector("fetchTodos")
  let isLoading = selector(store.getState())
  expect(isLoading).toBeFalsy()

  const firstAction = {
    name: 'fetchTodos',
    takeType: 'every',
    thunk: async function (dispatch) {
      const newTodos = await api.get_AB_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const firstDispatchPromise = store.dispatch(firstAction)
  const secondAction = {
    name: 'fetchTodos',
    takeType: 'every',
    thunk: async function (dispatch) {
      const newTodos = await api.get_BCD_twoSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const secondDispatchPromise = store.dispatch(secondAction)
  const thirdAction = {
    name: 'fetchTodos',
    takeType: 'every',
    thunk: async function (dispatch) {
      const newTodos = await api.get_BCDE_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const thirdDispatchPromise = store.dispatch(thirdAction)

  isLoading = selector(store.getState())
  expect(isLoading).toBeTruthy()

  await firstDispatchPromise
  isLoading = selector(store.getState())
  expect(isLoading).toBeTruthy()

  await Promise.all([
    firstDispatchPromise,
    secondDispatchPromise,
    thirdDispatchPromise
  ])
  isLoading = selector(store.getState())
  expect(isLoading).toBeFalsy()

  expect(store.getState().todo.items).toEqual(['Bravo', 'Charlie', 'Delta'])
})

test('Different names do not interfere', async () => {
  const fetchTodoSelector = createIsLoadingSelector("fetchTodos")
  let fetchTodosLoading = fetchTodoSelector(store.getState())
  expect(fetchTodosLoading).toBeFalsy()

  const fetchTodoAction = {
    name: 'fetchTodos',
    takeType: 'every',
    thunk: async function (dispatch) {
      const newTodos = await api.get_AB_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const dispatchFetchTodoActionPromise = store.dispatch(fetchTodoAction)
  fetchTodosLoading = fetchTodoSelector(store.getState())
  expect(fetchTodosLoading).toBeTruthy()

  const someOtherAction = {
    name: 'someOther',
    takeType: 'every',
    thunk: async function () {
      const ms = 2000
      await new Promise(resolve => setTimeout(resolve, ms))
    }
  }
  const dispatchSomeOtherActionPromise = store.dispatch(someOtherAction)

  await dispatchFetchTodoActionPromise
  fetchTodosLoading = fetchTodoSelector(store.getState())
  expect(fetchTodosLoading).toBeFalsy()

  await Promise.all([
    dispatchFetchTodoActionPromise,
    dispatchSomeOtherActionPromise
  ])
  fetchTodosLoading = fetchTodoSelector(store.getState())
  expect(fetchTodosLoading).toBeFalsy()
})
