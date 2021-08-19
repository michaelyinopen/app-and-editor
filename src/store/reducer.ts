import { combineReducers } from '@reduxjs/toolkit'
import { jobSetsReducer, jobSetsPageReducer } from '../components/JobSets'
import { reduxTakingThunkReducer } from '../redux-taking-thunk'
import type { RootState } from './store'

export const reducer = combineReducers({
  jobSets: jobSetsReducer,
  jobSetsPage: jobSetsPageReducer,
  notifications: notificationsReducer,
  reduxTakingThunk: reduxTakingThunkReducer
})

export const jobSetsSelector = (state: RootState) => state.jobSets
export const jobSetsPageSelector = (state: RootState) => state.jobSetsPage
export const notificationsSelector = (state: RootState) => state.notifications