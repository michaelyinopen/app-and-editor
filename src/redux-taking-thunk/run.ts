import type { AnyAction, Dispatch } from 'redux'
import { nanoid } from 'nanoid'
import {
  takeEvery_Add,
  takeEvery_Remove,
  takeLatest_Destroy,
  takeLatest_SetLatestExecutionId,
  takeLeading_End,
  takeLeading_Start
} from './actions'
import {
  createLatestExecutionIdSelector,
  createIsLoadingSelector
} from './reducer'
import { defaultTakeType } from './types'
import type {
  TakingThunkTakeLatestAction,
  TakingThunkTakeLeadingOrEveryAction,
  StateWithReduxTakingThunk
} from './types'

function isPromise(obj) {
  return obj && 'function' == typeof obj.then
}

function isGenerator(obj) {
  return obj
    && 'function' == typeof obj.next
    && 'function' == typeof obj.throw
    && 'function' == typeof obj.return
}

async function runGenerator(generator: Generator | AsyncGenerator): Promise<any> {
  let iteratorResult: IteratorResult<unknown> | undefined
  { // scope firstIteratorResult
    const firstIteratorResult = generator.next()
    iteratorResult = isPromise(firstIteratorResult)
      ? await firstIteratorResult
      : firstIteratorResult as IteratorResult<unknown>
  }

  while (!iteratorResult.done) {
    let value: unknown
    let [hasValueError, valueError]: [boolean, any] = [false, undefined]

    try {
      value = isPromise(iteratorResult.value)
        ? await iteratorResult.value
        : iteratorResult.value
    }
    catch (e) {
      [hasValueError, valueError] = [true, e]
    }
    if (hasValueError) {
      const iteratorThrowResult = generator.throw(valueError)
      iteratorResult = isPromise(iteratorThrowResult)
        ? await iteratorThrowResult
        : iteratorThrowResult as IteratorResult<unknown>
    } else {
      const iteratorNextResult = generator.next(value)
      iteratorResult = isPromise(iteratorNextResult)
        ? await iteratorNextResult
        : iteratorNextResult as IteratorResult<unknown>
    }
  }
  const finalResult = iteratorResult?.value
  return isPromise(finalResult)
    ? await finalResult
    : finalResult
}

type RunTakeLeadingOrEveryArg<
  TState extends StateWithReduxTakingThunk,
  TExtraThunkArg = undefined
  > = TakingThunkTakeLeadingOrEveryAction<TState, TExtraThunkArg> & {
    dispatch: Dispatch<AnyAction>,
    getState: () => TState,
    extraArgument?: TExtraThunkArg
  }

async function runTakeLeadingOrEvery<
  TState extends StateWithReduxTakingThunk,
  TExtraThunkArg = undefined
>(runTakeLatestArg: RunTakeLeadingOrEveryArg<TState, TExtraThunkArg>) {
  const takeType = runTakeLatestArg.takeType ?? defaultTakeType
  const {
    dispatch,
    getState,
    extraArgument,
    name,
    thunk
  } = runTakeLatestArg

  const isLoadingSelector = createIsLoadingSelector(name)
  const isLoading = isLoadingSelector(getState())

  if (takeType === "leading" && isLoading) {
    return
  } else if (takeType === "leading" && !isLoading) {
    dispatch(takeLeading_Start(name))
  } else if (takeType === "every") {
    dispatch(takeEvery_Add(name))
  }

  try {
    const thunkResult = thunk(dispatch, getState, extraArgument)
    if (isGenerator(thunkResult)) {
      return await runGenerator(thunkResult)
    } else {
      return isPromise(thunkResult)
        ? await thunkResult
        : thunkResult
    }
  }
  finally {
    if (takeType === "leading") {
      dispatch(takeLeading_End(name))
    } else if (takeType === "every") {
      dispatch(takeEvery_Remove(name))
    }
  }
}

type RunTakeLatestArg<
  TState extends StateWithReduxTakingThunk,
  TExtraThunkArg = undefined
  > = TakingThunkTakeLatestAction<TState, TExtraThunkArg> & {
    dispatch: Dispatch<AnyAction>,
    getState: () => TState,
    extraArgument?: TExtraThunkArg
  }

async function runTakeLatest<
  TState extends StateWithReduxTakingThunk,
  TExtraThunkArg = undefined
>(runTakeLatestArg: RunTakeLatestArg<TState, TExtraThunkArg>) {
  const {
    dispatch,
    getState,
    extraArgument,
    name,
    thunk
  } = runTakeLatestArg
  const generator = thunk(dispatch, getState, extraArgument)

  if (!isGenerator(generator)) {
    throw new Error("redux-taking-thunk only allows dispatching 'takeLatest' with a generator function or an async generator fucntion, but got something else.")
  }

  const latestExecutionIdSelector = createLatestExecutionIdSelector(name)

  // new executionId
  const executionId = nanoid()

  dispatch(takeLatest_SetLatestExecutionId(name, executionId))

  function getIsExecutionIdLatest(): boolean {
    // captures executionId, latestExecutionIdSelector, (name), and getState
    const latestExecutionId = latestExecutionIdSelector(getState())
    return latestExecutionId === executionId
  }

  let iteratorResult: IteratorResult<unknown> | undefined
  try {
    { // scope firstIteratorResult
      const firstIteratorResult = generator.next()
      iteratorResult = isPromise(firstIteratorResult)
        ? await firstIteratorResult
        : firstIteratorResult as IteratorResult<unknown>
    }

    while (!iteratorResult.done) {
      let value: unknown
      let [hasValueError, valueError]: [boolean, any] = [false, undefined]

      try {
        value = isPromise(iteratorResult.value)
          ? await iteratorResult.value
          : iteratorResult.value
      }
      catch (e) {
        [hasValueError, valueError] = [true, e]
      }

      if (!getIsExecutionIdLatest()) {
        const iteratorReturnResult = generator.return(undefined)
        iteratorResult = isPromise(iteratorReturnResult)
          ? await iteratorReturnResult
          : iteratorReturnResult as IteratorResult<unknown>
      } else if (hasValueError) {
        const iteratorThrowResult = generator.throw(valueError)
        iteratorResult = isPromise(iteratorThrowResult)
          ? await iteratorThrowResult
          : iteratorThrowResult as IteratorResult<unknown>
      } else {
        const iteratorNextResult = generator.next(value)
        iteratorResult = isPromise(iteratorNextResult)
          ? await iteratorNextResult
          : iteratorNextResult as IteratorResult<unknown>
      }
    }
    const finalResult = iteratorResult?.value
    return isPromise(finalResult)
      ? await finalResult
      : finalResult
  }
  finally {
    if (getIsExecutionIdLatest()) {
      dispatch(takeLatest_Destroy(name))
    }
  }
}

export async function run<
  TState extends StateWithReduxTakingThunk,
  TExtraThunkArg = undefined
>(runArg: RunTakeLeadingOrEveryArg<TState, TExtraThunkArg> | RunTakeLatestArg<TState, TExtraThunkArg>) {
  if (runArg.takeType === "latest") {
    return await runTakeLatest(runArg)
  } else {
    return await runTakeLeadingOrEvery(runArg)
  }
}