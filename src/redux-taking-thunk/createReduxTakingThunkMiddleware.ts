import { isTakingThunkAction } from './types'
import type {
  StateWithReduxTakingThunk,
  TakingThunkMiddleware,
} from './types'
import { run } from './run'

export const createReduxTakingThunkMiddleware = <
  TState extends StateWithReduxTakingThunk,
  TExtraThunkArg = undefined
>(extraArgument?: TExtraThunkArg): TakingThunkMiddleware<TState, TExtraThunkArg> => store => next => action => {
  if (isTakingThunkAction(action)) {
    return run({
      dispatch: store.dispatch,
      getState: store.getState,
      name: action.name,
      takeType: action.takeType,
      thunk: action.thunk,
      extraArgument
    })
  }
  return next(action)
}