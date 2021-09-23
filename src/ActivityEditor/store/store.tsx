import React from 'react'
import { createStore, applyMiddleware } from 'redux'
import {
  Provider,
  createDispatchHook,
  createSelectorHook,
  TypedUseSelectorHook
} from 'react-redux'
import { activityEditorReducer } from './activityEditorReducer'
import { editHistoryMiddleware } from './editHistory'

const activityEditorContext = React.createContext<any>(null)

export type ActivityEditorState = ReturnType<typeof activityEditorStore.getState>

export const useActivityEditorDispatch = createDispatchHook(activityEditorContext)
export const useActivityEditorSelector: TypedUseSelectorHook<ActivityEditorState>
  = createSelectorHook(activityEditorContext)

const activityEditorStore = createStore(activityEditorReducer, applyMiddleware(editHistoryMiddleware))

export function ActivityEditorProvider({ children }) {
  return (
    <Provider context={activityEditorContext} store={activityEditorStore}>
      {children}
    </Provider>
  )
}