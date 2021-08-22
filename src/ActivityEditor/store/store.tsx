import React from 'react'
import { createStore } from 'redux'
import {
  Provider,
  createDispatchHook,
  createSelectorHook
} from 'react-redux'
import { activityEditorReducer } from './activityEditorReducer'

const activityEditorContext = React.createContext<any>(null)

export const useActivityEditorDispatch = createDispatchHook(activityEditorContext)
export const useActivityEditorSelector = createSelectorHook(activityEditorContext)

const activityEditorStore = createStore(activityEditorReducer)

export type ActivityEditorState = ReturnType<typeof activityEditorStore.getState>

export function ActivityEditorProvider({ children }) {
  return (
    <Provider context={activityEditorContext} store={activityEditorStore}>
      {children}
    </Provider>
  )
}