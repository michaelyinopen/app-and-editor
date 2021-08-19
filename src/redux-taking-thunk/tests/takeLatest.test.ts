

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

test('Can dispatch Generator function thunk', async () => {
  const takingThunkAction = {
    name: 'fetchTodos',
    takeType: 'latest',
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

test('Can dispatch async Generator function thunk', async () => {
  const takingThunkAction = {
    name: 'fetchTodos',
    takeType: 'latest',
    thunk: async function* (dispatch) {
      const isAuthorized = await api.get_isAuthorized_yes_twoSecond()
      if (!isAuthorized) {
        return
      }
      const newTodos = yield api.get_AB_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
      return 'i can return'
    }
  }
  const returned = await store.dispatch(takingThunkAction)

  expect(store.getState().todo.items).toEqual(['Alfa', 'Bravo'])
  expect(returned).toEqual('i can return')
})

test('Cannot dispatch async function thunk', async () => {
  await expect(async () => {
    const takingThunkAction = {
      name: 'fetchTodos',
      takeType: 'latest',
      thunk: async function (dispatch) {
        const newTodos = await api.get_AB_oneSecond()
        dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
      }
    }
    await store.dispatch(takingThunkAction)
  }).rejects
    .toThrow()
})

test('Can dispatch multiple generator thunks', async () => {
  const first_get_AB_oneSecond = jest.fn(api.get_AB_oneSecond)
  const second_get_BCD_twoSecond = jest.fn(api.get_BCD_twoSecond)
  const third_get_BCDE_oneSecond = jest.fn(api.get_BCDE_oneSecond)
  const firstAction = {
    name: 'fetchTodos',
    takeType: 'latest',
    thunk: function* (dispatch) {
      const newTodos = yield first_get_AB_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const firstDispatchPromise = store.dispatch(firstAction)
  const secondAction = {
    name: 'fetchTodos',
    takeType: 'latest',
    thunk: function* (dispatch) {
      const newTodos = yield second_get_BCD_twoSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const secondDispatchPromise = store.dispatch(secondAction)
  const thirdAction = {
    name: 'fetchTodos',
    takeType: 'latest',
    thunk: function* (dispatch) {
      const newTodos = yield third_get_BCDE_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const thirdDispatchPromise = store.dispatch(thirdAction)
  await Promise.all([
    firstDispatchPromise,
    secondDispatchPromise,
    thirdDispatchPromise
  ])

  expect(store.getState().todo.items).toEqual(['Bravo', 'Charlie', 'Delta', 'Echo'])
  expect(first_get_AB_oneSecond.mock.calls.length).toBe(1)
  expect(second_get_BCD_twoSecond.mock.calls.length).toBe(1)
  expect(third_get_BCDE_oneSecond.mock.calls.length).toBe(1)
})

test('Generator fucntions can have multiple yields', async () => {
  const first_x_AB_twoSecond = jest.fn(api.get_AB_twoSecond)
  const first_y_BCD_oneSecond = jest.fn(api.get_BCD_oneSecond)
  const second_x_BCD_oneSecond = jest.fn(api.get_BCD_oneSecond)
  const second_y_BCDE_oneSecond = jest.fn(api.get_BCDE_oneSecond)
  const firstAction = {
    name: 'fetchTodos',
    takeType: 'latest',
    thunk: function* (dispatch) {
      const xTodos = yield first_x_AB_twoSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: xTodos })

      const yTodos = yield first_y_BCD_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: yTodos })
    }
  }
  const firstDispatchPromise = store.dispatch(firstAction)
  const secondAction = {
    name: 'fetchTodos',
    takeType: 'latest',
    thunk: function* (dispatch) {
      const xTodos = yield second_x_BCD_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: xTodos })

      const yTodos = yield second_y_BCDE_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: yTodos })
    }
  }
  const secondDispatchPromise = store.dispatch(secondAction)
  await Promise.all([
    firstDispatchPromise,
    secondDispatchPromise
  ])

  expect(store.getState().todo.items).toEqual(['Bravo', 'Charlie', 'Delta', 'Echo'])
  expect(first_x_AB_twoSecond.mock.calls.length).toBe(1)
  expect(first_y_BCD_oneSecond.mock.calls.length).toBe(0)
  expect(second_x_BCD_oneSecond.mock.calls.length).toBe(1)
  expect(second_y_BCDE_oneSecond.mock.calls.length).toBe(1)
})

test('Async generator function does not discontinue at await', async () => {
  const first_get_isAuthorized = jest.fn(api.get_isAuthorized_yes_twoSecond)
  const first_BCD_oneSecond = jest.fn(api.get_BCD_oneSecond)
  const second_BCDE_oneSecond = jest.fn(api.get_BCDE_oneSecond)
  const firstAction = {
    name: 'fetchTodos',
    takeType: 'latest',
    thunk: async function* (dispatch) {
      const isAuthorized = await first_get_isAuthorized() // always continues
      if (!isAuthorized) {
        return
      }

      const newTodos = yield first_BCD_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const firstDispatchPromise = store.dispatch(firstAction)
  const secondAction = {
    name: 'fetchTodos',
    takeType: 'latest',
    thunk: function* (dispatch) {
      const yTodos = yield second_BCDE_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: yTodos })
    }
  }
  const secondDispatchPromise = store.dispatch(secondAction)
  await Promise.all([
    firstDispatchPromise,
    secondDispatchPromise
  ])

  expect(store.getState().todo.items).toEqual(['Bravo', 'Charlie', 'Delta', 'Echo'])
  expect(first_BCD_oneSecond.mock.calls.length).toBe(1) // always called
  expect(second_BCDE_oneSecond.mock.calls.length).toBe(1)
})

test("Discontinued thunks's dispatch will return resolved promise with value undefined", async () => {
  const firstAction = {
    name: 'fetchTodos',
    takeType: 'latest',
    thunk: function* (dispatch) {
      const newTodos = yield api.get_AB_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
      return "first returned"
    }
  }
  const firstDispatchPromise = store.dispatch(firstAction)
  const secondAction = {
    name: 'fetchTodos',
    takeType: 'latest',
    thunk: function* (dispatch) {
      const newTodos = yield api.get_BCD_twoSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
      return "second returned"
    }
  }
  const secondDispatchPromise = store.dispatch(secondAction)
  await Promise.all([
    firstDispatchPromise,
    secondDispatchPromise
  ])

  const firstResult = await firstDispatchPromise
  const secondResult = await secondDispatchPromise

  expect(store.getState().todo.items).toEqual(['Bravo', 'Charlie', 'Delta'])
  expect(firstResult).toBeUndefined()
  expect(secondResult).toBe("second returned")
})

test('Uncaught error will return rejected promise', async () => {
  const takingThunkAction = {
    name: 'fetchTodos',
    takeType: 'latest',
    // eslint-disable-next-line require-yield
    thunk: function* (dispatch) {
      yield api.get_thrownApiError_oneSecond()
    }
  }
  let [hasError, errorMessage] = [false, null]
  try {
    await store.dispatch(takingThunkAction)
  } catch (e) {
    [hasError, errorMessage] = [true, e.message]
  }
  expect(hasError).toBeTruthy()
  expect(errorMessage).toEqual("api error")
})

test('Generator function can have caught error', async () => {
  const takingThunkAction = {
    name: 'fetchTodos',
    takeType: 'latest',
    thunk: function* (dispatch) {
      try {
        const newTodos = yield api.get_thrownApiError_oneSecond()
        dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
      }
      catch (e) {
        dispatch({ type: actionTypes.todoSetAllError, payload: e.message })
      }
      return "can return even with throw-and-caught errors"
    }
  }
  const returned = await store.dispatch(takingThunkAction)

  expect(store.getState().todo.items).toEqual([])
  expect(store.getState().todo.setAllError).toEqual("api error")
  expect(returned).toBe("can return even with throw-and-caught errors")
})

test('isLoading will be true if the latest thunk is waiting', async () => {
  const selector = createIsLoadingSelector("fetchTodos")
  let isLoading = selector(store.getState())
  expect(isLoading).toBeFalsy()

  const firstAction = {
    name: 'fetchTodos',
    takeType: 'latest',
    thunk: function* (dispatch) {
      const newTodos = yield api.get_AB_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const firstDispatchPromise = store.dispatch(firstAction)
  const secondAction = {
    name: 'fetchTodos',
    takeType: 'latest',
    thunk: function* (dispatch) {
      const newTodos = yield api.get_BCD_twoSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const secondDispatchPromise = store.dispatch(secondAction)
  const thirdAction = {
    name: 'fetchTodos',
    takeType: 'latest',
    thunk: function* (dispatch) {
      const newTodos = yield api.get_BCDE_oneSecond()
      dispatch({ type: actionTypes.todoSetAll, payload: newTodos })
    }
  }
  const thirdDispatchPromise = store.dispatch(thirdAction)

  isLoading = selector(store.getState())
  expect(isLoading).toBeTruthy()

  await thirdDispatchPromise
  isLoading = selector(store.getState())
  expect(isLoading).toBeFalsy()

  await Promise.all([
    firstDispatchPromise,
    secondDispatchPromise,
    thirdDispatchPromise
  ])
  isLoading = selector(store.getState())
  expect(isLoading).toBeFalsy()

  expect(store.getState().todo.items).toEqual(['Bravo', 'Charlie', 'Delta', 'Echo'])
})
