import {
  ComponentType,
  FunctionComponent,
  useEffect,
} from "react"
import {
  createSingleActivityIsLoadingSelector,
  getActivityTakingThunkAction
} from "../getActivityTakingThunkAction"
import { useAppDispatch, useAppSelector } from "../store"
import {
  failedToLoadActivity,
  loadedActivity,
  resetActivityEditor,
  setActivityEditorId,
  setActivityEditorIsEdit,
  setActivityFromAppStore,
} from "./store/actions"
import {
  ActivityEditorProvider,
  useActivityEditorDispatch,
  useActivityEditorSelector
} from "./store/store"
import { ActivityEditorForm } from './ActivityEditorForm'

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

export const ActivityEditor: FunctionComponent<ActivityEditorProps> = WithJobSetEditorProvider(
  ({ id, edit }) => {
    const dispatch = useAppDispatch()
    const editorDispatch = useActivityEditorDispatch()

    useEffect(() => {
      if (id) {
        dispatch(getActivityTakingThunkAction(id))
          .then(result => {
            if (result === true) {
              editorDispatch(loadedActivity())
            } else if (result === false) {
              editorDispatch(failedToLoadActivity())
            }
          })
          .catch(() => {
            editorDispatch(failedToLoadActivity())
          })
      }
    }, [dispatch, editorDispatch, id])

    useEffect(() => {
      editorDispatch(setActivityEditorId(id))
      return () => { editorDispatch(resetActivityEditor()) }
    }, [editorDispatch, id])

    useEffect(() => {
      editorDispatch(setActivityEditorIsEdit(edit))
    }, [editorDispatch, edit])

    const appActivity = useAppSelector(s => id !== undefined ? s.activities.entities[id] : undefined)

    const loaded = useActivityEditorSelector(es => es.control.loaded)
    const failedToLoad = useActivityEditorSelector(es => es.control.failedToLoad)
    const setFromAppStore = useActivityEditorSelector(es => es.control.setFromAppStore)
    const loading = useAppSelector(createSingleActivityIsLoadingSelector(id))

    useEffect(() => {
      if (appActivity) {
        editorDispatch(setActivityFromAppStore(appActivity))
      }
    }, [editorDispatch, appActivity, loaded])

    return (
      <div>
        {id ? <h1>Activity #{id}</h1> : <h1>New Activity</h1>}
        <div>
          <button
            onClick={() => {
              if (id) {
                dispatch(getActivityTakingThunkAction(id))
                  .then(result => {
                    if (result === true) {
                      editorDispatch(loadedActivity())
                    }
                  })
              }
            }}
          >
            referesh
          </button>
          {failedToLoad && <span> Failed to load!!!</span>}
          {loading && <span> Loading...</span>}
        </div>
        <ActivityEditorForm disabled={!edit || !setFromAppStore} />
      </div>
    )
  }
)
