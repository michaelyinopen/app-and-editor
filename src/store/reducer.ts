import { combineReducers } from '@reduxjs/toolkit'
import { activitiesReducer } from './activitiesReducer'
import { reduxTakingThunkReducer } from '../redux-taking-thunk'

export const reducer = combineReducers({
  activities: activitiesReducer,
  reduxTakingThunk: reduxTakingThunkReducer
})