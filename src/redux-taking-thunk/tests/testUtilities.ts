import { combineReducers } from 'redux'
import { reduxTakingThunkReducer } from '../'

export const actionTypes = {
  todoSetAll: "todoSetAll", // payload is an array of string
  todoSetAllError: "todoSetAllError", // payload is null or a string
}

const todoInitialState = {
  items: [],
  setAllError: null,
}
const todoReducer = (state = todoInitialState as any, action) => {
  if (action.type === actionTypes.todoSetAll) {
    return {
      ...state,
      items: [...action.payload],
      setAllError: null,
    }
  } else if (action.type === actionTypes.todoSetAllError) {
    return {
      ...state,
      setAllError: action.payload,
    }
  }
  return state
}

export const reducer = combineReducers({
  todo: todoReducer,
  reduxTakingThunk: reduxTakingThunkReducer
})

async function get_AB_oneSecond() {
  const ms = 1000
  await new Promise(resolve => setTimeout(resolve, ms))
  return ['Alfa', 'Bravo']
}

async function get_AB_twoSecond() {
  const ms = 2000
  await new Promise(resolve => setTimeout(resolve, ms))
  return ['Alfa', 'Bravo']
}

async function get_BCD_oneSecond() {
  const ms = 1000
  await new Promise(resolve => setTimeout(resolve, ms))
  return ['Bravo', 'Charlie', 'Delta']
}

async function get_BCD_twoSecond() {
  const ms = 2000
  await new Promise(resolve => setTimeout(resolve, ms))
  return ['Bravo', 'Charlie', 'Delta']
}

async function get_BCDE_oneSecond() {
  const ms = 1000
  await new Promise(resolve => setTimeout(resolve, ms))
  return ['Bravo', 'Charlie', 'Delta', 'Echo']
}

async function get_BCDE_twoSecond() {
  const ms = 2000
  await new Promise(resolve => setTimeout(resolve, ms))
  return ['Bravo', 'Charlie', 'Delta', 'Echo']
}

/**
 * throws Error "api error"
 */
async function get_thrownApiError_oneSecond() {
  const ms = 1000
  await new Promise(resolve => setTimeout(resolve, ms))
  throw new Error("api error")
}

async function get_isAuthorized_yes_twoSecond() {
  const ms = 1000
  await new Promise(resolve => setTimeout(resolve, ms))
  return true
}

export const api = {
  get_AB_oneSecond,
  get_AB_twoSecond,
  get_BCD_oneSecond,
  get_BCD_twoSecond,
  get_BCDE_oneSecond,
  get_BCDE_twoSecond,
  get_thrownApiError_oneSecond,
  get_isAuthorized_yes_twoSecond
}