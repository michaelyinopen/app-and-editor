import type { Middleware } from 'redux'

//#region State
type TakingThunkTakeLeadingState = {
  takeLeading_isLoading: true
}
export function isTakeLeading(state): state is TakingThunkTakeLeadingState {
  return (state as TakingThunkTakeLeadingState)?.takeLeading_isLoading !== undefined
}
type TakingThunkTakeEveryState = {
  takeEvery_loadingCount: number
}
export function isTakeEvery(state): state is TakingThunkTakeEveryState {
  return (state as TakingThunkTakeEveryState)?.takeEvery_loadingCount !== undefined
}
type TakingThunkTakeLatestState = {
  takeLatest_latestExecutionId: string
}
export function isTakeLatest(state): state is TakingThunkTakeLatestState {
  return (state as TakingThunkTakeLatestState)?.takeLatest_latestExecutionId !== undefined
}
type TakingThunkState = TakingThunkTakeLeadingState | TakingThunkTakeEveryState | TakingThunkTakeLatestState
export type ReduxTakingThunkState = {
  [key: string]: TakingThunkState
}

export type StateWithReduxTakingThunk<TState = {}> = TState & {
  reduxTakingThunk: ReduxTakingThunkState;
}
//#endregion State

export type TakingThunkDispatch<
  TState extends StateWithReduxTakingThunk,
  TExtraThunkArg = undefined
  > =
  (
    takingThunkAction: TakingThunkAction<TState, TExtraThunkArg>
  ) => any

//#region Action
export type TakeType = "leading" | "every" | "latest"
export const defaultTakeType = "every" as const

export type TakingThunkTakeLeadingOrEveryAction<
  TState extends StateWithReduxTakingThunk,
  TExtraThunkArg = undefined
  > = {
    name: string,
    takeType?: "leading" | "every"
    thunk: (
      dispatch: any, // do not know the type of dispatch, because there might be other middlewares
      getState: () => TState,
      extraArgument?: TExtraThunkArg,
    ) => any
  }

export type TakingThunkTakeLatestAction<
  TState extends StateWithReduxTakingThunk,
  TExtraThunkArg = undefined
  > = {
    name: string,
    takeType: "latest"
    thunk: ( // must be generator function
      dispatch: any, // do not know the type of dispatch, because there might be other middlewares
      getState: () => TState,
      extraArgument?: TExtraThunkArg,
    ) => Generator | AsyncGenerator
  }

// takeType: "leading" | "every" can have any kind of function as thunk
// takeType: "latest" must have generator function or async generator function as thunk
export type TakingThunkAction<
  TState extends StateWithReduxTakingThunk,
  TExtraThunkArg = undefined
  > =
  TakingThunkTakeLatestAction<TState, TExtraThunkArg>
  | TakingThunkTakeLeadingOrEveryAction<TState, TExtraThunkArg>

export function isTakingThunkAction<
  TState extends StateWithReduxTakingThunk = StateWithReduxTakingThunk,
  TExtraThunkArg = unknown
>(action: any): action is TakingThunkAction<TState, TExtraThunkArg> {
  const loadingThunk = action as TakingThunkAction<TState, TExtraThunkArg>
  return loadingThunk
    && loadingThunk.name !== undefined
    && loadingThunk.thunk !== undefined
}
//#endregion Action

export type TakingThunkMiddleware<
  TState extends StateWithReduxTakingThunk,
  TExtraThunkArg = undefined
  > = Middleware<
    TakingThunkDispatch<TState, TExtraThunkArg>,
    TState
  >