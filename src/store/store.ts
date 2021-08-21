import {
  configureStore,
  createImmutableStateInvariantMiddleware,
  createSerializableStateInvariantMiddleware,
  ThunkAction,
  Action,
} from '@reduxjs/toolkit'
import thunkMiddleware from 'redux-thunk'
import { createReduxTakingThunkMiddleware } from '../redux-taking-thunk'
import type { TakingThunkAction } from '../redux-taking-thunk'
import { reducer } from './reducer'

export const store = configureStore({
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

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
export type AppTakingThunkAction = TakingThunkAction<RootState>
