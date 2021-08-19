import { createStore, applyMiddleware } from 'redux'
import {
  configureStore,
  createImmutableStateInvariantMiddleware,
  createSerializableStateInvariantMiddleware,
} from '@reduxjs/toolkit'
import thunkMiddleware from 'redux-thunk'
import { createReduxTakingThunkMiddleware } from '../'
import { reducer } from './testUtilities'

test('Configure store with reduxTakingThunk middleware', () => {
  const store = configureStore({
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
  expect(store).not.toBeUndefined()
})

test('Create store with redux', () => {
  const store = createStore(reducer, undefined, applyMiddleware(createReduxTakingThunkMiddleware()))
  expect(store).not.toBeUndefined()
})

test('Configure store with extra argument', () => {
  const store = configureStore({
    reducer,
    middleware: [
      thunkMiddleware,
      createReduxTakingThunkMiddleware("extra"),
      createImmutableStateInvariantMiddleware(),
      createSerializableStateInvariantMiddleware()
    ],
  })
  expect(store).not.toBeUndefined()
})