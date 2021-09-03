import { combineReducers } from '@reduxjs/toolkit'
import { activitiesReducer } from './activitiesReducer'
import { reduxTakingThunkReducer } from '../redux-taking-thunk'
import { notificationsReducer } from './notificationsReducer'

export const reducer = combineReducers({
  activities: activitiesReducer,
  notifications: notificationsReducer,
  reduxTakingThunk: reduxTakingThunkReducer
})