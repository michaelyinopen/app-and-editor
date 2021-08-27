import React from 'react'
import { createStore, applyMiddleware } from 'redux'
import {
  Provider,
  createDispatchHook,
  createSelectorHook
} from 'react-redux'
import { activityEditorReducer } from './activityEditorReducer'
import { undoHistoryMiddleware } from './undoHistoryMiddleware'

const activityEditorContext = React.createContext<any>(null)

export const useActivityEditorDispatch = createDispatchHook(activityEditorContext)
export const useActivityEditorSelector = createSelectorHook(activityEditorContext)

const activityEditorStore = createStore(activityEditorReducer, applyMiddleware(undoHistoryMiddleware))

export type ActivityEditorState = ReturnType<typeof activityEditorStore.getState>

export function ActivityEditorProvider({ children }) {
  return (
    <Provider context={activityEditorContext} store={activityEditorStore}>
      {children}
    </Provider>
  )
}