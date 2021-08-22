import {
  ComponentType,
  FunctionComponent
} from "react"
import { useAppDispatch } from "../store"
import { ActivityEditorProvider, useActivityEditorDispatch } from "./store/store"

type ActivityEditorProps = {
  id: number | undefined
  edit: boolean
}

type WithActivityEditorProviderType =
  (Component: ComponentType<ActivityEditorProps>) => FunctionComponent<ActivityEditorProps>

const WithJobSetEditorProvider: WithActivityEditorProviderType = (Component) => (props) => {
  return (
    <ActivityEditorProvider>
      <Component {...props} />
    </ActivityEditorProvider>
  )
}

export const ActivityEditor: FunctionComponent<ActivityEditorProps> =
  WithJobSetEditorProvider(({ id, edit }) => {
    const dispatch = useAppDispatch()
    const editorDispatch = useActivityEditorDispatch()

    return (<div />)
  })