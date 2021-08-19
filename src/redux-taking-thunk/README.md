# redux-taking-thunk
A Redux middleware that allows dispatching thunks with takeLeading, takeEvery or takeLatest behaviour, and adds loading state.

- [Setup](#setup)
- [Dispatch API](#dispatch-api)
- [createIsLoadingSelector API](#createisloadingselector-api)
- [With Typescript and Redux Toolkit](#with-typescript-and-redux-toolkit)
- [Unit tests](#unit-tests)
- [Motivation](#motivation)
- [Depenedencies](#depenedencies)
- [Credit](#credit)

## Setup
1. Add the reducer

```
import { combineReducers } from 'redux'
import { reduxTakingThunkReducer } from 'redux-taking-thunk'

export const reducer = combineReducers({
  other: otherReducer,
  reduxTakingThunk: reduxTakingThunkReducer
})
```

2. Add the middleware

```
// with Redux Toolkit
import {
  configureStore,
  createImmutableStateInvariantMiddleware,
  createSerializableStateInvariantMiddleware
} from '@reduxjs/toolkit'
import thunkMiddleware from 'redux-thunk'
import { reducer } from './reducer'
import { createReduxTakingThunkMiddleware } from 'redux-taking-thunk'

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
```

<details>
  <summary>without Redux Toolkit</summary>

```
// without Redux Toolkit
import { createStore, applyMiddleware } from 'redux'
import { reducer } from './reducer'
import { createReduxTakingThunkMiddleware } from 'redux-taking-thunk'

export const store = createStore(reducer, undefined, applyMiddleware(createReduxTakingThunkMiddleware()))
```

</details>

<details>
  <summary>extraArgument</summary>

```
// extraArgument
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
```

</details>

> Note about `redux-thunk`

> The `redux-taking-thunk` middleware only handles the dispatch of a `TakingTypeAction`, and does not handle dispatch of a function, therefore does not interfere with `redux-thunk`.

## Dispatch API
Adds a `dispatch` overload that accepts a `TakingTypeAction` object as parameter and returns a Promise.

```
dispatch(a: TakingThunkAction) => Promise<any>
```

```
const takingThunkAction = {
  name: 'fetchTodos',
  takeType: 'latest',
  thunk: function*(dispatch){
    try {
      const response = yield fetch('http://example.com/todos.json')
      dispatch({type: 'fetchTodoSuccess', todos: response.json()})
    } catch(e) {
      dispatch({type: 'fetchTodoError', error: 'failed to fetch todos'})
    }
  }
}
dispatch(takingThunkAction)
```

### `TakingTypeAction` Properties
- `name`\
identifies the action, used to get the loading state
- `takeType`\
'every'(default), 'leading', or 'latest'
- `thunk`\
a function

### `takeType`

In case of a newly dispatched `TakingTypeAction`:

If store's state of the `name` is not "loading", the `thunk` will execute and store's state will be "loading".

If store's state of the `name` is "loading", see table:

| takeType | `thunk` returns a value | `thunk` returns a Promsie | `thunk` returns a Generator or Async Generator |
| --- | --- | --- | --- |
| leading | Does not execute | :star:Does not execute | Does not execute |
| every | Executes and increments state's counter.<br/>As the function returns immidiately, decrements state's counter | :star:Executes and increments state's counter.<br/>After the promise resolves or rejects, decrements state's counter | Executes and increments state's counter.<br/>After the generator returns, decrements state's counter |
| latest | Does not allow | Does not allow | :star:Executes and changes state's executionId.<br/>By changing the executionId, all other running generators will be discontinued(will not call next()) |

:star:: recommended use case

> if `takeType` does not match the store state, the `thunk` will not be executed.

> `every` does not deal with execution order.

#### `takeType` "loading"
| takeType | |
| --- | --- |
| leading | The leading promise is not resolved/rejected; or<br/>The leading generator is not finished.
| every | Not all promises are resolved/rejected; or<br/> Not all generators are finished
| latest | The latest generator is not finished (does not care about other generators)

### `thunk`
`thunk` can be
- a normal function (but no need to use this library),
- a function that returns a promise(async function),
- a generator function, or
- an async generator function

`thunk` Parameters
- `dispatch`
- `getState`
- `extraArgument` the argument passed in the middleware

### `thunk` return value
- If `thunk` is a generator function or an async generator function, and the execution did not finish (because another `takeLatest` action with same name is dispatched), `dispatch` will return a resolved Promise with value undefined.

- If `thunk`'s return value is a promise, `dispatch` will return a promise with the same resolved or rejected value.

- If `thunk`'s return value is not a promise, `dispatch` will return a resolved promise with that value.

-  If an exceptionis thrown from, or uncaught within `thunk`, `dispatch` will return a rejected promise with that error.

### `dispatch` Return value
This `dispatch` overload returns a Promise. (see [thunk return value](#thunk-return-value))

E.g. call `then` on the returned Promise.

```
dispatch(takingThunkAction).then(() => alert('got todos!!'))
```

## `createIsLoadingSelector` API
`createIsLoadingSelector` creates a selector function of the loading state(see [takeType loading](#taketype-loading)) of the actions identified by `name`.

```
import { createIsLoadingSelector } from 'redux-taking-thunk'

const isLoadingSelector = createIsLoadingSelector(name)
const isLoading = isLoadingSelector(state)
```

## With Typescript and Redux Toolkit
Type benefits when used with Typescript and Redux Toolkit.
- Type hint of the `dispatch` overload

```
// in store.ts
export type AppDispatch = typeof store.dispatch

// in component
  const dispatch = useAppDispatch()
  dispatch(
```

- Type safety when adding middleware, if you forgot to add the reducer

```
// in store.ts
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
  // eslint errors: ... Type 'TakingThunkMiddleware...' is not assignable to type 'Middleware...
})
```

## Unit tests
```
npm run test redux-taking-thunk -- --verbose
```

## Motivation
When using Redux Thunk to make API requests, how to handle concurrency?

One way is to just call the thunks, without caring the order of dispatch. The order of promise resolve is not controlled. For example a slow first dispatch, could resolve later than a fast second dispatch.
```
// take every
async function fetchTodos(dispatch, getsState){
  dispatch({type: 'fetchTodoStart'})
  try {
    const response = await fetch('http://example.com/todos.json')
    dispatch({type: 'fetchTodoSuccess', todos: response.json()})
  } catch(e) {
    dispatch({type: 'fetchTodoError', error: 'failed to fetch todos'})
  }
}

// with redux-thunk
dispatch(fetchTodos) // first
dispatch(fetchTodos) // second, both respond will update state, but do not know which will be the last
```

A common pattern to handle concurrency is to block the late dispatch if state already is loading.

```
// take leading
async function fetchTodos(dispatch, getsState){
  if(getsState().todoIsLoading === true){
    return
  }
  dispatch({type: 'fetchTodoStart'})
  try {
    const response = await fetch('http://example.com/todos.json')
    dispatch({type: 'fetchTodoSuccess', todos: response.json()})
  } catch(e) {
    dispatch({type: 'fetchTodoError', error: 'failed to fetch todos'})
  }
}

// with redux-thunk
dispatch(fetchTodos) // first
dispatch(fetchTodos) // second, will be blocked if first is not resolved
```

An interesting way is take latest.

Take latest discontinus, not cancels. E.g. if an API request is made, and while waiting for the promise to resolve, another thunk is dispatched.

We will not try to cancel the previous API request, as it is already made. Instead, we want to skip the execution of any code following the API request.

However, how to skip the code after the API request? We will transform the async function thunk into a generator thunk, so that the execution exits, and re-enters at `yield`.

```
// take latest
// not care about the loading state
function* fetchTodos(dispatch, getsState){
  try {
    const response = yield fetch('http://example.com/todos.json')
    dispatch({type: 'fetchTodoSuccess', todos: response.json()})
  } catch(e) {
    dispatch({type: 'fetchTodoError', error: 'failed to fetch todos'})
  }
}
```

Because there is a `yield`, `redux-taking-thunk` middleware can decide whether or not to re-enter the execution.

For example, with only one dispatch, the thunk executes "normally" as expected, execution "exits" at the yield, after the API request resolves/rejects, execution "re-enters" and executes the following code, and updates state's value.

For another example, the first thunk executes and "exits" at the yield, and waits for the API request to resolve. At this moment, a second thunk is dispatched. The second thunk will execute "normally" until the end (no other dispatches). When the first thunk's API request resolves, the middleware decides not to "re-enter" the first thunk, code following the yield will not be executed, so the state's value will not be overridden.

With `redux-taking-thunk` the examples will become

```
// take every
const takingThunkAction = {
  name: 'fetchTodos',
  takeType: 'every',
  thunk: async function(dispatch){
    try {
      const response = await fetch('http://example.com/todos.json')
      dispatch({type: 'fetchTodoSuccess', todos: response.json()})
    } catch(e) {
      dispatch({type: 'fetchTodoError', error: 'failed to fetch todos'})
    }
  }
}
dispatch(takingThunkAction) // first
dispatch(takingThunkAction) // second, both respond will update state, but do not know which will be the last
```

```
// take leading
const takingThunkAction = {
  name: 'fetchTodos',
  takeType: 'leading',
  thunk: async function(dispatch){
    try {
      const response = await fetch('http://example.com/todos.json')
      dispatch({type: 'fetchTodoSuccess', todos: response.json()})
    } catch(e) {
      dispatch({type: 'fetchTodoError', error: 'failed to fetch todos'})
    }
  }
}
dispatch(takingThunkAction) // first, called normally
dispatch(takingThunkAction) // second, not called if first is not resolved
```

```
// take latest
const takingThunkAction = {
  name: 'fetchTodos',
  takeType: 'latest',
  thunk: function*(dispatch){
    try {
      const response = yield fetch('http://example.com/todos.json')
      dispatch({type: 'fetchTodoSuccess', todos: response.json()})
    } catch(e) {
      dispatch({type: 'fetchTodoError', error: 'failed to fetch todos'})
    }
  }
}
dispatch(takingThunkAction) // first
dispatch(takingThunkAction) // second, graunteed to be the last to update state
```

<details>
  <summary>On Idiomatic Redux</summary>

### On Idiomatic Redux
Just my 2¢.

Redux pros
- centralized state
- separate action from state update logic
  - logic stems from "how the state slice respond the actions?", not "what happens for the action?"
  - vs context, recoil, zustand or global getter setters
- can reason about state changes by the dispatched actions

Redux cons
- imposed limitations
- abstractions

#### With or without middleware?

Redux without middleware
- can reason about state changes by the all the dispatched actions

Redux-thunk and/or redux-taking-thunk
- use dispatch as an extension point
  - dispatch is modified to accept fucntions/thunks
- can still reason about state changes by the dispatched "simple" actions

</details>

## Depenedencies
- immer
- redux
- nanoid

## Credit
Original inspiration comes from [redux-thunk-loading](https://github.com/jeffery021121/redux-thunk-loading).